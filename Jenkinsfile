pipeline {
    agent any
    parameters {
        string(name: 'REPO_URL', defaultValue: '')
    }
    stages {
        stage('Clone') {
            steps { sh "git clone ${params.REPO_URL} ./repo" }
        }
        stage('Trivy Scan') {
            steps {
                sh """
                    docker run --rm \
                        -v \$(pwd)/repo:/scan \
                        -v /var/jenkins_home/trivy-cache:/root/.cache/trivy \
                        aquasec/trivy:latest fs \
                        --scanners vuln \
                        --format json \
                        --output /scan/trivy-report.json \
                        --severity CRITICAL,HIGH,MEDIUM,LOW \
                        /scan || true
                """
            }
        }
        stage('Send Results') {
            steps {
                sh "curl -X POST http://backend:5000/api/report -d '{...}'"
            }
        }
    }
}