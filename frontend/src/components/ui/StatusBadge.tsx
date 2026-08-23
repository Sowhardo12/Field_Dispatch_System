// src/components/ui/StatusBadge.tsx
import { WorkOrderStatus } from "@/types";

interface StatusBadgeProps {
  status: WorkOrderStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStyles = (status: WorkOrderStatus) => {
    switch (status) {
      case "CREATED":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "DISPATCHED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "OFFERED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "IN_PROGRESS":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CLOSED":
        return "bg-slate-200 text-slate-800 border-slate-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyles(
        status
      )}`}
    >
      {status}
    </span>
  );
}