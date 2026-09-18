"use client";

import React from "react";
import { TEAM_ROLES } from "@/lib/constants";
import styles from "./ArchitectureInfoModal.module.css";

interface ArchitectureInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureInfoModal: React.FC<ArchitectureInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="architecture-modal-title"
      onClick={onClose}
    >
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3 id="architecture-modal-title" className={styles.modalTitle}>
            <span>👥</span>
            <span>Team Architecture &amp; Module Ownership</span>
          </h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <p className={styles.modalDesc}>
          GeoCopilot follows a modular architecture where each domain is cleanly isolated
          to enable concurrent development without merge conflicts.
        </p>

        <div className={styles.teamGrid}>
          {TEAM_ROLES.map((member) => (
            <div key={member.member} className={styles.memberCard}>
              <div className={styles.memberHeader}>
                <span className={styles.memberId}>{member.member}</span>
                <span className={styles.memberRole}>{member.role}</span>
              </div>
              <p className={styles.memberFocus}>{member.focus}</p>
              <code className={styles.memberPath}>{member.primaryPath}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
