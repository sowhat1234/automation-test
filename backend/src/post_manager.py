"""
Post Management System

This module provides classes and utilities for creating, validating, and managing
Facebook posts of different types (text, image, etc.) with comprehensive validation.
"""

import os
import re
import logging
import mimetypes
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from dataclasses import dataclass, field
from PIL import Image
import requests


@dataclass
class PostResult:
    """Result of a post operation"""
    success: bool
    post_id: Optional[str] = None
    message: str = ""
    error_code: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)


class ValidationError(Exception):
    """Exception raised for content validation errors"""
    def __init__(self, message: str, field: Optional[str] = None):
        self.message = message
        self.field = field
        super().__init__(self.message)


class PostValidator:
    """
    Content validator for Facebook posts with platform-specific rules.
    """
    
    # Facebook's content limits
    MAX_TEXT_LENGTH = 63206  # characters
    MAX_IMAGE_SIZE = 4 * 1024 * 1024 * 1024  # 4GB in bytes
    MAX_IMAGES_PER_POST = 10
    ALLOWED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.gif']
    MIN_IMAGE_DIMENSION = 200  # pixels
    MAX_IMAGE_DIMENSION = 8000  # pixels
    
    # Content patterns
    URL_PATTERN = re.compile(
        r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    )
    
    @classmethod
    def validate_text(cls, text: str) -> None:
        """
        Validate text content for Facebook posts.
        
        Args:
            text: Text content to validate
            
        Raises:
            ValidationError: If text content is invalid
        """
        if not text or not text.strip():
            raise ValidationError("Text content cannot be empty", "text")
        
        if len(text) > cls.MAX_TEXT_LENGTH:
            raise ValidationError(
                f"Text exceeds maximum length of {cls.MAX_TEXT_LENGTH} characters",
                "text"
            )
        
        # Check for potentially problematic content
        if text.count('\n') > 100:  # Too many line breaks
            raise ValidationError("Text contains too many line breaks", "text")
    
    @classmethod
    def validate_image_file(cls, image_path: str) -> Dict[str, Any]:
        """
        Validate image file for Facebook posting.
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dictionary with image metadata
            
        Raises:
            ValidationError: If image is invalid
        """
        if not os.path.exists(image_path):
            raise ValidationError(f"Image file not found: {image_path}", "image_path")
        
        # Check file size
        file_size = os.path.getsize(image_path)
        if file_size > cls.MAX_IMAGE_SIZE:
            raise ValidationError(
                f"Image file exceeds maximum size of {cls.MAX_IMAGE_SIZE / (1024**3):.1f}GB",
                "image_size"
            )
        
        if file_size == 0:
            raise ValidationError("Image file is empty", "image_size")
        
        # Check file extension
        file_ext = os.path.splitext(image_path)[1].lower()
        if file_ext not in cls.ALLOWED_IMAGE_FORMATS:
            raise ValidationError(
                f"Unsupported image format: {file_ext}. "
                f"Allowed formats: {', '.join(cls.ALLOWED_IMAGE_FORMATS)}",
                "image_format"
            )
        
        # Validate image with PIL
        try:
            with Image.open(image_path) as img:
                width, height = img.size
                format_name = img.format
                mode = img.mode
                
                # Check dimensions
                if width < cls.MIN_IMAGE_DIMENSION or height < cls.MIN_IMAGE_DIMENSION:
                    raise ValidationError(
                        f"Image dimensions too small. Minimum: {cls.MIN_IMAGE_DIMENSION}x{cls.MIN_IMAGE_DIMENSION}",
                        "image_dimensions"
                    )
                
                if width > cls.MAX_IMAGE_DIMENSION or height > cls.MAX_IMAGE_DIMENSION:
                    raise ValidationError(
                        f"Image dimensions too large. Maximum: {cls.MAX_IMAGE_DIMENSION}x{cls.MAX_IMAGE_DIMENSION}",
                        "image_dimensions"
                    )
                
                return {
                    'path': image_path,
                    'size_bytes': file_size,
                    'size_mb': round(file_size / (1024 * 1024), 2),
                    'width': width,
                    'height': height,
                    'format': format_name,
                    'mode': mode,
                    'aspect_ratio': round(width / height, 2)
                }
                
        except Exception as e:
            raise ValidationError(f"Invalid or corrupted image file: {str(e)}", "image_file")
    
    @classmethod
    def validate_url(cls, url: str) -> bool:
        """
        Validate URL format.
        
        Args:
            url: URL to validate
            
        Returns:
            True if URL is valid
        """
        if not url:
            return False
        
        return bool(cls.URL_PATTERN.match(url))
    
    @classmethod
    def validate_multiple_images(cls, image_paths: List[str]) -> List[Dict[str, Any]]:
        """
        Validate multiple images for a single post.
        
        Args:
            image_paths: List of image file paths
            
        Returns:
            List of image metadata dictionaries
            
        Raises:
            ValidationError: If any image is invalid or count exceeds limit
        """
        if len(image_paths) > cls.MAX_IMAGES_PER_POST:
            raise ValidationError(
                f"Too many images. Maximum allowed: {cls.MAX_IMAGES_PER_POST}",
                "image_count"
            )
        
        if not image_paths:
            raise ValidationError("No images provided", "image_count")
        
        validated_images = []
        total_size = 0
        
        for i, image_path in enumerate(image_paths):
            try:
                image_info = cls.validate_image_file(image_path)
                validated_images.append(image_info)
                total_size += image_info['size_bytes']
                
            except ValidationError as e:
                # Add context about which image failed
                raise ValidationError(f"Image {i+1}: {e.message}", e.field)
        
        # Check total size for multiple images
        if total_size > cls.MAX_IMAGE_SIZE:
            raise ValidationError(
                f"Total image size exceeds limit: {total_size / (1024**3):.1f}GB",
                "total_image_size"
            )
        
        return validated_images


