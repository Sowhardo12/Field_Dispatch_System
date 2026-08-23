// // src/app/(dashboard)/work-orders/[id]/page.tsx
// "use client";

// import Link from "next/link";
// import { useParams, useRouter } from "next/navigation";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { toast } from "sonner";
// import { api } from "@/lib/api";
// import { WorkOrder } from "@/types";
// import { useAuthStore } from "@/store/useAuthStore";
// import StatusBadge from "@/components/ui/StatusBadge";
// import { 
//   ArrowLeft, 
//   User, 
//   Wrench, 
//   CheckCircle2, 
//   Play, 
//   Send, 
//   XCircle, 
//   Clock
// } from "lucide-react";

// export default function WorkOrderDetailPage() {
//   const params = useParams();
//   const workOrderId = params?.id as string;
  
//   const router = useRouter();
//   const queryClient = useQueryClient();
//   const user = useAuthStore((state) => state.user);

//   // 1. Query Work Order
//   const { data: order, isLoading, isError } = useQuery({
//     queryKey: ["work-orders", workOrderId],
//     queryFn: async () => {
//       return await api.get<never, WorkOrder>(`/work-orders/${workOrderId}`);
//     },
//     enabled: !!workOrderId,
//   });

//   ////////////////////////


//   const { data: logsResponse } = useQuery({
//   queryKey: ["work-order-logs", workOrderId],
//   queryFn: async () => {
//     return await api.get<never, any>(`/work-orders/${workOrderId}/logs`);
//   },
//   enabled: !!workOrderId,
// });

// const executionLogs = Array.isArray(logsResponse)
//   ? logsResponse
//   : Array.isArray(logsResponse?.data)
//   ? logsResponse.data
//   : [];


//   ////////////////////////

//   // 2. State Transition Mutation
//   const transitionMutation = useMutation({
//     mutationFn: async ({ action, payload }: { action: string; payload?: object }) => {
//       return await api.patch(`/work-orders/${workOrderId}/${action}`, payload || {});
//     },
//     onSuccess: (_, variables) => {
//       toast.success(`Action '${variables.action}' executed successfully!`);
//       queryClient.invalidateQueries({ queryKey: ["work-orders", workOrderId] });
//       queryClient.invalidateQueries({ queryKey: ["work-orders"] });
//     },
//     onError: (error: any) => {
//       toast.error(error.message || "Failed to update work order state");
//     },
//   });

//   if (isLoading) {
//     return (
//       <div className="p-12 text-center text-slate-500">
//         <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
//         <p className="text-sm">Loading work order details...</p>
//       </div>
//     );
//   }

//   if (isError || !order) {
//     return (
//       <div className="bg-white rounded-xl p-8 border border-slate-200 text-center max-w-md mx-auto my-12">
//         <h2 className="text-lg font-bold text-slate-900">Work Order Not Found</h2>
//         <p className="text-slate-500 text-sm mt-2 mb-4">
//           The requested work order standard does not exist or you lack permission.
//         </p>
//         <Link
//           href="/work-orders"
//           className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
//         >
//           ← Return to List
//         </Link>
//       </div>
//     );
//   }

//   const role = user?.role;

//   return (
//     <div className="max-w-4xl mx-auto space-y-6">
//       {/* Top Header Nav */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center space-x-3">
//           <Link
//             href="/work-orders"
//             className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 transition"
//           >
//             <ArrowLeft className="h-5 w-5" />
//           </Link>
//           <div>
//             <div className="flex items-center space-x-2">
//               <h1 className="text-2xl font-bold text-slate-900">Order #{order.id}</h1>
//               <StatusBadge status={order.status} />
//             </div>
//             <p className="text-slate-500 text-sm">Created on {new Date(order.created_at).toLocaleString()}</p>
//           </div>
//         </div>
//       </div>

