"use client";
import { motion } from "framer-motion";

interface Props {
  report: string;
  isStreaming: boolean;
  onClose: () => void;
}

export default function ReportPanel({ report, isStreaming, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-bright)",
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 0 40px rgba(0,229,160,0.1)",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        background: "rgba(0,229,160,0.04)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isStreaming ? "var(--accent)" : "var(--text-dim)",
            boxShadow: isStreaming ? "0 0 10px var(--accent)" : "none",
            animation: isStreaming ? "ticker 0.8s ease-in-out infinite" : "none",
          }} />
          <span style={{
            fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.15em",
            color: "var(--accent)",
          }}>
            {isStreaming ? "GEMINI GENERATING REPORT..." : "// FULL HOME ENERGY AUDIT"}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "1px solid var(--border)", borderRadius: 4,
            padding: "3px 10px", cursor: "pointer",
            fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-muted)",
            letterSpacing: "0.1em",
          }}
        >
          CLOSE
        </button>
      </div>

      {/* Streaming content */}
      <div style={{
        padding: 16, maxHeight: "60vh", overflowY: "auto",
        fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.8,
        color: "var(--text-muted)",
        whiteSpace: "pre-wrap",
      }}>
        {report}
        {isStreaming && (
          <span style={{
            display: "inline-block",
            width: 8, height: 14,
            background: "var(--accent)",
            marginLeft: 2,
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