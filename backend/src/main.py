"""
Facebook Automation Backend API
Main FastAPI application entry point
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from typing import Optional, List
import os
import uvicorn
import logging
from dotenv import load_dotenv

# Import our custom modules
from config_manager import create_config_manager, setup_logging_from_config, validate_environment
from facebook_api import create_facebook_client, FacebookAPIError, AuthenticationError, RateLimitError
from post_manager import PostManager, ValidationError

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
