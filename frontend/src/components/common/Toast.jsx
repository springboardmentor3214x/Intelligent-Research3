import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import "./Toast.css";

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={18} className="toast-icon toast-icon-success" />,
    error: <AlertCircle size={18} className="toast-icon toast-icon-error" />,
    info: <Info size={18} className="toast-icon toast-icon-info" />
  };

  return (
    <div className={`toast-container toast-${toast.type || "success"} animate-slide-in`}>
      <div className="toast-content">
        {icons[toast.type || "success"]}
        <span className="toast-message">{toast.message}</span>
      </div>
      <button
        type="button"
        className="toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}