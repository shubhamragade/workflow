import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.config import Config
from app.models import User, AISummary, Task, WorkLog
from app.services import ai_service
import time

class TestConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    TESTING = True

def test_handover_persistence():
    app = create_app(config_class=TestConfig)
    
    with app.app_context():
        db.create_all()
        print("Setting up test user and activity...")
        
        # 1. Create User
        user = User(name="Leaving Employee", email="leave@company.com", status="Active")
        db.session.add(user)
        db.session.commit()
        
        # 2. Trigger Handover (simulate route logic)
        print(f"Triggering handover for User {user.id}...")
        # In routes.py: ai_service.generate_handover_report(user_id)
        # We call the service directly
        
        # Mocking OpenAI to avoid cost/api calls if possible, or just let it fail/run 
        # For this test, we care about persistence. 
        # If the service fails to generate (due to no API key or mock), it catches exception and returns fallback.
        # The fallback should ALSO be saved? 
        # Looking at code: 
        # except Exception as e: summary = "Fallback..."
        # THEN it logs event, returns dict.
        # It does NOT save to AISummary.
        
        result, status = ai_service.generate_handover_report(user.id)
        print(f"Service returned status: {status}")
        
        # 3. Check Persistence
        saved_report = AISummary.query.filter_by(user_id=user.id, summary_type='HANDOVER').first()
        
        if saved_report:
            print("SUCCESS: Handover report was saved to database.")
            print(f"Content: {saved_report.content[:50]}...")
            return True
        else:
            print("FAILURE: No Handover report found in AISummary table.")
            return False

if __name__ == "__main__":
    success = test_handover_persistence()
    sys.exit(0 if success else 1)
