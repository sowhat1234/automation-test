#!/usr/bin/env python3
"""
Facebook Access Token Refresh Utility

This script helps you refresh your Facebook Page Access Token when it expires.
Run this script when you see authentication errors.
"""

import os
import sys
import requests
import json
from typing import Dict, Any

class FacebookTokenRefresher:
    """Utility class to refresh Facebook access tokens"""
    
    def __init__(self):
        self.app_id = os.getenv('FACEBOOK_APP_ID')
        self.app_secret = os.getenv('FACEBOOK_APP_SECRET')
        self.page_id = os.getenv('FACEBOOK_PAGE_ID')
        self.current_token = os.getenv('FACEBOOK_PAGE_ACCESS_TOKEN')
        
        if not all([self.app_id, self.app_secret, self.page_id]):
            raise ValueError("Missing required Facebook credentials in .env file")
    
    def get_long_lived_user_token(self, short_lived_token: str) -> str:
        """
        Exchange a short-lived user access token for a long-lived one
        
        Args:
            short_lived_token: Short-lived user access token from Facebook Login
            
        Returns:
            Long-lived user access token (valid for 60 days)
        """
        url = "https://graph.facebook.com/v18.0/oauth/access_token"
        params = {
            'grant_type': 'fb_exchange_token',
            'client_id': self.app_id,
            'client_secret': self.app_secret,
            'fb_exchange_token': short_lived_token
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        return data['access_token']
    
    def get_page_access_token(self, user_access_token: str) -> Dict[str, Any]:
        """
        Get a page access token using a user access token
        
        Args:
            user_access_token: Valid user access token
            
        Returns:
            Dictionary with page access token and metadata
        """
        url = f"https://graph.facebook.com/v18.0/{self.page_id}"
        params = {
            'fields': 'access_token,name,category',
            'access_token': user_access_token
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        return response.json()
    
    def validate_token(self, token: str) -> Dict[str, Any]:
        """
        Validate a Facebook access token
        
        Args:
            token: Access token to validate
            
        Returns:
            Token information if valid
        """
        url = "https://graph.facebook.com/v18.0/me"
        params = {
            'access_token': token,
            'fields': 'id,name,permissions'
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {'error': str(e)}
    
    def check_current_token(self) -> Dict[str, Any]:
        """Check the status of the current token in .env"""
        print("🔍 Checking current token status...")
        
        if not self.current_token:
            return {'status': 'missing', 'message': 'No token found in .env file'}
        
        validation = self.validate_token(self.current_token)
        
        if 'error' in validation:
            return {
                'status': 'invalid', 
                'message': 'Current token is invalid or expired',
                'error': validation['error']
            }
        else:
            return {
                'status': 'valid',
                'message': 'Current token is valid',
                'data': validation
            }
    
    def update_env_file(self, new_token: str) -> bool:
        """
        Update the .env file with a new access token
        
        Args:
            new_token: New Facebook page access token
            
        Returns:
            True if successful
        """
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        
        try:
            # Read current .env file
            with open(env_path, 'r') as f:
                lines = f.readlines()
            
            # Update the token line
            updated_lines = []
            token_updated = False
            
            for line in lines:
                if line.startswith('FACEBOOK_PAGE_ACCESS_TOKEN='):
                    updated_lines.append(f'FACEBOOK_PAGE_ACCESS_TOKEN={new_token}\n')
                    token_updated = True
                else:
                    updated_lines.append(line)
            
            # If token line wasn't found, add it
            if not token_updated:
                updated_lines.append(f'FACEBOOK_PAGE_ACCESS_TOKEN={new_token}\n')
            
            # Write back to file
            with open(env_path, 'w') as f:
                f.writelines(updated_lines)
            
            return True
            
        except Exception as e:
            print(f"❌ Error updating .env file: {e}")
            return False

def main():
    """Main function to guide user through token refresh process"""
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    try:
        refresher = FacebookTokenRefresher()
        
        print("🔧 Facebook Access Token Refresh Utility")
        print("=" * 50)
        
        # Check current token status
        status = refresher.check_current_token()
        print(f"📊 Current token status: {status['status']}")
        print(f"📝 Message: {status['message']}")
        
        if status['status'] == 'valid':
            print("✅ Your current token is still valid!")
            print("📋 Token info:", json.dumps(status['data'], indent=2))
            return
        
        print("\n🔄 Your token needs to be refreshed.")
        print("\n📋 To get a new token, follow these steps:")
        print("\n1. Go to Facebook Graph API Explorer:")
        print("   https://developers.facebook.com/tools/explorer/")
        
        print(f"\n2. Select your app (App ID: {refresher.app_id})")
        
        print("\n3. Select your page from the 'User or Page' dropdown")
        
        print("\n4. Add these permissions:")
        print("   - pages_manage_posts")
        print("   - pages_read_engagement") 
        print("   - pages_show_list")
        
        print("\n5. Click 'Generate Access Token'")
        
        print("\n6. Copy the generated token and paste it below:")
        
        # Get new token from user
        new_token = input("\n🔑 Enter your new Page Access Token: ").strip()
        
        if not new_token:
            print("❌ No token provided. Exiting.")
            return
        
        # Validate new token
        print("\n🔍 Validating new token...")
        validation = refresher.validate_token(new_token)
        
        if 'error' in validation:
            print(f"❌ Invalid token: {validation['error']}")
            return
        
        print("✅ Token is valid!")
        print(f"📋 Token info: {json.dumps(validation, indent=2)}")
        
        # Update .env file
        print("\n💾 Updating .env file...")
        if refresher.update_env_file(new_token):
            print("✅ .env file updated successfully!")
            print("\n🚀 You can now restart your backend server and try posting again.")
            print("\n📝 Restart command:")
            print("   cd backend")
            print("   python src/main.py")
        else:
            print("❌ Failed to update .env file")
            print(f"📝 Please manually update FACEBOOK_PAGE_ACCESS_TOKEN in .env file with:")
            print(f"   {new_token}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n📋 Manual token refresh steps:")
        print("1. Go to https://developers.facebook.com/tools/explorer/")
        print("2. Generate a new Page Access Token")
        print("3. Update FACEBOOK_PAGE_ACCESS_TOKEN in backend/.env file")
        print("4. Restart the backend server")

if __name__ == "__main__":
    main()
