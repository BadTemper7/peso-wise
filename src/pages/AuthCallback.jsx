import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import LoadingScreen from "../components/common/LoadingScreen";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    const run = async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) await supabase.auth.exchangeCodeForSession(code);
      const { data } = await supabase.auth.getSession();
      navigate(data.session ? "/dashboard" : "/login", { replace: true });
    };
    run().catch(() => navigate("/login", { replace: true }));
  }, [navigate]);
  return <LoadingScreen label="Verifying your email…" />;
}
