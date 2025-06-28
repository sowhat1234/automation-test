"""
Facebook Graph API Integration Module

This module provides a comprehensive Facebook Graph API client with:
- Authentication and token management
- Rate limiting compliance (200 calls/hour)
- Retry logic with exponential backoff
- Error handling for common API scenarios
- Support for posting text and image content
"""

import os
import time
import json
import logging
from typing import Dict, List, Optional, Union, Any
from datetime import datetime, timedelta
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry


class FacebookAPIError(Exception):
    """Custom exception for Facebook API errors"""
    def __init__(self, message: str, error_code: Optional[int] = None, error_type: Optional[str] = None):
        self.message = message
        self.error_code = error_code
        self.error_type = error_type
        super().__init__(self.message)


class RateLimitError(FacebookAPIError):
    """Exception raised when API rate limit is exceeded"""
    pass


class AuthenticationError(FacebookAPIError):
    """Exception raised for authentication-related errors"""
    pass


class FacebookAPI:
    """
    Facebook Graph API client with comprehensive error handling and rate limiting.
    
    This class provides methods to interact with Facebook's Graph API for:
    - Page information retrieval
    - Text post creation
    - Image post creation
    - Token validation
    """
    
    BASE_URL = "https://graph.facebook.com/v18.0"
    RATE_LIMIT_CALLS = 200  # calls per hour
    RATE_LIMIT_WINDOW = 3600  # 1 hour in seconds
    
    def __init__(self, app_id: str, app_secret: str, page_access_token: str, page_id: str):
        """
        Initialize Facebook API client.
        
        Args:
            app_id: Facebook App ID
            app_secret: Facebook App Secret
            page_access_token: Page Access Token for posting
            page_id: Facebook Page ID
        """
        self.app_id = app_id
        self.app_secret = app_secret
        self.page_access_token = page_access_token
        self.page_id = page_id
        
        # Rate limiting tracking
        self.call_history: List[float] = []
        
        # Setup logging
        self.logger = logging.getLogger(__name__)
        
        # Setup requests session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "POST"],
            backoff_factor=1
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        self.logger.info("Facebook API client initialized")
    
    def _check_rate_limit(self) -> None:
        """
        Check if we're within rate limits before making API call.
        
        Raises:
            RateLimitError: If rate limit would be exceeded
        """
        current_time = time.time()
        
        # Remove calls older than 1 hour
        self.call_history = [
            call_time for call_time in self.call_history 
            if current_time - call_time < self.RATE_LIMIT_WINDOW
        ]
        
        # Check if we're at the limit
        if len(self.call_history) >= self.RATE_LIMIT_CALLS:
            oldest_call = min(self.call_history)
            wait_time = self.RATE_LIMIT_WINDOW - (current_time - oldest_call)
            raise RateLimitError(
                f"Rate limit exceeded. Wait {wait_time:.0f} seconds before next call."
            )
    
    def _record_api_call(self) -> None:
        """Record the timestamp of an API call for rate limiting."""
        self.call_history.append(time.time())
    
    def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        params: Optional[Dict] = None, 
        data: Optional[Dict] = None,
        files: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Make a request to Facebook Graph API with error handling.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            params: Query parameters
            data: Request body data
            files: Files to upload
            
        Returns:
            API response as dictionary
            
        Raises:
            FacebookAPIError: For API-related errors
            RateLimitError: If rate limit is exceeded
            AuthenticationError: For authentication errors
        """
        # Check rate limits
        self._check_rate_limit()
        
        # Prepare URL
        url = f"{self.BASE_URL}/{endpoint}"
        
        # Prepare parameters
        if params is None:
            params = {}
        params['access_token'] = self.page_access_token
        
        # Log request
        self.logger.info(f"Making {method} request to {endpoint}")
        
        try:
            # Make request
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                data=data,
                files=files,
                timeout=30
            )
            
            # Record the API call
            self._record_api_call()
            
            # Parse response
            response_data = response.json()
            
            # Check for API errors
            if 'error' in response_data:
                error = response_data['error']
                error_code = error.get('code', 0)
                error_type = error.get('type', 'unknown')
                error_message = error.get('message', 'Unknown error')
                
                # Handle specific error types
                if error_code in [190, 102]:  # Invalid or expired token
                    raise AuthenticationError(
                        f"Authentication error: {error_message}",
                        error_code=error_code,
                        error_type=error_type
                    )
                elif error_code in [4, 17, 32]:  # Rate limiting
                    raise RateLimitError(
                        f"Rate limit error: {error_message}",
                        error_code=error_code,
                        error_type=error_type
                    )
                else:
                    raise FacebookAPIError(
                        f"Facebook API error: {error_message}",
                        error_code=error_code,
                        error_type=error_type
                    )
            
            # Check HTTP status
            response.raise_for_status()
            
            self.logger.info(f"Request successful: {method} {endpoint}")
            return response_data
            
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Request failed: {e}")
            raise FacebookAPIError(f"Network error: {str(e)}")
    
    def validate_token(self) -> Dict[str, Any]:
        """
        Validate the current access token.
        
        Returns:
            Token information and permissions
            
        Raises:
            AuthenticationError: If token is invalid
        """
        try:
            response = self._make_request(
                'GET',
                'me',
                params={'fields': 'id,name,permissions'}
            )
            
            self.logger.info("Token validation successful")
            return response
            
        except FacebookAPIError as e:
            self.logger.error(f"Token validation failed: {e}")
            raise AuthenticationError(f"Token validation failed: {e}")
    
    def get_page_info(self) -> Dict[str, Any]:
        """
        Get information about the Facebook page.
        
        Returns:
            Page information including name, category, etc.
        """
        try:
            response = self._make_request(
                'GET',
                self.page_id,
                params={
                    'fields': 'id,name,category,about,website,phone,emails,location,cover,picture'
                }
            )
            
            self.logger.info(f"Retrieved page info for {response.get('name', 'Unknown')}")
            return response
            
        except FacebookAPIError as e:
            self.logger.error(f"Failed to get page info: {e}")
            raise
    
    def create_text_post(self, message: str, link: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a text post on the Facebook page.
        
        Args:
            message: Text content of the post
            link: Optional URL to include in the post
            
        Returns:
            Post creation response with post ID
        """
        if not message or len(message.strip()) == 0:
            raise ValueError("Message cannot be empty")
        
        if len(message) > 63206:  # Facebook's character limit
            raise ValueError("Message exceeds Facebook's character limit (63,206)")
        
        data = {'message': message}
        if link:
            data['link'] = link
        
        try:
            response = self._make_request(
                'POST',
                f"{self.page_id}/feed",
                data=data
            )
            
            post_id = response.get('id')
            self.logger.info(f"Text post created successfully: {post_id}")
            return response
            
        except FacebookAPIError as e:
            self.logger.error(f"Failed to create text post: {e}")
            raise
    
    def create_image_post(
        self, 
        message: str, 
        image_path: str, 
        alt_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create an image post on the Facebook page.
        
        Args:
            message: Text content to accompany the image
            image_path: Path to the image file
            alt_text: Alternative text for accessibility
            
        Returns:
            Post creation response with post ID
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        # Check file size (4GB limit)
        file_size = os.path.getsize(image_path)
        if file_size > 4 * 1024 * 1024 * 1024:  # 4GB in bytes
            raise ValueError("Image file exceeds 4GB size limit")
        
        # Check file extension
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        file_ext = os.path.splitext(image_path)[1].lower()
        if file_ext not in allowed_extensions:
            raise ValueError(f"Unsupported image format: {file_ext}")
        
        data = {'message': message}
        if alt_text:
            data['alt_text'] = alt_text
        
        try:
            with open(image_path, 'rb') as image_file:
                files = {'source': image_file}
                
                response = self._make_request(
                    'POST',
                    f"{self.page_id}/photos",
                    data=data,
                    files=files
                )
            
            post_id = response.get('id')
            self.logger.info(f"Image post created successfully: {post_id}")
            return response
            
        except FacebookAPIError as e:
            self.logger.error(f"Failed to create image post: {e}")
            raise
        except IOError as e:
            self.logger.error(f"Failed to read image file: {e}")
            raise FacebookAPIError(f"Failed to read image file: {e}")
    
    def get_page_posts(self, limit: int = 25) -> List[Dict[str, Any]]:
        """
        Get recent posts from the Facebook page.
        
        Args:
            limit: Number of posts to retrieve (max 100)
            
        Returns:
            List of posts with metadata
        """
        if limit > 100:
            limit = 100
        
        try:
            response = self._make_request(
                'GET',
                f"{self.page_id}/posts",
                params={
                    'fields': 'id,message,created_time,type,status_type,permalink_url',
                    'limit': limit
                }
            )
            
            posts = response.get('data', [])
            self.logger.info(f"Retrieved {len(posts)} posts from page")
            return posts
            
        except FacebookAPIError as e:
            self.logger.error(f"Failed to get page posts: {e}")
            raise
    
    def delete_post(self, post_id: str) -> bool:
        """
        Delete a post from the Facebook page.
        
        Args:
            post_id: ID of the post to delete
            
        Returns:
            True if deletion was successful
        """
        try:
            response = self._make_request('DELETE', post_id)
            
            success = response.get('success', False)
            if success:
                self.logger.info(f"Post deleted successfully: {post_id}")
            else:
                self.logger.warning(f"Post deletion may have failed: {post_id}")
            
            return success
            
        except FacebookAPIError as e:
            self.logger.error(f"Failed to delete post {post_id}: {e}")
            raise
    
    def get_api_usage(self) -> Dict[str, Any]:
        """
        Get current API usage statistics.
        
        Returns:
            Dictionary with rate limit information
        """
        current_time = time.time()
        
        # Clean old calls
        self.call_history = [
            call_time for call_time in self.call_history 
            if current_time - call_time < self.RATE_LIMIT_WINDOW
        ]
        
        calls_made = len(self.call_history)
        calls_remaining = self.RATE_LIMIT_CALLS - calls_made
        
        # Calculate reset time
        if self.call_history:
            oldest_call = min(self.call_history)
            reset_time = oldest_call + self.RATE_LIMIT_WINDOW
        else:
            reset_time = current_time + self.RATE_LIMIT_WINDOW
        
        return {
            'calls_made': calls_made,
            'calls_remaining': calls_remaining,
            'rate_limit': self.RATE_LIMIT_CALLS,
            'window_seconds': self.RATE_LIMIT_WINDOW,
            'reset_time': datetime.fromtimestamp(reset_time).isoformat(),
            'current_time': datetime.fromtimestamp(current_time).isoformat()
        }


def create_facebook_client() -> FacebookAPI:
    """
    Factory function to create Facebook API client from environment variables.
    
    Returns:
        Configured FacebookAPI instance
        
    Raises:
        ValueError: If required environment variables are missing
    """
    app_id = os.getenv('FACEBOOK_APP_ID')
    app_secret = os.getenv('FACEBOOK_APP_SECRET')
    page_access_token = os.getenv('FACEBOOK_PAGE_ACCESS_TOKEN')
    page_id = os.getenv('FACEBOOK_PAGE_ID')
    
    if not all([app_id, app_secret, page_access_token, page_id]):
        missing = []
        if not app_id: missing.append('FACEBOOK_APP_ID')
        if not app_secret: missing.append('FACEBOOK_APP_SECRET')
        if not page_access_token: missing.append('FACEBOOK_PAGE_ACCESS_TOKEN')
        if not page_id: missing.append('FACEBOOK_PAGE_ID')
        
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
    
    return FacebookAPI(app_id, app_secret, page_access_token, page_id)
