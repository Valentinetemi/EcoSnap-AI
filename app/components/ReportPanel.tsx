"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Device } from "../hooks/useEcoStore";
import { exportPDF } from "../utils/exportPDF";

interface Props {
  report: string;
  isStreaming: boolean;
  onClose: () => void;
  devices: Device[];
  country: string;
  currency: string;
  totals: { totalWatts: number; totalCO2: number; totalCost: number; avgScore: number };
  dashboardRef: React.RefObject<HTMLDivElement>;
}

export default function ReportPanel({
  report, isStreaming, onClose,
  devices, country, currency, totals, dashboardRef,
}: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportPDF({ devices, report, country, currency, totals, dashboardEl: dashboardRef.current });
    } catch (e) {
      console.error("PDF export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border-bright)",
        borderRadius: 10, overflow: "hidden",
        boxShadow: "0 0 40px rgba(0,229,160,0.08)",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "12px 16px", borderBottom: "1px solid var(--border)",
        background: "rgba(0,229,160,0.04)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 8, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isStreaming ? "var(--accent)" : "var(--text-dim)",
            boxShadow: isStreaming ? "0 0 10px var(--accent)" : "none",
            animation: isStreaming ? "ticker 0.8s ease-in-out infinite" : "none",
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.12em", color: "var(--accent)" }}>
            {isStreaming ? "GEMINI IS WRITING YOUR REPORT..." : "// YOUR ENERGY AUDIT REPORT"}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {!isStreaming && report && (
            <button
              onClick={handleExport}
              disabled={exporting}
              style={{
                background: exporting ? "rgba(0,229,160,0.1)" : "linear-gradient(135deg, var(--accent), var(--accent2))",
                border: "none", borderRadius: 6, padding: "6px 14px",
                cursor: exporting ? "not-allowed" : "pointer",
                fontSize: 10, fontFamily: "var(--mono)", fontWeight: 600,
                color: exporting ? "var(--accent)" : "var(--bg-void)",
                letterSpacing: "0.1em", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {exporting ? "EXPORTING..." : "⬇ SAVE AS PDF"}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: "none", border: "1px solid var(--border)",
              borderRadius: 6, padding: "6px 12px", cursor: "pointer",
              fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-muted)",
              letterSpacing: "0.1em",
            }}
          >
            CLOSE
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        padding: 16, maxHeight: "55vh", overflowY: "auto",
        fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.85,
        color: "var(--text-muted)", whiteSpace: "pre-wrap",
      }}>
        {report.split("\n").map((line, i) => {
          if (line.startsWith("## ")) {
            return (
              <div key={i} style={{
                fontSize: 13, fontWeight: 700, color: "var(--accent)",
                marginTop: 16, marginBottom: 6,
                paddingBottom: 6, borderBottom: "1px solid var(--border)",
              }}>
                {line.replace("## ", "")}
              </div>
            );
          }
          if (line.startsWith("**") && line.endsWith("**")) {
            return <div key={i} style={{ fontWeight: 600, color: "var(--text)", marginTop: 4 }}>{line.replace(/\*\*/g, "")}</div>;
          }
          if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
          return <div key={i}>{line}</div>;
        })}
        {isStreaming && (
          <span style={{
            display: "inline-block", width: 8, height: 14,
            background: "var(--accent)", marginLeft: 2,
            animation: "ticker 0.6s ease-in-out infinite",
            verticalAlign: "text-bottom",
          }} />
        )}
        {!report && isStreaming && (
          <span style={{ color: "var(--text-dim)", animation: "ticker 1s ease-in-out infinite" }}>
            Analyzing your home energy profile...
          </span>
        )}
      </div>
    </motion.div>
  );
}