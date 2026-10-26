// Regra única da senha definitiva das contas das Promotorias, usada pela função de borda
// contas-promotorias (servidor) e pela tela "Definir senha definitiva" (navegador).
// Sem dependências, para valer igual no Deno e no Vite.
//
// A senha é usada exatamente como digitada: espaços não são cortados nem convertidos.
// O Supabase Auth também aplica a política de senhas do projeto (Authentication), que precisa
// aceitar este tamanho mínimo; se ela for mais exigente, a recusa do Supabase prevalece.

export const TAMANHO_MINIMO_SENHA = 8;

// Devolve a mensagem do primeiro problema encontrado, ou null quando a senha é aceita.
// A confirmação só é conferida quando informada (a tela confere; o servidor recebe uma só).
export function validarNovaSenha(nova: string, confirmacao?: string): string | null {
  if (nova.length < TAMANHO_MINIMO_SENHA) {
    return `A nova senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
  }
  if (confirmacao !== undefined && nova !== confirmacao) {
    return "A confirmação não confere com a nova senha.";
  }
  return null;
}