//       {/* Main Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Left Column: Details */}
//         <div className="lg:col-span-2 space-y-6">
//           <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
//             <h2 className="text-xl font-semibold text-slate-900">{order.title}</h2>
//             <div className="border-t border-slate-100 pt-4">
//               <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
//               <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{order.description}</p>
//             </div>
//           </div>

//           {/* Action Control Panel */}
//           <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
//             <h3 className="text-base font-bold text-slate-900">Available Lifecycle Actions</h3>
//             <p className="text-xs text-slate-500">
//               Your active role (<span className="font-semibold text-slate-700">{role}</span>) can perform actions valid for state <span className="font-semibold text-slate-700">{order.status}</span>.
//             </p>

//             <div className="flex flex-wrap gap-3 pt-2">
//               {/* DISPATCH ACTION (DISPATCHER / ADMIN) */}
//               {(role === "DISPATCHER" || role === "ADMIN") && order.status === "CREATED" && (
//                 <button
//                   onClick={() => transitionMutation.mutate({ action: "dispatch" })}
//                   disabled={transitionMutation.isPending}
//                   className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
//                 >
//                   <Send className="h-4 w-4" />
//                   <span>Dispatch Order</span>
//                 </button>
//               )}

//               {/* OFFER / ACCEPT ACTION (TECHNICIAN) */}
//               {role === "TECHNICIAN" && order.status === "DISPATCHED" && (
//                 <button
//                   onClick={() => transitionMutation.mutate({ action: "offer" })}
//                   disabled={transitionMutation.isPending}
//                   className="inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
//                 >
//                   <Clock className="h-4 w-4" />
//                   <span>Accept / Claim Order</span>
//                 </button>
//               )}

//               {/* START WORK ACTION (TECHNICIAN) */}
//               {role === "TECHNICIAN" && (order.status === "OFFERED" || order.status === "DISPATCHED") && (
//                 <button
//                   onClick={() => transitionMutation.mutate({ action: "accept" })}
//                   disabled={transitionMutation.isPending}
//                   className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
//                 >
//                   <Play className="h-4 w-4" />
//                   <span>Accept Work Order</span>
//                 </button>
//               )}

//               {/* COMPLETE WORK ACTION (TECHNICIAN) */}
//               {role === "TECHNICIAN" && order.status === "IN_PROGRESS" && (
//                 <button
//                   onClick={() => transitionMutation.mutate({ action: "complete" })}
//                   disabled={transitionMutation.isPending}
//                   className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
//                 >
//                   <CheckCircle2 className="h-4 w-4" />
//                   <span>Mark Completed</span>
//                 </button>
//               )}

//               {/* CLOSE ACTION (DISPATCHER / ADMIN) */}
//               {(role === "DISPATCHER" || role === "ADMIN") && order.status === "COMPLETED" && (
//                 <button
//                   onClick={() => transitionMutation.mutate({ action: "close" })}
//                   disabled={transitionMutation.isPending}
//                   className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
//                 >
//                   <XCircle className="h-4 w-4" />
//                   <span>Close Work Order</span>
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Right Column: Metadata Sidebar */}
//         <div className="space-y-6">
//           <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
//             <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Stakeholders</h3>
            
//             <div className="space-y-3 text-sm">
//               <div className="flex items-start space-x-3">
//                 <User className="h-5 w-5 text-slate-400 mt-0.5" />
//                 <div>
//                   <p className="text-xs text-slate-500 font-medium">Client</p>
//                   <p className="font-semibold text-slate-800">
//                     {order.client?.full_name || `Client #${order.client_id}`}
//                   </p>
//                   <p className="text-xs text-slate-500">{order.client?.email}</p>
//                 </div>
//               </div>

