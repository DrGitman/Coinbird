import bcrypt

def test_bcrypt():
    try:
        password = "testpassword123"
        print(f"Testing bcrypt with password: {password}")
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        print(f"Hashed: {hashed}")
        
        matches = bcrypt.checkpw(password.encode('utf-8'), hashed)
        print(f"Matches: {matches}")
        
    except Exception as e:
        print(f"Bcrypt error: {e}")

if __name__ == "__main__":
    test_bcrypt()
