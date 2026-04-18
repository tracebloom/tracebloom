import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./tokens.css";

function Viewer() {
  return (
    <div
      style={{
        minHeight: "100vh",
        margin: 0,
        background: "var(--bg)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-ui)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-7)",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 600 }}>
        <div
          style={{
            fontSize: 14,
            fontFamily: "var(--font-code)",
            color: "var(--text-secondary)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "var(--space-4)",
          }}
        >
          tracebloom viewer
        </div>
        <h1
          style={{
            fontSize: 36,
            margin: 0,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
          }}
        >
          Coming soon.
        </h1>
        <p
          style={{
            marginTop: "var(--space-5)",
            fontSize: 17,
            lineHeight: 1.55,
            color: "var(--text-secondary)",
          }}
        >
          See every decision your agent makes. Replay any run with one variable
          changed. Catch drift before your users do.
        </p>
        <div
          style={{
            marginTop: "var(--space-7)",
            padding: "var(--space-4) var(--space-5)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderLeft: "3px solid var(--accent)",
            borderRadius: "var(--radius-2)",
            display: "inline-block",
            fontFamily: "var(--font-code)",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          v0.1.0 · Phase 2
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("root element missing");

createRoot(root).render(
  <StrictMode>
    <Viewer />
  </StrictMode>,
);
