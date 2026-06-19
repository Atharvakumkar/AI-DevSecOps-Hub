# AI DevSecOps Hub

A full-stack DevSecOps platform that automates vulnerability scanning on any public Git repository. A user submits a repository URL through the frontend, Jenkins clones it and runs a Trivy filesystem scan, the results are sent to the Flask backend, stored in SQLite, and then analysed by a Groq-powered AI model that produces a structured security report. SonarQube runs alongside for static code analysis. The entire stack is containerised and orchestrated with Docker Compose.

## Table of Contents

- [Architecture](#architecture)
- [Pipeline](#pipeline)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Running the Stack](#running-the-stack)
- [Services and Ports](#services-and-ports)
- [Jenkins Pipeline](#jenkins-pipeline)
- [API Reference](#api-reference)
- [Security Notes](#security-notes)
- [Author](#author)
- [License](#license)

---

## Architecture

The platform is composed of four services connected on a shared Docker bridge network (`devsecops-net`):

- **Frontend** — JavaScript/HTML/CSS interface where users submit repository URLs and view scan results
- **Backend** — Python Flask API that receives scan reports, stores them in SQLite, sends them to Groq for AI analysis, and serves results to the frontend
- **Jenkins** — CI server that clones the target repository, runs Trivy inside a Docker container, and posts the raw JSON report to the backend
- **SonarQube** — Community edition static analysis server available for code quality and security rule evaluation

```
User --> Frontend (3000) --> Backend (7000) <-- Jenkins (2000)
                                 |
                              SQLite
                                 |
                              Groq API
                                 |
                           SonarQube (9000)
```

---

## Pipeline

1. User submits a Git repository URL via the frontend.
2. The frontend calls the backend API, which triggers a Jenkins job (`devsecops-scan`) via the Jenkins REST API, passing the repository URL as a parameter.
3. Jenkins clones the repository and runs `aquasec/trivy:latest` as a Docker container against the cloned filesystem, scanning for vulnerabilities at CRITICAL, HIGH, MEDIUM, and LOW severity. Output is written as `trivy-report.json`.
4. Jenkins posts the report JSON to the backend at `POST /api/report`.
5. The backend stores the raw report in SQLite and forwards it to the Groq API for AI-driven analysis and summarisation.
6. The frontend polls or retrieves the processed report and renders the findings.

---

## Project Structure

```
AI-DevSecOps-Hub/
|
|-- backend/                  # Flask API server
|   |-- app.py                # Application entry point and route definitions
|   |-- Dockerfile            # Backend container image
|   |-- requirements.txt      # Python dependencies
|   |-- data/                 # SQLite database volume mount point (scans.db)
|
|-- frontend/                 # Web interface
|   |-- index.html            # Main UI
|   |-- Dockerfile            # Frontend container image
|   |-- (js, css files)       # Client-side logic and styling
|
|-- Jenkinsfile               # Declarative pipeline: Clone, Trivy Scan, Send Results
|-- docker-compose.yml        # Orchestrates backend, frontend, and SonarQube
|-- .env.example              # Template for required environment variables
```

---

## Tech Stack

**Backend**

- Python 3.x
- Flask — REST API framework
- SQLite — scan result persistence (`scans.db`)
- Groq API — AI model inference for vulnerability report analysis

**Frontend**

- JavaScript

**Security Scanning**

- Trivy (`aquasec/trivy:latest`) — filesystem vulnerability scanner; runs as a Docker container inside the Jenkins pipeline
- SonarQube Community Edition — static code analysis

**CI/CD**

- Jenkins — triggers and executes the scan pipeline via a parameterised declarative pipeline

**Infrastructure**

- Docker
- Docker Compose
- Bridge network (`devsecops-net`) connecting all services

---

## Prerequisites

- Docker and Docker Compose installed
- Jenkins running and accessible (by default expected at `http://host.docker.internal:2000`)
- Jenkins must have Docker available on its agent to run the Trivy container
- A Groq API key (obtain from [console.groq.com](https://console.groq.com))
- The Jenkins job `devsecops-scan` created and configured with the `Jenkinsfile` from this repository

---

## Environment Variables

Copy `.env.example` to `.env` and populate the values before starting the stack. The following variables are required by the backend service:

| Variable | Description |
|---|---|
| `FLASK_ENV` | Flask environment (`development` or `production`) |
| `DB_PATH` | Path to the SQLite database file inside the container |
| `JENKINS_URL` | Base URL of the Jenkins server |
| `JENKINS_USER` | Jenkins username for API authentication |
| `JENKINS_TOKEN` | Jenkins API token for authenticating job triggers |
| `JENKINS_JOB` | Name of the Jenkins job to trigger |
| `GROQ_API_KEY` | API key for Groq model inference |

**Never commit a populated `.env` file or hardcode credentials in `docker-compose.yml`.**

---

## Running the Stack
**Method 1 -->**
1. Download **AI-DevSecOps-Hub-Setup.bat** from the releases page
2. Double-click the **.bat** file
3. If Windows Smart App Control blocks it:
   Click "More Info"
   Click "Run Anyway"

**Method 2 -->**

Clone the repository:

```bash
git clone https://github.com/Atharvakumkar/AI-DevSecOps-Hub.git
cd AI-DevSecOps-Hub
```

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

Start all services:

```bash
docker compose up --build
```

To run in detached mode:

```bash
docker compose up --build -d
```

To stop and remove containers:

```bash
docker compose down
```

To remove containers along with named volumes (clears the SQLite and SonarQube data):

```bash
docker compose down -v
```

---

## Services and Ports

| Service | Container Name | Host Port | Container Port |
|---|---|---|---|
| Backend | `devsecops-backend` | 7000 | 7000 |
| Frontend | `devsecops-frontend` | 3000 | 3000 |
| SonarQube | `devsecops-sonarqube` | 9000 | 9000 |
| Jenkins | (external) | 2000 | — |

The frontend is accessible at `http://localhost:3000`. The backend API is accessible at `http://localhost:7000`. SonarQube is accessible at `http://localhost:9000` (default credentials: admin / admin on first login).

---

## Jenkins Pipeline

The `Jenkinsfile` defines a three-stage declarative pipeline. The pipeline accepts a single string parameter:

| Parameter | Default | Description |
|---|---|---|
| `REPO_URL` | (empty) | The Git repository URL to clone and scan |

**Stage 1 — Clone**

Clones the target repository into `./repo` on the Jenkins agent workspace.

**Stage 2 — Trivy Scan**

Runs the official Trivy Docker image against the cloned filesystem. The Trivy cache is mounted from `/var/jenkins_home/trivy-cache` to avoid re-downloading the vulnerability database on each run. Scan parameters:

| Parameter | Value |
|---|---|
| Scanner | `vuln` (OS and library vulnerabilities) |
| Output format | `json` |
| Output file | `/scan/trivy-report.json` |
| Severity filter | `CRITICAL,HIGH,MEDIUM,LOW` |

The stage uses `|| true` to prevent the pipeline from failing if Trivy exits with a non-zero code due to found vulnerabilities, allowing the results to still be posted.

**Stage 3 — Send Results**

Posts the scan results to the backend via `curl -X POST http://backend:5000/api/report`.

---

## API Reference

The backend exposes the following endpoint. Full request and response schemas are defined in `backend/app.py`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/report` | Receives a Trivy JSON report from Jenkins; stores it and triggers AI analysis |
| `GET` | `/api/scans` | Returns a list of all stored scan results |
| `GET` | `/api/scans/<id>` | Returns the full report and AI analysis for a specific scan |

---

## Security Notes

- The `docker-compose.yml` in this repository contains hardcoded credentials including a Jenkins API token and a Groq API key. These should be treated as compromised and rotated immediately. All secrets must be moved to a `.env` file or a secrets manager and loaded via environment variable substitution in Compose.
- The `.env.example` file exists as a template.
- The SonarQube default admin password should be changed immediately after first login.
- Trivy is run with `--scanners vuln` which covers OS packages and application dependencies. For broader coverage, consider adding `--scanners secret` to detect hardcoded secrets in the scanned repository.

---

## Author

Atharva Kumkar

---

## License

This project is released under the MIT License.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
