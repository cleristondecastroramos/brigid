// Branding institucional BRIGID — aplicado automaticamente a todos os relatórios e exportações.
export const BRIGID_BRAND = {
  short: "BRIGID",
  long: "BRIGID — Base de Referência Integrada para Gestão, Inteligência e Dados",
  project: "Projeto Feminicídio Zero",
  org: "Ministério Público do Estado do Piauí · CAOCRIM",
  footer:
    "Documento institucional gerado pela plataforma BRIGID · MPPI · CAOCRIM · Projeto Feminicídio Zero",
};

function brandedFilename(filename: string) {
  // Garante prefixo institucional no nome do arquivo.
  if (/^brigid[_-]/i.test(filename)) return filename;
  return `BRIGID_${filename}`;
}

function nowStamp() {
  return new Date().toLocaleString("pt-BR");
}

function csvHeaderLines() {
  return [
    `# ${BRIGID_BRAND.long}`,
    `# ${BRIGID_BRAND.project} · ${BRIGID_BRAND.org}`,
    `# Gerado em: ${nowStamp()}`,
    `# ${BRIGID_BRAND.footer}`,
    "",
  ];
}

export function exportCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))];
  const csv = [...csvHeaderLines(), ...body].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  download(blob, brandedFilename(filename));
}

export async function exportXlsx(filename: string, rows: Record<string, any>[], sheetName = "Dados") {
  if (!rows.length) return;
  const XLSX = await import("xlsx");
  const headers = Object.keys(rows[0]);
  const aoa: any[][] = [
    [BRIGID_BRAND.long],
    [`${BRIGID_BRAND.project} · ${BRIGID_BRAND.org}`],
    [`Gerado em: ${nowStamp()}`],
    [BRIGID_BRAND.footer],
    [],
    headers,
    ...rows.map((r) => headers.map((h) => r[h] ?? "")),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Merge das 4 linhas de cabeçalho institucional ao longo das colunas dos dados.
  const lastCol = Math.max(0, headers.length - 1);
  (ws["!merges"] ||= []).push(
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: lastCol } },
  );
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: BRIGID_BRAND.long,
    Subject: BRIGID_BRAND.project,
    Author: BRIGID_BRAND.org,
    Company: "MPPI",
    CreatedDate: new Date(),
  };
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, brandedFilename(filename));
}

// Desenha o monograma BRIGID (escudo + "B") via primitivas vetoriais do jsPDF.
function drawBrigidMark(doc: any, x: number, y: number, size: number) {
  const navy: [number, number, number] = [33, 53, 95];
  doc.setFillColor(...navy);
  // Escudo arredondado aproximado
  doc.roundedRect(x, y, size, size, size * 0.18, size * 0.18, "F");
  // "B" estilizado em branco
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size * 0.7);
  doc.text("B", x + size / 2, y + size * 0.78, { align: "center" });
  // Reset
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
}

export async function exportPdf(filename: string, title: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setProperties({
    title: `${BRIGID_BRAND.short} · ${title}`,
    subject: BRIGID_BRAND.project,
    author: BRIGID_BRAND.org,
    creator: BRIGID_BRAND.long,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const headerHeight = 78;

  const drawHeader = () => {
    drawBrigidMark(doc, margin, 24, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(33, 53, 95);
    doc.text(BRIGID_BRAND.long, margin + 48, 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(`${BRIGID_BRAND.project} · ${BRIGID_BRAND.org}`, margin + 48, 52);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text(title, margin, headerHeight);
    doc.setDrawColor(33, 53, 95);
    doc.setLineWidth(0.8);
    doc.line(margin, headerHeight + 6, pageWidth - margin, headerHeight + 6);
  };

  const drawFooter = (pageNumber: number, pageCount: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.setDrawColor(210);
    doc.line(margin, pageHeight - 32, pageWidth - margin, pageHeight - 32);
    doc.text(BRIGID_BRAND.footer, margin, pageHeight - 18);
    doc.text(
      `Gerado em ${nowStamp()} · Página ${pageNumber} de ${pageCount}`,
      pageWidth - margin,
      pageHeight - 18,
      { align: "right" },
    );
  };

  const headers = Object.keys(rows[0]);
  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => headers.map((h) => String(r[h] ?? ""))),
    startY: headerHeight + 14,
    margin: { top: headerHeight + 14, bottom: 44, left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [33, 53, 95], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didDrawPage: () => {
      drawHeader();
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(i, pageCount);
  }

  doc.save(brandedFilename(filename.replace(/\.csv$/i, ".pdf")));
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
