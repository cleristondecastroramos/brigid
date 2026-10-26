// Contas das Promotorias no Diagnóstico BRIGID (função de borda, Deno).
//
// Única parte do sistema que usa a chave de serviço, disponível só no servidor
// (SUPABASE_SERVICE_ROLE_KEY). O navegador chama esta função com o token da sessão:
//   - ativar                    (CAOCRIM)  aprova a Promotoria; só conta nova recebe credencial;
//   - redefinir                 (CAOCRIM)  emite nova credencial provisória individual;
//   - definir_senha_definitiva  (a própria conta) troca a credencial pela senha definitiva.
// As regras de cada ação ficam em acoes.ts. As respostas podem conter a credencial
// provisória: não são guardadas em cache e o corpo nunca vai para os logs.
import { createClient } from "npm:@supabase/supabase-js@2";
import { ErroSolicitacao, executarAcao } from "./acoes.ts";

const cabecalhos = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
};

function resposta(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cabecalhos, "Content-Type": "application/json" },
  });
}

// A política de senhas do projeto pode recusar a credencial ou a nova senha
function erroConta(acao: string, message: string) {
  const politica = /password/i.test(message)
    ? " A senha não atende à política de senhas do Supabase (Authentication)."
    : "";
  return new ErroSolicitacao(`Não foi possível ${acao}: ${message}.${politica}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cabecalhos });
  if (req.method !== "POST") return resposta({ erro: "Método não permitido." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const authorization = req.headers.get("Authorization") ?? "";
    // Cliente com o token de quem chamou: as funções do banco conferem o CAOCRIM (auth.uid())
    const comoUsuario = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const servico = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Valida o token no servidor de autenticação
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
      obterConta: async (userId) => {
        const { data, error } = await servico.auth.admin.getUserById(userId);
        if (error) throw erroConta("consultar a conta", error.message);
        return data.user;
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
      ehAdmin: async (userId) => {
        const { data, error } = await servico
          .from("admin_users")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw erroConta("conferir o perfil", error.message);
        return data !== null;
      },
      temVinculoAtivo: async (userId) => {
        const { count, error } = await servico
          .from("usuarios_promotoria")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("ativo", true);
        if (error) throw erroConta("conferir o vínculo", error.message);
        return (count ?? 0) > 0;
      },
      lerCredencial: async (userId) => {
        const { data, error } = await servico
          .from("credenciais_provisorias")
          .select("hash_credencial, emitida_em, expira_em")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw erroConta("conferir a credencial", error.message);
        return data;
      },
      gravarCredencial: async (userId, c) => {
        const { error } = await servico
          .from("credenciais_provisorias")
          .upsert({ user_id: userId, ...c }, { onConflict: "user_id" });
        if (error) throw erroConta("registrar a credencial", error.message);
      },
      apagarCredencial: async (userId) => {
        await servico.from("credenciais_provisorias").delete().eq("user_id", userId);
      },
      encerrarSessoes: async (userId) => {
        const { data, error } = await servico.rpc("encerrar_sessoes_conta", { p_user_id: userId });
        return error ? -1 : Number(data);
      },
      bytesAleatorios: (n) => crypto.getRandomValues(new Uint8Array(n)),
      agora: () => new Date(),
    });
    return resposta(resultado);
  } catch (e) {
    if (e instanceof ErroSolicitacao) return resposta({ erro: e.message }, e.status);
    // Só o tipo do erro: o corpo da solicitação e a resposta nunca são registrados
    console.error("contas-promotorias: erro inesperado", e instanceof Error ? e.name : typeof e);
    return resposta({ erro: "Erro interno ao processar a solicitação." }, 500);
  }
});
