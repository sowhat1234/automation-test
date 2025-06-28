#!/usr/bin/env python3
"""
Facebook API Diagnostic Script

This script helps diagnose Facebook API issues by checking:
- Token validity
- Page permissions
- Page information
- Available pages for the token
"""

import os
import sys
import requests
import json
from typing import Dict, Any, List

class FacebookDiagnostic:
    """Facebook API diagnostic utility"""
    
    def __init__(self):
        self.app_id = os.getenv('FACEBOOK_APP_ID')
        self.app_secret = os.getenv('FACEBOOK_APP_SECRET')
        self.page_access_token = os.getenv('FACEBOOK_PAGE_ACCESS_TOKEN')
        self.page_id = os.getenv('FACEBOOK_PAGE_ID')
        
        if not all([self.app_id, self.app_secret, self.page_access_token, self.page_id]):
            raise ValueError("Missing required Facebook credentials in .env file")
    
    def make_api_request(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        """Make a request to Facebook Graph API"""
        if params is None:
            params = {}
        
        params['access_token'] = self.page_access_token
        
        url = f"https://graph.facebook.com/v18.0/{endpoint}"
        
        try:
            response = requests.get(url, params=params)
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'data': response.json()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def check_token_info(self) -> Dict[str, Any]:
        """Check what the current token represents"""
        print("🔍 Checking access token information...")
        
        result = self.make_api_request('me', {'fields': 'id,name,category,permissions'})
        
        if result['success']:
            data = result['data']
            print(f"✅ Token is valid")
            print(f"📋 Token represents: {data.get('name', 'Unknown')}")
            print(f"🆔 ID: {data.get('id', 'Unknown')}")
            
            if 'category' in data:
                print(f"📂 Category: {data['category']}")
            
            if 'permissions' in data:
                perms = [p['permission'] for p in data['permissions']['data'] if p['status'] == 'granted']
                print(f"🔑 Permissions: {', '.join(perms)}")
            
            return data
        else:
            print(f"❌ Token validation failed: {result['data']}")
            return result['data']
    
    def get_available_pages(self) -> List[Dict[str, Any]]:
        """Get list of pages accessible with current token"""
        print("\\n📄 Checking available pages...")
        
        # First, check if this is a user token and get user's pages
        result = self.make_api_request('me/accounts', {'fields': 'id,name,access_token,permissions'})
        
        if result['success']:
            pages = result['data'].get('data', [])
            if pages:
                print(f"✅ Found {len(pages)} accessible pages:")
                for page in pages:
                    print(f"  📄 {page.get('name', 'Unknown')} (ID: {page.get('id', 'Unknown')})")
                    if 'permissions' in page:
                        perms = [p for p in page['permissions'] if p != 'ADMINISTER']
                        print(f"     🔑 Permissions: {', '.join(perms) if perms else 'ADMINISTER only'}")
                return pages
            else:
                print("❌ No pages found accessible with this token")
                return []
        else:
            print(f"❌ Could not retrieve pages: {result['data']}")
            return []
    
    def check_specific_page(self) -> Dict[str, Any]:
        """Check the specific page ID from configuration"""
        print(f"\\n🎯 Checking specific page ID: {self.page_id}")
        
        result = self.make_api_request(self.page_id, {'fields': 'id,name,category,about,access_token'})
        
        if result['success']:
            data = result['data']
            print(f"✅ Page found: {data.get('name', 'Unknown')}")
            print(f"🆔 ID: {data.get('id', 'Unknown')}")
            print(f"📂 Category: {data.get('category', 'Unknown')}")
            
            if 'access_token' in data:
                print("🔑 Page has its own access token available")
            else:
                print("⚠️  No page access token in response")
            
            return data
        else:
            error_data = result['data']
            print(f"❌ Cannot access page: {error_data}")
            
            if 'error' in error_data:
                error = error_data['error']
                if error.get('code') == 100:
                    print("💡 Error code 100 typically means:")
                    print("   - Page ID doesn't exist")
                    print("   - Token doesn't have permission to access this page")
                    print("   - Page privacy settings prevent access")
                elif error.get('code') == 190:
                    print("💡 Error code 190 means token is invalid or expired")
            
            return error_data
    
    def test_post_permissions(self) -> Dict[str, Any]:
        """Test if we can make a post to the page"""
        print(f"\\n📝 Testing post permissions for page {self.page_id}...")
        
        # Try to get the page's feed (this tests read permissions)
        result = self.make_api_request(f"{self.page_id}/feed", {'limit': 1})
        
        if result['success']:
            print("✅ Can read page feed")
            return {'can_read': True}
        else:
            print(f"❌ Cannot read page feed: {result['data']}")
            return {'can_read': False, 'error': result['data']}
    
    def suggest_solutions(self):
        """Provide solutions based on diagnostic results"""
        print("\\n💡 Suggested Solutions:")
        print("\\n1. **Generate Page Access Token:**")
        print("   - Go to: https://developers.facebook.com/tools/explorer/")
        print(f"   - Select your app: {self.app_id}")
        print("   - In 'User or Page' dropdown, select your page (not your user)")
        print("   - Add permissions: pages_manage_posts, pages_read_engagement")
        print("   - Generate Access Token")
        print("   - Copy the PAGE access token (not user token)")
        
        print("\\n2. **Verify Page Setup:**")
        print("   - Make sure you're an admin of the page")
        print("   - Check page is published (not draft)")
        print("   - Verify page allows API access")
        
        print("\\n3. **Update Configuration:**")
        print("   - Use the correct Page ID from the pages list above")
        print("   - Update FACEBOOK_PAGE_ACCESS_TOKEN with page-specific token")
        print("   - Restart the backend server")

def main():
    """Main diagnostic function"""
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    try:
        print("🔧 Facebook API Diagnostic Tool")
        print("=" * 50)
        
        diag = FacebookDiagnostic()
        
        print(f"📋 Configuration:")
        print(f"   App ID: {diag.app_id}")
        print(f"   Page ID: {diag.page_id}")
        print(f"   Token: {diag.page_access_token[:20]}...")
        
        # Check token info
        token_info = diag.check_token_info()
        
        # Get available pages
        pages = diag.get_available_pages()
        
        # Check specific page
        page_info = diag.check_specific_page()
        
        # Test permissions
        perms = diag.test_post_permissions()
        
        # Provide solutions
        diag.suggest_solutions()
        
        print("\\n" + "=" * 50)
        print("🏁 Diagnostic complete!")
        
    except Exception as e:
        print(f"❌ Diagnostic failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
