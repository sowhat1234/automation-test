"""
Post Scheduling Framework

This module provides classes and utilities for scheduling Facebook posts
with JSON-based persistence and comprehensive validation.
"""

import os
import json
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field
from enum import Enum


class RecurrenceType(Enum):
    """Supported recurrence patterns"""
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class PostStatus(Enum):
    """Post scheduling statuses"""
    SCHEDULED = "scheduled"
    PENDING = "pending"
    POSTED = "posted"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class ScheduledPost:
    """Represents a scheduled post with all metadata"""
    id: str
    post_type: str  # 'text' or 'image'
    message: str
    schedule_time: datetime
    status: PostStatus = PostStatus.SCHEDULED
    recurrence: RecurrenceType = RecurrenceType.NONE
    recurrence_end: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    
    # Post-specific data
    link: Optional[str] = None
    image_path: Optional[str] = None
    alt_text: Optional[str] = None
    
    # Execution metadata
    facebook_post_id: Optional[str] = None
    execution_attempts: int = 0
    last_error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'post_type': self.post_type,
            'message': self.message,
            'schedule_time': self.schedule_time.isoformat(),
            'status': self.status.value,
            'recurrence': self.recurrence.value,
            'recurrence_end': self.recurrence_end.isoformat() if self.recurrence_end else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'link': self.link,
            'image_path': self.image_path,
            'alt_text': self.alt_text,
            'facebook_post_id': self.facebook_post_id,
            'execution_attempts': self.execution_attempts,
            'last_error': self.last_error
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ScheduledPost':
        """Create from dictionary (JSON deserialization)"""
        return cls(
            id=data['id'],
            post_type=data['post_type'],
            message=data['message'],
            schedule_time=datetime.fromisoformat(data['schedule_time']),
            status=PostStatus(data['status']),
            recurrence=RecurrenceType(data['recurrence']),
            recurrence_end=datetime.fromisoformat(data['recurrence_end']) if data.get('recurrence_end') else None,
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at']),
            link=data.get('link'),
            image_path=data.get('image_path'),
            alt_text=data.get('alt_text'),
            facebook_post_id=data.get('facebook_post_id'),
            execution_attempts=data.get('execution_attempts', 0),
            last_error=data.get('last_error')
        )


