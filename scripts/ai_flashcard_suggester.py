#!/usr/bin/env python3
import os
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

# Debug: Print current directory and .env.local existence
print(f"Current directory: {os.getcwd()}")
print(f".env.local exists: {os.path.exists('.env.local')}")

load_dotenv('.env.local')

# Debug: Print if environment variables are set
print(f"SUPABASE_URL is set: {'SUPABASE_URL' in os.environ}")
print(f"SUPABASE_SERVICE_ROLE_KEY is set: {'SUPABASE_SERVICE_ROLE_KEY' in os.environ}")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]  # Service role key

print(f"Connecting to Supabase at {SUPABASE_URL}")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    since = (datetime.utcnow() - timedelta(days=1)).isoformat()
    print(f"Fetching sessions since {since}")
    
    try:
        # First, get all sessions with their set names
        sessions = supabase.table('flashcard_study_sessions')\
            .select('*, flashcard_sets(name)')\
            .gte('created_at', since)\
            .execute().data
        print(f"Found {len(sessions)} sessions")
    except Exception as e:
        print(f"Error fetching sessions: {e}")
        return

    for session in sessions:
        print(f"\nChecking session: user={session['user_id']} set={session['set_id']} incorrect={session['incorrect']}")
        if session['incorrect'] > 1:
            try:
                # Check if a notification already exists for this specific session
                existing = supabase.table('notifications').select('*')\
                    .eq('user_id', session['user_id'])\
                    .eq('set_id', session['set_id'])\
                    .eq('type', 'repeat_suggestion')\
                    .eq('session_id', session['id'])\
                    .execute().data
                
                print(f"  Existing notifications: {existing}")
                if not existing:
                    try:
                        # Get the set name from the joined data
                        set_name = session.get('flashcard_sets', {}).get('name', '')
                        message = f"Рекомендуем повторить набор карточек {set_name}!"
                        
                        result = supabase.table('notifications').insert({
                            'user_id': session['user_id'],
                            'type': 'repeat_suggestion',
                            'message': message,
                            'set_id': session['set_id'],
                            'session_id': session['id'],
                            'set_name': set_name,
                            'read': False
                        }).execute()
                        print(f"  Notification created successfully: {result.data}")
                    except Exception as e:
                        print(f"  Error creating notification: {e}")
                else:
                    print(f"  Notification already exists for user {session['user_id']} set {session['set_id']}")
            except Exception as e:
                print(f"  Error checking existing notifications: {e}")
        else:
            print(f"  Not enough mistakes for user {session['user_id']} set {session['set_id']}")

if __name__ == '__main__':
    main()