class BasePost(ABC):
    """
    Abstract base class for all post types.
    """
    
    def __init__(self, message: str):
        """
        Initialize base post.
        
        Args:
            message: Text content of the post
        """
        self.message = message
        self.created_at = datetime.now()
        self.post_id: Optional[str] = None
        self.status = "draft"
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Validate message
        PostValidator.validate_text(message)
    
    @abstractmethod
    def validate(self) -> None:
        """Validate post content. Must be implemented by subclasses."""
        pass
    
    @abstractmethod
    def to_dict(self) -> Dict[str, Any]:
        """Convert post to dictionary representation."""
        pass
    
    def set_post_id(self, post_id: str) -> None:
        """Set the Facebook post ID after successful posting."""
        self.post_id = post_id
        self.status = "posted"
    
    def mark_failed(self) -> None:
        """Mark post as failed."""
        self.status = "failed"


class TextPost(BasePost):
    """
    Text-only Facebook post.
    """
    
    def __init__(self, message: str, link: Optional[str] = None):
        """
        Initialize text post.
        
        Args:
            message: Text content of the post
            link: Optional URL to include in the post
        """
        super().__init__(message)
        self.link = link
        
        # Validate link if provided
        if link and not PostValidator.validate_url(link):
            raise ValidationError("Invalid URL format", "link")
    
    def validate(self) -> None:
        """Validate text post content."""
        PostValidator.validate_text(self.message)
        
        if self.link and not PostValidator.validate_url(self.link):
            raise ValidationError("Invalid URL format", "link")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert text post to dictionary representation."""
        data = {
            'type': 'text',
            'message': self.message,
            'created_at': self.created_at.isoformat(),
            'status': self.status
        }
        
        if self.link:
            data['link'] = self.link
        
        if self.post_id:
            data['post_id'] = self.post_id
        
        return data


class ImagePost(BasePost):
    """
    Image Facebook post with optional text.
    """
    
    def __init__(
        self, 
        message: str, 
        image_paths: Union[str, List[str]], 
        alt_text: Optional[str] = None
    ):
        """
        Initialize image post.
        
        Args:
            message: Text content to accompany the image(s)
            image_paths: Single image path or list of image paths
            alt_text: Alternative text for accessibility
        """
        super().__init__(message)
        
        # Normalize image paths to list
        if isinstance(image_paths, str):
            self.image_paths = [image_paths]
        else:
            self.image_paths = image_paths
        
        self.alt_text = alt_text
        self.image_metadata: List[Dict[str, Any]] = []
        
        # Validate images
        self.validate()
    
    def validate(self) -> None:
        """Validate image post content."""
        PostValidator.validate_text(self.message)
        
        # Validate all images and store metadata
        self.image_metadata = PostValidator.validate_multiple_images(self.image_paths)
        
        self.logger.info(f"Validated {len(self.image_paths)} images for post")
    
    def get_primary_image(self) -> str:
        """Get the path to the primary (first) image."""
        return self.image_paths[0] if self.image_paths else ""
    
    def is_multiple_images(self) -> bool:
        """Check if post contains multiple images."""
        return len(self.image_paths) > 1
    
    def get_total_size_mb(self) -> float:
        """Get total size of all images in MB."""
        return sum(img['size_mb'] for img in self.image_metadata)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert image post to dictionary representation."""
        data = {
            'type': 'image',
            'message': self.message,
            'image_paths': self.image_paths,
            'image_count': len(self.image_paths),
            'total_size_mb': self.get_total_size_mb(),
            'image_metadata': self.image_metadata,
            'created_at': self.created_at.isoformat(),
            'status': self.status
        }
        
        if self.alt_text:
            data['alt_text'] = self.alt_text
        
        if self.post_id:
            data['post_id'] = self.post_id
        
        return data


