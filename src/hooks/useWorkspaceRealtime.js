import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useWorkspaceRealtime(workspaceId, tables, onChange) {
  useEffect(() => {
    if (!workspaceId || !tables?.length || !onChange) return undefined;
    const channel = supabase.channel(`workspace:${workspaceId}:${tables.join("-")}:${Math.random()}`);
    tables.forEach((table) => {
      channel.on("postgres_changes", {
        event: "*",
        schema: "public",
        table,
        filter: `workspace_id=eq.${workspaceId}`,
      }, (payload) => onChange(table, payload));
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspaceId, tables?.join("|"), onChange]);
}
