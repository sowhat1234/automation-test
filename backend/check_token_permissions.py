#!/usr/bin/env python3
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app_id = os.getenv('FACEBOOK_APP_ID')
page_access_token = os.getenv('FACEBOOK_PAGE_ACCESS_TOKEN')
page_id = os.getenv('FACEBOOK_PAGE_ID')

print("🔍 Facebook Token Permission Checker")
print("=" * 50)
print(f"📱 App ID: {app_id}")
print(f"📄 Page ID: {page_id}")
print(f"🔑 Token: {page_access_token[:20]}...")
print()

# Check what this token can access
print("🔍 Checking token details...")
try:
    # Check token info
    response = requests.get(f"https://graph.facebook.com/me?access_token={page_access_token}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Token belongs to: {data.get('name', 'Unknown')}")
        print(f"🆔 Token ID: {data.get('id', 'Unknown')}")
        print(f"📋 Token Type: {'Page' if data.get('id') == page_id else 'User/Other'}")
    else:
        print(f"❌ Token validation failed: {response.json()}")
    
    print()
    
    # Check token permissions using debug endpoint
    print("🔍 Checking token permissions...")
    debug_url = f"https://graph.facebook.com/debug_token?input_token={page_access_token}&access_token={page_access_token}"
    response = requests.get(debug_url)
    
    if response.status_code == 200:
        debug_data = response.json()
        token_data = debug_data.get('data', {})
        
        print(f"✅ Token is valid: {token_data.get('is_valid', False)}")
        print(f"📱 App ID matches: {token_data.get('app_id') == app_id}")
        print(f"🔄 Token type: {token_data.get('type', 'Unknown')}")
        print(f"⏰ Expires: {token_data.get('expires_at', 'Never' if token_data.get('expires_at') == 0 else 'Unknown')}")
        
        scopes = token_data.get('scopes', [])
        print(f"\n📋 Current permissions ({len(scopes)}):")
        for scope in sorted(scopes):
            print(f"   ✓ {scope}")
        
        print("\n📋 Required permissions for posting:")
        required = ['pages_manage_posts', 'pages_read_engagement']
        for req in required:
            status = "✅ GRANTED" if req in scopes else "❌ MISSING"
            print(f"   {status}: {req}")
            
    else:
        print(f"❌ Debug token failed: {response.json()}")
        
    print()
    
    # Try to test posting capability
    print("🧪 Testing posting capability...")
    test_url = f"https://graph.facebook.com/{page_id}/feed"
    test_data = {
        'message': 'TEST - This is a test post to verify permissions',
        'access_token': page_access_token
    }
    
    # Just test the endpoint, don't actually post
    response = requests.post(test_url, data=test_data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Posting would succeed! Post ID would be: {result.get('id', 'Unknown')}")
        # Delete the test post immediately
        post_id = result.get('id')
        if post_id:
            delete_response = requests.delete(f"https://graph.facebook.com/{post_id}?access_token={page_access_token}")
            if delete_response.status_code == 200:
                print("🗑️ Test post deleted successfully")
    else:
        error_data = response.json()
        error_msg = error_data.get('error', {}).get('message', 'Unknown error')
        error_code = error_data.get('error', {}).get('code', 'Unknown')
        print(f"❌ Posting failed: ({error_code}) {error_msg}")
        
        if "permissions" in error_msg.lower() or "access" in error_msg.lower():
            print("\n💡 This is a permissions issue. You need to:")
            print("   1. Generate a new page access token with proper permissions")
            print("   2. Make sure you select the PAGE (not user) in Graph API Explorer")
            print("   3. Add both 'pages_manage_posts' and 'pages_read_engagement' permissions")

except Exception as e:
    print(f"❌ Error during check: {e}")

print("\n" + "=" * 50)
print("🏁 Permission check complete!")
