"use client";
import { useState, useCallback, useEffect } from "react";
// UPDATED: location support + fixed streaming

export interface Device {
  id: string;
  appliance: string;
  category: string;
  wattageMin: number;
  wattageMax: number;
  dailyHours: number;
  habitChange: string;
  alternative: string;
  efficiencyScore: number;
  co2PerYear: number;
  costPerYear: number;
  funFact: string;
  scannedAt: number;
  thumbUrl: string;
}

export type AppPhase = "IDLE" | "SCANNING" | "ANALYZING" | "RESULT" | "REPORT" | "ERROR";

const STORAGE_KEY = "ecoflow-devices-v1";

function calcTotals(devices: Device[]) {
  const totalWatts = devices.reduce((s, d) => s + (d.wattageMin + d.wattageMax) / 2, 0);
  const totalCO2 = devices.reduce((s, d) => s + d.co2PerYear, 0);
  const totalCost = devices.reduce((s, d) => s + d.costPerYear, 0);
  const avgScore = devices.length
    ? devices.reduce((s, d) => s + d.efficiencyScore, 0) / devices.length
    : 0;
  return { totalWatts, totalCO2, totalCost, avgScore };
}

export function useEcoStore() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [phase, setPhase] = useState<AppPhase>("IDLE");
  const [activeDevice, setActiveDevice] = useState<Device | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setDevices(JSON.parse(saved));
    } catch (_) {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(devices)); } catch (_) {}
  }, [devices]);

  const analyzeImage = useCallback(async (b64: string, thumbUrl: string) => {
    setPhase("ANALYZING");
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64 }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Analysis failed");

      const device: Device = {
        ...data,
        id: crypto.randomUUID(),
        scannedAt: Date.now(),
        thumbUrl,
      };
      setActiveDevice(device);
      setDevices(prev => [device, ...prev]);
      setPhase("RESULT");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setPhase("ERROR");
    }
  }, []);

  const generateReport = useCallback(async () => {
    if (!devices.length) return;
    setPhase("REPORT");
    setReport("");
    setIsStreaming(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ devices }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setReport(prev => prev + decoder.decode(value));
      }
    } catch (e) {
      setReport("Error generating report.");
    } finally {
      setIsStreaming(false);
    }
  }, [devices]);

  const removeDevice = useCallback((id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
  }, []);

  const reset = useCallback(() => {
    setPhase("IDLE");
    setActiveDevice(null);
    setError(null);
  }, []);

  const clearAll = useCallback(() => {
    setDevices([]);
    setPhase("IDLE");
    setActiveDevice(null);
    setReport("");
  }, []);

  return {
    devices, phase, activeDevice, error, report, isStreaming,
    analyzeImage, generateReport, removeDevice, reset, clearAll,
    totals: calcTotals(devices),
  };
}