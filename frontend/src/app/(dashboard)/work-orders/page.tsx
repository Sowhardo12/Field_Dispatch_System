// src/app/(dashboard)/work-orders/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { WorkOrder } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import StatusBadge from "@/components/ui/StatusBadge";
import { PlusCircle, Search, RefreshCw, ChevronLeft, ChevronRight, Eye } from "lucide-react";

export default function WorkOrdersPage() {
  const user = useAuthStore((state) => state.user);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  const { data: responseData, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["work-orders", statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      return await api.get<never, any>(`/work-orders?${params.toString()}`);
    },
  });

  // Safely extract the array regardless of backend pagination format
  const workOrders: WorkOrder[] = Array.isArray(responseData)
    ? responseData
    : Array.isArray(responseData?.data)
    ? responseData.data
    : Array.isArray(responseData?.items)
    ? responseData.items
    : [];

  const canCreate = user?.role === "CLIENT" || user?.role === "DISPATCHER" || user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Work Orders</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage field work orders and lifecycle states
          </p>
        </div>

        {canCreate && (
          <Link
            href="/work-orders/new"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm self-start sm:self-auto"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Work Order</span>
          </Link>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-48 px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          >
            <option value="ALL">All Statuses</option>
            <option value="CREATED">CREATED</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="OFFERED">OFFERED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900 px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white hover:bg-slate-50 transition w-full sm:w-auto justify-center"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm">Loading work orders...</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-red-500 text-sm">
            Failed to load work orders. Ensure backend API is active.
          </div>
        ) : workOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Search className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p className="font-medium text-slate-700">No work orders found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new order.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Client ID</th>
                  <th className="px-6 py-3">Technician ID</th>
                  <th className="px-6 py-3">Created At</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {workOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">#{order.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 max-w-xs truncate">
                      {order.title}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {order.client?.full_name ? `${order.client.full_name} (#${order.client_id})` : `#${order.client_id}`}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {order.technician ? `${order.technician.full_name} (#${order.technician_id})` : order.technician_id ? `#${order.technician_id}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/work-orders/${order.id}`}
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-2.5 py-1 rounded-md transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">Page {page}</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 transition"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={workOrders.length < limit || isLoading}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 transition"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}