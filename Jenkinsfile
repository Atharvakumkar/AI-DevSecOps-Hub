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
                docker run aquasec/trivy:latest fs \
                    --format json \
                    --output /results/trivy.json \
                    ./repo
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