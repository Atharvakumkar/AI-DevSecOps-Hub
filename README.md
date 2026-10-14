# AI DevSecOps Hub

### Automated Security Scanning and AI-Powered Vulnerability Analysis

AI DevSecOps Hub is a full-stack DevSecOps platform that automates security analysis for public Git repositories by integrating **Jenkins, Trivy, SonarQube, Flask, SQLite, and the Groq API**.

Users submit a repository URL through a web interface, triggering an automated pipeline that analyzes the source code, scans dependencies for vulnerabilities, and optionally scans Docker images when a Dockerfile is present.

The resulting security findings are sent to a Flask backend, persisted in SQLite, and analyzed by an AI model to generate structured security reports and remediation recommendations.

The entire application stack is containerized and orchestrated using Docker Compose.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Security Analysis Workflow](#security-analysis-workflow)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Getting Started](#getting-started)
- [Services and Ports](#services-and-ports)
- [Jenkins Pipeline](#jenkins-pipeline)
- [API Reference](#api-reference)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Future Improvements](#future-improvements)
- [Author](#author)
- [License](#license)

---

## Overview

AI DevSecOps Hub demonstrates how security testing can be integrated into an automated software delivery workflow.

Instead of manually executing individual security tools, users can submit a public Git repository and initiate a centralized scanning process.

The platform combines multiple components:

- **Jenkins** orchestrates the scanning pipeline.
- **Trivy** identifies vulnerabilities in repository dependencies and container images.
- **SonarQube** performs static code analysis and identifies code quality issues and security-related findings.
- **Flask** provides the backend API for scan submission, result ingestion, and report retrieval.
- **SQLite** persists scan results and associated analysis.
- **Groq API** powers AI-assisted interpretation of security findings.
- **Docker Compose** orchestrates the containerized application services.

The objective is to demonstrate a practical integration of DevSecOps tools into a centralized security analysis workflow.

## Architecture

The platform consists of a frontend, a Flask backend, Jenkins, SonarQube, and SQLite, with the application services communicating through their configured interfaces.

### Architecture Diagram

```text
                   +---------------------------+
                   |          User             |
                   |  Public Repository URL    |
                   +-------------+-------------+
                                 |
                                 v
                   +---------------------------+
                   |         Frontend          |
                   |      HTML / CSS / JS      |
                   |       Port: 3000           |
                   +-------------+-------------+
                                 |
                                 v
                   +---------------------------+
                   |       Flask Backend       |
                   |       REST API            |
                   |       Port: 7000           |
                   +-------------+-------------+
                                 |
                                 | Trigger Scan
                                 v
                   +---------------------------+
                   |          Jenkins          |
                   |     CI/CD Orchestration   |
                   |       Port: 2000           |
                   +-------------+-------------+
                                 |
                    +------------+------------+
                    |                         |
                    v                         v
          +------------------+     +------------------+
          |      Trivy       |     |    SonarQube     |
          | Filesystem Scan  |     |  Static Analysis |
          | Image Scan       |     |  Code Quality    |
          +--------+---------+     +------------------+
                   |
                   | Scan Results
                   v
          +---------------------------+
          |       Flask Backend       |
          | Report Processing         |
          | AI-Assisted Analysis      |
          +-------------+-------------+
                        |
              +---------+---------+
              |                   |
              v                   v
       +-------------+    +------------------+
       |   SQLite    |    |     Groq API     |
       | Scan History|    | AI Analysis      |
       +-------------+    +------------------+
```

The diagram represents the logical workflow. Actual network paths and service dependencies are determined by the Jenkins configuration, Docker Compose configuration, and backend implementation.

### Service Responsibilities

| Component | Responsibility |
|---|---|
| Frontend | Accepts repository URLs and displays scan results |
| Flask Backend | Coordinates scans, receives reports, and exposes API endpoints |
| Jenkins | Executes the automated security scanning pipeline |
| Trivy | Scans repository filesystems and container images |
| SonarQube | Performs static code analysis and evaluates code quality |
| SQLite | Stores scan history and associated findings |
| Groq API | Generates AI-assisted security analysis and remediation suggestions |
| Docker Compose | Orchestrates the containerized application services |

## Key Features

### Automated Security Scanning

- Accepts public GitHub repository URLs.
- Triggers Jenkins pipelines through the Jenkins REST API.
- Clones target repositories for analysis.
- Performs filesystem vulnerability scanning using Trivy.
- Supports container image scanning when a Dockerfile is detected.
- Integrates SonarQube for static code analysis.
- Categorizes vulnerability findings by severity.

### AI-Assisted Security Analysis

- Processes collected scan findings through the Flask backend.
- Uses the Groq API to generate structured security analysis.
- Produces remediation recommendations based on the supplied findings.
- Associates AI-generated analysis with stored scan results.

AI-generated recommendations should be reviewed and validated before being used to make security decisions.

### Centralized Results Management

- Stores scan results in SQLite.
- Maintains a history of submitted scans.
- Exposes API endpoints for retrieving scan summaries and detailed reports.
- Displays vulnerability summaries and recommendations through the frontend.

### Containerized Infrastructure

- Docker-based application packaging.
- Docker Compose orchestration.
- Shared Docker bridge networking.
- Independent frontend and backend containers.
- Integration with external Jenkins infrastructure.
- Persistent storage for configured application data.

## Security Analysis Workflow

The platform follows an automated workflow from repository submission to report presentation.

### Workflow

1. **Repository Submission**

   The user submits a public GitHub repository URL through the frontend.

2. **Pipeline Trigger**

   The Flask backend triggers the configured Jenkins job through the Jenkins REST API.

3. **Repository Cloning**

   Jenkins clones the target repository into its workspace.

4. **Repository Inspection**

   The pipeline identifies project metadata and checks for files such as:

   - `package.json`
   - `requirements.txt`
   - `Dockerfile`

5. **Static Code Analysis**

   SonarQube analyzes the repository for supported code quality issues and security-related findings.

6. **Filesystem Vulnerability Scanning**

   Trivy scans the repository and supported dependency files for detectable vulnerabilities and other configured findings.

7. **Container Image Scanning**

   If a Dockerfile is detected, the pipeline can build a temporary Docker image and scan it using Trivy.

8. **Report Processing**

   The pipeline parses the generated reports and aggregates vulnerability counts by severity.

9. **Result Submission**

   Jenkins sends the scan results to the Flask backend.

10. **Result Persistence**

    The backend stores the scan results in SQLite.

11. **AI-Assisted Analysis**

    The backend submits relevant findings to the Groq API for structured analysis and remediation recommendations.

12. **Report Presentation**

    The frontend displays scan history, vulnerability summaries, and available AI-generated recommendations.

## Technology Stack

### Backend

- Python 3.x
- Flask
- SQLite
- boto3 — not required by the documented core workflow
- Groq API
- REST APIs

### Frontend

- HTML5
- CSS3
- JavaScript

### Security Analysis

- Trivy
- SonarQube Community Edition

### CI/CD

- Jenkins
- Jenkins REST API
- Declarative Jenkins Pipeline

### Infrastructure

- Docker
- Docker Compose
- Docker bridge networking
- Linux-based containers

### Data Persistence

- SQLite
- Docker volumes, where configured

## Project Structure

```text
AI-DevSecOps-Hub/
|
|-- backend/
|   |
|   |-- app.py
|   |   Flask application entry point and API routes
|   |
|   |-- Dockerfile
|   |   Backend container configuration
|   |
|   |-- requirements.txt
|   |   Python dependencies
|   |
|   |-- data/
|       SQLite database storage location
|
|-- frontend/
|   |
|   |-- index.html
|   |   Main user interface
|   |
|   |-- Dockerfile
|   |   Frontend container configuration
|   |
|   |-- js/
|   |   Client-side application logic, if present
|   |
|   |-- css/
|       Stylesheets, if present
|
|-- Jenkinsfile
|   Declarative security scanning pipeline
|
|-- docker-compose.yml
|   Application service orchestration
|
|-- .env.example
|   Environment variable template
|
|-- README.md
    Project documentation
```

The exact files and directory names depend on the current repository structure. Retain only entries that exist in your repository.

## Prerequisites

Before starting the application, ensure that the following tools and services are available.

### Required Tools

- Git
- Docker
- Docker Compose
- A Groq API key

### Jenkins Requirements

The Jenkins server must be accessible from the backend and configured to execute the scanning pipeline.

The project expects Jenkins to be available at:

```text
http://host.docker.internal:2000
```

This is the documented default for environments where `host.docker.internal` resolves to the machine hosting Jenkins. Adjust `JENKINS_URL` if your setup differs.

Jenkins must also have:

- The required pipeline job configured.
- Access to the target Git repositories.
- Docker access for running Trivy containers.
- The required pipeline tools and plugins.
- Appropriate permissions to create temporary images and scan workspaces.

### Jenkins Job

The configured Jenkins job is:

```text
devsecops-scan
```

Ensure the job uses the `Jenkinsfile` from this repository and accepts the expected repository URL parameter.

## Environment Configuration

Create a local environment file from the supplied template.

```bash
cp .env.example .env
```

Configure the required variables.

| Variable | Description |
|---|---|
| `FLASK_ENV` | Flask environment configuration |
| `DB_PATH` | Path to the SQLite database file inside the container |
| `JENKINS_URL` | Base URL of the Jenkins server |
| `JENKINS_USER` | Jenkins username used for API authentication |
| `JENKINS_TOKEN` | Jenkins API token |
| `JENKINS_JOB` | Name of the Jenkins job to trigger |
| `GROQ_API_KEY` | API key used for Groq model inference |

### Example Configuration

The following is a template. Replace the example values with your own configuration.

```dotenv
FLASK_ENV=development
DB_PATH=/app/data/scans.db

JENKINS_URL=http://host.docker.internal:2000
JENKINS_USER=your-jenkins-username
JENKINS_TOKEN=your-jenkins-api-token
JENKINS_JOB=devsecops-scan

GROQ_API_KEY=your-groq-api-key
```

**Security requirements:**

- Never commit your actual `.env` file.
- Keep `.env.example` limited to placeholder values.
- Ensure the `.env` file is ignored by Git.
- Rotate any credentials previously committed to the repository.
- Use a secrets manager for production deployments where appropriate.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Atharavkumkar/AI-DevSecOps-Hub.git

cd AI-DevSecOps-Hub
```

### 2. Configure Environment Variables

Copy the environment template:

```bash
cp .env.example .env
```

Add the required Jenkins and Groq configuration.

### 3. Verify the Docker Configuration

Review the Compose configuration:

```bash
docker compose config
```

Check that required environment variables are configured and that no credentials are hardcoded in the Compose file.

### 4. Start the Application

Build and start the configured services:

```bash
docker compose up --build
```

To run the containers in detached mode:

```bash
docker compose up --build -d
```

### 5. Verify the Running Containers

```bash
docker compose ps
```

Inspect the application logs:

```bash
docker compose logs -f
```

### 6. Access the Application

Once the services are running, open the frontend in your browser.

## Services and Ports

The documented default service ports are:

| Service | Container Name | Host Port | Container Port |
|---|---|---:|---:|
| Backend | `devsecops-backend` | 7000 | 7000 |
| Frontend | `devsecops-frontend` | 3000 | 3000 |
| SonarQube | `devsecops-sonarqube` | 9000 | 9000 |
| Jenkins | External service | 2000 | Depends on configuration |

### Service URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:7000 |
| SonarQube | http://localhost:9000 |
| Jenkins | http://localhost:2000 |

These URLs assume the ports are published or forwarded as configured in your environment.

Jenkins runs outside the documented Compose stack and must be configured separately.

For a new SonarQube installation, complete the initial setup and change the default administrator credentials before using it.

## Jenkins Pipeline

The Jenkins pipeline coordinates the security analysis process.

### Stage 1 — Prepare Metadata

Generates project metadata and a SonarQube-compatible project key.

### Stage 2 — Clone Repository

Clones the submitted repository into the Jenkins workspace.

### Stage 3 — Repository Inspection

Checks for common project files, including:

```text
package.json
requirements.txt
Dockerfile
```

The discovered files help identify the project structure and determine which scanning steps are applicable.

### Stage 4 — SonarQube Analysis

Runs static code analysis and evaluates supported code quality and security rules.

Depending on the configuration and language support, SonarQube can report:

- Bugs
- Vulnerabilities
- Security hotspots
- Code smells
- Maintainability metrics

The availability of these findings depends on the scanner configuration, language support, and enabled rules.

### Stage 5 — Trivy Filesystem Scan

Runs Trivy against the repository filesystem.

Depending on the configured scanners and detected files, the report can include findings such as:

- Vulnerabilities in supported dependencies and packages.
- Vulnerabilities in operating system packages where applicable.
- Other findings enabled through the scanner configuration.

The actual coverage depends on the Trivy version, command-line options, and scanned repository contents.

### Stage 6 — Trivy Container Image Scan

If a Dockerfile is present, the pipeline can:

1. Build a temporary Docker image.
2. Scan the image using Trivy.
3. Generate a JSON report.

This step provides visibility into vulnerabilities in the image's operating system packages and supported application dependencies.

### Stage 7 — Parse Results

Parses the generated reports and aggregates findings by severity.

### Stage 8 — Send Results

Submits the processed findings to the Flask backend for storage and further analysis.

### Stage 9 — Archive Artifacts

The pipeline is configured to retain reports such as:

```text
trivy-report.json
trivy-image-report.json
summary.json
```

These artifacts support debugging, report inspection, and review of scan results.

The availability of each artifact depends on which pipeline stages execute successfully.

## API Reference

The Flask backend exposes endpoints for ingesting and retrieving scan reports.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/report` | Receives scan results from Jenkins, persists findings, and initiates AI analysis |
| `GET` | `/api/scans` | Returns stored scan results |
| `GET` | `/api/scans/<id>` | Returns the report and AI analysis for a specific scan |

### POST `/api/report`

Receives the scan report submitted by the Jenkins pipeline.

The backend processes the report, stores the available findings, and initiates AI-assisted analysis.

### GET `/api/scans`

Retrieves the stored scan history.

### GET `/api/scans/<id>`

Retrieves the details of a particular scan, including its findings and available AI-generated analysis.

**Note:** Consult `backend/app.py` for the actual request payloads, response structures, validation rules, and error codes.

## Security Considerations

Security is a central concern for a platform that clones repositories and executes scanning tools.

### 1. Credential Management

The existing repository documentation identifies hardcoded Jenkins and Groq credentials in the Compose configuration.

Treat any credentials committed to a public repository as compromised.

Before deploying the project:

- Revoke and rotate exposed Jenkins API tokens.
- Rotate exposed Groq API keys.
- Remove hardcoded secrets from configuration files.
- Use environment variables or a secrets manager.
- Ensure `.env` is excluded from version control.
- Review Git history for previously committed credentials.

Moving a credential to a new file does not invalidate copies already present in Git history. Rotate exposed credentials even if the original commit is removed.

### 2. Docker Daemon Access

The Jenkins pipeline requires Docker access to execute Trivy containers and potentially build images.

Access to the Docker daemon is highly privileged and can allow control over the host.

Avoid making the Docker socket world-writable or using commands such as:

```bash
chmod 666 /var/run/docker.sock
```

Instead, configure a controlled execution environment with appropriate permissions and consider a dedicated build agent or isolated runner.

### 3. Repository Input Validation

The platform accepts repository URLs from users.

Validate submitted URLs and restrict supported repository sources. Consider protections against:

- Internal network access.
- Server-side request forgery.
- Malicious repository contents.
- Resource exhaustion.
- Untrusted build scripts.
- Unauthorized pipeline access.

Cloning and scanning an untrusted repository should not automatically grant its code access to privileged credentials or the Docker host.

### 4. SonarQube Credentials

Change the default SonarQube administrator password during initial setup.

Use dedicated tokens and restrict access to the SonarQube service where possible.

### 5. API Security

For production use, consider:

- Authentication and authorization for scan submission.
- Rate limiting.
- Request validation.
- Payload size limits.
- Secure handling of AI API responses.
- Protection against unauthorized report access.
- Appropriate network isolation.
- TLS for externally accessible services.

### 6. Scanner Coverage

The existing Trivy configuration uses vulnerability scanning.

Additional scanner types, such as secret detection, should be explicitly configured and tested if required.

Security tools provide different types of coverage. A successful scan does not guarantee that a repository is free from vulnerabilities.

## Troubleshooting

### Jenkins Cannot Access Docker

If Jenkins reports a Docker daemon permission error, verify:

- The Docker daemon is running.
- The Jenkins execution environment has the intended Docker access.
- The configured Docker socket or remote endpoint is reachable.
- The Jenkins agent has the required permissions.
- The configured Docker CLI can communicate with the daemon.

Test Docker access from the relevant Jenkins execution environment:

```bash
docker ps
```

Do not resolve permission errors by making the Docker socket world-writable.

### SonarQube Reports Zero Files Indexed

Check that:

- The repository was cloned successfully.
- The scanner runs against the correct directory.
- `sonar.sources` points to valid source directories.
- The project key is configured correctly.
- The relevant files are not excluded by scanner configuration.

### Trivy Report Is Not Generated

Verify that:

- Docker is available to the Jenkins agent when required.
- The repository clone completed successfully.
- Trivy executed without errors.
- The workspace has the required permissions.
- The report output path matches the pipeline configuration.
- The scanned repository contains supported files or dependencies.

### Backend Cannot Trigger Jenkins

Verify that:

- `JENKINS_URL` is correct and reachable from the backend container.
- The Jenkins job exists.
- `JENKINS_JOB` matches the configured job name.
- The Jenkins username and API token are valid.
- The Jenkins user has the necessary permissions.
- The configured authentication and CSRF handling match the Jenkins setup.

### AI Analysis Fails

Check that:

- `GROQ_API_KEY` is configured correctly.
- The key has not been revoked or rotated without updating the environment.
- The backend can reach the Groq API.
- The configured model is available.
- The request and response handling match the current API behavior.

Review application logs without exposing API keys, tokens, or sensitive scan contents.

## Future Improvements

Potential enhancements include:

- Adding software composition analysis reports with more detailed dependency information.
- Generating Software Bills of Materials using Syft.
- Introducing infrastructure-as-code scanning with Checkov.
- Adding secrets detection using Gitleaks.
- Integrating policy-based security gates into Jenkins.
- Publishing machine-readable SARIF reports.
- Adding authentication and authorization for users.
- Implementing rate limiting and isolated scanning workers.
- Adding automated tests for backend endpoints.
- Managing infrastructure with Terraform.
- Improving structured logging and operational dashboards.
- Introducing retention policies for stored scan reports.
- Adding automated security regression tests.

These are potential extensions rather than claims about the current implementation.

## Author

**Atharva Kumkar**

GitHub: [Atharavkumkar](https://github.com/Atharvakumkar)

## License

This project is licensed under the MIT License.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
