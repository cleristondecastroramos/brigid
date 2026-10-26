// Regras das ações da função contas-promotorias, sem dependência do Deno nem do Supabase:
// index.ts liga estas ações aos clientes reais e os testes (scripts/testes) usam dublês.
//
// Marcas em app_metadata (só a chave de serviço altera app_metadata):
//   senha_provisoria     true enquanto a conta usa a senha provisória padrão
//   senha_provisoria_em  quando a senha provisória foi definida (aprovação ou redefinição)
//   senha_definida_em    quando a Promotoria definiu a senha atual

export const SENHA_PROVISORIA = "feminicidio0";
export const TAMANHO_MINIMO = 10;
// Depois deste prazo sem troca, a senha provisória não serve mais para definir a senha
// definitiva: o CAOCRIM precisa redefini-la. Reduz o tempo em que uma conta fica exposta
// com a senha padrão, que é conhecida.
export const VALIDADE_PROVISORIA_HORAS = 72;

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
  app_metadata?: Record<string, unknown>;
}

export interface Dependencias {
  // Função do banco chamada com o token de quem fez a solicitação (confere o CAOCRIM)
  rpc: <T>(fn: string, args: Record<string, unknown>) => Promise<T>;
  criarConta: (
    email: string,
    senha: string,
    appMetadata: Record<string, unknown>,
  ) => Promise<string>;
  atualizarConta: (
    userId: string,
    dados: { password?: string; email_confirm?: boolean; app_metadata?: Record<string, unknown> },
  ) => Promise<void>;
  agora: () => Date;
}

export function senhaProvisoriaExpirada(
  appMetadata: Record<string, unknown> | undefined,
  agora: Date,
) {
  const em = Date.parse(String(appMetadata?.senha_provisoria_em ?? ""));
  // Sem data registrada, a senha provisória é tratada como expirada
  if (Number.isNaN(em)) return true;
  return agora.getTime() - em > VALIDADE_PROVISORIA_HORAS * 3600 * 1000;
}

function marcaProvisoria(agora: Date) {
  return { senha_provisoria: true, senha_provisoria_em: agora.toISOString() };
}

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
      // Valida o CAOCRIM, a Promotoria e o e-mail; informa a conta existente, se houver
      const [conta] =
        (await deps.rpc<{ user_id: string | null; manter_senha: boolean }[]>(
          "admin_preparar_conta_promotoria",
          { p_promotoria_id: promotoriaId, p_email: email },
        )) ?? [];
      let userId = conta?.user_id ?? null;
      const contaExistente = userId !== null;

      // Conta de Promotoria que já tem senha definitiva: só vincula, sem apagar a senha.
      // Para voltar à senha provisória, o CAOCRIM usa "Redefinir senha".
      if (userId && conta?.manter_senha) {
        await deps.rpc("admin_vincular_conta_promotoria", {
          p_user_id: userId,
          p_promotoria_id: promotoriaId,
        });
        return { email, conta_existente: true, senha_mantida: true };
      }

      const agora = deps.agora();
      if (userId) {
        await deps.atualizarConta(userId, {
          password: SENHA_PROVISORIA,
          email_confirm: true,
          app_metadata: { ...marcaProvisoria(agora), senha_definida_em: null },
        });
      } else {
        userId = await deps.criarConta(email, SENHA_PROVISORIA, marcaProvisoria(agora));
      }
      await deps.rpc("admin_vincular_conta_promotoria", {
        p_user_id: userId,
        p_promotoria_id: promotoriaId,
      });
      return {
        email,
        senha_provisoria: SENHA_PROVISORIA,
        conta_existente: contaExistente,
        senha_mantida: false,
      };
    }

    case "redefinir": {
      const userId = String(corpo.user_id ?? "");
      // Só contas de Promotoria, e só pelo CAOCRIM
      const email = await deps.rpc<string>("admin_conferir_conta_promotoria", {
        p_user_id: userId,
      });
      await deps.atualizarConta(userId, {
        password: SENHA_PROVISORIA,
        app_metadata: { ...marcaProvisoria(deps.agora()), senha_definida_em: null },
      });
      return { email, senha_provisoria: SENHA_PROVISORIA };
    }

    case "trocar_senha": {
      // Só a conta que está com a senha provisória troca a senha por aqui: uma sessão de outra
      // conta (inclusive do CAOCRIM) não altera a própria senha sem a senha atual
      if (usuario.app_metadata?.senha_provisoria !== true) {
        throw new ErroSolicitacao(
          "Esta conta não está com a senha provisória. Para trocar a senha, solicite ao CAOCRIM a redefinição.",
          403,
        );
      }
      const agora = deps.agora();
      if (senhaProvisoriaExpirada(usuario.app_metadata, agora)) {
        throw new ErroSolicitacao(
          `A senha provisória expirou (validade de ${VALIDADE_PROVISORIA_HORAS} horas). Solicite ao CAOCRIM uma nova redefinição.`,
          403,
        );
      }
      const nova = String(corpo.nova_senha ?? "");
      if (nova.length < TAMANHO_MINIMO) {
        throw new ErroSolicitacao(`A nova senha deve ter pelo menos ${TAMANHO_MINIMO} caracteres.`);
      }
      if (nova.trim().toLowerCase() === SENHA_PROVISORIA) {
        throw new ErroSolicitacao("A nova senha não pode ser a senha provisória.");
      }
      await deps.atualizarConta(usuario.id, {
        password: nova,
        app_metadata: {
          senha_provisoria: false,
          senha_provisoria_em: null,
          senha_definida_em: agora.toISOString(),
        },
      });
      return { ok: true };
    }

    default:
      throw new ErroSolicitacao("Ação desconhecida.");
  }
}
