"""
Test script to demonstrate how os.getenv() and load_dotenv() work.
This will show you exactly where the environment variables are coming from.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

print("=" * 60)
print("ENVIRONMENT VARIABLE LOADING TEST")
print("=" * 60)

# Step 1: Check BEFORE loading .env file
print("\n1. BEFORE loading .env file:")
print(f"   GOOEY_AI_API_KEY from os.getenv(): {os.getenv('GOOEY_AI_API_KEY', 'NOT FOUND')}")
print(f"   GOOEY_AI_API_KEY from os.environ.get(): {os.environ.get('GOOEY_AI_API_KEY', 'NOT FOUND')}")

# Step 2: Check if .env file exists
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / ".env"
print(f"\n2. Checking for .env file:")
print(f"   Looking for: {env_path}")
print(f"   File exists: {env_path.exists()}")

if env_path.exists():
    print(f"   File size: {env_path.stat().st_size} bytes")
    # Read first few lines (without showing sensitive data)
    with open(env_path, 'r') as f:
        lines = f.readlines()
        print(f"   Number of lines: {len(lines)}")
        for i, line in enumerate(lines[:3], 1):
            if '=' in line:
                key = line.split('=')[0].strip()
                value_preview = line.split('=')[1].strip()[:10] + "..." if len(line.split('=')[1].strip()) > 10 else line.split('=')[1].strip()
                print(f"   Line {i}: {key} = {value_preview}")

# Step 3: Load .env file
print(f"\n3. Loading .env file with load_dotenv():")
result = load_dotenv(dotenv_path=env_path, override=False)
print(f"   load_dotenv() returned: {result}")
print(f"   (True = loaded successfully, False = no file or already loaded)")

# Step 4: Check AFTER loading .env file
print(f"\n4. AFTER loading .env file:")
api_key_from_getenv = os.getenv('GOOEY_AI_API_KEY', 'NOT FOUND')
api_key_from_environ = os.environ.get('GOOEY_AI_API_KEY', 'NOT FOUND')

print(f"   GOOEY_AI_API_KEY from os.getenv(): {api_key_from_getenv[:20]}..." if len(api_key_from_getenv) > 20 and api_key_from_getenv != 'NOT FOUND' else f"   GOOEY_AI_API_KEY from os.getenv(): {api_key_from_getenv}")
print(f"   GOOEY_AI_API_KEY from os.environ.get(): {api_key_from_environ[:20]}..." if len(api_key_from_environ) > 20 and api_key_from_environ != 'NOT FOUND' else f"   GOOEY_AI_API_KEY from os.environ.get(): {api_key_from_environ}")

# Step 5: Check system environment variables
print(f"\n5. System environment variables (from console/terminal):")
# Check if it exists in os.environ (which includes system env vars)
if 'GOOEY_AI_API_KEY' in os.environ:
    print(f"   [FOUND] GOOEY_AI_API_KEY found in os.environ")
    print(f"   Source: Could be from .env file OR system environment")
else:
    print(f"   [NOT FOUND] GOOEY_AI_API_KEY NOT found in os.environ")

# Step 6: Explain the flow
print(f"\n" + "=" * 60)
print("HOW IT WORKS:")
print("=" * 60)
print("\n1. os.getenv('KEY') is a SHORTCUT for os.environ.get('KEY')")
print("   - Both read from the SAME place: os.environ dictionary")
print("   - os.environ is Python's representation of the process environment")

print("\n2. load_dotenv() does this:")
print("   - Reads the .env file")
print("   - Parses KEY=VALUE pairs")
print("   - ADDS them to os.environ dictionary")
print("   - If a variable already exists in os.environ, it WON'T override it (by default)")

print("\n3. Priority order (what os.getenv() checks):")
print("   a) System environment variables (set in console/terminal)")
print("      Example: export GOOEY_AI_API_KEY=xxx (Linux/Mac)")
print("               set GOOEY_AI_API_KEY=xxx (Windows CMD)")
print("               $env:GOOEY_AI_API_KEY='xxx' (PowerShell)")
print("   b) Variables from .env file (loaded by load_dotenv())")
print("      Example: GOOEY_AI_API_KEY=xxx in backend/.env")

print("\n4. So in your code:")
print("   - load_dotenv() loads .env file and adds to os.environ")
print("   - os.getenv() reads from os.environ")
print("   - Result: You get the value from .env file (unless system env var exists)")

print("\n5. os.getenv() vs os.environ.get():")
print("   - They are EXACTLY the same")
print("   - os.getenv() is just a convenience function")
print("   - Both read from os.environ dictionary")

print("\n" + "=" * 60)
print("CURRENT STATUS:")
print("=" * 60)
if api_key_from_getenv and api_key_from_getenv != 'NOT FOUND':
    print(f"[SUCCESS] API Key is loaded successfully!")
    print(f"  Length: {len(api_key_from_getenv)} characters")
    print(f"  Source: {'System environment' if result == False and 'GOOEY_AI_API_KEY' in os.environ else '.env file'}")
else:
    print(f"[ERROR] API Key NOT found!")
    print(f"  Make sure you have GOOEY_AI_API_KEY in your .env file or system environment")

