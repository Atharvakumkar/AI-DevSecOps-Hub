import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:7000";

const styles = {
  app: {
    minHeight: "100vh",
    background: "#0d1117",
    color: "#e6edf3",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  header: {
    background: "#161b22",
    borderBottom: "1px solid #30363d",
    padding: "16px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 20,
    fontWeight: 700,
    color: "#58a6ff",
  },
  statusDot: (connected) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: connected ? "#3fb950" : "#f85149",
    display: "inline-block",
    marginRight: 6,
  }),
  statusText: (connected) => ({
    fontSize: 12,
    color: connected ? "#3fb950" : "#f85149",
  }),
  main: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "32px 24px",
  },
  statsBar: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 10,
    padding: "20px 24px",
    textAlign: "center",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 700,
    color: "#58a6ff",
    margin: 0,
  },
  statLabel: {
    fontSize: 12,
    color: "#8b949e",
    marginTop: 4,
  },
  scanBox: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 10,
    padding: 24,
    marginBottom: 32,
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 16,
    color: "#e6edf3",
  },
  inputRow: {
    display: "flex",
    gap: 12,
  },
  input: {
    flex: 1,
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: 8,
    padding: "10px 16px",
    fontSize: 14,
    color: "#e6edf3",
    outline: "none",
  },
  scanBtn: (loading) => ({
    background: loading ? "#388bfd50" : "#238636",
    border: "none",
    borderRadius: 8,
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    cursor: loading ? "not-allowed" : "pointer",
    minWidth: 120,
    transition: "background 0.2s",
  }),
  message: (type) => ({
    marginTop: 12,
    fontSize: 13,
    color: type === "success" ? "#3fb950" : "#f85149",
  }),
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#e6edf3",
    marginBottom: 16,
  },
  card: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    transition: "border-color 0.2s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  repoName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#58a6ff",
    textDecoration: "none",
  },
  riskBadge: (level) => {
    const colors = {
      CRITICAL: { bg: "#f8514920", color: "#f85149", border: "#f85149" },
      HIGH:     { bg: "#fb8f4420", color: "#fb8f44", border: "#fb8f44" },
      MEDIUM:   { bg: "#d2992220", color: "#d29922", border: "#d29922" },
      LOW:      { bg: "#3fb95020", color: "#3fb950", border: "#3fb950" },
      NONE:     { bg: "#8b949e20", color: "#8b949e", border: "#8b949e" },
    };
    const c = colors[level] || colors.NONE;
    return {
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      borderRadius: 20,
      padding: "3px 12px",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
    };
  },
  severityRow: {
    display: "flex",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  severityPill: (color, bg) => ({
    background: bg,
    color: color,
    borderRadius: 6,
    padding: "4px 12px",
    fontSize: 13,
    fontWeight: 600,
  }),
  timestamp: {
    fontSize: 11,
    color: "#8b949e",
    marginTop: 8,
  },
  adviceBox: {
    marginTop: 14,
    background: "#1c2128",
    border: "1px solid #388bfd40",
    borderLeft: "3px solid #58a6ff",
    borderRadius: 6,
    overflow: "hidden",
  },
  adviceHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    cursor: "pointer",
    userSelect: "none",
  },
  adviceTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#58a6ff",
  },
  adviceContent: {
    padding: "0 14px 14px",
    fontSize: 13,
    color: "#c9d1d9",
    whiteSpace: "pre-wrap",
    lineHeight: 1.7,
  },
  empty: {
    textAlign: "center",
    padding: "48px 0",
    color: "#8b949e",
    fontSize: 14,
  },
  sonarLink: {
    display: "inline-block",
    marginTop: 8,
    fontSize: 12,
    color: "#58a6ff",
    textDecoration: "none",
    border: "1px solid #30363d",
    borderRadius: 6,
    padding: "3px 10px",
  },
};

function getRiskLevel(critical, high, medium, low) {
  if (critical > 0) return "CRITICAL";
  if (high > 0) return "HIGH";
  if (medium > 0) return "MEDIUM";
  if (low > 0) return "LOW";
  return "NONE";
}

