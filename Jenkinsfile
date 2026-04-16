pipeline {
    agent any

    stages {

        stage('Test Docker') {
            steps {
                sh 'docker ps'
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
