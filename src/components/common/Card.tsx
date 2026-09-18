import React from "react";
import { cn } from "@/lib/utils";
import styles from "./Card.module.css";

interface CardProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, action, children, className }) => {
  return (
    <div className={cn(styles.card, className)}>
      {title && (
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{title}</h3>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={styles.cardBody}>{children}</div>
    </div>
  );
};
