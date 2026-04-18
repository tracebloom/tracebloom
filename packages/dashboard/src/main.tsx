import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./styles.css";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-ui)",
        padding: "var(--space-7)",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "var(--space-5)",
          borderBottom: "1px solid var(--border)",
          marginBottom: "var(--space-6)",
        }}
      >
        <Link
          to="/"
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--text-primary)",
            textDecoration: "none",
            letterSpacing: "-0.01em",
          }}
        >
          tracebloom
        </Link>
        <span
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            fontFamily: "var(--font-code)",
          }}
        >
          pre-alpha · Phase 1
        </span>
      </header>
      {children}
    </div>
  );
}

function Home() {
  return (
    <Shell>
      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          paddingTop: "var(--space-7)",
        }}
      >
        <h1
          style={{
            fontSize: 40,
            lineHeight: 1.15,
            margin: 0,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            fontWeight: 600,
          }}
        >
          Coming soon.
        </h1>
        <p
          style={{
            marginTop: "var(--space-5)",
            fontSize: 18,
            lineHeight: 1.55,
            color: "var(--text-secondary)",
            maxWidth: 580,
          }}
        >
          See every decision your agent makes. Replay any run with one variable
          changed. Catch drift before your users do.
        </p>
        <div
          style={{
            marginTop: "var(--space-7)",
            padding: "var(--space-5)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-3)",
            boxShadow: "var(--shadow)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-code)",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            v0.1.0 ships when Phase 2 completes. Watch the repo to be notified.
          </p>
        </div>
      </main>
    </Shell>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("root element missing");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
