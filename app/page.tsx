"use client";
import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaPipe } from "./hooks/useMediaPipe";
import { useEcoStore } from "./hooks/useEcoStore";
import ViewfinderPanel from "./components/ViewfinderPanel";
import DeviceCard from "./components/DeviceCard";
import Dashboard from "./components/Dashboard";
import ReportPanel from "./components/ReportPanel";

export default function Home() {
  const store = useEcoStore();
  const [showReport, setShowReport] = useState(false);

  const handlePinch = useCallback(async (captureFrame: () => string | null) => {
    if (store.phase !== "IDLE") return;
    store.reset();

    const b64 = captureFrame();
    if (!b64) return;

    const thumbUrl = `data:image/jpeg;base64,${b64}`;
    await store.analyzeImage(b64, thumbUrl);
  }, [store]);

  const mp = useMediaPipe({ onPinch: handlePinch });

  const handleGenerateReport = async () => {
    setShowReport(true);
    await store.generateReport();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-void)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top nav */}
      <nav style={{
        padding: "14px 24px",
        borderBottom: "1px solid var(--border)",
        background: "rgba(6,13,18,0.9)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Logo mark */}
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#020508" strokeWidth="2.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
              EcoFlow
            </span>
            <span style={{
              marginLeft: 8, fontSize: 9, fontFamily: "var(--mono)",
              color: "var(--text-dim)", letterSpacing: "0.15em",
            }}>
              AI ENERGY AUDITOR
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {store.devices.length > 0 && (
            <>
              <span style={{
                fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-muted)",
                letterSpacing: "0.1em",
              }}>
                {store.devices.length} DEVICE{store.devices.length !== 1 ? "S" : ""} SCANNED
              </span>
              <button
                type="button"
                onClick={store.clearAll}
                style={{
                  background: "none", border: "1px solid var(--border)",
                  borderRadius: 4, padding: "4px 10px", cursor: "pointer",
                  fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-dim)",
                  letterSpacing: "0.1em",
                }}
              >
                CLEAR ALL
              </button>
            </>
          )}
          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: mp.ready ? "var(--accent)" : "var(--text-dim)",
              boxShadow: mp.ready ? "0 0 8px var(--accent)" : "none",
              animation: mp.ready ? "ticker 2s ease-in-out infinite" : "none",
            }} />
            <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-dim)", letterSpacing: "0.1em" }}>
              {mp.ready ? "LIVE" : "LOADING"}
            </span>
          </div>
        </div>
      </nav>

      {/* Main layout */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
        gap: 0,
        maxWidth: 1200,
        margin: "0 auto",
        width: "100%",
        padding: "20px 24px",
        alignItems: "start",
      }}>
        {/* LEFT — Camera */}
        <div style={{ paddingRight: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <ViewfinderPanel
            videoRef={mp.videoRef}
            canvasRef={mp.canvasRef}
            captureRef={mp.captureRef}
            handState={mp.handState}
            phase={store.phase}
            ready={mp.ready}
            onFlip={mp.flipCamera}
          />

          {/* Active result detail */}
          <AnimatePresence>
            {store.phase === "RESULT" && store.activeDevice && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid rgba(0,229,160,0.3)",
                  borderRadius: 8, padding: 16,
                  boxShadow: "0 0 30px rgba(0,229,160,0.1)",
                }}
              >
                <div style={{
                  fontSize: 9, fontFamily: "var(--mono)", color: "var(--accent)",
                  letterSpacing: "0.15em", marginBottom: 12,
                }}>
                  // AUDIT COMPLETE — {store.activeDevice.appliance.toUpperCase()}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { k: "HABIT CHANGE", v: store.activeDevice.habitChange, icon: "↻" },
                    { k: "ECO ALTERNATIVE", v: store.activeDevice.alternative, icon: "★" },
                  ].map(({ k, v, icon }) => (
                    <div key={k} style={{
                      background: "var(--bg-deep)", borderRadius: 6,
                      padding: "10px 12px", border: "1px solid var(--border)",
                    }}>
                      <div style={{ fontSize: 8, fontFamily: "var(--mono)", color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: 4 }}>
                        {icon} {k}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={store.reset}
                  style={{
                    width: "100%", marginTop: 12,
                    background: "rgba(0,229,160,0.06)",
                    border: "1px solid rgba(0,229,160,0.25)",
                    borderRadius: 6, padding: "9px",
                    fontSize: 11, fontFamily: "var(--mono)", fontWeight: 500,
                    color: "var(--accent)", cursor: "pointer",
                    letterSpacing: "0.1em", transition: "all 0.15s",
                  }}
                >
                  SCAN NEXT DEVICE →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {store.phase === "ERROR" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  background: "rgba(239,68,68,0.05)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 8, padding: 14,
                  fontSize: 12, color: "#fca5a5", fontFamily: "var(--mono)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <span>⚠ {store.error}</span>
                <button
                  onClick={store.reset}
                  style={{
                    background: "none", border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 4, padding: "3px 10px",
                    color: "#fca5a5", cursor: "pointer",
                    fontSize: 10, fontFamily: "var(--mono)",
                  }}
                >
                  RETRY
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — Dashboard + Device list */}
        <div style={{
          borderLeft: "1px solid var(--border)",
          paddingLeft: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxHeight: "calc(100vh - 80px)",
          overflowY: "auto",
          paddingBottom: 20,
        }}>
          {/* Empty state */}
          {!store.devices.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                minHeight: 300, gap: 16, textAlign: "center",
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: "float 3s ease-in-out infinite",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)", marginBottom: 6 }}>
                  No devices scanned yet
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, maxWidth: 220 }}>
                  Point the camera at any electrical appliance and pinch your fingers to start building your energy profile.
                </div>
              </div>
            </motion.div>
          )}

          {/* Dashboard charts */}
          {store.devices.length >= 1 && (
            <Dashboard
              devices={store.devices}
              totals={store.totals}
              onGenerateReport={handleGenerateReport}
              isStreaming={store.isStreaming}
            />
          )}

          {/* Report panel */}
          <AnimatePresence>
            {showReport && (
              <ReportPanel
                report={store.report}
                isStreaming={store.isStreaming}
                onClose={() => setShowReport(false)}
              />
            )}
          </AnimatePresence>

          {/* Device list */}
          {store.devices.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{
                fontSize: 9, fontFamily: "var(--mono)", color: "var(--text-dim)",
                letterSpacing: "0.15em", marginBottom: 2,
              }}>
                // SCANNED DEVICES
              </div>
              <AnimatePresence>
                {store.devices.map((device, i) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    isActive={store.activeDevice?.id === device.id}
                    onRemove={store.removeDevice}
                    index={i}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}