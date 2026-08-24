// src/components/ui/SocketIndicator.tsx
"use client";

import { useSocket } from "@/context/SocketContext";
import { Radio } from "lucide-react";

export default function SocketIndicator() {
  const { isConnected } = useSocket();

  return (
    <div
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        isConnected
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-amber-50 text-amber-700 border-amber-200"
      }`}
    >
      <Radio className={`h-3 w-3 ${isConnected ? "animate-pulse text-emerald-600" : "text-amber-600"}`} />
      <span>{isConnected ? "Live Connected" : "Connecting..."}</span>
    </div>
  );
}