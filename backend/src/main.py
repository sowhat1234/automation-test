"""
Facebook Automation Backend API
Main FastAPI application entry point
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
import os
import uvicorn
import logging
from dotenv import load_dotenv

# Import our custom modules
from config_manager import create_config_manager, setup_logging_from_config, validate_environment
from facebook_api import create_facebook_client, FacebookAPIError, AuthenticationError, RateLimitError
from post_manager import PostManager, ValidationError
from scheduler import create_post_queue, PostQueue, ScheduledPost, SchedulingError, PostStatus, RecurrenceType

# Load environment variables
load_dotenv()

# Initialize configuration and logging
config_manager = create_config_manager()
try:
    app_config = config_manager.get_config()
    setup_logging_from_config(app_config.logging)
    config_manager.create_directories()
except Exception as e:
    print(f"Configuration error: {e}")
    print("Please check your .env file and ensure all required variables are set.")
    exit(1)

# Create FastAPI app
app = FastAPI(
    title="Facebook Automation API",
    description="Backend API for Facebook post automation and scheduling",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=app_config.api.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize global components
post_manager = PostManager()
post_queue = create_post_queue()
logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

# Pydantic models for request/response
class TextPostRequest(BaseModel):
    message: str
    link: Optional[str] = None

class ImagePostRequest(BaseModel):
    message: str
    alt_text: Optional[str] = None

class PostResponse(BaseModel):
    success: bool
    post_id: Optional[str] = None
    message: str
    error_code: Optional[str] = None

# Scheduling models
class ScheduleTextPostRequest(BaseModel):
    message: str
    schedule_time: datetime
    link: Optional[str] = None
    recurrence: Optional[str] = "none"
    recurrence_end: Optional[datetime] = None
    
    @validator('schedule_time')
    def validate_schedule_time(cls, v):
        if v <= datetime.now():
            raise ValueError('Schedule time must be in the future')
        return v
    
    @validator('recurrence')
    def validate_recurrence(cls, v):
        valid_values = ['none', 'daily', 'weekly', 'monthly']
        if v not in valid_values:
            raise ValueError(f'Recurrence must be one of: {valid_values}')
        return v

class ScheduleImagePostRequest(BaseModel):
    message: str
    schedule_time: datetime
    alt_text: Optional[str] = None
    recurrence: Optional[str] = "none"
    recurrence_end: Optional[datetime] = None
    
    @validator('schedule_time')
    def validate_schedule_time(cls, v):
        if v <= datetime.now():
            raise ValueError('Schedule time must be in the future')
        return v
    
    @validator('recurrence')
    def validate_recurrence(cls, v):
        valid_values = ['none', 'daily', 'weekly', 'monthly']
        if v not in valid_values:
            raise ValueError(f'Recurrence must be one of: {valid_values}')
        return v

class UpdateScheduledPostRequest(BaseModel):
    message: Optional[str] = None
    schedule_time: Optional[datetime] = None
    link: Optional[str] = None
    alt_text: Optional[str] = None
    recurrence: Optional[str] = None
    recurrence_end: Optional[datetime] = None
    
    @validator('schedule_time')
    def validate_schedule_time(cls, v):
        if v and v <= datetime.now():
            raise ValueError('Schedule time must be in the future')
        return v

class ScheduledPostResponse(BaseModel):
    id: str
    post_type: str
    message: str
    schedule_time: datetime
    status: str
    recurrence: str
    recurrence_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    link: Optional[str] = None
    image_path: Optional[str] = None
    alt_text: Optional[str] = None
    facebook_post_id: Optional[str] = None

@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "Facebook Automation API",
        "status": "running",
        "version": "1.0.0",
        "environment": app_config.api.environment
    }

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint"""
    try:
        # Check configuration
        env_status = validate_environment()
        
        # Try to create Facebook client
        facebook_client = None
        facebook_status = "not_configured"
        
        if env_status["valid"]:
            try:
                facebook_client = create_facebook_client()
                facebook_status = "configured"
            except Exception as e:
                facebook_status = f"error: {str(e)}"
        
        return {
            "status": "healthy" if env_status["valid"] else "unhealthy",
            "service": "facebook-automation-api",
            "environment": app_config.api.environment,
            "configuration_valid": env_status["valid"],
            "facebook_status": facebook_status,
            "issues": env_status.get("issues", [])
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "facebook-automation-api",
            "error": str(e)
        }

