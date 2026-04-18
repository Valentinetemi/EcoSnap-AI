"use client";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Device } from "../hooks/useEcoStore";

interface Props {
  devices: Device[];
  totals: { totalWatts: number; totalCO2: number; totalCost: number; avgScore: number };
  onGenerateReport: () => void;
  isStreaming: boolean;
  currency?: string;
}

const SCORE_COLOR = (s: number) => s >= 7 ? "#00e5a0" : s >= 4 ? "#f59e0b" : "#ef4444";
const GRADE = (s: number) => s >= 8 ? "A" : s >= 6 ? "B" : s >= 4 ? "C" : s >= 2 ? "D" : "F";

const CustomTooltip = ({ active, payload, label }: Record<string, unknown>) => {
  if (active && Array.isArray(payload) && payload.length) {
    return (
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 6, padding: "8px 12px",
        fontSize: 11, fontFamily: "var(--mono)",
      }}>
        <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>{String(label)}</div>
        {(payload as Array<{ name: string; value: number; color: string }>).map((p, i) => (
          <div key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === "number" ? p.value.toFixed(0) : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard({ devices, totals, onGenerateReport, isStreaming, currency = "$" }: Props) {
  if (!devices.length) return null;

  const wattageData = devices.slice(0, 8).map(d => ({
    name: d.appliance.split(" ").slice(0, 2).join(" "),
    watts: Math.round((d.wattageMin + d.wattageMax) / 2),
  }));

  const co2Data = devices.slice(0, 6).map(d => ({
    name: d.appliance.split(" ")[0],
    co2: Math.round(d.co2PerYear),
    fill: SCORE_COLOR(d.efficiencyScore),
  }));

  const treesEquiv = Math.max(1, Math.round(totals.totalCO2 / 21));
  const flightsEquiv = (totals.totalCO2 / 255).toFixed(1);
  const gradeScore = totals.avgScore;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--text-dim)", letterSpacing: "0.15em" }}>
            // HOME ENERGY PROFILE
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginTop: 2 }}>
            {devices.length} Device{devices.length !== 1 ? "s" : ""} Scanned
          </div>
        </div>
        <button
          onClick={onGenerateReport}
          disabled={isStreaming}
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            border: "none", borderRadius: 8, padding: "9px 16px",
            fontSize: 11, fontFamily: "var(--mono)", fontWeight: 600,
            color: "var(--bg-void)", cursor: isStreaming ? "not-allowed" : "pointer",
            letterSpacing: "0.08em", opacity: isStreaming ? 0.6 : 1,
            transition: "opacity 0.2s", whiteSpace: "nowrap",
          }}
        >
          {isStreaming ? "GENERATING..." : "FULL AUDIT →"}
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          {
            label: "⚡ TOTAL POWER",
            value: `${totals.totalWatts.toFixed(0)}W`,
            sub: "running simultaneously",
            color: "var(--accent)",
          },
          {
            label: "💸 MONTHLY COST",
value: `${currency}${(totals.totalCost / 12).toFixed(0)}`,
sub: `${currency}${(totals.totalCost / 365).toFixed(1)}/day · ${currency}${totals.totalCost.toFixed(0)}/yr`,
color: "var(--warn)",
          },
          {
            label: "🌫️ CO₂ PER MONTH",
value: `${(totals.totalCO2 / 12).toFixed(1)}kg`,
sub: `${totals.totalCO2.toFixed(0)}kg per year total`,
color: "#ef4444",
          },
          {
            label: "📊 ECO GRADE",
            value: GRADE(gradeScore),
            sub: `avg score ${gradeScore.toFixed(1)}/10`,
            color: SCORE_COLOR(gradeScore),
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 8, padding: "12px",
          }}>
            <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "var(--mono)", lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {devices.length >= 2 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "12px",
          }}>
            <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 8 }}>
              WATTAGE BY DEVICE
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={wattageData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 7, fill: "var(--text-dim)", fontFamily: "var(--mono)" }} />
                <YAxis tick={{ fontSize: 7, fill: "var(--text-dim)", fontFamily: "var(--mono)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="watts" radius={[2, 2, 0, 0]}>
                  {wattageData.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? "var(--accent)" : "var(--accent2)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "12px",
          }}>
            <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 8 }}>
              CO₂ IMPACT (kg/yr)
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={co2Data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 7, fill: "var(--text-dim)", fontFamily: "var(--mono)" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 7, fill: "var(--text-dim)", fontFamily: "var(--mono)" }} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="co2" radius={[0, 2, 2, 0]}>
                  {co2Data.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Global impact */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 8, padding: "14px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 4 }}>
            🌳 TREES TO OFFSET YOUR CO₂
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#22c55e", fontFamily: "var(--mono)" }}>
            {treesEquiv}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>trees needed per year</div>
        </div>
        <div>
          <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 4 }}>
            ✈️ SAME AS FLYING
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#f59e0b", fontFamily: "var(--mono)" }}>
            {flightsEquiv}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>short-haul flights/yr</div>
        </div>
      </div>
    </motion.div>
  );
}