"""
Configuration Management System

This module provides comprehensive configuration management for the Facebook automation system,
including environment variable loading, validation, and secure credential handling.
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass, field
from pathlib import Path
from dotenv import load_dotenv


@dataclass
class FacebookConfig:
    """Facebook API configuration settings"""
    app_id: str
    app_secret: str
    page_access_token: str
    page_id: str
    api_version: str = "v18.0"
    rate_limit_calls: int = 200
    rate_limit_window: int = 3600


@dataclass
class APIConfig:
    """API server configuration settings"""
    host: str = "localhost"
    port: int = 8000
    debug: bool = False
    cors_origins: List[str] = field(default_factory=lambda: ["http://localhost:3000"])
    jwt_secret: str = ""
    environment: str = "development"


@dataclass
class LoggingConfig:
    """Logging configuration settings"""
    level: str = "INFO"
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    file_path: str = "logs/automation.log"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    backup_count: int = 5
    enable_console: bool = True


@dataclass
class MediaConfig:
    """Media handling configuration"""
    images_dir: str = "media/images"
    max_image_size: int = 4 * 1024 * 1024 * 1024  # 4GB
    allowed_formats: List[str] = field(default_factory=lambda: [".jpg", ".jpeg", ".png", ".gif"])
    optimize_images: bool = True
    max_dimension: int = 8000


@dataclass
class AppConfig:
    """Complete application configuration"""
    facebook: FacebookConfig
    api: APIConfig
    logging: LoggingConfig
    media: MediaConfig


class ConfigurationError(Exception):
    """Exception raised for configuration-related errors"""
    def __init__(self, message: str, field: Optional[str] = None):
        self.message = message
        self.field = field
        super().__init__(self.message)


class ConfigManager:
    """
    Comprehensive configuration manager for the Facebook automation system.
    
    Handles loading configuration from:
    - Environment variables
    - Configuration files
    - Default values
    
    Provides validation and secure credential management.
    """
    
    # Required environment variables
    REQUIRED_ENV_VARS = [
        "FACEBOOK_APP_ID",
        "FACEBOOK_APP_SECRET", 
        "FACEBOOK_PAGE_ACCESS_TOKEN",
        "FACEBOOK_PAGE_ID"
    ]
    
    # Optional environment variables with defaults
    OPTIONAL_ENV_VARS = {
        "FACEBOOK_API_VERSION": "v18.0",
        "API_HOST": "localhost",
        "API_PORT": "8000",
        "LOG_LEVEL": "INFO",
        "ENVIRONMENT": "development",
        "CORS_ORIGINS": "http://localhost:3000",
        "JWT_SECRET": "",
        "IMAGES_DIR": "media/images",
        "OPTIMIZE_IMAGES": "true"
    }
    
    def __init__(self, env_file: Optional[str] = None, config_file: Optional[str] = None):
        """
        Initialize configuration manager.
        
        Args:
            env_file: Path to .env file (optional)
            config_file: Path to JSON configuration file (optional)
        """
        self.logger = logging.getLogger(__name__)
        self.env_file = env_file
        self.config_file = config_file
        self._config: Optional[AppConfig] = None
        
        # Load environment variables
        self._load_environment()
    
    def _load_environment(self) -> None:
        """Load environment variables from .env file if specified."""
        if self.env_file and os.path.exists(self.env_file):
            load_dotenv(self.env_file)
            self.logger.info(f"Loaded environment variables from {self.env_file}")
        elif os.path.exists(".env"):
            load_dotenv(".env")
            self.logger.info("Loaded environment variables from .env")
        else:
            self.logger.info("No .env file found, using system environment variables")
    
    def validate_configuration(self) -> List[str]:
        """
        Validate current configuration and return list of issues.
        
        Returns:
            List of validation error messages (empty if valid)
        """
        issues = []
        
        # Check required environment variables
        for var in self.REQUIRED_ENV_VARS:
            value = os.getenv(var)
            if not value or value.strip() == "":
                issues.append(f"Missing required environment variable: {var}")
        
        # Validate Facebook configuration
        facebook_config = self._get_facebook_config()
        if facebook_config:
            try:
                self._validate_facebook_config(facebook_config)
            except ConfigurationError as e:
                issues.append(f"Facebook configuration error: {e.message}")
        
        # Validate API configuration
        api_config = self._get_api_config()
        if api_config:
            try:
                self._validate_api_config(api_config)
            except ConfigurationError as e:
                issues.append(f"API configuration error: {e.message}")
        
        # Validate media configuration
        media_config = self._get_media_config()
        if media_config:
            try:
                self._validate_media_config(media_config)
            except ConfigurationError as e:
                issues.append(f"Media configuration error: {e.message}")
        
        return issues
    
    def _validate_facebook_config(self, config: FacebookConfig) -> None:
        """Validate Facebook configuration."""
        if not config.app_id:
            raise ConfigurationError("Facebook App ID is required", "app_id")
        
        if not config.app_secret:
            raise ConfigurationError("Facebook App Secret is required", "app_secret")
        
        if not config.page_access_token:
            raise ConfigurationError("Facebook Page Access Token is required", "page_access_token")
        
        if not config.page_id:
            raise ConfigurationError("Facebook Page ID is required", "page_id")
        
        # Validate token format (basic check)
        if len(config.page_access_token) < 50:
            raise ConfigurationError("Page Access Token appears to be invalid (too short)", "page_access_token")
        
        # Validate rate limiting
        if config.rate_limit_calls <= 0:
            raise ConfigurationError("Rate limit calls must be positive", "rate_limit_calls")
        
        if config.rate_limit_window <= 0:
            raise ConfigurationError("Rate limit window must be positive", "rate_limit_window")
    
    def _validate_api_config(self, config: APIConfig) -> None:
        """Validate API configuration."""
        if not config.host:
            raise ConfigurationError("API host is required", "host")
        
        if not (1 <= config.port <= 65535):
            raise ConfigurationError("API port must be between 1 and 65535", "port")
        
        if config.environment not in ["development", "production", "testing"]:
            raise ConfigurationError("Environment must be 'development', 'production', or 'testing'", "environment")
        
        if not config.cors_origins:
            raise ConfigurationError("At least one CORS origin is required", "cors_origins")
        
        # Validate CORS origins
        for origin in config.cors_origins:
            if not origin.startswith(("http://", "https://", "*")):
                raise ConfigurationError(f"Invalid CORS origin format: {origin}", "cors_origins")
    
    def _validate_media_config(self, config: MediaConfig) -> None:
        """Validate media configuration."""
        if not config.images_dir:
            raise ConfigurationError("Images directory is required", "images_dir")
        
        if config.max_image_size <= 0:
            raise ConfigurationError("Max image size must be positive", "max_image_size")
        
        if not config.allowed_formats:
            raise ConfigurationError("At least one allowed image format is required", "allowed_formats")
        
        # Validate image formats
        for fmt in config.allowed_formats:
            if not fmt.startswith("."):
                raise ConfigurationError(f"Image format must start with dot: {fmt}", "allowed_formats")
        
        if config.max_dimension <= 0:
            raise ConfigurationError("Max image dimension must be positive", "max_dimension")
    
    def _get_facebook_config(self) -> Optional[FacebookConfig]:
        """Create Facebook configuration from environment variables."""
        try:
            return FacebookConfig(
                app_id=os.getenv("FACEBOOK_APP_ID", ""),
                app_secret=os.getenv("FACEBOOK_APP_SECRET", ""),
                page_access_token=os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN", ""),
                page_id=os.getenv("FACEBOOK_PAGE_ID", ""),
                api_version=os.getenv("FACEBOOK_API_VERSION", "v18.0"),
                rate_limit_calls=int(os.getenv("FACEBOOK_RATE_LIMIT_CALLS", "200")),
                rate_limit_window=int(os.getenv("FACEBOOK_RATE_LIMIT_WINDOW", "3600"))
            )
        except (ValueError, TypeError) as e:
            self.logger.error(f"Error creating Facebook configuration: {e}")
            return None
    
    def _get_api_config(self) -> Optional[APIConfig]:
        """Create API configuration from environment variables."""
        try:
            cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
            cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]
            
            return APIConfig(
                host=os.getenv("API_HOST", "localhost"),
                port=int(os.getenv("API_PORT", "8000")),
                debug=os.getenv("API_DEBUG", "false").lower() == "true",
                cors_origins=cors_origins,
                jwt_secret=os.getenv("JWT_SECRET", ""),
                environment=os.getenv("ENVIRONMENT", "development")
            )
        except (ValueError, TypeError) as e:
            self.logger.error(f"Error creating API configuration: {e}")
            return None
    
    def _get_logging_config(self) -> LoggingConfig:
        """Create logging configuration from environment variables."""
        return LoggingConfig(
            level=os.getenv("LOG_LEVEL", "INFO"),
            format=os.getenv("LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s"),
            file_path=os.getenv("LOG_FILE_PATH", "logs/automation.log"),
            max_file_size=int(os.getenv("LOG_MAX_FILE_SIZE", str(10 * 1024 * 1024))),
            backup_count=int(os.getenv("LOG_BACKUP_COUNT", "5")),
            enable_console=os.getenv("LOG_ENABLE_CONSOLE", "true").lower() == "true"
        )
    
    def _get_media_config(self) -> Optional[MediaConfig]:
        """Create media configuration from environment variables."""
        try:
            allowed_formats_str = os.getenv("ALLOWED_IMAGE_FORMATS", ".jpg,.jpeg,.png,.gif")
            allowed_formats = [fmt.strip() for fmt in allowed_formats_str.split(",")]
            
            return MediaConfig(
                images_dir=os.getenv("IMAGES_DIR", "media/images"),
                max_image_size=int(os.getenv("MAX_IMAGE_SIZE", str(4 * 1024 * 1024 * 1024))),
                allowed_formats=allowed_formats,
                optimize_images=os.getenv("OPTIMIZE_IMAGES", "true").lower() == "true",
                max_dimension=int(os.getenv("MAX_IMAGE_DIMENSION", "8000"))
            )
        except (ValueError, TypeError) as e:
            self.logger.error(f"Error creating media configuration: {e}")
            return None
    
    def get_config(self) -> AppConfig:
        """
        Get complete application configuration.
        
        Returns:
            AppConfig instance with all configuration settings
            
        Raises:
            ConfigurationError: If configuration is invalid
        """
        if self._config is None:
            facebook_config = self._get_facebook_config()
            api_config = self._get_api_config()
            logging_config = self._get_logging_config()
            media_config = self._get_media_config()
            
            if not all([facebook_config, api_config, media_config]):
                raise ConfigurationError("Failed to load required configuration sections")
            
            self._config = AppConfig(
                facebook=facebook_config,
                api=api_config,
                logging=logging_config,
                media=media_config
            )
            
            # Validate configuration
            issues = self.validate_configuration()
            if issues:
                raise ConfigurationError(f"Configuration validation failed: {'; '.join(issues)}")
        
        return self._config
    
    def get_facebook_config(self) -> FacebookConfig:
        """Get Facebook-specific configuration."""
        return self.get_config().facebook
    
    def get_api_config(self) -> APIConfig:
        """Get API-specific configuration."""
        return self.get_config().api
    
    def get_logging_config(self) -> LoggingConfig:
        """Get logging-specific configuration."""
        return self.get_config().logging
    
    def get_media_config(self) -> MediaConfig:
        """Get media-specific configuration."""
        return self.get_config().media
    
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.get_api_config().environment == "development"
    
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.get_api_config().environment == "production"
    
    def create_directories(self) -> None:
        """Create necessary directories if they don't exist."""
        config = self.get_config()
        
        # Create logs directory
        log_dir = Path(config.logging.file_path).parent
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # Create images directory
        images_dir = Path(config.media.images_dir)
        images_dir.mkdir(parents=True, exist_ok=True)
        
        self.logger.info("Created necessary directories")
    
    def get_config_summary(self) -> Dict[str, Any]:
        """
        Get configuration summary (safe for logging - no secrets).
        
        Returns:
            Dictionary with non-sensitive configuration information
        """
        try:
            config = self.get_config()
            
            return {
                "facebook": {
                    "app_id": config.facebook.app_id[:8] + "..." if config.facebook.app_id else "Not set",
                    "page_id": config.facebook.page_id[:8] + "..." if config.facebook.page_id else "Not set",
                    "api_version": config.facebook.api_version,
                    "rate_limit_calls": config.facebook.rate_limit_calls,
                    "has_access_token": bool(config.facebook.page_access_token),
                    "has_app_secret": bool(config.facebook.app_secret)
                },
                "api": {
                    "host": config.api.host,
                    "port": config.api.port,
                    "environment": config.api.environment,
                    "debug": config.api.debug,
                    "cors_origins_count": len(config.api.cors_origins),
                    "has_jwt_secret": bool(config.api.jwt_secret)
                },
                "logging": {
                    "level": config.logging.level,
                    "file_path": config.logging.file_path,
                    "enable_console": config.logging.enable_console
                },
                "media": {
                    "images_dir": config.media.images_dir,
                    "max_image_size_mb": config.media.max_image_size / (1024 * 1024),
                    "allowed_formats": config.media.allowed_formats,
                    "optimize_images": config.media.optimize_images
                }
            }
        except Exception as e:
            return {"error": f"Failed to get configuration summary: {str(e)}"}
    
    def save_config_to_file(self, file_path: str) -> None:
        """
        Save current configuration to JSON file (excluding secrets).
        
        Args:
            file_path: Path to save configuration file
        """
        config_summary = self.get_config_summary()
        
        try:
            with open(file_path, 'w') as f:
                json.dump(config_summary, f, indent=2)
            
            self.logger.info(f"Configuration saved to {file_path}")
            
        except Exception as e:
            self.logger.error(f"Failed to save configuration: {e}")
            raise ConfigurationError(f"Failed to save configuration: {e}")
    
    def check_facebook_connectivity(self) -> Dict[str, Any]:
        """
        Check if Facebook configuration allows connectivity.
        
        Returns:
            Dictionary with connectivity status
        """
        config = self.get_facebook_config()
        
        checks = {
            "has_app_id": bool(config.app_id),
            "has_app_secret": bool(config.app_secret),
            "has_page_token": bool(config.page_access_token),
            "has_page_id": bool(config.page_id),
            "token_length_ok": len(config.page_access_token) >= 50 if config.page_access_token else False
        }
        
        checks["all_configured"] = all(checks.values())
        
        return checks


