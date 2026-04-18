"use client";
import React, { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaPipe } from "./hooks/useMediaPipe";
import { useEcoStore, COUNTRIES } from "./hooks/useEcoStore";
import ViewfinderPanel from "./components/ViewfinderPanel";
import DeviceCard from "./components/DeviceCard";
import Dashboard from "./components/Dashboard";
import ReportPanel from "./components/ReportPanel";

export default function Home() {
  const store = useEcoStore();
  const [showReport, setShowReport] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

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
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; }
        .app-root { min-height: 100vh; background: var(--bg-void); display: flex; flex-direction: column; }
        .nav {
          padding: 12px 16px; border-bottom: 1px solid var(--border);
          background: rgba(6,13,18,0.95); backdrop-filter: blur(12px);
          position: sticky; top: 0; z-index: 200;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .nav-logo { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .logo-mark {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .logo-title { font-size: 18px; font-weight: 700; color: var(--text); letter-spacing: -0.02em; line-height: 1; }
        .logo-sub { font-size: 9px; font-family: var(--mono); color: var(--text-dim); letter-spacing: 0.15em; margin-top: 2px; }
        .nav-right { display: flex; align-items: center; gap: 8px; }
        .location-wrap { position: relative; }
        .location-btn {
          display: flex; align-items: center; gap: 6px;
          background: var(--bg-panel); border: 1px solid var(--border-bright);
          border-radius: 6px; padding: 6px 10px; cursor: pointer;
          font-family: var(--mono); font-size: 11px; color: var(--accent);
          letter-spacing: 0.1em; white-space: nowrap; transition: all 0.15s;
        }
        .location-btn:hover { border-color: var(--accent); background: rgba(0,229,160,0.05); }
        .location-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          background: var(--bg-card); border: 1px solid var(--border-bright);
          border-radius: 8px; min-width: 210px; max-height: 280px;
          overflow-y: auto; z-index: 300;
          box-shadow: 0 20px 60px rgba(0,0,0,0.7);
        }
        .location-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; cursor: pointer; font-size: 13px;
          color: var(--text-muted); border-bottom: 1px solid var(--border);
          transition: all 0.1s;
        }
        .location-item:last-child { border-bottom: none; }
        .location-item:hover { background: rgba(0,229,160,0.05); color: var(--text); }
        .location-item.active { color: var(--accent); background: rgba(0,229,160,0.08); }
        .location-rate { font-family: var(--mono); font-size: 10px; color: var(--text-dim); }
        .live-dot { display: flex; align-items: center; gap: 5px; font-size: 10px; font-family: var(--mono); color: var(--text-dim); letter-spacing: 0.1em; }
        .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .main-grid { flex: 1; display: grid; grid-template-columns: 1fr; gap: 0; width: 100%; max-width: 1280px; margin: 0 auto; }
        @media (min-width: 900px) { .main-grid { grid-template-columns: 1.1fr 0.9fr; } }
        .left-panel { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        @media (min-width: 900px) { .left-panel { padding: 20px 20px 20px 24px; border-right: 1px solid var(--border); } }
        .hero-card {
          background: linear-gradient(135deg, rgba(0,229,160,0.06), rgba(0,200,240,0.04));
          border: 1px solid rgba(0,229,160,0.2); border-radius: 10px; padding: 16px;
        }
        .hero-title { font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 4px; line-height: 1.2; }
        .hero-sub { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 14px; }
        .steps-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .step-item { background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 8px; padding: 10px 8px; text-align: center; }
        .step-num { font-size: 18px; margin-bottom: 4px; }
        .step-text { font-size: 11px; color: var(--text-muted); line-height: 1.4; }
        .result-card { background: var(--bg-card); border: 1px solid rgba(0,229,160,0.3); border-radius: 10px; padding: 16px; box-shadow: 0 0 30px rgba(0,229,160,0.08); }
        .result-header { font-size: 10px; font-family: var(--mono); color: var(--accent); letter-spacing: 0.15em; margin-bottom: 12px; }
        .result-insights { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
        @media (max-width: 400px) { .result-insights { grid-template-columns: 1fr; } }
        .insight-box { background: var(--bg-deep); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; }
        .insight-label { font-size: 9px; font-family: var(--mono); color: var(--text-dim); letter-spacing: 0.1em; margin-bottom: 5px; }
        .insight-text { font-size: 12px; color: var(--text-muted); line-height: 1.5; }
        .scan-next-btn { width: 100%; background: rgba(0,229,160,0.08); border: 1px solid rgba(0,229,160,0.25); border-radius: 8px; padding: 11px; font-size: 12px; font-family: var(--mono); font-weight: 500; color: var(--accent); cursor: pointer; letter-spacing: 0.1em; transition: all 0.15s; }
        .scan-next-btn:hover { background: rgba(0,229,160,0.14); }
        .error-card { background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 14px 16px; font-size: 13px; color: #fca5a5; font-family: var(--mono); display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .retry-btn { background: none; border: 1px solid rgba(239,68,68,0.3); border-radius: 4px; padding: 4px 12px; color: #fca5a5; cursor: pointer; font-size: 10px; font-family: var(--mono); white-space: nowrap; }
        .right-panel { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        @media (min-width: 900px) { .right-panel { padding: 20px 24px 20px 20px; max-height: calc(100vh - 58px); overflow-y: auto; position: sticky; top: 58px; } }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 280px; gap: 16px; text-align: center; padding: 20px; }
        .empty-icon { width: 64px; height: 64px; border-radius: 50%; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; animation: float 3s ease-in-out infinite; }
        .empty-title { font-size: 16px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
        .empty-body { font-size: 13px; color: var(--text-dim); line-height: 1.7; max-width: 240px; }
        .empty-tips { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 260px; }
        .tip-item { display: flex; align-items: center; gap: 10px; background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; text-align: left; }
        .tip-emoji { font-size: 18px; flex-shrink: 0; }
        .tip-text { font-size: 12px; color: var(--text-muted); line-height: 1.4; }
        .section-label { font-size: 9px; font-family: var(--mono); color: var(--text-dim); letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 2px; }
        .clear-btn { background: none; border: 1px solid var(--border); border-radius: 4px; padding: 5px 10px; cursor: pointer; font-size: 10px; font-family: var(--mono); color: var(--text-dim); letter-spacing: 0.1em; white-space: nowrap; }
        .right-panel::-webkit-scrollbar { width: 3px; }
        .right-panel::-webkit-scrollbar-track { background: transparent; }
        .right-panel::-webkit-scrollbar-thumb { background: var(--border-bright); border-radius: 2px; }
      `}</style>

      <div className="app-root">
        {/* NAV */}
        <nav className="nav">
          <div className="nav-logo">
            <div className="logo-mark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#020508" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <div className="logo-title">EcoFlow</div>
              <div className="logo-sub">AI ENERGY AUDITOR</div>
            </div>
          </div>

          <div className="nav-right">
            {store.devices.length > 0 && (
              <button className="clear-btn" onClick={store.clearAll}>CLEAR ALL</button>
            )}

            {/* Location picker */}
            <div className="location-wrap">
              <button className="location-btn" onClick={() => setShowLocationMenu(p => !p)}>
                📍 {store.selectedCountry.code} <span style={{ opacity: 0.5 }}>▾</span>
              </button>
              <AnimatePresence>
                {showLocationMenu && (
                  <motion.div
                    className="location-dropdown"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {COUNTRIES.map(c => (
                      <div
                        key={c.code}
                        className={`location-item ${store.selectedCountry.code === c.code ? "active" : ""}`}
                        onClick={() => { store.changeCountry(c.code); setShowLocationMenu(false); }}
                      >
                        <span>{c.name}</span>
                        <span className="location-rate">{c.currency} {c.rate}/kWh</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Live dot */}
            <div className="live-dot">
              <div className="dot" style={{
                background: mp.ready ? "var(--accent)" : "var(--text-dim)",
                boxShadow: mp.ready ? "0 0 8px var(--accent)" : "none",
                animation: mp.ready ? "ticker 2s ease-in-out infinite" : "none",
              }} />
            </div>
          </div>
        </nav>

        {/* MAIN GRID */}
        <div className="main-grid">
          {/* LEFT */}
          <div className="left-panel">
            {!store.devices.length && store.phase === "IDLE" && (
              <motion.div className="hero-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="hero-title">⚡ Know what your devices cost</div>
                <div className="hero-sub">
                  Point your camera at any electrical device — fan, fridge, phone charger, TV — and pinch your fingers. EcoFlow tells you exactly how much it costs you and the planet.
                </div>
                <div className="steps-row">
                  <div className="step-item"><div className="step-num">📷</div><div className="step-text">Point camera at device</div></div>
                  <div className="step-item"><div className="step-num">🤌</div><div className="step-text">Pinch thumb + index finger</div></div>
                  <div className="step-item"><div className="step-num">📊</div><div className="step-text">See cost + CO₂ instantly</div></div>
                </div>
              </motion.div>
            )}

            <ViewfinderPanel
              videoRef={mp.videoRef}
              canvasRef={mp.canvasRef}
              captureRef={mp.captureRef}
              handState={mp.handState}
              phase={store.phase}
              ready={mp.ready}
              onFlip={mp.flipCamera}
            />

            <AnimatePresence>
              {store.phase === "RESULT" && store.activeDevice && (
                <motion.div
                  className="result-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="result-header">✓ SCAN COMPLETE — {store.activeDevice.appliance.toUpperCase()}</div>
                  <div className="result-insights">
                    <div className="insight-box">
                      <div className="insight-label">💡 SAVE ENERGY BY</div>
                      <div className="insight-text">{store.activeDevice.habitChange}</div>
                    </div>
                    <div className="insight-box">
                      <div className="insight-label">🌍 BETTER OPTION</div>
                      <div className="insight-text">{store.activeDevice.alternative}</div>
                    </div>
                  </div>
                  {store.activeDevice.funFact && (
                    <div style={{
                      background: "rgba(0,229,160,0.04)", border: "1px solid rgba(0,229,160,0.15)",
                      borderRadius: 6, padding: "10px 12px",
                      fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 12,
                    }}>
                      ⚡ <em>{store.activeDevice.funFact}</em>
                    </div>
                  )}
                  <button className="scan-next-btn" onClick={store.reset}>SCAN NEXT DEVICE →</button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {store.phase === "ERROR" && (
                <motion.div className="error-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <span>⚠ {store.error}</span>
                  <button className="retry-btn" onClick={store.reset}>RETRY</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT */}
          <div className="right-panel">
            {!store.devices.length && (
              <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="empty-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <div>
                  <div className="empty-title">Your energy profile</div>
                  <div className="empty-body">Scan your first device and we'll build your personal energy dashboard here.</div>
                </div>
                <div className="empty-tips">
                  {[
                    { e: "🔌", t: "A charger left plugged in still uses power even with no phone" },
                    { e: "❄️", t: "Old fridges use 3× more energy than new efficient ones" },
                    { e: "💡", t: "LED bulbs use 80% less energy than old bulbs" },
                  ].map(({ e, t }) => (
                    <div key={t} className="tip-item">
                      <span className="tip-emoji">{e}</span>
                      <span className="tip-text">{t}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Dashboard with ref for PDF screenshot */}
            {store.devices.length >= 1 && (
              <div ref={dashboardRef}>
                <Dashboard
                  devices={store.devices}
                  totals={store.totals}
                  onGenerateReport={handleGenerateReport}
                  isStreaming={store.isStreaming}
                  currency={store.selectedCountry.currency}
                />
              </div>
            )}

            <AnimatePresence>
              {showReport && (
                <ReportPanel
                  report={store.report}
                  isStreaming={store.isStreaming}
                  onClose={() => setShowReport(false)}
                  devices={store.devices}
                  country={store.selectedCountry.name}
                  currency={store.selectedCountry.currency}
                  totals={store.totals}
                  dashboardRef={dashboardRef}
                />
              )}
            </AnimatePresence>

            {store.devices.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="section-label">// SCANNED DEVICES</div>
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
    </>
  );
}