function timeAgo(timestamp) {
  if (!timestamp) return "";
  const diff = Math.floor((Date.now() - new Date(timestamp + "Z").getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ScanCard({ scan }) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const isPending = scan.status === "pending" || scan.status === "running";
  const risk = getRiskLevel(
    scan.critical ?? 0,
    scan.high ?? 0,
    scan.medium ?? 0,
    scan.low ?? 0
  );

  useEffect(() => {
    if (!isPending) {
      setProgress(100);
      return;
    }
    setProgress(10);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 8;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isPending]);

  return (
    <div style={styles.card}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>

      {isPending && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "#58a6ff" }}>⏳ Jenkins scanning...</span>
            <span style={{ fontSize: 12, color: "#8b949e" }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ background: "#0d1117", borderRadius: 4, height: 6, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #1f6feb, #58a6ff)",
              borderRadius: 4,
              transition: "width 1.2s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, gap: 8 }}>
            {["Cloning repo", "SonarQube", "Trivy scan", "Sending report"].map((step, i) => (
              <div key={i} style={{
                flex: 1,
                background: progress > (i + 1) * 22 ? "#1f6feb20" : "#161b22",
                border: `1px solid ${progress > (i + 1) * 22 ? "#1f6feb" : "#30363d"}`,
                borderRadius: 6,
                padding: "6px 4px",
                textAlign: "center",
                fontSize: 10,
                color: progress > (i + 1) * 22 ? "#58a6ff" : "#8b949e",
                transition: "all 0.5s ease",
              }}>
                {progress > (i + 1) * 22 ? "✓ " : ""}{step}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.cardHeader}>
        <div>
          <a href={scan.repo_url} target="_blank" rel="noreferrer" style={styles.repoName}>
            {scan.repo_name}
          </a>
        </div>
        {!isPending && <span style={styles.riskBadge(risk)}>{risk} RISK</span>}
      </div>

      {isPending ? (
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          {["Critical", "High", "Medium", "Low"].map(label => (
            <div key={label} style={{
              background: "#0d1117",
              borderRadius: 6,
              padding: "4px 12px",
              fontSize: 13,
              color: "#30363d",
              animation: "pulse 1.5s ease-in-out infinite",
            }}>
              {label}: --
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.severityRow}>
          <span style={styles.severityPill("#f85149", "#f8514920")}>Critical: {scan.critical ?? 0}</span>
          <span style={styles.severityPill("#fb8f44", "#fb8f4420")}>High: {scan.high ?? 0}</span>
          <span style={styles.severityPill("#d29922", "#d2992220")}>Medium: {scan.medium ?? 0}</span>
          <span style={styles.severityPill("#3fb950", "#3fb95020")}>Low: {scan.low ?? 0}</span>
        </div>
      )}

      <div style={styles.timestamp}>
        Status: {scan.status} · {timeAgo(scan.timestamp)}
      </div>

      {scan.sonarqube_url && !isPending && (
  <a
    href={scan.sonarqube_url.replace(
      "host.docker.internal",
      "localhost"
    )}
    target="_blank"
    rel="noreferrer"
    style={styles.sonarLink}
  >
    📊 View SonarQube Report →
  </a>
)}
      {scan.advice && !isPending && (
        <div style={styles.adviceBox}>
          <div style={styles.adviceHeader} onClick={() => setOpen(!open)}>
            <span style={styles.adviceTitle}>🤖 AI Security Advice</span>
            <span style={{ color: "#58a6ff", fontSize: 12 }}>{open ? "▲ Hide" : "▼ Show"}</span>
          </div>
          {open && <div style={styles.adviceContent}>{scan.advice}</div>}
        </div>
      )}
    </div>
  );
}

function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [scans, setScans] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const fetchScans = async () => {
    try {
      const res = await axios.get(`${API}/api/scans`);
      setScans(res.data);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    fetchScans();
    const interval = setInterval(() => {
      fetchScans();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleScan = async () => {
    if (!repoUrl || loading) return;
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      await axios.post(`${API}/api/scan`, { repo_url: repoUrl });
      setMessage({ text: `✅ Scan queued! Jenkins is running...`, type: "success" });
      setRepoUrl("");
      fetchScans();
    } catch {
      setMessage({ text: "❌ Failed to trigger scan. Is the backend running?", type: "error" });
    }
    setLoading(false);
  };

  const totalCritical = scans.reduce((s, x) => s + (x.critical || 0), 0);

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div style={styles.logo}>
          🛡️ AI DevSecOps Hub
        </div>
        <div>
          <span style={styles.statusDot(connected)} />
          <span style={styles.statusText(connected)}>
            {connected ? "Backend connected" : "Backend offline"}
          </span>
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.statsBar}>
          <div style={styles.statCard}>
            <p style={styles.statNumber}>{scans.length}</p>
            <p style={styles.statLabel}>TOTAL SCANS</p>
          </div>
          <div style={styles.statCard}>
            <p style={{ ...styles.statNumber, color: totalCritical > 0 ? "#f85149" : "#3fb950" }}>
              {totalCritical}
            </p>
            <p style={styles.statLabel}>CRITICAL VULNERABILITIES</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statNumber}>
              {new Set(scans.map(s => s.repo_name)).size}
            </p>
            <p style={styles.statLabel}>REPOS SCANNED</p>
          </div>
        </div>

        <div style={styles.scanBox}>
          <div style={styles.scanTitle}>🔍 Scan a Repository</div>
          <div style={styles.inputRow}>
            <input
              style={styles.input}
              type="text"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleScan()}
            />
            <button style={styles.scanBtn(loading)} onClick={handleScan}>
              {loading ? "Queuing..." : "Scan"}
            </button>
          </div>
          {message.text && (
            <p style={styles.message(message.type)}>{message.text}</p>
          )}
        </div>

        <div style={styles.sectionTitle}>📋 Recent Scans ({scans.length})</div>
        {scans.length === 0 ? (
          <div style={styles.empty}>
            <p>No scans yet.</p>
            <p>Enter a GitHub URL above to get started.</p>
          </div>
        ) : (
          scans.map(scan => <ScanCard key={scan.id} scan={scan} />)
        )}
      </div>
    </div>
  );
}

export default App;