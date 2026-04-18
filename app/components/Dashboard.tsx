"use client";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell,
} from "recharts";
import { Device } from "../hooks/useEcoStore";

interface Props {
  devices: Device[];
  totals: {
    totalWatts: number;
    totalCO2: number;
    totalCost: number;
    avgScore: number;
  };
  onGenerateReport: () => void;
  isStreaming: boolean;
}

const SCORE_COLOR = (s: number) =>
  s >= 7 ? "#00e5a0" : s >= 4 ? "#f59e0b" : "#ef4444";
const GRADE = (s: number) =>
  s >= 8 ? "A" : s >= 6 ? "B" : s >= 4 ? "C" : s >= 2 ? "D" : "F";

const CustomTooltip = ({ active, payload, label }: Record<string, unknown>) => {
  if (active && Array.isArray(payload) && payload.length) {
    return (
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "8px 12px",
          fontSize: 11,
          fontFamily: "var(--mono)",
        }}
      >
        <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>
          {String(label)}
        </div>
        {(payload as Array<{ name: string; value: number; color: string }>).map(
          (p, i) => (
            <div key={i} style={{ color: p.color }}>
              {p.name}:{" "}
              {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
            </div>
          ),
        )}
      </div>
    );
  }
  return null;
};

export default function Dashboard({
  devices,
  totals,
  onGenerateReport,
  isStreaming,
}: Props) {
  if (!devices.length) return null;

  const wattageData = devices.slice(0, 8).map((d) => ({
    name: d.appliance.split(" ").slice(0, 2).join(" "),
    watts: Math.round((d.wattageMin + d.wattageMax) / 2),
    cost: Math.round(d.costPerYear),
  }));

  const co2Data = devices.slice(0, 6).map((d) => ({
    name: d.appliance.split(" ")[0],
    co2: Math.round(d.co2PerYear),
    fill: SCORE_COLOR(d.efficiencyScore),
  }));

  // Efficiency grade arc
  const gradeScore = totals.avgScore;

  // Trees equivalent
  const treesEquiv = Math.round(totals.totalCO2 / 21);
  const flightsEquiv = (totals.totalCO2 / 255).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--mono)",
              color: "var(--text-dim)",
              letterSpacing: "0.15em",
            }}
          >
            // HOME ENERGY PROFILE
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text)",
              marginTop: 2,
            }}
          >
            {devices.length} Device{devices.length !== 1 ? "s" : ""} Scanned
          </div>
        </div>
        <button
          onClick={onGenerateReport}
          disabled={isStreaming}
          style={{
            background:
              "linear-gradient(135deg, var(--accent), var(--accent2))",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 11,
            fontFamily: "var(--mono)",
            fontWeight: 600,
            color: "var(--bg-void)",
            cursor: isStreaming ? "not-allowed" : "pointer",
            letterSpacing: "0.1em",
            opacity: isStreaming ? 0.6 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {isStreaming ? "GENERATING..." : "FULL AUDIT →"}
        </button>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 8,
        }}
      >
        {[
          {
            label: "TOTAL WATTS",
            value: `${totals.totalWatts.toFixed(0)}W`,
            color: "var(--accent)",
          },
          {
            label: "ANNUAL COST",
            value: `$${totals.totalCost.toFixed(0)}`,
            color: "var(--warn)",
          },
          {
            label: "CO₂/YEAR",
            value: `${totals.totalCO2.toFixed(0)}kg`,
            color: "#ef4444",
          },
          {
            label: "ECO GRADE",
            value: GRADE(gradeScore),
            color: SCORE_COLOR(gradeScore),
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontSize: 8,
                fontFamily: "var(--mono)",
                color: "var(--text-dim)",
                letterSpacing: "0.12em",
                marginBottom: 4,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color,
                fontFamily: "var(--mono)",
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* Wattage bar chart */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "12px",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontFamily: "var(--mono)",
              color: "var(--text-dim)",
              letterSpacing: "0.12em",
              marginBottom: 10,
            }}
          >
            WATTAGE BY DEVICE
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart
              data={wattageData}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 8,
                  fill: "var(--text-dim)",
                  fontFamily: "var(--mono)",
                }}
              />
              <YAxis
                tick={{
                  fontSize: 8,
                  fill: "var(--text-dim)",
                  fontFamily: "var(--mono)",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="watts" radius={[2, 2, 0, 0]}>
                {wattageData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i % 2 === 0 ? "var(--accent)" : "var(--accent2)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CO2 chart */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "12px",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontFamily: "var(--mono)",
              color: "var(--text-dim)",
              letterSpacing: "0.12em",
              marginBottom: 10,
            }}
          >
            CO₂ IMPACT (kg/yr)
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart
              data={co2Data}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{
                  fontSize: 8,
                  fill: "var(--text-dim)",
                  fontFamily: "var(--mono)",
                }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{
                  fontSize: 8,
                  fill: "var(--text-dim)",
                  fontFamily: "var(--mono)",
                }}
                width={60}
              />
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

      {/* Global impact */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "12px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              fontFamily: "var(--mono)",
              color: "var(--text-dim)",
              letterSpacing: "0.12em",
              marginBottom: 4,
            }}
          >
            🌳 TREES NEEDED TO OFFSET
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#22c55e",
              fontFamily: "var(--mono)",
            }}
          >
            {treesEquiv}
          </div>
          <div
            style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}
          >
            trees per year
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 9,
              fontFamily: "var(--mono)",
              color: "var(--text-dim)",
              letterSpacing: "0.12em",
              marginBottom: 4,
            }}
          >
            ✈️ EQUIVALENT FLIGHTS
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#f59e0b",
              fontFamily: "var(--mono)",
            }}
          >
            {flightsEquiv}
          </div>
          <div
            style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}
          >
            short-haul flights/yr
          </div>
        </div>
      </div>
    </motion.div>
  );
}
