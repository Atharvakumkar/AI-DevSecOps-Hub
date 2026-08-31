pipeline {
    agent any

    environment {
        SONARQUBE_URL = 'http://host.docker.internal:9000'
        BACKEND_URL   = 'http://host.docker.internal:7000'
    }

    stages {

        stage('Prepare Metadata') {
            steps {
                script {

                    def repoUrl = sh(
                        script: 'git config --get remote.origin.url',
                        returnStdout: true
                    ).trim()

                    echo "SCM Repository URL: ${repoUrl}"

                    env.REPO_URL = repoUrl
                        .replace('https://github.com/', '')
                        .replace('http://github.com/', '')
                        .replace('git@github.com:', '')
                        .replace('.git', '')
                        .replaceAll('/$', '')

                    env.REPO_NAME = env.REPO_URL

                    env.PROJECT_KEY = env.REPO_NAME
                        .replace('/', '-')
                        .toLowerCase()

                    echo "Repository Name: ${env.REPO_NAME}"
                    echo "Project Key: ${env.PROJECT_KEY}"
                }
            }
        }

        stage('Repository Inspection') {
            steps {
                sh '''
                    echo "===== CURRENT WORKSPACE ====="
                    pwd

                    echo "===== REPOSITORY CONTENTS ====="
                    ls -lah

                    echo "===== package.json ====="
                    find . -name package.json -not -path './.git/*' || true

                    echo "===== requirements.txt ====="
                    find . -name requirements.txt -not -path './.git/*' || true

                    echo "===== Dockerfile ====="
                    find . -name Dockerfile -not -path './.git/*' || true
                '''
            }
        }

        stage('Debug Metadata') {
            steps {
                echo "REPO_URL=${env.REPO_URL}"
                echo "REPO_NAME=${env.REPO_NAME}"
                echo "PROJECT_KEY=${env.PROJECT_KEY}"
            }
        }

        stage('Legitify Security Scan') {
            steps {

                withCredentials([
                    string(
                        credentialsId: 'legitify-github-token',
                        variable: 'SCM_TOKEN'
                    )
                ]) {

                    sh '''
                        set +x

                        echo "========================================"
                        echo "        LEGITIFY SECURITY SCAN"
                        echo "========================================"

                        echo "Repository: ${REPO_NAME}"

                        legitify analyze \
                            --repo "${REPO_NAME}" \
                            --failed-only \
                            --scorecard verbose \
                            --output-format json \
                            --output-file legitify-report.json \
                            --error-file legitify-error.log \
                            --permissions-file legitify-permissions.json

                        echo "========================================"
                        echo "LegITIFY SCAN COMPLETED"
                        echo "========================================"

                        echo "Report:"
                        ls -lah legitify-report.json || true

                        echo "Error log:"
                        ls -lah legitify-error.log || true

                        echo "Permissions log:"
                        ls -lah legitify-permissions.json || true
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {

                withCredentials([
                    string(
                        credentialsId: 'sonarqube-token',
                        variable: 'SONAR_TOKEN'
                    )
                ]) {

                    sh '''
                        docker run --rm \
                            --network host \
                            -e SONAR_HOST_URL="${SONARQUBE_URL}" \
                            -e SONAR_TOKEN="${SONAR_TOKEN}" \
                            -v "$(pwd):/usr/src" \
                            sonarsource/sonar-scanner-cli:latest \
                            -Dsonar.projectKey="${PROJECT_KEY}" \
                            -Dsonar.projectName="${REPO_NAME}" \
                            -Dsonar.projectBaseDir=/usr/src \
                            -Dsonar.sources=/usr/src \
                            -Dsonar.inclusions="**/*.js,**/*.ts,**/*.jsx,**/*.tsx,**/*.json" \
                            -Dsonar.scm.disabled=true \
                            -Dsonar.host.url="${SONARQUBE_URL}" \
                            -Dsonar.token="${SONAR_TOKEN}"
                    '''
                }
            }
        }

        stage('Trivy Filesystem Scan') {
            steps {

                sh '''
                    mkdir -p /var/jenkins_home/trivy-cache

                    echo "========================================"
                    echo "       TRIVY FILESYSTEM SCAN"
                    echo "========================================"

                    docker run --rm \
                        -v "$(pwd):/scan" \
                        -v /var/jenkins_home/trivy-cache:/root/.cache/trivy \
                        aquasec/trivy:latest fs \
                        --scanners vuln,secret \
                        --format json \
                        --severity CRITICAL,HIGH,MEDIUM,LOW \
                        --skip-dirs .git \
                        /scan > trivy-report.json

                    echo "===== TRIVY REPORT ====="
                    ls -lah trivy-report.json || true
                '''
            }
        }

        stage('Trivy Docker Image Scan') {
            steps {

                script {

                    def buildStatus = sh(
                        script: "docker build -t scan-target-${BUILD_NUMBER} .",
                        returnStatus: true
                    )

                    if (buildStatus != 0) {

                        echo "Docker build failed. Skipping image scan."

                    } else {

                        sh '''
                            echo "========================================"
                            echo "      TRIVY DOCKER IMAGE SCAN"
                            echo "========================================"

                            docker run --rm \
                                -v /var/run/docker.sock:/var/run/docker.sock \
                                -v /var/jenkins_home/trivy-cache:/root/.cache/trivy \
                                aquasec/trivy:latest image \
                                --format json \
                                "scan-target-${BUILD_NUMBER}" \
                                > trivy-image-report.json

                            echo "===== IMAGE REPORT ====="
                            ls -lah trivy-image-report.json || true
                        '''
                    }
                }
            }
        }

        stage('Parse Results') {
            steps {

                sh '''
python3 << 'EOF'

import json
import os
import glob

counts = {
    "CRITICAL": 0,
    "HIGH": 0,
    "MEDIUM": 0,
    "LOW": 0
}

print("================================")
print("AVAILABLE JSON FILES")
print("================================")

for f in glob.glob("**/*.json", recursive=True):
    print(f)

print("================================")


def parse_trivy_report(path):

    if not os.path.exists(path):
        print(f"Missing: {path}")
        return

    try:

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        print(f"Parsing Trivy report: {path}")

        for result in data.get("Results", []):

            for vuln in result.get("Vulnerabilities", []) or []:

                sev = vuln.get("Severity", "").upper()

                if sev in counts:
                    counts[sev] += 1

    except Exception as e:

        print(f"Error parsing {path}: {e}")


parse_trivy_report("trivy-report.json")
parse_trivy_report("trivy-image-report.json")

print("================================")
print("FINAL TRIVY COUNTS")
print(counts)
print("================================")

with open("summary.json", "w") as f:
    json.dump(counts, f, indent=4)

print("summary.json created successfully")

EOF
                '''
            }
        }

        stage('Send Results To Dashboard') {
            steps {

                sh '''
python3 << EOF

import json
import urllib.request

with open("summary.json") as f:
    counts = json.load(f)

payload = {
    "repo_url": "${REPO_URL}",
    "repo_name": "${REPO_NAME}",
    "status": "completed",
    "critical": counts["CRITICAL"],
    "high": counts["HIGH"],
    "medium": counts["MEDIUM"],
    "low": counts["LOW"],
    "sonarqube_url": "${SONARQUBE_URL}/dashboard?id=${PROJECT_KEY}"
}

req = urllib.request.Request(
    "${BACKEND_URL}/api/report",
    data=json.dumps(payload).encode(),
    headers={"Content-Type": "application/json"},
    method="POST"
)

response = urllib.request.urlopen(req, timeout=15)

print(response.read().decode())

EOF
                '''
            }
        }

        stage('Archive Artifacts') {
            steps {

                archiveArtifacts(
                    artifacts: 'legitify-report.json',
                    allowEmptyArchive: true
                )

                archiveArtifacts(
                    artifacts: 'legitify-error.log',
                    allowEmptyArchive: true
                )

                archiveArtifacts(
                    artifacts: 'legitify-permissions.json',
                    allowEmptyArchive: true
                )

                archiveArtifacts(
                    artifacts: 'trivy-report.json',
                    allowEmptyArchive: true
                )

                archiveArtifacts(
                    artifacts: 'trivy-image-report.json',
                    allowEmptyArchive: true
                )

                archiveArtifacts(
                    artifacts: 'summary.json',
                    allowEmptyArchive: true
                )
            }
        }
    }

    post {

        success {
            echo "Pipeline completed successfully"
        }

        failure {
            echo "Pipeline failed"
        }

        always {
            cleanWs(
                cleanWhenNotBuilt: true,
                cleanWhenSuccess: true,
                cleanWhenFailure: false
            )
        }
    }
}    
