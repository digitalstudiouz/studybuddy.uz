#!/usr/bin/env python3
import schedule
import time
from ai_flashcard_suggester import main as run_suggester

def job():
    print(f"Running flashcard suggester at {time.strftime('%Y-%m-%d %H:%M:%S')}")
    run_suggester()

# Schedule the job to run every hour
schedule.every().hour.do(job)

print("Scheduler started. Running flashcard suggester every hour...")
while True:
    schedule.run_pending()
    time.sleep(60)  # Check every minute 