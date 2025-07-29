pipeline {
    agent any

    environment {
        IMAGE_NAME = 'digital-wallet-backend'
        IMAGE_TAG = 'latest'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                echo 'No build step defined, skipping...'
            }
        }

        stage('Test') {
            steps {
                echo 'No tests defined, skipping...'
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    docker.build("${env.IMAGE_NAME}:${env.IMAGE_TAG}")
                }
            }
        }
    }
}
