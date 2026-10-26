// Contas das Promotorias no Diagnóstico BRIGID (função de borda, Deno).
//
// Única parte do sistema que usa a chave de serviço, disponível só no servidor
// (SUPABASE_SERVICE_ROLE_KEY). O navegador chama esta função com o token da sessão:
//   - ativar        (CAOCRIM)  cria a conta da Promotoria com a senha provisória padrão;
//   - redefinir     (CAOCRIM)  volta a conta à senha provisória padrão;
//   - trocar_senha  (a própria conta) troca a senha provisória por uma senha definitiva.
// As regras de cada ação ficam em acoes.ts. Com a senha provisória,
// app_metadata.senha_provisoria = true e o banco bloqueia o acesso aos diagnósticos
// (database/migrations/08_senha_provisoria.sql). app_metadata só muda com a chave de serviço,
// então a conta não consegue retirar a marca sem trocar a senha.
import { createClient } from "npm:@supabase/supabase-js@2";
import { ErroSolicitacao, executarAcao } from "./acoes.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function resposta(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// A política de senhas do projeto pode recusar a senha provisória padrão
function erroConta(acao: string, message: string) {
  const politica = /password/i.test(message)
    ? " Verifique se a política de senhas do Supabase (Authentication) aceita a senha provisória padrão."
    : "";
  return new ErroSolicitacao(`Não foi possível ${acao}: ${message}.${politica}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return resposta({ erro: "Método não permitido." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const authorization = req.headers.get("Authorization") ?? "";
    // Cliente com o token de quem chamou: as funções do banco conferem o CAOCRIM (auth.uid())
    const comoUsuario = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const servico = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    // Lido do servidor de autenticação: app_metadata sempre atual, não o do token
    const {
      data: { user },
    } = await comoUsuario.auth.getUser(authorization.replace(/^Bearer\s+/i, ""));
    if (!user) throw new ErroSolicitacao("Sessão expirada. Entre novamente.", 401);

    const corpo = await req.json().catch(() => ({}));
    const resultado = await executarAcao(corpo, user, {
      rpc: async <T>(fn: string, args: Record<string, unknown>) => {
        const { data, error } = await comoUsuario.rpc(fn, args);
        if (error) throw new ErroSolicitacao(error.message, error.code === "42501" ? 403 : 400);
        return data as T;
      },
      criarConta: async (email, senha, appMetadata) => {
        const { data, error } = await servico.auth.admin.createUser({
          email,
          password: senha,
          email_confirm: true,
          app_metadata: appMetadata,
        });
        if (error || !data.user) throw erroConta("criar a conta", error?.message ?? "");
        return data.user.id;
      },
      atualizarConta: async (userId, dados) => {
        const { error } = await servico.auth.admin.updateUserById(userId, dados);
        if (error) throw erroConta("atualizar a conta", error.message);
      },
      agora: () => new Date(),
    });
    return resposta(resultado);
  } catch (e) {
    if (e instanceof ErroSolicitacao) return resposta({ erro: e.message }, e.status);
    console.error(e);
    return resposta({ erro: "Erro interno ao processar a solicitação." }, 500);
  }
});
