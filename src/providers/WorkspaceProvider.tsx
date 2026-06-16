"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export type Workspace = {
  id: string;
  name: string;
  logo_url?: string;
  brand_color?: string;
  created_at: string;
};

type WorkspaceContextType = {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (w: Workspace | null) => void;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace | null>;
  updateWorkspaceBranding: (id: string, logoUrl: string, brandColor: string) => Promise<void>;
  isLoading: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshWorkspaces = async () => {
    if (!userId) {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const res = await fetch("/api/workspaces");
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
        
        // If we have workspaces but no active one, select the first one.
        // If we have an active one, make sure it still exists.
        if (data.workspaces?.length > 0) {
          if (!activeWorkspace || !data.workspaces.find((w: Workspace) => w.id === activeWorkspace.id)) {
            setActiveWorkspace(data.workspaces[0]);
          }
        } else {
          setActiveWorkspace(null);
        }
      }
    } catch (e) {
      console.error("Failed to load workspaces", e);
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkspace = async (name: string) => {
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        const newW = data.workspace;
        setWorkspaces(prev => [...prev, newW]);
        setActiveWorkspace(newW);
        return newW;
      }
    } catch (e) {
      console.error("Failed to create workspace", e);
    }
    return null;
  };

  const updateWorkspaceBranding = async (id: string, logoUrl: string, brandColor: string) => {
    try {
      const res = await fetch("/api/workspaces", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, logo_url: logoUrl, brand_color: brandColor }),
      });
      if (res.ok) {
        await refreshWorkspaces();
      }
    } catch (e) {
      console.error("Failed to update workspace branding", e);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      refreshWorkspaces();
    }
  }, [isLoaded, userId]);

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, setActiveWorkspace, refreshWorkspaces, createWorkspace, updateWorkspaceBranding, isLoading }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