//               <div className="flex items-start space-x-3 border-t border-slate-100 pt-3">
//                 <Wrench className="h-5 w-5 text-slate-400 mt-0.5" />
//                 <div>
//                   <p className="text-xs text-slate-500 font-medium">Assigned Technician</p>
//                   <p className="font-semibold text-slate-800">
//                     {order.technician?.full_name || (order.technician_id ? `Tech #${order.technician_id}` : "Unassigned")}
//                   </p>
//                   <p className="text-xs text-slate-500">{order.technician?.email || "—"}</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3 text-xs text-slate-500">
//             <div className="flex justify-between">
//               <span>Created At:</span>
//               <span className="font-medium text-slate-700">{new Date(order.created_at).toLocaleDateString()}</span>
//             </div>
//             <div className="flex justify-between">
//               <span>Last Updated:</span>
//               <span className="font-medium text-slate-700">{new Date(order.updated_at).toLocaleDateString()}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }













"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { WorkOrder } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import StatusBadge from "@/components/ui/StatusBadge";
import { 
  ArrowLeft, 
  User, 
  Wrench, 
  CheckCircle2, 
  Play, 
  Send, 
  XCircle, 
  PlusCircle,
  FileText
} from "lucide-react";

export default function WorkOrderDetailPage() {
  const params = useParams();
  const workOrderId = params?.id as string;
  
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [logNotes, setLogNotes] = useState("");

  // 1. Query Work Order Details
  const { data: order, isLoading: isOrderLoading, isError } = useQuery({
    queryKey: ["work-orders", workOrderId],
    queryFn: async () => {
      return await api.get<never, WorkOrder>(`/work-orders/${workOrderId}`);
    },
    enabled: !!workOrderId,
  });

  // 2. Query Execution Logs directly from MongoDB controller (@Get('work-orders/:id/logs'))
  const { data: logsResponse, isLoading: isLogsLoading } = useQuery({
    queryKey: ["work-order-logs", workOrderId],
    queryFn: async () => {
      return await api.get<never, any>(`/work-orders/${workOrderId}/logs`);
    },
    enabled: !!workOrderId,
  });

  // Safely parse execution logs array from response
  const executionLogs = Array.isArray(logsResponse)
    ? logsResponse
    : Array.isArray(logsResponse?.data)
    ? logsResponse.data
    : [];

  // 3. State Transition Mutation (accept, complete, dispatch, close)
  const transitionMutation = useMutation({
    mutationFn: async ({ action, payload }: { action: string; payload?: object }) => {
      return await api.patch(`/work-orders/${workOrderId}/${action}`, payload || {});
    },
    onSuccess: (_, variables) => {
      toast.success(`Action '${variables.action}' executed successfully!`);
      queryClient.invalidateQueries({ queryKey: ["work-orders", workOrderId] });
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update work order state");
    },
  });

  // 4. Add Execution Log Mutation (@Post('work-orders/:id/logs'))
  const logMutation = useMutation({
    mutationFn: async (payload: { technician_notes: string }) => {
      return await api.post(`/work-orders/${workOrderId}/logs`, payload);
    },
    onSuccess: () => {
      toast.success("Execution log added successfully!");
      setLogNotes("");
      queryClient.invalidateQueries({ queryKey: ["work-order-logs", workOrderId] });
      queryClient.invalidateQueries({ queryKey: ["work-orders", workOrderId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create execution log");
    },
  });

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logNotes.trim()) {
      toast.error("Please enter technician notes before submitting.");
      return;
    }
    logMutation.mutate({
      technician_notes: logNotes,
    });
  };

  if (isOrderLoading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-sm">Loading work order details...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200 text-center max-w-md mx-auto my-12">
        <h2 className="text-lg font-bold text-slate-900">Work Order Not Found</h2>
        <p className="text-slate-500 text-sm mt-2 mb-4">
          The requested work order does not exist or you lack permission to view it.
        </p>
        <Link
          href="/work-orders"
          className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Return to List
        </Link>
      </div>
    );
  }

  const role = user?.role;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900">Order #{order.id}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-slate-500 text-sm">
              Created on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">{order.title}</h2>
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Description
              </h3>
              <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                {order.description}
              </p>
            </div>
          </div>

          {/* Action Control Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Available Lifecycle Actions</h3>
            <p className="text-xs text-slate-500">
              Your active role (<span className="font-semibold text-slate-700">{role}</span>) can perform actions valid for state <span className="font-semibold text-slate-700">{order.status}</span>.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {/* DISPATCH ACTION (DISPATCHER / ADMIN) */}
              {(role === "DISPATCHER" || role === "ADMIN") && order.status === "CREATED" && (
                <button
                  onClick={() => transitionMutation.mutate({ action: "dispatch" })}
                  disabled={transitionMutation.isPending}
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>Dispatch Order</span>
                </button>
              )}

              {/* ACCEPT ACTION (TECHNICIAN) -> Calls @Patch(':id/accept') */}
              {role === "TECHNICIAN" && (order.status === "DISPATCHED" || order.status === "OFFERED") && (
                <button
                  onClick={() => transitionMutation.mutate({ action: "accept" })}
                  disabled={transitionMutation.isPending}
                  className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  <span>Accept Work Order</span>
                </button>
              )}

              {/* COMPLETE ACTION (TECHNICIAN) -> Calls @Patch(':id/complete') */}
              {role === "TECHNICIAN" && order.status === "IN_PROGRESS" && (
                <button
                  onClick={() => transitionMutation.mutate({ action: "complete" })}
                  disabled={transitionMutation.isPending}
                  className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mark Completed</span>
                </button>
              )}

              {/* CLOSE ACTION (DISPATCHER / ADMIN) -> Calls @Patch(':id/close') */}
              {(role === "DISPATCHER" || role === "ADMIN") && order.status === "COMPLETED" && (
                <button
                  onClick={() => transitionMutation.mutate({ action: "close" })}
                  disabled={transitionMutation.isPending}
                  className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Close Work Order</span>
                </button>
              )}
            </div>
          </div>

          {/* Execution Logs Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Execution Logs ({executionLogs.length})</span>
              </h3>
            </div>

            {/* Form to add log (Visible to Technicians when order is IN_PROGRESS) */}
            {role === "TECHNICIAN" && order.status === "IN_PROGRESS" && (
              <form onSubmit={handleAddLog} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs font-semibold text-slate-700">Add Work Execution Log (Required to Complete)</p>
                <div>
                  <textarea
                    rows={3}
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder="Describe actions taken, replaced components, or diagnostic findings..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={logMutation.isPending}
                    className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>{logMutation.isPending ? "Submitting..." : "Submit Log"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* List existing logs fetched from MongoDB */}
            {isLogsLoading ? (
              <p className="text-xs text-slate-400 animate-pulse">Loading execution logs...</p>
            ) : executionLogs.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No execution logs added yet.</p>
            ) : (
              <div className="space-y-3">
                {executionLogs.map((log: any, idx: number) => (
                  <div key={log.id || log._id || idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-semibold text-slate-700">Log #{idx + 1}</span>
                      <span>
                        {log.createdAt || log.created_at
                          ? new Date(log.createdAt || log.created_at).toLocaleString()
                          : "Recently"}
                      </span>
                    </div>
                    <p className="text-slate-800 text-sm whitespace-pre-wrap">{log.technician_notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Stakeholders</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Client</p>
                  <p className="font-semibold text-slate-800">
                    {order.client?.full_name || `Client #${order.client_id}`}
                  </p>
                  <p className="text-xs text-slate-500">{order.client?.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 border-t border-slate-100 pt-3">
                <Wrench className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Assigned Technician</p>
                  <p className="font-semibold text-slate-800">
                    {order.technician?.full_name || (order.technician_id ? `Tech #${order.technician_id}` : "Unassigned")}
                  </p>
                  <p className="text-xs text-slate-500">{order.technician?.email || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}