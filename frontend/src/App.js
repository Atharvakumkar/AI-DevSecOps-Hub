import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:7000";

function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [scans, setScans] = useState([]);
  const [message, setMessage] = useState("");

  const fetchScans = async () => {
    const res = await axios.get(`${API}/api/scans`);
    setScans(res.data);
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const handleScan = async () => {
    if (!repoUrl) return;
    const res = await axios.post(`${API}/api/scan`, { repo_url: repoUrl });
    setMessage(`Scan queued! ID: ${res.data.scan_id}`);
    setRepoUrl("");
    fetchScans();
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", fontFamily: "monospace", padding: "0 20px" }}>
      <h1>🔒 DevSecOps Scanning Hub</h1>

      <div style={{ marginBottom: 30 }}>
        <input
          type="text"
          placeholder="https://github.com/owner/repo"
          value={repoUrl}
          onChange={e => setRepoUrl(e.target.value)}
          style={{ width: "70%", padding: 10, fontSize: 16, marginRight: 10 }}
        />
        <button onClick={handleScan} style={{ padding: "10px 20px", fontSize: 16, cursor: "pointer" }}>
          Scan
        </button>
        {message && <p style={{ color: "green" }}>{message}</p>}
      </div>

      <h2>Scan Results</h2>
      {scans.length === 0 && <p>No scans yet.</p>}
      {scans.map(scan => (
        <div key={scan.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 8px" }}>{scan.repo_name}</h3>
          <p style={{ margin: "0 0 8px", color: "#666" }}>{scan.repo_url}</p>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ color: "red" }}>Critical: {scan.critical}</span>
            <span style={{ color: "orange" }}>High: {scan.high}</span>
            <span style={{ color: "goldenrod" }}>Medium: {scan.medium}</span>
            <span style={{ color: "green" }}>Low: {scan.low}</span>
          </div>
          <p style={{ margin: "8px 0 0", color: "#999", fontSize: 12 }}>
            Status: {scan.status} | {scan.timestamp}
          </p>
        </div>
      ))}
    </div>
  );
}

export default App;