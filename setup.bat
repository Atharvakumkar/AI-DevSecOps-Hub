@echo off

git clone https://github.com/Atharvakumkar/AI-DevSecOps-Hub.git
cd AI-DevSecOps-Hub
copy .env.example .env
docker compose up --build

pause
