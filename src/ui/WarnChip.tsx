import { AlertTriangle } from "lucide-react";

export function WarnChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="ss-warn" role="status">
      <AlertTriangle aria-hidden size={14} />
      {children}
    </span>
  );
}