def create_config_manager(env_file: Optional[str] = None) -> ConfigManager:
    """
    Factory function to create ConfigManager instance.
    
    Args:
        env_file: Optional path to .env file
        
    Returns:
        ConfigManager instance
    """
    return ConfigManager(env_file=env_file)


def setup_logging_from_config(config: LoggingConfig) -> None:
    """
    Set up logging based on configuration.
    
    Args:
        config: Logging configuration
    """
    import logging.handlers
    
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, config.level.upper(), logging.INFO))
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Create formatter
    formatter = logging.Formatter(config.format)
    
    # Console handler
    if config.enable_console:
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
    
    # File handler with rotation
    if config.file_path:
        # Ensure directory exists
        log_dir = Path(config.file_path).parent
        log_dir.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.handlers.RotatingFileHandler(
            config.file_path,
            maxBytes=config.max_file_size,
            backupCount=config.backup_count
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)


def validate_environment() -> Dict[str, Any]:
    """
    Validate environment and return status report.
    
    Returns:
        Dictionary with validation results
    """
    config_manager = create_config_manager()
    
    try:
        validation_issues = config_manager.validate_configuration()
        config_summary = config_manager.get_config_summary()
        connectivity = config_manager.check_facebook_connectivity()
        
        return {
            "valid": len(validation_issues) == 0,
            "issues": validation_issues,
            "facebook_connectivity": connectivity,
            "config_summary": config_summary
        }
        
    except Exception as e:
        return {
            "valid": False,
            "issues": [f"Configuration validation failed: {str(e)}"],
            "facebook_connectivity": {"all_configured": False},
            "config_summary": {"error": str(e)}
        }
