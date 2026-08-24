// src/context/SocketContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    
    // Initialize Socket.io connection passing JWT token
    const socketInstance = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    // Real-Time Event: Work Order Created
    socketInstance.on("work_order_created", (data: any) => {
      toast.info(`New Work Order Created: #${data.id || data.workOrderId}`, {
        description: data.title || "A new work order has been added.",
      });
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    });

    // Real-Time Event: Work Order State Transition
    socketInstance.on("work_order_updated", (data: any) => {
      toast.info(`Work Order #${data.id || data.workOrderId} Updated`, {
        description: `Status changed to ${data.status}`,
      });
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      if (data.id || data.workOrderId) {
        queryClient.invalidateQueries({
          queryKey: ["work-orders", String(data.id || data.workOrderId)],
        });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}