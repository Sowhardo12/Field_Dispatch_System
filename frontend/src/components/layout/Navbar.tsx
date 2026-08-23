// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut, User, Wrench, LayoutDashboard, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const { user, refreshToken, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refresh_token: refreshToken }).catch(() => {});
      }
    } finally {
      logout();
      toast.info("Logged out successfully");
      router.push("/login");
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "DISPATCHER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "TECHNICIAN":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/dashboard" className="flex items-center space-x-2 text-slate-900 font-bold text-lg">
            <Wrench className="h-6 w-6 text-blue-600" />
            <span>WorkOrderPro</span>
          </Link>

          <nav className="hidden md:flex space-x-4">
            <Link
              href="/dashboard"
              className="flex items-center space-x-1 text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/work-orders"
              className="flex items-center space-x-1 text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Work Orders</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-3">
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-700 font-medium">
                <User className="h-4 w-4 text-slate-400" />
                <span>{user.full_name}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 text-slate-500 hover:text-red-600 p-2 rounded-lg hover:bg-slate-50 transition"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}