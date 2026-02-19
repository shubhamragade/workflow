import requests

BASE_URL = "http://127.0.0.1:5000/api"

def test_simple():
    print("Testing GET /users...")
    try:
        res = requests.get(f"{BASE_URL}/users")
        print(f"GET Status: {res.status_code}")
        print(f"GET Response: {res.text[:100]}")
    except Exception as e:
        print(f"GET Failed: {e}")

    print("\nTesting POST /users...")
    try:
        res = requests.post(f"{BASE_URL}/users", json={"name": "Simple Test", "email": "simple@test.com", "role": "Member"})
        print(f"POST Status: {res.status_code}")
        print(f"POST Response: {res.text}")
    except Exception as e:
        print(f"POST Failed: {e}")

if __name__ == "__main__":
    test_simple()
