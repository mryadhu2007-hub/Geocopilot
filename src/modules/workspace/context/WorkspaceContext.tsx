"use client";

import React, { createContext, useReducer, ReactNode } from "react";
import type { WorkspaceState, WorkspaceAction } from "../types";
import { workspaceReducer } from "../reducer";
import { initialWorkspaceState } from "../initialState";

export interface WorkspaceContextValue {
  state: WorkspaceState;
  dispatch: React.Dispatch<WorkspaceAction>;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
  initialState?: WorkspaceState;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({
  children,
  initialState = initialWorkspaceState,
}) => {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);

  return (
    <WorkspaceContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
