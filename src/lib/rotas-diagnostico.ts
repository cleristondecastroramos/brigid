// Destinos do módulo Diagnóstico BRIGID depois de entrar ou de definir a senha definitiva.
// Só decide a navegação: as permissões continuam conferidas no banco (RLS e funções).

export const ROTA_INICIAL_DIAGNOSTICO = "/diagnostico-brigid";

// Páginas do módulo exclusivas do CAOCRIM
const EXCLUSIVAS_CAOCRIM = ["/diagnostico-brigid/revisao", "/diagnostico-brigid/administracao"];

export function rotaExclusivaCaocrim(caminho: string): boolean {
  return EXCLUSIVAS_CAOCRIM.some((r) => caminho === r || caminho.startsWith(`${r}/`));
}

// Mantém a página atual quando ela é do módulo e o perfil pode abri-la; caso contrário,
// volta à página inicial do módulo. Nunca devolve endereço externo.
export function destinoAutorizado(caminho: string | null | undefined, ehAdmin: boolean): string {
  const c = caminho ?? "";
  const doModulo = c === ROTA_INICIAL_DIAGNOSTICO || c.startsWith(`${ROTA_INICIAL_DIAGNOSTICO}/`);
  if (!doModulo || c.includes("//") || c.includes("\\")) return ROTA_INICIAL_DIAGNOSTICO;
  if (rotaExclusivaCaocrim(c) && !ehAdmin) return ROTA_INICIAL_DIAGNOSTICO;
  return c;
}
