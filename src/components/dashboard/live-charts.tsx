"use client";

import { useEffect, useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MetricsData {
  timestamp: string;
  systemCpu: number;
  systemMemory: number;
  bankingRps: number;
  logisticsRps: number;
  healthcareRps: number;
  bankingLatency: number;
  logisticsLatency: number;
  healthcareLatency: number;
}

// Keep the last 60 data points (1 minute at 1s interval)
const MAX_POINTS = 60;

export function LiveCharts() {
  const [data, setData] = useState<MetricsData[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/metrics");
        if (!res.ok) return;
        const json = await res.json();
        const now = new Date().toLocaleTimeString("en-GB", { hour12: false });

        const systemCpu = json.system?.translationEngineCpu ?? 0;
        const systemMemory = json.system?.memoryUsage ?? 0;

        const banking = json.connectors?.find((c: any) => c.id === "banking");
        const logistics = json.connectors?.find((c: any) => c.id === "logistics");
        const healthcare = json.connectors?.find((c: any) => c.id === "healthcare");

        const point: MetricsData = {
          timestamp: now,
          systemCpu,
          systemMemory,
          bankingRps: banking?.requestCount ?? 0,
          logisticsRps: logistics?.requestCount ?? 0,
          healthcareRps: healthcare?.requestCount ?? 0,
          bankingLatency: banking?.avgLatencyMs ?? 0,
          logisticsLatency: logistics?.avgLatencyMs ?? 0,
          healthcareLatency: healthcare?.avgLatencyMs ?? 0,
        };

        setData((prev) => {
          const newData = [...prev, point];
          if (newData.length > MAX_POINTS) newData.shift();
          return newData;
        });
      } catch {
        // ignore
      }
    };

    fetchMetrics();
    intervalRef.current = setInterval(fetchMetrics, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const cyan = "#00D4FF";
  const green = "#00FF9C";
  const amber = "#F59E0B";
  const purple = "#9B6DFF";
  const gridColor = "rgba(30, 45, 64, 0.8)";
  const axisColor = "#3A5068";
  const tooltipBg = "#131920";
  const tooltipBorder = "#1E2D40";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "20px" }}>
      {/* CPU & Memory */}
      <div className="bridge-chart-wrap">
        <div className="bridge-chart-wrap__title">System CPU & Memory (%)</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tick={{ fill: axisColor, fontSize: 10 }} />
            <YAxis tick={{ fill: axisColor, fontSize: 10 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 4 }}
              labelStyle={{ color: cyan, fontFamily: "var(--font-mono)", fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#7A8FA6" }} />
            <Line type="monotone" dataKey="systemCpu" stroke={cyan} dot={false} strokeWidth={2} name="CPU" />
            <Line type="monotone" dataKey="systemMemory" stroke={green} dot={false} strokeWidth={2} name="Memory" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Request Rate per connector */}
      <div className="bridge-chart-wrap">
        <div className="bridge-chart-wrap__title">Requests / sec (by connector)</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tick={{ fill: axisColor, fontSize: 10 }} />
            <YAxis tick={{ fill: axisColor, fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 4 }}
              labelStyle={{ color: cyan, fontFamily: "var(--font-mono)", fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#7A8FA6" }} />
            <Line type="monotone" dataKey="bankingRps" stroke={cyan} dot={false} strokeWidth={2} name="Banking" />
            <Line type="monotone" dataKey="logisticsRps" stroke={green} dot={false} strokeWidth={2} name="Logistics" />
            <Line type="monotone" dataKey="healthcareRps" stroke={amber} dot={false} strokeWidth={2} name="Healthcare" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Latency per connector */}
      <div className="bridge-chart-wrap">
        <div className="bridge-chart-wrap__title">Avg Latency (ms)</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tick={{ fill: axisColor, fontSize: 10 }} />
            <YAxis tick={{ fill: axisColor, fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 4 }}
              labelStyle={{ color: cyan, fontFamily: "var(--font-mono)", fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#7A8FA6" }} />
            <Line type="monotone" dataKey="bankingLatency" stroke={cyan} dot={false} strokeWidth={2} name="Banking" />
            <Line type="monotone" dataKey="logisticsLatency" stroke={green} dot={false} strokeWidth={2} name="Logistics" />
            <Line type="monotone" dataKey="healthcareLatency" stroke={purple} dot={false} strokeWidth={2} name="Healthcare" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Network placeholder */}
      <div className="bridge-chart-wrap">
        <div className="bridge-chart-wrap__title">Network (Mbps) – Coming soon</div>
        <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
          Live network charts can be added here
        </div>
      </div>
    </div>
  );
}