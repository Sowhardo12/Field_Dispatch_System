// src/app/(dashboard)/work-orders/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowLeft, Send } from "lucide-react";

const createWorkOrderSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title must not exceed 255 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type CreateWorkOrderFormValues = z.infer<typeof createWorkOrderSchema>;

export default function NewWorkOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWorkOrderFormValues>({
    resolver: zodResolver(createWorkOrderSchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: CreateWorkOrderFormValues) => {
      return await api.post("/work-orders", values);
    },
    onSuccess: () => {
      toast.success("Work Order created successfully! Status set to CREATED.");
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      router.push("/work-orders");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create work order");
    },
  });

  const onSubmit = (data: CreateWorkOrderFormValues) => {
    mutation.mutate(data);
  };

  // Guard against Technicians creating work orders
  if (user?.role === "TECHNICIAN") {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200 text-center max-w-md mx-auto my-12">
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-slate-500 text-sm mt-2 mb-4">
          Technicians are not authorized to create new work orders.
        </p>
        <Link
          href="/work-orders"
          className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Return to Work Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/work-orders"
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create Work Order</h1>
            <p className="text-slate-500 text-sm">Initiate a new field service request</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Work Order Title
            </label>
            <input
              type="text"
              {...register("title")}
              placeholder="e.g., Server Rack Power Fault Repair"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Detailed Description
            </label>
            <textarea
              rows={5}
              {...register("description")}
              placeholder="Describe the technical issue, hardware affected, site location details, or specific symptoms..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">Lifecycle Note:</p>
            <p>
              New work orders are submitted with state <span className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-800">CREATED</span>. Dispatchers or queue workers can then transition them to <span className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-800">DISPATCHED</span>.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Link
              href="/work-orders"
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{mutation.isPending ? "Submitting..." : "Submit Order"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}