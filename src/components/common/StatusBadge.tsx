import React from "react";
import type { ModuleStatus } from "@/types";
import { cn } from "@/lib/utils";
import styles from "./StatusBadge.module.css";

interface StatusBadgeProps {
  status: ModuleStatus;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const statusLabels: Record<ModuleStatus, string> = {
    ready: "Ready",
    stubbed: "Integration Stub",
    "in-development": "In Progress",
    planned: "Planned",
  };

  const statusClassMap: Record<ModuleStatus, string> = {
    ready: styles.ready,
    stubbed: styles.stubbed,
    "in-development": styles.inDevelopment,
    planned: styles.planned,
  };

  return (
    <span className={cn(styles.badge, statusClassMap[status])}>
      <span className={styles.dot} />
      <span>{label || statusLabels[status]}</span>
    </span>
  );
};