@app.get("/api/status")
async def api_status():
    """Detailed API status endpoint"""
    try:
        env_status = validate_environment()
        config_summary = config_manager.get_config_summary()
        
        return {
            "api": "online",
            "version": "1.0.0",
            "environment": app_config.api.environment,
            "configuration": config_summary,
            "facebook_connectivity": env_status.get("facebook_connectivity", {}),
            "validation_issues": env_status.get("issues", []),
            "post_stats": post_manager.get_post_stats()
        }
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@app.post("/api/auth/validate")
async def validate_facebook_token():
    """Validate Facebook access token"""
    try:
        facebook_client = create_facebook_client()
        token_info = facebook_client.validate_token()
        
        return {
            "valid": True,
            "token_info": token_info,
            "message": "Token validation successful"
        }
    except AuthenticationError as e:
        logger.error(f"Token validation failed: {e}")
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(status_code=500, detail=f"Token validation failed: {str(e)}")

@app.get("/api/page/info")
async def get_page_info():
    """Get Facebook page information"""
    try:
        facebook_client = create_facebook_client()
        page_info = facebook_client.get_page_info()
        
        return {
            "success": True,
            "page_info": page_info
        }
    except FacebookAPIError as e:
        logger.error(f"Failed to get page info: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Page info error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get page info: {str(e)}")

@app.post("/api/posts/text", response_model=PostResponse)
async def create_text_post(post_request: TextPostRequest):
    """Create and publish a text post"""
    try:
        # Create post using post manager
        text_post = post_manager.create_text_post(
            message=post_request.message,
            link=post_request.link
        )
        
        # Publish to Facebook
        facebook_client = create_facebook_client()
        response = facebook_client.create_text_post(
            message=post_request.message,
            link=post_request.link
        )
        
        # Update post with Facebook post ID
        post_id = response.get('id')
        if post_id:
            text_post.set_post_id(post_id)
        
        logger.info(f"Text post created successfully: {post_id}")
        
        return PostResponse(
            success=True,
            post_id=post_id,
            message="Text post created successfully"
        )
        
    except ValidationError as e:
        logger.error(f"Text post validation failed: {e}")
        raise HTTPException(status_code=400, detail=f"Validation error: {e.message}")
    except FacebookAPIError as e:
        logger.error(f"Facebook API error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Text post creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create text post: {str(e)}")

@app.post("/api/posts/image", response_model=PostResponse)
async def create_image_post(
    message: str = Form(...),
    alt_text: Optional[str] = Form(None),
    image: UploadFile = File(...)
):
    """Create and publish an image post"""
    try:
        # Save uploaded image temporarily
        import tempfile
        import shutil
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(image.filename)[1]) as tmp_file:
            shutil.copyfileobj(image.file, tmp_file)
            temp_image_path = tmp_file.name
        
        try:
            # Create post using post manager
            image_post = post_manager.create_image_post(
                message=message,
                image_paths=temp_image_path,
                alt_text=alt_text
            )
            
            # Publish to Facebook
            facebook_client = create_facebook_client()
            response = facebook_client.create_image_post(
                message=message,
                image_path=temp_image_path,
                alt_text=alt_text
            )
            
            # Update post with Facebook post ID
            post_id = response.get('id')
            if post_id:
                image_post.set_post_id(post_id)
            
            logger.info(f"Image post created successfully: {post_id}")
            
            return PostResponse(
                success=True,
                post_id=post_id,
                message="Image post created successfully"
            )
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_image_path)
            except:
                pass
        
    except ValidationError as e:
        logger.error(f"Image post validation failed: {e}")
        raise HTTPException(status_code=400, detail=f"Validation error: {e.message}")
    except FacebookAPIError as e:
        logger.error(f"Facebook API error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Image post creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create image post: {str(e)}")

@app.get("/api/posts")
async def get_posts(limit: int = 25):
    """Get recent posts from Facebook page"""
    try:
        facebook_client = create_facebook_client()
        posts = facebook_client.get_page_posts(limit=min(limit, 100))
        
        return {
            "success": True,
            "posts": posts,
            "count": len(posts)
        }
    except FacebookAPIError as e:
        logger.error(f"Failed to get posts: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Get posts error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get posts: {str(e)}")

