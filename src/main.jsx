import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { PWAProvider } from "./contexts/PWAContext";
import "./index.css";

const savedTheme = window.localStorage.getItem("pesowise-theme");
const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
const initialTheme =
  savedTheme === "light" || savedTheme === "dark"
    ? savedTheme
    : prefersDark
      ? "dark"
      : "light";

document.documentElement.classList.toggle("dark", initialTheme === "dark");
document.documentElement.style.colorScheme = initialTheme;

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("PesoWise service worker registration failed:", error);
    });
  });
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <PWAProvider>
        <ToastProvider>
          <AuthProvider>
            <WorkspaceProvider>
              <App />
            </WorkspaceProvider>
          </AuthProvider>
        </ToastProvider>
      </PWAProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
