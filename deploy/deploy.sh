#!/bin/bash
set -e

# ScreenFlow Deployment Script
# To be run as the `screenflow` user or via sudo -u screenflow

APP_DIR="/opt/screenflow"
cd $APP_DIR

echo "Pulling latest code..."
git pull origin main

echo "Activating virtual environment and installing dependencies..."
# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
    python3.11 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

echo "Running Alembic migrations..."
export $(cat .env | xargs) # Load environment variables
alembic upgrade head

echo "Restarting Systemd services..."
# We use sudo here because standard users cannot restart systemd services
# Make sure the screenflow user has passwordless sudo for these specific commands,
# or run this deploy script as root.
sudo systemctl restart screenflow
sudo systemctl restart screenflow-celery
sudo systemctl restart screenflow-celerybeat

echo "Deployment complete!"
