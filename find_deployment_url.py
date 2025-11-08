#!/usr/bin/env python3
"""
Deployment URL Helper Script
Helps you find your deployment URL or deploy your app
"""

import subprocess
import sys
import os

def check_vercel_projects():
    """Check if you have any Vercel projects"""
    try:
        result = subprocess.run(['vercel', 'ls'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Vercel projects found:")
            print(result.stdout)
            return True
        else:
            print("❌ No Vercel projects found or not logged in")
            return False
    except FileNotFoundError:
        print("❌ Vercel CLI not found. Installing...")
        try:
            subprocess.run(['npm', 'install', '-g', 'vercel'], check=True)
            print("✅ Vercel CLI installed successfully")
            return False
        except subprocess.CalledProcessError:
            print("❌ Failed to install Vercel CLI")
            return False

def deploy_to_vercel():
    """Deploy to Vercel"""
    print("🚀 Deploying to Vercel...")
    try:
        # Check if already logged in
        result = subprocess.run(['vercel', 'whoami'], capture_output=True, text=True)
        if result.returncode != 0:
            print("🔐 Please log in to Vercel first:")
            print("Run: vercel login")
            return None
        
        # Deploy
        result = subprocess.run(['vercel', '--prod'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Deployment successful!")
            print(result.stdout)
            # Extract URL from output
            lines = result.stdout.split('\n')
            for line in lines:
                if 'https://' in line and 'vercel.app' in line:
                    return line.strip()
        else:
            print("❌ Deployment failed:")
            print(result.stderr)
            return None
    except Exception as e:
        print(f"❌ Error during deployment: {e}")
        return None

def test_local_api():
    """Test if local API is running"""
    import requests
    try:
        response = requests.get("http://localhost:8000/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Local API is running at http://localhost:8000")
            return "http://localhost:8000"
        else:
            print("❌ Local API not responding properly")
            return None
    except requests.exceptions.RequestException:
        print("❌ Local API not running")
        return None

def main():
    print("🔍 DEPLOYMENT URL HELPER")
    print("=" * 50)
    
    # Check for existing Vercel projects
    if check_vercel_projects():
        print("\n📋 You have existing Vercel projects!")
        print("Please check the output above for your project URL")
        print("It should look like: https://your-project-name.vercel.app")
        return
    
    # Check for local API
    local_url = test_local_api()
    if local_url:
        print(f"\n🎯 You can test locally with: {local_url}")
        print("Update your test scripts with this URL")
        return
    
    # Offer to deploy
    print("\n🚀 No existing deployment found. Would you like to deploy?")
    print("Options:")
    print("1. Deploy to Vercel (recommended)")
    print("2. Test locally (start local server)")
    print("3. Use existing URL (if you have one)")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == "1":
        url = deploy_to_vercel()
        if url:
            print(f"\n🎉 Your app is deployed at: {url}")
            print("Update your test scripts with this URL:")
            print(f"BASE_URL = \"{url}\"")
        else:
            print("\n❌ Deployment failed. Please try manual deployment.")
    
    elif choice == "2":
        print("\n🔧 To test locally:")
        print("1. Start your local server:")
        print("   cd server")
        print("   python app.py")
        print("2. Update test scripts with: BASE_URL = \"http://localhost:8000\"")
    
    elif choice == "3":
        url = input("Enter your deployment URL: ").strip()
        if url:
            print(f"\n✅ Using URL: {url}")
            print("Update your test scripts with this URL:")
            print(f"BASE_URL = \"{url}\"")
    
    else:
        print("❌ Invalid choice")

if __name__ == "__main__":
    main()
