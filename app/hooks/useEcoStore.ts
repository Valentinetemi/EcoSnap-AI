"use client";
import { useState, useCallback, useEffect } from "react";

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

export const COUNTRIES = [
  { code: "NG", name: "Nigeria",        rate: 0.04,  currency: "₦"  },
  { code: "US", name: "United States",  rate: 0.13,  currency: "$"  },
  { code: "GB", name: "United Kingdom", rate: 0.34,  currency: "£"  },
  { code: "DE", name: "Germany",        rate: 0.38,  currency: "€"  },
  { code: "FR", name: "France",         rate: 0.21,  currency: "€"  },
  { code: "IN", name: "India",          rate: 0.08,  currency: "₹"  },
  { code: "ZA", name: "South Africa",   rate: 0.10,  currency: "R"  },
  { code: "GH", name: "Ghana",          rate: 0.05,  currency: "₵"  },
  { code: "KE", name: "Kenya",          rate: 0.17,  currency: "KSh"},
  { code: "AU", name: "Australia",      rate: 0.25,  currency: "A$" },
  { code: "CA", name: "Canada",         rate: 0.11,  currency: "C$" },
  { code: "BR", name: "Brazil",         rate: 0.15,  currency: "R$" },
  { code: "MX", name: "Mexico",         rate: 0.09,  currency: "$"  },
  { code: "JP", name: "Japan",          rate: 0.24,  currency: "¥"  },
  { code: "CN", name: "China",          rate: 0.08,  currency: "¥"  },
  { code: "SG", name: "Singapore",      rate: 0.20,  currency: "S$" },
  { code: "AE", name: "UAE",            rate: 0.08,  currency: "AED"},
  { code: "EG", name: "Egypt",          rate: 0.03,  currency: "£E" },
  { code: "PK", name: "Pakistan",       rate: 0.07,  currency: "₨"  },
  { code: "PH", name: "Philippines",    rate: 0.18,  currency: "₱"  },
];

const STORAGE_KEY = "ecoflow-devices-v1";
const LOCATION_KEY = "ecoflow-location-v1";

function calcTotals(devices: Device[], ratePerKwh: number) {
  const totalWatts = devices.reduce((s, d) => s + (d.wattageMin + d.wattageMax) / 2, 0);
  const totalCO2 = devices.reduce((s, d) => s + d.co2PerYear, 0);
  const totalCost = devices.reduce((s, d) => {
    const avgWatts = (d.wattageMin + d.wattageMax) / 2;
    const kwhPerYear = (avgWatts / 1000) * d.dailyHours * 365;
    return s + kwhPerYear * ratePerKwh;
  }, 0);
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
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setDevices(JSON.parse(saved));
      const savedLoc = localStorage.getItem(LOCATION_KEY);
      if (savedLoc) {
        const found = COUNTRIES.find(c => c.code === savedLoc);
        if (found) setSelectedCountry(found);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(devices)); } catch (_) {}
  }, [devices]);

  const changeCountry = useCallback((code: string) => {
    const found = COUNTRIES.find(c => c.code === code);
    if (found) {
      setSelectedCountry(found);
      try { localStorage.setItem(LOCATION_KEY, code); } catch (_) {}
    }
  }, []);

  const analyzeImage = useCallback(async (b64: string, thumbUrl: string) => {
    setPhase("ANALYZING");
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64, ratePerKwh: selectedCountry.rate }),
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
  }, [selectedCountry]);

  const generateReport = useCallback(async () => {
    if (!devices.length) return;
    setReport("");
    setIsStreaming(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          devices,
          country: selectedCountry.name,
          currency: selectedCountry.currency,
          ratePerKwh: selectedCountry.rate,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) setReport(prev => prev + chunk);
      }
    } catch (e: unknown) {
      setReport(`Error: ${e instanceof Error ? e.message : "Unknown error"}\n\nCheck your GEMINI_API_KEY in .env.local`);
    } finally {
      setIsStreaming(false);
    }
  }, [devices, selectedCountry]);

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
    selectedCountry, changeCountry,
    analyzeImage, generateReport, removeDevice, reset, clearAll,
    totals: calcTotals(devices, selectedCountry.rate),
  };
}
