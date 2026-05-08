"use client";

import { useEffect, useRef, useState } from "react";

interface LogEntry {
  timestamp: string;
  level: string;
  connector: string;
  resource: string;
  latency: number;
  cache: string;
  status: number;
  message: string;
}

export function LiveLogStream() {
  const streamRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const eventSource = new EventSource("/api/stream/logs");

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.connected) return; // initial handshake
        setLogs((prev) => [...prev.slice(-100), parsed]); // keep last 100 entries
      } catch {
        // ignore unparseable lines
      }
    };

    eventSource.onerror = () => {
      // EventSource automatically tries to reconnect
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [logs]);

  const getLineClass = (level: string) => {
    switch (level) {
      case "OK": return "bridge-log-line--ok";
      case "WARN": return "bridge-log-line--warn";
      case "ERR": return "bridge-log-line--error";
      default: return "bridge-log-line--info";
    }
  };

  return (
    <div className="bridge-log-stream" ref={streamRef}>
      {logs.length === 0 && (
        <div style={{ color: "var(--text-tertiary)" }}>
          Waiting for API requests...
        </div>
      )}
      {logs.map((entry, i) => (
        <div key={i} className={`bridge-log-line ${getLineClass(entry.level)}`}>
          <span className="bridge-log-line__ts">
            {new Date(entry.timestamp).toLocaleTimeString("en-GB", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
          <span className="bridge-log-line__tag">{entry.level}</span>
          <span className="bridge-log-line__msg">{entry.message}</span>
        </div>
      ))}
    </div>
  );
}