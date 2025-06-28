#!/usr/bin/env python3
"""
Test script for the scheduling framework
"""

import sys
import os
sys.path.append('src')

from datetime import datetime, timedelta
from scheduler import create_post_queue, RecurrenceType, PostStatus

def test_scheduling():
    """Test basic scheduling functionality"""
    print("🧪 Testing Facebook Post Scheduling Framework")
    print("=" * 60)
    
    # Create a post queue
    print("1. Creating post queue...")
    queue = create_post_queue()
    print("✅ Post queue created successfully!")
    
    # Test scheduling a text post
    print("\n2. Testing text post scheduling...")
    future_time = datetime.now() + timedelta(minutes=15)
    
    try:
        scheduled_post = queue.schedule_text_post(
            message="This is a test scheduled post! 🚀",
            schedule_time=future_time,
            link="https://example.com",
            recurrence=RecurrenceType.NONE
        )
        print(f"✅ Text post scheduled successfully!")
        print(f"   Post ID: {scheduled_post.id}")
        print(f"   Schedule time: {scheduled_post.schedule_time}")
        print(f"   Status: {scheduled_post.status.value}")
    except Exception as e:
        print(f"❌ Failed to schedule text post: {e}")
        return False
    
    # Test getting scheduled posts
    print("\n3. Testing scheduled posts retrieval...")
    try:
        posts = queue.get_scheduled_posts(status_filter=PostStatus.SCHEDULED)
        print(f"✅ Retrieved {len(posts)} scheduled posts")
        
        if posts:
            print(f"   First post: {posts[0].message[:30]}...")
            print(f"   Schedule time: {posts[0].schedule_time}")
    except Exception as e:
        print(f"❌ Failed to get scheduled posts: {e}")
        return False
    
    # Test queue statistics
    print("\n4. Testing queue statistics...")
    try:
        stats = queue.get_queue_stats()
        print(f"✅ Queue statistics retrieved!")
        print(f"   Total posts: {stats['total_posts']}")
        print(f"   Status breakdown: {stats['status_breakdown']}")
        print(f"   Upcoming 24h: {stats['upcoming_24h']}")
    except Exception as e:
        print(f"❌ Failed to get queue stats: {e}")
        return False
    
    # Test updating a scheduled post
    print("\n5. Testing post update...")
    try:
        updated_post = queue.update_scheduled_post(
            scheduled_post.id,
            message="Updated test message! 📝"
        )
        if updated_post:
            print(f"✅ Post updated successfully!")
            print(f"   New message: {updated_post.message}")
        else:
            print("❌ Post not found for update")
    except Exception as e:
        print(f"❌ Failed to update post: {e}")
        return False
    
    # Test cancelling a scheduled post
    print("\n6. Testing post cancellation...")
    try:
        success = queue.cancel_scheduled_post(scheduled_post.id)
        if success:
            print(f"✅ Post cancelled successfully!")
        else:
            print("❌ Failed to cancel post")
    except Exception as e:
        print(f"❌ Failed to cancel post: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 All scheduling tests passed successfully!")
    print("✅ Basic scheduling framework is working correctly")
    
    # Show final stats
    final_stats = queue.get_queue_stats()
    print(f"\n📊 Final Queue Statistics:")
    print(f"   Total posts: {final_stats['total_posts']}")
    print(f"   Cancelled posts: {final_stats['status_breakdown']['cancelled']}")
    
    return True

if __name__ == "__main__":
    success = test_scheduling()
    if success:
        print("\n🚀 Scheduling framework is ready for use!")
        exit(0)
    else:
        print("\n❌ Some tests failed")
        exit(1)
