export function exportCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  download(blob, filename);
}

export async function exportXlsx(filename: string, rows: Record<string, any>[], sheetName = "Dados") {
  if (!rows.length) return;
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export async function exportPdf(filename: string, title: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text(title, 40, 36);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`MPPI · CAOCRIM · Feminicídio Zero · ${new Date().toLocaleString("pt-BR")}`, 40, 52);
  const headers = Object.keys(rows[0]);
  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => headers.map((h) => String(r[h] ?? ""))),
    startY: 64,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [33, 53, 95], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });
  doc.save(filename);
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
