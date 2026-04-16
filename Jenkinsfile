pipeline {
    agent any

    stages {

        stage('Clean Workspace') {
            steps {
                deleteDir()
            }
        }

        stage('Clone') {
            steps {
                git branch: 'main', url: 'https://github.com/SSSahil15/Password-Strength-Checker.git'
            }
        }

        stage('Build Image') {
            steps {
                sh 'docker build -t password-checker:latest .'
            }
        }

        stage('Done') {
            steps {
                echo 'Build Complete'
            }
        }
    }
}
