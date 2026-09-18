import React from "react";
import { Header } from "@/components/common/Header";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DatasetPlaceholder } from "@/modules/data/components/DatasetPlaceholder";
import { MapPlaceholder } from "@/modules/map/components/MapPlaceholder";
import { CopilotPlaceholder } from "@/modules/copilot/components/CopilotPlaceholder";
import { WorkflowPlaceholder } from "@/modules/workflow/components/WorkflowPlaceholder";
import { TEAM_ROLES } from "@/lib/constants";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.main}>
      {/* 1. Header */}
      <Header />

      <main className={styles.content}>
        {/* 2. System / Workspace Status Information */}
        <section className={styles.heroBanner} aria-label="System Status">
          <div className={styles.heroContent}>
            <h2>GeoCopilot Workspace Foundation</h2>
            <p>
              Initial Next.js App Router &amp; TypeScript frontend online.
              Ready for modular team feature integration.
            </p>
          </div>
          <div className={styles.statusPills}>
            <StatusBadge status="ready" label="Next.js 15" />
            <StatusBadge status="ready" label="React 19" />
            <StatusBadge status="ready" label="TypeScript Strict" />
            <StatusBadge status="stubbed" label="4 Modules Prepared" />
          </div>
        </section>

        {/* 3. Primary Workspace Grid: Datasets, Map, AI Copilot */}
        <section className={styles.workspaceGrid} aria-label="Geospatial Workspace">
          {/* Dataset Area */}
          <div className={styles.datasetCol}>
            <DatasetPlaceholder />
          </div>

          {/* Map Area */}
          <div className={styles.mapCol}>
            <MapPlaceholder />
          </div>

          {/* AI Copilot Area */}
          <div className={styles.copilotCol}>
            <CopilotPlaceholder />
          </div>
        </section>

        {/* 4. Workflow Area */}
        <section className={styles.workflowSection} aria-label="Analysis Workflow">
          <WorkflowPlaceholder />
        </section>

        {/* 5. Team Architecture & Integration Guide */}
        <section className={styles.teamSection} aria-label="Team Architecture">
          <h2 className={styles.sectionTitle}>
            <span>👥</span>
            <span>Team Architecture &amp; Module Ownership</span>
          </h2>
          <p className={styles.sectionDesc}>
            Each team member owns a distinct layer to prevent merge conflicts.
            Follow branch conventions when developing your respective components.
          </p>

          <div className={styles.teamGrid}>
            {TEAM_ROLES.map((member) => (
              <div key={member.member} className={styles.memberCard}>
                <div className={styles.memberHeader}>
                  <span className={styles.memberId}>{member.member}</span>
                  <StatusBadge
                    status={member.member === "Member 2" ? "ready" : "stubbed"}
                    label={member.member === "Member 2" ? "Foundation Ready" : "Stub Ready"}
                  />
                </div>
                <div className={styles.memberRole}>{member.role}</div>
                <p className={styles.memberFocus}>{member.focus}</p>
                <code className={styles.memberPath}>{member.primaryPath}</code>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>GeoCopilot — Human-AI Geospatial Workspace • Hackathon Foundation Scaffolding</p>
      </footer>
    </div>
  );
}
