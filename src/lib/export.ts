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
  const headers = Object.keys(rows[0]).filter(k => k !== "codigo_ibge");
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
  const headers = Object.keys(rows[0]).filter(k => k !== "codigo_ibge");
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

export async function exportPdf(
  filename: string, 
  title: string, 
  rows: Record<string, any>[],
  options?: {
    subtitle?: string;
    kpis?: { label: string; value: string | number }[];
    criterios?: string;
  }
) {
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

  const logoImg = await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = "/logo_brigid.png";
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  
  // Calculate first page header height
  let firstPageHeaderHeight = 85;
  let linesCriterios: string[] = [];
  
  if (options) {
    if (options.subtitle) firstPageHeaderHeight += 14;
    if (options.criterios) {
      firstPageHeaderHeight += 20;
      linesCriterios = doc.splitTextToSize(options.criterios, pageWidth - margin * 2 - 100);
      firstPageHeaderHeight += (linesCriterios.length - 1) * 12;
    }
    if (options.kpis && options.kpis.length > 0) {
      firstPageHeaderHeight += 25 + 36;
    }
  }
  firstPageHeaderHeight += 15; // Padding before table

  const regularHeaderHeight = 100; // For page 2 onwards

  const drawHeader = (pageNumber: number) => {
    if (logoImg) {
      let w = 40;
      let h = (logoImg.height / logoImg.width) * w;
      if (h > 36) {
        h = 36;
        w = (logoImg.width / logoImg.height) * h;
      }
      doc.addImage(logoImg, "PNG", margin, 24 + (36 - h) / 2, w, h);
    } else {
      drawBrigidMark(doc, margin, 24, 36);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(33, 53, 95);
    doc.text(BRIGID_BRAND.long, margin + 48, 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`${BRIGID_BRAND.project} · ${BRIGID_BRAND.org}`, margin + 48, 48);

    doc.setDrawColor(210, 215, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, 65, pageWidth - margin, 65);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20, 30, 40);
    doc.text(title, margin, 85);

    let currentY = 85;

    if (pageNumber === 1 && options) {
      if (options.subtitle) {
        currentY += 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(80, 90, 100);
        doc.text(options.subtitle, margin, currentY);
      }
      
      if (options.criterios) {
        currentY += 20;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(40, 50, 60);
        doc.text("Critérios Aplicados:", margin, currentY);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 90, 100);
        doc.text(linesCriterios, margin + 105, currentY);
        currentY += (linesCriterios.length - 1) * 12;
      }
      
      if (options.kpis && options.kpis.length > 0) {
        currentY += 25;
        let xPos = margin;
        for (const kpi of options.kpis) {
           doc.setDrawColor(220, 225, 230);
           doc.setFillColor(248, 250, 252);
           doc.roundedRect(xPos, currentY, 120, 36, 3, 3, "FD");
           
           doc.setFont("helvetica", "bold");
           doc.setFontSize(14);
           doc.setTextColor(33, 53, 95);
           doc.text(String(kpi.value), xPos + 60, currentY + 16, { align: "center" });
           
           doc.setFont("helvetica", "normal");
           doc.setFontSize(7);
           doc.setTextColor(100);
           doc.text(kpi.label.toUpperCase(), xPos + 60, currentY + 28, { align: "center" });
           
           xPos += 130;
        }
        currentY += 36;
      }
    }

    currentY += 10;
    doc.setDrawColor(33, 53, 95);
    doc.setLineWidth(0.8);
    doc.line(margin, currentY, pageWidth - margin, currentY);
  };

  const drawFooter = (pageNumber: number, pageCount: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.setDrawColor(210);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 32, pageWidth - margin, pageHeight - 32);
    doc.text(BRIGID_BRAND.footer, margin, pageHeight - 18);
    doc.text(
      `Gerado em ${nowStamp()} · Página ${pageNumber} de ${pageCount}`,
      pageWidth - margin,
      pageHeight - 18,
      { align: "right" },
    );
  };

  const headers = Object.keys(rows[0]).filter(k => k !== "codigo_ibge");
  
  const formatHeader = (key: string) => {
    const dict: Record<string, string> = {
      populacao_feminina: "População Feminina",
      populacao: "População",
      municipio: "Município",
      polo: "Polo Regional",
      polo_regional: "Polo\nRegional",
      comarca: "Comarca",
      risco: "Risco de Feminicídio",
      alerta_rede: "Alerta Rede",
      score_ier: "Score\nIER",
      score_imf: "Score\nIMF",
      score_iqt: "Score\nIQT",
      ier_score: "Score\nIER",
      imf_score: "Score\nIMF",
      iqt_score: "Score\nIQT",
      falta_opm: "Sem OPM",
      falta_creas: "Sem CREAS",
      falta_protocolo: "Sem Protocolo",
      ocorrencias_totais: "Ocorrências (Total)",
      consumados: "Feminicídios Consumados",
      tentados: "Feminicídios Tentados",
      opm: "Tem OPM",
      creas: "Tem CREAS",
      status: "Status da Rede",
      prioridade_creas: "Prioridade CREAS",
      prioridade_opm: "Prioridade OPM",
      sala_especializada: "Sala Especializada",
      tem_sala_especializada: "Sala\nEspecializ.",
      recursos_minimos: "Recursos Mínimos",
      tem_recursos_minimos: "Recursos\nMínimos",
      tem_atendimento_psicossocial: "Atend.\nPsicos.",
      tem_atendimento_juridico: "Atend.\nJuríd.",
      fluxo_formal: "Fluxo Formal",
      tem_fluxo_formal: "Fluxo\nFormal",
      protocolo_regional: "Protocolo Regional",
      tem_protocolo_local_regional: "Protocolo\nRegional",
      tem_articulacao_rede: "Articul.\nRede",
      tem_equipe_multiprofissional: "Equipe\nMultiprof.",
      capacitado_perspectiva_genero: "Capacit.\nGênero",
      treinamento_especifico_feminicidio: "Treinam.\nFeminic.",
      suficiencia: "Suficiência",
      grau_suficiencia_estrutura: "Suficiên.\nEstrut.",
      opm_orgaotipo: "Tipologia OPM",
      opm_status_politicas_publicas: "Políticas Efetivas"
    };
    if (dict[key]) return dict[key];
    return key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const formattedHeaders = headers.map(formatHeader);

  const numericColumns = headers.map(h => {
    return rows.some(r => {
      const val = r[h];
      return typeof val === "number" || (typeof val === "string" && !isNaN(Number(val)) && val.trim() !== "");
    });
  });

  autoTable(doc, {
    head: [formattedHeaders],
    body: rows.map((r) => headers.map((h) => {
      const val = r[h];
      if (val === null || val === undefined) return "";
      if (typeof val === "number") return val.toLocaleString("pt-BR");
      if (typeof val === "string" && !isNaN(Number(val)) && val.trim() !== "") return Number(val).toLocaleString("pt-BR");
      return String(val);
    })),
    startY: firstPageHeaderHeight,
    margin: { top: regularHeaderHeight, bottom: 44, left: margin, right: margin },
    styles: { 
      font: "helvetica",
      fontSize: 6.5, 
      cellPadding: 3,
      textColor: [40, 50, 60],
      lineColor: [230, 235, 240],
      lineWidth: 0.1
    },
    headStyles: { 
      fillColor: [248, 250, 252], 
      textColor: [33, 53, 95],
      fontStyle: "bold",
      lineWidth: 0.1,
      lineColor: [200, 210, 220]
    },
    alternateRowStyles: { fillColor: [252, 253, 254] },
    horizontalPageBreak: true,
    horizontalPageBreakRepeat: 0,
    didParseCell: (hookData: any) => {
      if (numericColumns[hookData.column.index]) {
        hookData.cell.styles.halign = 'right';
      }
    },
    didDrawPage: (data: any) => {
      drawHeader(data.pageNumber);
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
