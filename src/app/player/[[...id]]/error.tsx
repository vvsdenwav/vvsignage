"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function PlayerErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for monitoring (silently on the client)
    console.error("TV Player encountered an error:", error);

    // Auto-heal the TV by forcing a complete DOM and Cache rebuild after 5 seconds
    const timer = setTimeout(() => {
      window.location.reload();
    }, 5000);

    return () => clearTimeout(timer);
  }, [error]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#333333", // Very dark grey so passengers don't notice it
      }}
    >
      <Loader2 
        size={40} 
        style={{ animation: "spin 2s linear infinite", opacity: 0.2 }} 
      />
    </div>
  );
}
