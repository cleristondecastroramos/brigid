import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltam variáveis de ambiente do Supabase (VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY).",
  );
}

// Tipo do link de autenticação recebido por e-mail (convite ou "Esqueci minha senha").
// Lido antes de o cliente processar o endereço e limpá-lo, para que o app leve a pessoa à
// tela de definir senha qualquer que seja a Site URL configurada no Lovable Cloud.
export const tipoLinkAutenticacao: string | null =
  typeof window !== "undefined"
    ? (new URLSearchParams(window.location.hash.slice(1)).get("type") ??
      new URLSearchParams(window.location.search).get("type"))
    : null;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
