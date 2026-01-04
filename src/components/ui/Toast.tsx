"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  open: boolean;
  duration?: number; // ms
  onClose?: () => void;
};

export default function Toast({
  message,
  type = "info",
  open,
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  const bg =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-slate-700";

  return (
    <div className="fixed right-4 bottom-6 z-50">
      <div className={`max-w-xs ${bg} text-white px-4 py-2 rounded shadow-lg`}>
        {message}
      </div>
    </div>
  );
}
