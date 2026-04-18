"use client";
import { motion } from "framer-motion";
import { Device } from "../hooks/useEcoStore";

const CATEGORY_COLORS: Record<
  string,
  { border: string; glow: string; badge: string }
> = {
  heating: {
    border: "rgba(239,68,68,0.4)",
    glow: "rgba(239,68,68,0.1)",
    badge: "#ef4444",
  },
  cooling: {
    border: "rgba(59,130,246,0.4)",
    glow: "rgba(59,130,246,0.1)",
    badge: "#3b82f6",
  },
  computing: {
    border: "rgba(139,92,246,0.4)",
    glow: "rgba(139,92,246,0.1)",
    badge: "#8b5cf6",
  },
  kitchen: {
    border: "rgba(245,158,11,0.4)",
    glow: "rgba(245,158,11,0.1)",
    badge: "#f59e0b",
  },
  lighting: {
    border: "rgba(251,191,36,0.4)",
    glow: "rgba(251,191,36,0.1)",
    badge: "#fbbf24",
  },
  entertainment: {
    border: "rgba(236,72,153,0.4)",
    glow: "rgba(236,72,153,0.1)",
    badge: "#ec4899",
  },
  laundry: {
    border: "rgba(6,182,212,0.4)",
    glow: "rgba(6,182,212,0.1)",
    badge: "#06b6d4",
  },
  other: {
    border: "rgba(107,114,128,0.4)",
    glow: "rgba(107,114,128,0.1)",
    badge: "#6b7280",
  },
};

const SCORE_COLOR = (s: number) =>
  s >= 7 ? "#00e5a0" : s >= 4 ? "#f59e0b" : "#ef4444";

interface Props {
  device: Device;
  isActive?: boolean;
  onRemove: (id: string) => void;
  index: number;
}

export default function DeviceCard({
  device,
  isActive,
  onRemove,
  index,
}: Props) {
  const colors = CATEGORY_COLORS[device.category] || CATEGORY_COLORS.other;
  const avgWatts = (device.wattageMin + device.wattageMax) / 2;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${isActive ? "var(--accent)" : colors.border}`,
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: isActive
          ? "0 0 20px rgba(0,229,160,0.15)"
          : `0 0 20px ${colors.glow}`,
        position: "relative",
      }}
    >
      {isActive && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, var(--accent), var(--accent2))",
          }}
        />
      )}

      <div style={{ display: "flex", gap: 10, padding: 12 }}>
        {/* Thumbnail */}
        {device.thumbUrl && (
          <img
            src={device.thumbUrl}
            alt={device.appliance}
            style={{
              width: 64,
              height: 64,
              objectFit: "cover",
              borderRadius: 4,
              flexShrink: 0,
              border: "1px solid var(--border)",
            }}
          />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 6,
              marginBottom: 6,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text)",
                  lineHeight: 1.2,
                }}
              >
                {device.appliance}
              </div>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 3,
                  fontSize: 9,
                  fontFamily: "var(--mono)",
                  letterSpacing: "0.12em",
                  color: colors.badge,
                  background: `${colors.glow}`,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 3,
                  padding: "1px 6px",
                  textTransform: "uppercase",
                }}
              >
                {device.category}
              </span>
            </div>
            <button
              onClick={() => onRemove(device.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-dim)",
                fontSize: 14,
                padding: "0 2px",
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Metrics row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 6,
            }}
          >
            <div
              style={{
                background: "var(--bg-deep)",
                borderRadius: 4,
                padding: "4px 6px",
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  fontFamily: "var(--mono)",
                  color: "var(--text-dim)",
                  letterSpacing: "0.1em",
                }}
              >
                WATTS
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--accent)",
                }}
              >
                {avgWatts.toFixed(0)}W
              </div>
            </div>
            <div
              style={{
                background: "var(--bg-deep)",
                borderRadius: 4,
                padding: "4px 6px",
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  fontFamily: "var(--mono)",
                  color: "var(--text-dim)",
                  letterSpacing: "0.1em",
                }}
              >
                $/YR
              </div>
              <div
                style={{ fontSize: 12, fontWeight: 600, color: "var(--warn)" }}
              >
                ${device.costPerYear.toFixed(0)}
              </div>
            </div>
            <div
              style={{
                background: "var(--bg-deep)",
                borderRadius: 4,
                padding: "4px 6px",
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  fontFamily: "var(--mono)",
                  color: "var(--text-dim)",
                  letterSpacing: "0.1em",
                }}
              >
                SCORE
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: SCORE_COLOR(device.efficiencyScore),
                }}
              >
                {device.efficiencyScore}/10
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fun fact */}
      {isActive && device.funFact && (
        <div
          style={{
            padding: "8px 12px",
            borderTop: "1px solid var(--border)",
            background: "rgba(0,229,160,0.03)",
            fontSize: 11,
            color: "var(--text-muted)",
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          ⚡ {device.funFact}
        </div>
      )}
    </motion.div>
  );
}
