pipeline {
agent any

parameters {
    string(
        name: 'REPO_URL',
        defaultValue: '',
        description: 'GitHub Repository URL'
    )
}

environment {
    SONARQUBE_URL = 'http://host.docker.internal:9000'
    BACKEND_URL   = 'http://host.docker.internal:7000'
}

stages {

    stage('Prepare Metadata') {
        steps {
            script {

                env.REPO_NAME = params.REPO_URL
                    .replace('https://github.com/', '')
                    .replace('.git', '')

                env.PROJECT_KEY = env.REPO_NAME
                    .replace('/', '-')
                    .toLowerCase()

                echo "Repository Name: ${env.REPO_NAME}"
                echo "Project Key: ${env.PROJECT_KEY}"
            }
        }
    }

    stage('Clone Repository') {
        steps {
            sh '''
                rm -rf repo
                git clone ${REPO_URL} repo

                echo "Repository cloned successfully"
            '''
        }
    }

    stage('Repository Inspection') {
        steps {
            sh '''
                echo "===== package.json ====="
                find repo -name package.json || true

                echo "===== requirements.txt ====="
                find repo -name requirements.txt || true

                echo "===== Dockerfile ====="
                find repo -name Dockerfile || true
            '''
        }
    }
    
    stage('Debug Metadata') {
    steps {
        echo "REPO_NAME=${env.REPO_NAME}"
        echo "PROJECT_KEY=${env.PROJECT_KEY}"
    }
}

    stage('SonarQube Analysis') {
    steps {
        withCredentials([
            string(credentialsId: 'sonarqube-token', variable: 'SONAR_TOKEN')
        ]) {
            sh """
                docker run --rm \
                --network host \
                -e SONAR_HOST_URL=${SONARQUBE_URL} \
                -e SONAR_TOKEN=\$SONAR_TOKEN \
                -v \$(pwd)/repo:/usr/src \
                sonarsource/sonar-scanner-cli:latest \
                -Dsonar.projectKey=${env.PROJECT_KEY} \
                -Dsonar.projectName="${env.REPO_NAME}" \
                -Dsonar.projectBaseDir=/usr/src \
                -Dsonar.sources=/usr/src \
                -Dsonar.inclusions=**/*.js,**/*.ts,**/*.jsx,**/*.tsx,**/*.json \
                -Dsonar.scm.disabled=true \
                -Dsonar.host.url=${SONARQUBE_URL} \
                -Dsonar.token=\$SONAR_TOKEN
            """
        }
    }
}
    stage('Trivy Filesystem Scan') {
    steps {
        sh '''
            mkdir -p /var/jenkins_home/trivy-cache

           docker run --rm \
-v $(pwd):/workspace \
-v $(pwd)/repo:/scan \
-v /var/jenkins_home/trivy-cache:/root/.cache/trivy \
aquasec/trivy:latest fs \
--scanners vuln,secret \
--format json \
--severity CRITICAL,HIGH,MEDIUM,LOW \
--skip-dirs .git \
/scan > trivy-report.json

echo "===== CHECK FS REPORT ====="
ls -lah repo/trivy-report.json || true
find repo -name "*trivy*" || true

echo "===== AFTER FS SCAN ====="
find repo -name "*trivy*" -type f || true

echo "===== ROOT WORKSPACE ====="
find . -name "*trivy*" -type f || true

echo "TEST" > repo/test-file.txt

echo "===== TEST FILE ====="
ls -lah repo/test-file.txt
cat repo/test-file.txt
        '''
    }
}
    stage('Trivy Docker Image Scan') {
    steps {
        script {

            def buildStatus = sh(
                script: "docker build -t scan-target-${BUILD_NUMBER} repo",
                returnStatus: true
            )

            if (buildStatus != 0) {
                echo "Docker build failed. Skipping image scan."
                return
            }

            sh """
                docker run --rm \
-v /var/run/docker.sock:/var/run/docker.sock \
-v /var/jenkins_home/trivy-cache:/root/.cache/trivy \
aquasec/trivy:latest image \
--format json \
scan-target-${BUILD_NUMBER} > trivy-image-report.json

                echo "===== CHECK IMAGE REPORT ====="

                ls -lah trivy-image-report.json || true

                find . -name "*trivy*" -type f || true

                echo "===== WORKSPACE CONTENTS ====="

                ls -lah | head -50
            """
        }
    }
}
    stage('Parse Results') {
    steps {
        sh '''
python3 << EOF
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

def parse_report(path):
    if not os.path.exists(path):
        print(f"Missing: {path}")
        return

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        print(f"Parsing: {path}")

        for result in data.get("Results", []):
            for vuln in result.get("Vulnerabilities", []) or []:
                sev = vuln.get("Severity", "").upper()

                if sev in counts:
                    counts[sev] += 1

    except Exception as e:
        print(f"Error parsing {path}: {e}")

parse_report("trivy-report.json")
parse_report("trivy-image-report.json")

print("================================")
print("FINAL COUNTS")
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
archiveArtifacts artifacts: 'trivy-report.json', allowEmptyArchive: true
archiveArtifacts artifacts: 'trivy-image-report.json', allowEmptyArchive: true
archiveArtifacts artifacts: 'summary.json', allowEmptyArchive: true
}
}

} // <-- closes stages

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

} // <-- closes pipeline
