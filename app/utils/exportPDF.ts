import { jsPDF } from "jspdf";  
import html2canvas from "html2canvas";
import { Device } from "../hooks/useEcoStore";

interface ExportOptions {
  devices: Device[];
  report: string;
  country: string;
  currency: string;
  totals: {
    totalWatts: number;
    totalCO2: number;
    totalCost: number;
    avgScore: number;
  };
  dashboardEl: HTMLElement | null;
}

const GRADE = (s: number) => s >= 8 ? "A" : s >= 6 ? "B" : s >= 4 ? "C" : s >= 2 ? "D" : "F";

export async function exportPDF({
  devices,
  report,
  country,
  currency,
  totals,
  dashboardEl,
}: ExportOptions) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 16;
  const contentW = W - margin * 2;
  let y = 0;

  // ── Helper: add new page ──────────────────────────────────────────────
  const newPage = () => {
    pdf.addPage();
    y = margin;
  };

  const checkY = (needed: number) => {
    if (y + needed > 275) newPage();
  };

  // ══════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ══════════════════════════════════════════════════════════════════════

  // Dark background
  pdf.setFillColor(2, 5, 8);
  pdf.rect(0, 0, W, 297, "F");

  // Accent bar top
  pdf.setFillColor(0, 229, 160);
  pdf.rect(0, 0, W, 3, "F");

  // Logo area
  pdf.setFillColor(0, 229, 160);
  pdf.roundedRect(margin, 24, 12, 12, 2, 2, "F");
  pdf.setFontSize(8);
  pdf.setTextColor(2, 5, 8);
  pdf.setFont("helvetica", "bold");
  pdf.text("ECO", margin + 1.5, 32);

  pdf.setFontSize(22);
  pdf.setTextColor(226, 240, 236);
  pdf.setFont("helvetica", "bold");
  pdf.text("EcoFlow", margin + 16, 33);

  pdf.setFontSize(8);
  pdf.setTextColor(90, 138, 122);
  pdf.setFont("helvetica", "normal");
  pdf.text("AI ENERGY AUDITOR", margin + 16, 39);

  // Title block
  pdf.setFontSize(28);
  pdf.setTextColor(0, 229, 160);
  pdf.setFont("helvetica", "bold");
  pdf.text("HOME ENERGY", margin, 80);
  pdf.text("AUDIT REPORT", margin, 94);

  pdf.setFontSize(11);
  pdf.setTextColor(90, 138, 122);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Location: ${country}`, margin, 108);
  pdf.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, margin, 115);
  pdf.text(`Devices Scanned: ${devices.length}`, margin, 122);

  // Summary stats box
  pdf.setFillColor(13, 30, 46);
  pdf.setDrawColor(0, 229, 160);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, 138, contentW, 60, 3, 3, "FD");

  const stats = [
    { label: "TOTAL POWER", value: `${totals.totalWatts.toFixed(0)}W`, color: [0, 229, 160] as [number,number,number] },
    { label: "MONTHLY COST", value: `${currency}${(totals.totalCost / 12).toFixed(0)}`, color: [245, 158, 11] as [number,number,number] },
    { label: "CO₂ PER YEAR", value: `${totals.totalCO2.toFixed(0)}kg`, color: [239, 68, 68] as [number,number,number] },
    { label: "ECO GRADE", value: GRADE(totals.avgScore), color: [0, 229, 160] as [number,number,number] },
  ];

  stats.forEach((s, i) => {
    const x = margin + 8 + i * (contentW / 4);
    pdf.setFontSize(7);
    pdf.setTextColor(90, 138, 122);
    pdf.setFont("helvetica", "normal");
    pdf.text(s.label, x, 152);
    pdf.setFontSize(18);
    pdf.setTextColor(...s.color);
    pdf.setFont("helvetica", "bold");
    pdf.text(s.value, x, 166);
    const sub = s.label === "MONTHLY COST"
      ? `${currency}${(totals.totalCost / 365).toFixed(1)}/day`
      : s.label === "CO₂ PER YEAR"
      ? `${(totals.totalCO2 / 12).toFixed(1)}kg/month`
      : "";
    if (sub) {
      pdf.setFontSize(7);
      pdf.setTextColor(90, 138, 122);
      pdf.setFont("helvetica", "normal");
      pdf.text(sub, x, 173);
    }
  });

  // Device list on cover
  pdf.setFontSize(8);
  pdf.setTextColor(90, 138, 122);
  pdf.setFont("helvetica", "normal");
  pdf.text("// SCANNED DEVICES", margin, 216);

  pdf.setDrawColor(26, 58, 32);
  pdf.setLineWidth(0.2);
  pdf.line(margin, 219, W - margin, 219);

  devices.forEach((d, i) => {
    const dy = 225 + i * 10;
    if (dy > 280) return;
    const avgW = Math.round((d.wattageMin + d.wattageMax) / 2);
    const monthlyCost = ((avgW / 1000) * d.dailyHours * 30.4).toFixed(1);

    pdf.setFontSize(9);
    pdf.setTextColor(226, 240, 236);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${i + 1}. ${d.appliance}`, margin, dy);

    pdf.setFontSize(8);
    pdf.setTextColor(90, 138, 122);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${avgW}W  ·  ${currency}${monthlyCost}/mo  ·  Score: ${d.efficiencyScore}/10`, margin + 60, dy);

    pdf.setDrawColor(26, 58, 32);
    pdf.setLineWidth(0.1);
    pdf.line(margin, dy + 3, W - margin, dy + 3);
  });

  // Footer
  pdf.setFillColor(0, 229, 160);
  pdf.rect(0, 294, W, 3, "F");

  // ══════════════════════════════════════════════════════════════════════
  // PAGE 2 — DASHBOARD SCREENSHOT
  // ══════════════════════════════════════════════════════════════════════
  if (dashboardEl) {
    try {
      const canvas = await html2canvas(dashboardEl, {
        backgroundColor: "#060d12",
        scale: 1.5,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const imgH = (canvas.height / canvas.width) * contentW;

      pdf.addPage();
      pdf.setFillColor(2, 5, 8);
      pdf.rect(0, 0, W, 297, "F");

      pdf.setFillColor(0, 229, 160);
      pdf.rect(0, 0, W, 3, "F");

      pdf.setFontSize(10);
      pdf.setTextColor(90, 138, 122);
      pdf.setFont("helvetica", "normal");
      pdf.text("// ENERGY DASHBOARD", margin, 14);

      pdf.addImage(imgData, "PNG", margin, 20, contentW, Math.min(imgH, 250));

      pdf.setFillColor(0, 229, 160);
      pdf.rect(0, 294, W, 3, "F");
    } catch (e) {
      console.error("Dashboard screenshot failed:", e);
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // PAGE 3+ — AI REPORT
  // ══════════════════════════════════════════════════════════════════════
  if (report) {
    pdf.addPage();
    pdf.setFillColor(2, 5, 8);
    pdf.rect(0, 0, W, 297, "F");
    pdf.setFillColor(0, 229, 160);
    pdf.rect(0, 0, W, 3, "F");

    y = margin + 8;

    pdf.setFontSize(10);
    pdf.setTextColor(90, 138, 122);
    pdf.setFont("helvetica", "normal");
    pdf.text("// AI ENERGY AUDIT REPORT", margin, y);
    y += 10;

    const lines = report.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) { y += 3; continue; }

      // Section headers (## lines)
      if (trimmed.startsWith("##")) {
        checkY(12);
        const heading = trimmed.replace(/^#+\s*/, "");
        pdf.setFontSize(11);
        pdf.setTextColor(0, 229, 160);
        pdf.setFont("helvetica", "bold");
        pdf.text(heading, margin, y);
        y += 7;
        pdf.setDrawColor(0, 229, 160);
        pdf.setLineWidth(0.2);
        pdf.line(margin, y - 3, margin + contentW, y - 3);
        y += 2;
        continue;
      }

      // Bold (**text**)
      const isBold = trimmed.startsWith("**") || trimmed.startsWith("*");
      checkY(6);
      pdf.setFontSize(9);
      pdf.setTextColor(isBold ? 226 : 160, isBold ? 240 : 190, isBold ? 236 : 180);
      pdf.setFont("helvetica", isBold ? "bold" : "normal");

      const clean = trimmed.replace(/\*\*/g, "").replace(/^\* /, "• ");
      const wrapped = pdf.splitTextToSize(clean, contentW);
      for (const wline of wrapped) {
        checkY(5);
        if (y > 280) newPage();
        pdf.text(wline, margin, y);
        y += 5;
      }
      y += 1;
    }

    // Footer on last page
    pdf.setFillColor(0, 229, 160);
    pdf.rect(0, 294, W, 3, "F");
    pdf.setFontSize(7);
    pdf.setTextColor(90, 138, 122);
    pdf.setFont("helvetica", "normal");
    pdf.text("Generated by EcoFlow AI Energy Auditor · ecoflow.app", margin, 291);
  }

  // Save
  const filename = `EcoFlow-Report-${new Date().toISOString().split("T")[0]}.pdf`;
  pdf.save(filename);
}