// Ordenação alfabética em português do Brasil, sem distinguir acentos nem maiúsculas
// ("Água Branca" fica entre "Agricolândia" e "Alagoinha do Piauí", e não depois de "Z").
// Só compara: os nomes exibidos e gravados continuam com acentos.
// numeric: "2ª Promotoria" antes de "10ª Promotoria".
const collator = new Intl.Collator("pt-BR", { usage: "sort", sensitivity: "base", numeric: true });

export function compararTexto(a: string | null | undefined, b: string | null | undefined): number {
  return collator.compare(a ?? "", b ?? "");
}

// Cópia ordenada (não altera a lista original)
export function ordenarPorTexto<T>(
  lista: readonly T[],
  chave: (item: T) => string | null | undefined,
): T[] {
  return [...lista].sort((a, b) => compararTexto(chave(a), chave(b)));
}