class PostBuilder:
    """
    Builder pattern for creating different types of posts.
    """
    
    def __init__(self):
        """Initialize post builder."""
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def create_text_post(self, message: str, link: Optional[str] = None) -> TextPost:
        """
        Create a text post.
        
        Args:
            message: Text content of the post
            link: Optional URL to include
            
        Returns:
            TextPost instance
        """
        try:
            post = TextPost(message, link)
            self.logger.info("Text post created successfully")
            return post
            
        except ValidationError as e:
            self.logger.error(f"Failed to create text post: {e.message}")
            raise
    
    def create_image_post(
        self, 
        message: str, 
        image_paths: Union[str, List[str]], 
        alt_text: Optional[str] = None
    ) -> ImagePost:
        """
        Create an image post.
        
        Args:
            message: Text content to accompany the image(s)
            image_paths: Single image path or list of image paths
            alt_text: Alternative text for accessibility
            
        Returns:
            ImagePost instance
        """
        try:
            post = ImagePost(message, image_paths, alt_text)
            self.logger.info(f"Image post created with {len(post.image_paths)} images")
            return post
            
        except ValidationError as e:
            self.logger.error(f"Failed to create image post: {e.message}")
            raise
    
    def create_from_dict(self, post_data: Dict[str, Any]) -> BasePost:
        """
        Create a post from dictionary representation.
        
        Args:
            post_data: Dictionary containing post data
            
        Returns:
            Appropriate post instance
        """
        post_type = post_data.get('type')
        
        if post_type == 'text':
            return self.create_text_post(
                message=post_data['message'],
                link=post_data.get('link')
            )
        elif post_type == 'image':
            return self.create_image_post(
                message=post_data['message'],
                image_paths=post_data['image_paths'],
                alt_text=post_data.get('alt_text')
            )
        else:
            raise ValueError(f"Unknown post type: {post_type}")


class PostManager:
    """
    High-level post management system.
    """
    
    def __init__(self):
        """Initialize post manager."""
        self.builder = PostBuilder()
        self.logger = logging.getLogger(self.__class__.__name__)
        self._posts_history: List[BasePost] = []
    
    def create_text_post(self, message: str, link: Optional[str] = None) -> TextPost:
        """Create and track a text post."""
        post = self.builder.create_text_post(message, link)
        self._posts_history.append(post)
        return post
    
    def create_image_post(
        self, 
        message: str, 
        image_paths: Union[str, List[str]], 
        alt_text: Optional[str] = None
    ) -> ImagePost:
        """Create and track an image post."""
        post = self.builder.create_image_post(message, image_paths, alt_text)
        self._posts_history.append(post)
        return post
    
    def get_posts_history(self) -> List[Dict[str, Any]]:
        """Get history of all created posts."""
        return [post.to_dict() for post in self._posts_history]
    
    def get_posts_by_status(self, status: str) -> List[Dict[str, Any]]:
        """Get posts filtered by status."""
        return [
            post.to_dict() for post in self._posts_history 
            if post.status == status
        ]
    
    def get_post_stats(self) -> Dict[str, Any]:
        """Get statistics about created posts."""
        total_posts = len(self._posts_history)
        
        if total_posts == 0:
            return {
                'total_posts': 0,
                'text_posts': 0,
                'image_posts': 0,
                'posted': 0,
                'failed': 0,
                'draft': 0
            }
        
        text_posts = sum(1 for post in self._posts_history if isinstance(post, TextPost))
        image_posts = sum(1 for post in self._posts_history if isinstance(post, ImagePost))
        
        status_counts = {}
        for post in self._posts_history:
            status_counts[post.status] = status_counts.get(post.status, 0) + 1
        
        return {
            'total_posts': total_posts,
            'text_posts': text_posts,
            'image_posts': image_posts,
            'posted': status_counts.get('posted', 0),
            'failed': status_counts.get('failed', 0),
            'draft': status_counts.get('draft', 0)
        }


# Utility functions
def optimize_image_for_facebook(image_path: str, output_path: Optional[str] = None) -> str:
    """
    Optimize image for Facebook posting.
    
    Args:
        image_path: Path to source image
        output_path: Optional output path (defaults to source with _optimized suffix)
        
    Returns:
        Path to optimized image
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")
    
    if output_path is None:
        name, ext = os.path.splitext(image_path)
        output_path = f"{name}_optimized{ext}"
    
    try:
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Resize if too large
            max_dimension = 2048
            if max(img.size) > max_dimension:
                img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
            
            # Save with optimization
            img.save(output_path, optimize=True, quality=85)
            
        logging.info(f"Image optimized: {output_path}")
        return output_path
        
    except Exception as e:
        logging.error(f"Failed to optimize image: {e}")
        raise ValidationError(f"Image optimization failed: {e}")


def validate_post_content(content: Dict[str, Any]) -> None:
    """
    Validate post content dictionary.
    
    Args:
        content: Dictionary containing post content
        
    Raises:
        ValidationError: If content is invalid
    """
    if 'message' not in content:
        raise ValidationError("Missing required field: message")
    
    PostValidator.validate_text(content['message'])
    
    if 'image_paths' in content:
        PostValidator.validate_multiple_images(content['image_paths'])
    
    if 'link' in content and content['link']:
        if not PostValidator.validate_url(content['link']):
            raise ValidationError("Invalid URL format", "link")
