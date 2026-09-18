import React from "react";
import { WorkspaceProvider, WorkspaceShell } from "@/modules/workspace";

export default function Home() {
  return (
    <WorkspaceProvider>
      <WorkspaceShell />
    </WorkspaceProvider>
  );
}

