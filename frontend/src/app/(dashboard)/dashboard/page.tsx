// src/app/(dashboard)/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { ClipboardList, PlusCircle, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Logged in as <span className="font-semibold">{user?.email}</span> ({user?.role})
          </p>
        </div>

        {(user?.role === "CLIENT" || user?.role === "DISPATCHER" || user?.role === "ADMIN") && (
          <Link
            href="/work-orders/new"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Work Order</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Lifecycle</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">CREATED → DISPATCHED</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned State</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">OFFERED / IN_PROGRESS</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completion</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">COMPLETED</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Final State</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">CLOSED</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Quick Navigation</h2>
        <p className="text-slate-600 text-sm mb-4">
          Manage field work orders, inspect assignment flows, and review logs.
        </p>
        <Link
          href="/work-orders"
          className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 underline"
        >
          View All Work Orders →
        </Link>
      </div>
    </div>
  );
}