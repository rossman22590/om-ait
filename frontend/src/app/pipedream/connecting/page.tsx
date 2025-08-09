"use client";

import React, { useEffect, useState } from "react";

export default function PipedreamConnectingPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        if (!event || !event.data) return;
        const data = event.data;
        if (typeof data === "object" && data !== null && "link" in data) {
          const link = (data as any).link as string;
          if (typeof link === "string" && link.startsWith("http")) {
            // Navigate this popup to the Pipedream connect URL
            window.location.replace(link);
          }
        }
      } catch (e) {
        setError("Failed to process connection link. Close this window and try again.");
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 18, marginBottom: 8 }}>Connecting to Pipedream…</div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          If this window does not redirect automatically, you may close it and try again.
        </div>
        {error && (
          <div style={{ marginTop: 12, color: "#b91c1c" }}>{error}</div>
        )}
      </div>
    </div>
  );
}
