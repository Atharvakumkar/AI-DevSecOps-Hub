from flask import Flask, request, jsonify
from flask_cors import CORS
from db import init_db, save_scan, get_all_scans, get_scan_by_id
import requests

app = Flask(__name__)
CORS(app)

JENKINS_URL = "http://localhost:2000"
JENKINS_USER = "Atharvakumkar"
JENKINS_TOKEN = "11eb92f40bd544d5a20801bd8fddcc508c"

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/api/scan", methods=["POST"])
def trigger_scan():
    data = request.get_json()
    repo_url = data.get("repo_url", "").strip()

    if not repo_url:
        return jsonify({"error": "repo_url is required"}), 400

    repo_parts = repo_url.rstrip("/").split("/")
    repo_name = f"{repo_parts[-2]}/{repo_parts[-1]}"

    scan_id = save_scan({
        "repo_url": repo_url,
        "repo_name": repo_name,
        "status": "pending",
    })

    try:
        jenkins_response = requests.post(
            f"{JENKINS_URL}/job/devsecops-scan/buildWithParameters",
            auth=(JENKINS_USER, JENKINS_TOKEN),
            params={"REPO_URL": repo_url, "REPO_NAME": repo_name},
            timeout=5
        )
        print(f"Jenkins triggered: {jenkins_response.status_code}")
    except Exception as e:
        print(f"Jenkins trigger failed: {e}")

    return jsonify({"message": "Scan queued", "scan_id": scan_id, "repo": repo_name}), 202

@app.route("/api/scans", methods=["GET"])
def list_scans():
    return jsonify(get_all_scans())

@app.route("/api/scans/<int:scan_id>", methods=["GET"])
def get_scan(scan_id):
    scan = get_scan_by_id(scan_id)
    if not scan:
        return jsonify({"error": "Not found"}), 404
    return jsonify(scan)

@app.route("/api/report", methods=["POST"])
def receive_report():
    data = request.get_json()
    scan_id = save_scan(data)
    return jsonify({"message": "Report saved", "scan_id": scan_id}), 201

if __name__ == "__main__":
    init_db()
    app.run(port=7000, debug=True)