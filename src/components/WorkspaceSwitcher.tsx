"use client";

import React, { useState } from "react";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { ChevronDown, Plus, Building, Settings, X } from "lucide-react";

export default function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspace, createWorkspace, updateWorkspaceBranding, isLoading } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("");

  if (isLoading) {
    return <div className="h-8 w-32 animate-pulse bg-white/10 rounded-md" />;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    await createWorkspace(newName);
    setNewName("");
    setIsCreating(false);
    setIsOpen(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    await updateWorkspaceBranding(activeWorkspace.id, logoUrl, brandColor);
    setIsEditing(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-48 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Building className="w-4 h-4 text-white/50 shrink-0" />
          <span className="text-xs font-medium text-white/90 truncate">
            {activeWorkspace ? activeWorkspace.name : "Select Workspace"}
          </span>
        </div>
        <ChevronDown className={`w-3 h-3 text-white/50 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-56 bg-black border border-white/10 rounded-md shadow-xl overflow-hidden z-50">
          <div className="max-h-64 overflow-y-auto py-1">
            {workspaces.map(w => (
              <div
                key={w.id}
                onClick={() => {
                  setActiveWorkspace(w);
                  setIsOpen(false);
                }}
                className={`w-full cursor-pointer flex items-center px-3 py-2 text-left text-xs transition-colors ${activeWorkspace?.id === w.id ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
              >
                <span className="truncate flex-1">{w.name}</span>
                {activeWorkspace?.id === w.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLogoUrl(w.logo_url || "");
                      setBrandColor(w.brand_color || "");
                      setIsEditing(true);
                      setIsCreating(false);
                    }}
                    className="p-1 text-white/40 hover:text-white transition-colors"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="border-t border-white/10 p-2">
            {isEditing ? (
              <form onSubmit={handleEdit} className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-1 mb-1 text-[10px] text-white/50 uppercase tracking-widest">
                  <span>Workspace Settings</span>
                  <button type="button" onClick={() => setIsEditing(false)} className="hover:text-white"><X className="w-3 h-3" /></button>
                </div>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Logo URL (e.g. https://...)"
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="Brand Color (e.g. #34D399)"
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
                <button type="submit" className="w-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-medium py-1.5 rounded transition-colors mt-1">
                  Save Changes
                </button>
              </form>
            ) : isCreating ? (
              <form onSubmit={handleCreate} className="flex flex-col gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Workspace name..."
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
                <div className="flex items-center gap-2">
                  <button type="submit" className="flex-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-medium py-1.5 rounded transition-colors">
                    Create
                  </button>
                  <button type="button" onClick={() => setIsCreating(false)} className="flex-1 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white text-[10px] font-medium py-1.5 rounded transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => { setIsCreating(true); setIsEditing(false); }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
              >
                <Plus className="w-3 h-3" /> New Workspace
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