@app.get("/api/posts/history")
async def get_posts_history():
    """Get history of posts created through this API"""
    try:
        history = post_manager.get_posts_history()
        stats = post_manager.get_post_stats()
        
        return {
            "success": True,
            "posts": history,
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Get posts history error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get posts history: {str(e)}")

@app.get("/api/usage")
async def get_api_usage():
    """Get Facebook API usage statistics"""
    try:
        facebook_client = create_facebook_client()
        usage_stats = facebook_client.get_api_usage()
        
        return {
            "success": True,
            "usage": usage_stats
        }
    except Exception as e:
        logger.error(f"Get API usage error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get API usage: {str(e)}")

@app.get("/api/config/validate")
async def validate_config():
    """Validate current configuration"""
    try:
        env_status = validate_environment()
        return env_status
    except Exception as e:
        logger.error(f"Config validation error: {e}")
        raise HTTPException(status_code=500, detail=f"Configuration validation failed: {str(e)}")

# SCHEDULING ENDPOINTS

@app.post("/api/posts/schedule", response_model=ScheduledPostResponse)
async def schedule_text_post(post_request: ScheduleTextPostRequest):
    """Schedule a text post for future publishing"""
    try:
        # Convert string recurrence to enum
        recurrence = RecurrenceType(post_request.recurrence)
        
        # Schedule the post
        scheduled_post = post_queue.schedule_text_post(
            message=post_request.message,
            schedule_time=post_request.schedule_time,
            link=post_request.link,
            recurrence=recurrence,
            recurrence_end=post_request.recurrence_end
        )
        
        logger.info(f"Text post scheduled: {scheduled_post.id} for {scheduled_post.schedule_time}")
        
        return ScheduledPostResponse(
            id=scheduled_post.id,
            post_type=scheduled_post.post_type,
            message=scheduled_post.message,
            schedule_time=scheduled_post.schedule_time,
            status=scheduled_post.status.value,
            recurrence=scheduled_post.recurrence.value,
            recurrence_end=scheduled_post.recurrence_end,
            created_at=scheduled_post.created_at,
            updated_at=scheduled_post.updated_at,
            link=scheduled_post.link
        )
        
    except SchedulingError as e:
        logger.error(f"Scheduling failed: {e}")
        raise HTTPException(status_code=400, detail=f"Scheduling error: {e.message}")
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to schedule post: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to schedule post: {str(e)}")

@app.post("/api/posts/schedule-image", response_model=ScheduledPostResponse)
async def schedule_image_post(
    message: str = Form(...),
    schedule_time: datetime = Form(...),
    alt_text: Optional[str] = Form(None),
    recurrence: str = Form("none"),
    image: UploadFile = File(...)
):
    """Schedule an image post for future publishing"""
    try:
        # Save uploaded image to media directory
        import tempfile
        import shutil
        
        # Create media directory path
        media_dir = os.path.join(os.path.dirname(__file__), 'media')
        os.makedirs(media_dir, exist_ok=True)
        
        # Generate unique filename
        import uuid
        file_ext = os.path.splitext(image.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        image_path = os.path.join(media_dir, unique_filename)
        
        # Save the image
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Convert string recurrence to enum
        recurrence_type = RecurrenceType(recurrence)
        
        # Schedule the post
        scheduled_post = post_queue.schedule_image_post(
            message=message,
            image_path=image_path,
            schedule_time=schedule_time,
            alt_text=alt_text,
            recurrence=recurrence_type
        )
        
        logger.info(f"Image post scheduled: {scheduled_post.id} for {scheduled_post.schedule_time}")
        
        return ScheduledPostResponse(
            id=scheduled_post.id,
            post_type=scheduled_post.post_type,
            message=scheduled_post.message,
            schedule_time=scheduled_post.schedule_time,
            status=scheduled_post.status.value,
            recurrence=scheduled_post.recurrence.value,
            recurrence_end=scheduled_post.recurrence_end,
            created_at=scheduled_post.created_at,
            updated_at=scheduled_post.updated_at,
            image_path=scheduled_post.image_path,
            alt_text=scheduled_post.alt_text
        )
        
    except SchedulingError as e:
        logger.error(f"Image scheduling failed: {e}")
        raise HTTPException(status_code=400, detail=f"Scheduling error: {e.message}")
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to schedule image post: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to schedule image post: {str(e)}")

@app.get("/api/posts/scheduled")
async def get_scheduled_posts(
    status: Optional[str] = None,
    limit: Optional[int] = None
):
    """Get list of scheduled posts"""
    try:
        # Convert status string to enum if provided
        status_filter = None
        if status:
            try:
                status_filter = PostStatus(status)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
        
        # Get scheduled posts
        scheduled_posts = post_queue.get_scheduled_posts(
            status_filter=status_filter,
            limit=limit
        )
        
        # Convert to response format
        posts_data = []
        for post in scheduled_posts:
            posts_data.append({
                'id': post.id,
                'post_type': post.post_type,
                'message': post.message,
                'schedule_time': post.schedule_time.isoformat(),
                'status': post.status.value,
                'recurrence': post.recurrence.value,
                'recurrence_end': post.recurrence_end.isoformat() if post.recurrence_end else None,
                'created_at': post.created_at.isoformat(),
                'updated_at': post.updated_at.isoformat(),
                'link': post.link,
                'image_path': post.image_path,
                'alt_text': post.alt_text,
                'facebook_post_id': post.facebook_post_id
            })
        
        return {
            'success': True,
            'posts': posts_data,
            'count': len(posts_data)
        }
        
    except Exception as e:
        logger.error(f"Failed to get scheduled posts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get scheduled posts: {str(e)}")

@app.put("/api/posts/schedule/{post_id}", response_model=ScheduledPostResponse)
async def update_scheduled_post(post_id: str, update_request: UpdateScheduledPostRequest):
    """Update a scheduled post"""
    try:
        # Prepare update data
        update_data = {}
        if update_request.message is not None:
            update_data['message'] = update_request.message
        if update_request.schedule_time is not None:
            update_data['schedule_time'] = update_request.schedule_time
        if update_request.link is not None:
            update_data['link'] = update_request.link
        if update_request.alt_text is not None:
            update_data['alt_text'] = update_request.alt_text
        if update_request.recurrence is not None:
            update_data['recurrence'] = RecurrenceType(update_request.recurrence)
        if update_request.recurrence_end is not None:
            update_data['recurrence_end'] = update_request.recurrence_end
        
        # Update the post
        updated_post = post_queue.update_scheduled_post(post_id, **update_data)
        
        if not updated_post:
            raise HTTPException(status_code=404, detail="Scheduled post not found")
        
        logger.info(f"Updated scheduled post: {post_id}")
        
        return ScheduledPostResponse(
            id=updated_post.id,
            post_type=updated_post.post_type,
            message=updated_post.message,
            schedule_time=updated_post.schedule_time,
            status=updated_post.status.value,
            recurrence=updated_post.recurrence.value,
            recurrence_end=updated_post.recurrence_end,
            created_at=updated_post.created_at,
            updated_at=updated_post.updated_at,
            link=updated_post.link,
            image_path=updated_post.image_path,
            alt_text=updated_post.alt_text,
            facebook_post_id=updated_post.facebook_post_id
        )
        
    except SchedulingError as e:
        logger.error(f"Failed to update scheduled post: {e}")
        raise HTTPException(status_code=400, detail=f"Update error: {e.message}")
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update scheduled post: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update scheduled post: {str(e)}")

@app.delete("/api/posts/schedule/{post_id}")
async def cancel_scheduled_post(post_id: str):
    """Cancel (soft delete) a scheduled post"""
    try:
        success = post_queue.cancel_scheduled_post(post_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Scheduled post not found")
        
        logger.info(f"Cancelled scheduled post: {post_id}")
        
        return {
            'success': True,
            'message': f'Scheduled post {post_id} has been cancelled'
        }
        
    except Exception as e:
        logger.error(f"Failed to cancel scheduled post: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel scheduled post: {str(e)}")

@app.get("/api/posts/schedule/stats")
async def get_scheduling_stats():
    """Get scheduling queue statistics"""
    try:
        stats = post_queue.get_queue_stats()
        
        return {
            'success': True,
            'stats': stats
        }
        
    except Exception as e:
        logger.error(f"Failed to get scheduling stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get scheduling stats: {str(e)}")

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled exceptions"""
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal server error",
            "detail": str(exc) if os.getenv("ENVIRONMENT") == "development" else "An error occurred"
        }
    )

if __name__ == "__main__":
    try:
        config = config_manager.get_api_config()
        
        logger.info(f"Starting Facebook Automation API on {config.host}:{config.port}")
        logger.info(f"Environment: {config.environment}")
        logger.info("API Documentation available at: http://{}:{}/docs".format(config.host, config.port))
        
        uvicorn.run(
            "main:app",
            host=config.host,
            port=config.port,
            reload=config.debug,
            log_level="info"
        )
    except Exception as e:
        print(f"Failed to start server: {e}")
        exit(1)