class SchedulingError(Exception):
    """Exception raised for scheduling-related errors"""
    def __init__(self, message: str, error_code: Optional[str] = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class PostQueue:
    """Post scheduling queue with JSON persistence"""
    
    def __init__(self, storage_path: str = None, logger: Optional[logging.Logger] = None):
        """Initialize post queue
        
        Args:
            storage_path: Path to JSON storage file
            logger: Logger instance for scheduling operations
        """
        self.storage_path = storage_path or self._get_default_storage_path()
        self.logger = logger or logging.getLogger(__name__)
        self.queue: List[ScheduledPost] = []
        self.load_queue()
    
    def _get_default_storage_path(self) -> str:
        """Get default storage path in logs directory"""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        logs_dir = os.path.join(base_dir, 'logs')
        os.makedirs(logs_dir, exist_ok=True)
        return os.path.join(logs_dir, 'scheduled_posts.json')
    
    def load_queue(self) -> None:
        """Load scheduled posts from JSON file"""
        try:
            if os.path.exists(self.storage_path):
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.queue = [ScheduledPost.from_dict(post_data) for post_data in data]
                self.logger.info(f"Loaded {len(self.queue)} scheduled posts from {self.storage_path}")
            else:
                self.queue = []
                self.logger.info("No existing scheduled posts file found, starting with empty queue")
        except Exception as e:
            self.logger.error(f"Failed to load queue from {self.storage_path}: {e}")
            self.queue = []
            raise SchedulingError(f"Failed to load scheduled posts: {str(e)}", "LOAD_ERROR")
    
    def save_queue(self) -> None:
        """Save scheduled posts to JSON file"""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            
            # Save queue
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                data = [post.to_dict() for post in self.queue]
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            self.logger.debug(f"Saved {len(self.queue)} scheduled posts to {self.storage_path}")
        except Exception as e:
            self.logger.error(f"Failed to save queue to {self.storage_path}: {e}")
            raise SchedulingError(f"Failed to save scheduled posts: {str(e)}", "SAVE_ERROR")
    
    def validate_schedule_time(self, schedule_time: datetime) -> None:
        """Validate that schedule time is appropriate
        
        Args:
            schedule_time: When the post should be published
            
        Raises:
            SchedulingError: If schedule time is invalid
        """
        now = datetime.now()
        min_future_time = now + timedelta(minutes=10)
        
        if schedule_time <= now:
            raise SchedulingError(
                "Schedule time must be in the future",
                "INVALID_TIME_PAST"
            )
        
        if schedule_time < min_future_time:
            raise SchedulingError(
                "Schedule time must be at least 10 minutes from now",
                "INVALID_TIME_TOO_SOON"
            )
        
        # Check if it's too far in the future (optional limit)
        max_future_time = now + timedelta(days=365)  # 1 year limit
        if schedule_time > max_future_time:
            raise SchedulingError(
                "Schedule time cannot be more than 1 year in the future",
                "INVALID_TIME_TOO_FAR"
            )
    
    def schedule_text_post(
        self, 
        message: str, 
        schedule_time: datetime,
        link: Optional[str] = None,
        recurrence: RecurrenceType = RecurrenceType.NONE,
        recurrence_end: Optional[datetime] = None
    ) -> ScheduledPost:
        """Schedule a text post
        
        Args:
            message: Post message content
            schedule_time: When to publish the post
            link: Optional link to include
            recurrence: Recurrence pattern
            recurrence_end: When to stop recurring posts
            
        Returns:
            ScheduledPost: The scheduled post object
        """
        self.validate_schedule_time(schedule_time)
        
        post = ScheduledPost(
            id=str(uuid.uuid4()),
            post_type="text",
            message=message,
            schedule_time=schedule_time,
            link=link,
            recurrence=recurrence,
            recurrence_end=recurrence_end
        )
        
        self.queue.append(post)
        self.save_queue()
        
        self.logger.info(f"Scheduled text post {post.id} for {schedule_time}")
        return post
    
    def schedule_image_post(
        self,
        message: str,
        image_path: str,
        schedule_time: datetime,
        alt_text: Optional[str] = None,
        recurrence: RecurrenceType = RecurrenceType.NONE,
        recurrence_end: Optional[datetime] = None
    ) -> ScheduledPost:
        """Schedule an image post
        
        Args:
            message: Post message content
            image_path: Path to image file
            schedule_time: When to publish the post
            alt_text: Alternative text for image
            recurrence: Recurrence pattern
            recurrence_end: When to stop recurring posts
            
        Returns:
            ScheduledPost: The scheduled post object
        """
        self.validate_schedule_time(schedule_time)
        
        # Validate image file exists
        if not os.path.exists(image_path):
            raise SchedulingError(f"Image file not found: {image_path}", "IMAGE_NOT_FOUND")
        
        post = ScheduledPost(
            id=str(uuid.uuid4()),
            post_type="image",
            message=message,
            schedule_time=schedule_time,
            image_path=image_path,
            alt_text=alt_text,
            recurrence=recurrence,
            recurrence_end=recurrence_end
        )
        
        self.queue.append(post)
        self.save_queue()
        
        self.logger.info(f"Scheduled image post {post.id} for {schedule_time}")
        return post
    
    def get_scheduled_posts(
        self, 
        status_filter: Optional[PostStatus] = None,
        limit: Optional[int] = None
    ) -> List[ScheduledPost]:
        """Get scheduled posts with optional filtering
        
        Args:
            status_filter: Filter by post status
            limit: Maximum number of posts to return
            
        Returns:
            List of scheduled posts
        """
        posts = self.queue
        
        if status_filter:
            posts = [post for post in posts if post.status == status_filter]
        
        # Sort by schedule time
        posts.sort(key=lambda p: p.schedule_time)
        
        if limit:
            posts = posts[:limit]
        
        return posts
    
    def get_post_by_id(self, post_id: str) -> Optional[ScheduledPost]:
        """Get a specific scheduled post by ID
        
        Args:
            post_id: Post identifier
            
        Returns:
            ScheduledPost if found, None otherwise
        """
        for post in self.queue:
            if post.id == post_id:
                return post
        return None
    
    def update_scheduled_post(
        self, 
        post_id: str, 
        **kwargs
    ) -> Optional[ScheduledPost]:
        """Update a scheduled post
        
        Args:
            post_id: Post identifier
            **kwargs: Fields to update
            
        Returns:
            Updated post if found, None otherwise
        """
        post = self.get_post_by_id(post_id)
        if not post:
            return None
        
        # Update allowed fields
        allowed_fields = {
            'message', 'schedule_time', 'link', 'alt_text', 
            'recurrence', 'recurrence_end', 'status'
        }
        
        for field, value in kwargs.items():
            if field in allowed_fields:
                if field == 'schedule_time' and value:
                    self.validate_schedule_time(value)
                
                setattr(post, field, value)
                post.updated_at = datetime.now()
        
        self.save_queue()
        self.logger.info(f"Updated scheduled post {post_id}")
        return post
    
    def cancel_scheduled_post(self, post_id: str) -> bool:
        """Cancel a scheduled post
        
        Args:
            post_id: Post identifier
            
        Returns:
            True if post was cancelled, False if not found
        """
        post = self.get_post_by_id(post_id)
        if not post:
            return False
        
        post.status = PostStatus.CANCELLED
        post.updated_at = datetime.now()
        self.save_queue()
        
        self.logger.info(f"Cancelled scheduled post {post_id}")
        return True
    
    def remove_scheduled_post(self, post_id: str) -> bool:
        """Permanently remove a scheduled post
        
        Args:
            post_id: Post identifier
            
        Returns:
            True if post was removed, False if not found
        """
        original_length = len(self.queue)
        self.queue = [post for post in self.queue if post.id != post_id]
        
        if len(self.queue) < original_length:
            self.save_queue()
            self.logger.info(f"Removed scheduled post {post_id}")
            return True
        
        return False
    
    def get_queue_stats(self) -> Dict[str, Any]:
        """Get statistics about the post queue
        
        Returns:
            Dictionary with queue statistics
        """
        total_posts = len(self.queue)
        status_counts = {}
        
        for status in PostStatus:
            status_counts[status.value] = len([
                post for post in self.queue if post.status == status
            ])
        
        # Get upcoming posts (next 24 hours)
        now = datetime.now()
        next_24h = now + timedelta(hours=24)
        upcoming_posts = [
            post for post in self.queue 
            if post.status == PostStatus.SCHEDULED and 
               now <= post.schedule_time <= next_24h
        ]
        
        return {
            'total_posts': total_posts,
            'status_breakdown': status_counts,
            'upcoming_24h': len(upcoming_posts),
            'next_post': {
                'id': upcoming_posts[0].id,
                'schedule_time': upcoming_posts[0].schedule_time.isoformat(),
                'message_preview': upcoming_posts[0].message[:50] + '...' if len(upcoming_posts[0].message) > 50 else upcoming_posts[0].message
            } if upcoming_posts else None
        }


def create_post_queue(storage_path: Optional[str] = None) -> PostQueue:
    """Factory function to create a PostQueue instance
    
    Args:
        storage_path: Optional custom storage path
        
    Returns:
        PostQueue instance
    """
    logger = logging.getLogger(__name__)
    return PostQueue(storage_path=storage_path, logger=logger)
