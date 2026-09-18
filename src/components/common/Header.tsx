import React from "react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { StatusBadge } from "./StatusBadge";
import styles from "./Header.module.css";

export const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.logoIcon}>🛰️</span>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{APP_NAME}</h1>
          <p className={styles.tagline}>{APP_TAGLINE}</p>
        </div>
      </div>

      <div className={styles.actions}>
        <span className={styles.envInfo}>Next.js App Router • TypeScript</span>
        <StatusBadge status="ready" label="Foundation Online" />
      </div>
    </header>
  );
};
