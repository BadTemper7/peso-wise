import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("INVITE_FROM_EMAIL") || "PesoWise <noreply@example.com>";
    const appUrl = (Deno.env.get("APP_URL") || "http://localhost:5173").replace(/\/$/, "");
    const authorization = request.headers.get("Authorization") || "";

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { invitationId } = await request.json();
    const { data: invitation, error } = await userClient
      .from("workspace_invitations")
      .select("id,email,role,token,expires_at,workspace:workspaces(name),inviter:profiles!workspace_invitations_invited_by_fkey(full_name)")
      .eq("id", invitationId)
      .single();
    if (error || !invitation) throw error || new Error("Invitation not found");

    if (!resendKey) return new Response(JSON.stringify({ sent: false, reason: "RESEND_API_KEY is not configured" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [invitation.email],
        subject: `You’re invited to ${invitation.workspace.name} on PesoWise`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#152238"><h2>Manage money together</h2><p>${invitation.inviter?.full_name || "A workspace admin"} invited you to <strong>${invitation.workspace.name}</strong> as a ${invitation.role}.</p><p><a href="${appUrl}/register?email=${encodeURIComponent(invitation.email)}" style="display:inline-block;background:#14b8a6;color:#041030;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Open PesoWise</a></p><p style="color:#718096;font-size:12px">Sign in or register with ${invitation.email}. The invitation expires on ${new Date(invitation.expires_at).toLocaleDateString()}.</p></div>`,
      }),
    });
    if (!response.ok) throw new Error(await response.text());
    return new Response(JSON.stringify({ sent: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
