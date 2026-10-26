// Regras das ações da função contas-promotorias, sem dependência do Deno nem do Supabase:
// index.ts liga estas ações aos clientes reais e os testes (scripts/testes) usam dublês.
//
// Primeiro acesso com credencial provisória individual:
//   - a credencial é aleatória, gerada aqui a cada emissão (conta nova ou "Redefinir senha"),
//     e só aparece na resposta da operação do CAOCRIM; não é gravada nem registrada em log;
//   - guarda-se apenas o hash, com emissão e validade, em public.credenciais_provisorias
//     (migration 09), que só a chave de serviço lê;
//   - app_metadata.senha_provisoria (só a chave de serviço altera) bloqueia os diagnósticos
//     no banco (migration 08) até a definição da senha definitiva.
// Aprovar ou vincular nunca altera a senha de uma conta existente: isso só ocorre em
// "Redefinir senha".

import { TAMANHO_MINIMO_SENHA, validarNovaSenha } from "../_shared/politica-senha.ts";

export const VALIDADE_PROVISORIA_HORAS = 72;
// Mantido para quem já importa daqui; a regra fica em _shared/politica-senha.ts
export const TAMANHO_MINIMO = TAMANHO_MINIMO_SENHA;

export class ErroSolicitacao extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export interface Usuario {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
}

export interface Credencial {
  hash_credencial: string;
  emitida_em: string;
  expira_em: string;
}

export interface SituacaoConta {
  user_id: string | null;
  tem_senha: boolean;
  provisoria: boolean;
  credencial_individual: boolean;
  credencial_expirada: boolean;
  expira_em: string | null;
  vinculada_promotoria: boolean;
}

export interface Dependencias {
  // Função do banco chamada com o token de quem fez a solicitação (confere o CAOCRIM)
  rpc: <T>(fn: string, args: Record<string, unknown>) => Promise<T>;
  // Operações com a chave de serviço
  obterConta: (userId: string) => Promise<Usuario | null>;
  criarConta: (
    email: string,
    senha: string,
    appMetadata: Record<string, unknown>,
  ) => Promise<string>;
  atualizarConta: (
    userId: string,
    dados: { password?: string; email_confirm?: boolean; app_metadata?: Record<string, unknown> },
  ) => Promise<void>;
  ehAdmin: (userId: string) => Promise<boolean>;
  temVinculoAtivo: (userId: string) => Promise<boolean>;
  lerCredencial: (userId: string) => Promise<Credencial | null>;
  gravarCredencial: (userId: string, c: Credencial & { emitida_por: string }) => Promise<void>;
  apagarCredencial: (userId: string) => Promise<void>;
  encerrarSessoes: (userId: string) => Promise<number>;
  bytesAleatorios: (n: number) => Uint8Array;
  agora: () => Date;
}

// ------------------------------------------------------------------ credencial provisória
// Sem caracteres ambíguos (0/O, 1/l/I); 4 grupos de 4 = ~93 bits de entropia
const MAIUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const MINUSCULAS = "abcdefghijkmnpqrstuvwxyz";
const DIGITOS = "23456789";
const ALFABETO = MAIUSCULAS + MINUSCULAS + DIGITOS;

export function gerarCredencial(bytesAleatorios: (n: number) => Uint8Array): string {
  // Amostragem por rejeição: sem viés de módulo
  const limite = 256 - (256 % ALFABETO.length);
  for (;;) {
    let s = "";
    while (s.length < 16) {
      for (const b of bytesAleatorios(32)) {
        if (b < limite && s.length < 16) s += ALFABETO[b % ALFABETO.length];
      }
    }
    // Garante maiúscula, minúscula e dígito (o hífen cobre políticas que exigem símbolo)
    if ([MAIUSCULAS, MINUSCULAS, DIGITOS].every((cl) => [...s].some((c) => cl.includes(c)))) {
      return s.match(/.{4}/g)!.join("-");
    }
  }
}

export async function hashCredencial(credencial: string): Promise<string> {
  const dados = new TextEncoder().encode(credencial.trim());
  const digest = await crypto.subtle.digest("SHA-256", dados);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Comparação em tempo constante
function iguais(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// Emite uma nova credencial: grava o hash antes de alterar a conta. Se a alteração da conta
// falhar, o hash novo não corresponde a nenhuma senha e a conta continua como estava.
async function emitirCredencial(
  deps: Dependencias,
  emitidaPor: string,
  userId: string | null,
  email: string,
) {
  const agora = deps.agora();
  const credencial = gerarCredencial(deps.bytesAleatorios);
  const registro = {
    hash_credencial: await hashCredencial(credencial),
    emitida_em: agora.toISOString(),
    expira_em: new Date(agora.getTime() + VALIDADE_PROVISORIA_HORAS * 3600 * 1000).toISOString(),
  };
  const appMetadata = {
    senha_provisoria: true,
    senha_provisoria_em: registro.emitida_em,
    senha_provisoria_expira_em: registro.expira_em,
    senha_definida_em: null,
  };
  if (userId) {
    await deps.gravarCredencial(userId, { ...registro, emitida_por: emitidaPor });
    await deps.atualizarConta(userId, {
      password: credencial,
      email_confirm: true,
      app_metadata: appMetadata,
    });
  } else {
    // Conta nova: o id só existe depois da criação; sem o hash gravado, a conta fica
    // bloqueada e "Redefinir senha" resolve
    userId = await deps.criarConta(email, credencial, appMetadata);
    await deps.gravarCredencial(userId, { ...registro, emitida_por: emitidaPor });
  }
  return { userId, credencial, expira_em: registro.expira_em, emitida_em: registro.emitida_em };
}

// ------------------------------------------------------------------ ações
export async function executarAcao(
  corpo: Record<string, unknown>,
  usuario: Usuario,
  deps: Dependencias,
): Promise<Record<string, unknown>> {
  switch (corpo.acao) {
    case "ativar": {
      const email = String(corpo.email ?? "")
        .trim()
        .toLowerCase();
      const promotoriaId = String(corpo.promotoria_id ?? "");
      // Confere o CAOCRIM, a Promotoria e o e-mail no banco; descreve a conta existente
      const linhas = await deps.rpc<SituacaoConta[]>("admin_situacao_conta_promotoria", {
        p_promotoria_id: promotoriaId,
        p_email: email,
      });
      const conta = linhas?.[0] ?? null;
      const vincular = (userId: string) =>
        deps.rpc("admin_vincular_conta_promotoria", {
          p_user_id: userId,
          p_promotoria_id: promotoriaId,
        });

      // a) Conta nova, ou conta sem senha (convite antigo nunca concluído): emite credencial
      if (!conta?.user_id || (!conta.tem_senha && !conta.provisoria)) {
        const emitida = await emitirCredencial(deps, usuario.id, conta?.user_id ?? null, email);
        await vincular(emitida.userId);
        return {
          email,
          situacao: conta?.user_id ? "credencial_emitida" : "conta_criada",
          credencial_provisoria: emitida.credencial,
          expira_em: emitida.expira_em,
        };
      }

      // c) Conta ainda provisória: só vincula, sem emitir credencial nova
      if (conta.provisoria) {
        await vincular(conta.user_id);
        const situacao = !conta.credencial_individual
          ? "provisoria_legada"
          : conta.credencial_expirada
            ? "provisoria_expirada"
            : "provisoria_preservada";
        return { email, situacao, expira_em: conta.expira_em };
      }

      // Conta com senha que nunca foi de Promotoria: a existência da conta não prova que
      // ela pertence à Promotoria
      if (!conta.vinculada_promotoria) {
        throw new ErroSolicitacao(
          `Já existe uma conta com o e-mail ${email} fora do cadastro das Promotorias, e não há como confirmar a titularidade. Confira a conta em Authentication > Users no Supabase antes de aprovar.`,
          409,
        );
      }

      // b) Conta de Promotoria com senha definitiva: só vincula, senha preservada
      await vincular(conta.user_id);
      return { email, situacao: "senha_preservada" };
    }

    case "redefinir": {
      const userId = String(corpo.user_id ?? "");
      // Só contas de Promotoria, e só pelo CAOCRIM (conferido no banco)
      const email = await deps.rpc<string>("admin_conferir_conta_promotoria", {
        p_user_id: userId,
      });
      const emitida = await emitirCredencial(deps, usuario.id, userId, email);
      // As sessões abertas não servem para concluir o primeiro acesso (exige a credencial
      // nova); encerrá-las evita que continuem renovando o acesso
      const sessoes = await deps.encerrarSessoes(userId).catch(() => -1);
      return {
        email,
        situacao: "redefinida",
        credencial_provisoria: emitida.credencial,
        expira_em: emitida.expira_em,
        sessoes_encerradas: sessoes >= 0,
      };
    }

    case "definir_senha_definitiva": {
      // Só a própria conta: não aceita indicar outro usuário
      if (corpo.user_id !== undefined && corpo.user_id !== usuario.id) {
        throw new ErroSolicitacao("A senha só pode ser definida pela própria conta.", 403);
      }
      // Estado lido da conta no servidor de autenticação, não do token nem do navegador
      const conta = await deps.obterConta(usuario.id);
      if (!conta) throw new ErroSolicitacao("Conta não encontrada.", 404);
      if (await deps.ehAdmin(usuario.id)) {
        throw new ErroSolicitacao("Contas do CAOCRIM não usam o primeiro acesso.", 403);
      }
      if (conta.app_metadata?.senha_provisoria !== true) {
        throw new ErroSolicitacao("Esta conta já possui senha definitiva.", 403);
      }
      if (!(await deps.temVinculoAtivo(usuario.id))) {
        throw new ErroSolicitacao(
          "Esta conta não está vinculada a uma Promotoria ativa. Procure o CAOCRIM.",
          403,
        );
      }
      const registro = await deps.lerCredencial(usuario.id);
      if (!registro) {
        throw new ErroSolicitacao(
          "Esta conta não tem uma credencial provisória válida. Solicite ao CAOCRIM a redefinição da senha.",
          403,
        );
      }
      if (deps.agora().getTime() >= Date.parse(registro.expira_em)) {
        throw new ErroSolicitacao(
          `A credencial provisória expirou (validade de ${VALIDADE_PROVISORIA_HORAS} horas). Solicite ao CAOCRIM uma nova redefinição.`,
          403,
        );
      }
      const informada = String(corpo.credencial_provisoria ?? "");
      if (!iguais(await hashCredencial(informada), registro.hash_credencial)) {
        throw new ErroSolicitacao("A credencial provisória informada não confere.", 403);
      }
      const nova = String(corpo.nova_senha ?? "");
      const problema = validarNovaSenha(nova);
      if (problema) throw new ErroSolicitacao(problema);
      if (nova.trim() === informada.trim()) {
        throw new ErroSolicitacao("A nova senha não pode ser a credencial provisória.");
      }
      // Senha e marca na mesma atualização: se falhar, nada muda e a conta segue bloqueada
      await deps.atualizarConta(usuario.id, {
        password: nova,
        app_metadata: {
          senha_provisoria: false,
          senha_provisoria_em: null,
          senha_provisoria_expira_em: null,
          senha_definida_em: deps.agora().toISOString(),
        },
      });
      // Sem a marca, a credencial já não serve; apagar o hash é limpeza
      await deps.apagarCredencial(usuario.id).catch(() => undefined);
      return { ok: true };
    }

    default:
      throw new ErroSolicitacao("Ação desconhecida.");
  }
}
