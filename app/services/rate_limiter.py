import redis
from fastapi import Request, HTTPException, status
from app.core.config import settings

# Global Redis client
try:
    redis_url = settings.REDIS_URL or ""
    if "upstash.io" in redis_url and redis_url.startswith("redis://"):
        redis_url = redis_url.replace("redis://", "rediss://", 1)

    if redis_url.startswith("rediss://"):
        redis_client = redis.Redis.from_url(redis_url, decode_responses=True, ssl_cert_reqs=None)
    elif redis_url.startswith("redis://"):
        redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
    else:
        redis_client = None
except Exception as e:
    print(f"[WARN] Failed to initialize Redis client: {e}")
    redis_client = None

class RateLimiter:
    def __init__(self, client: redis.Redis):
        self.redis = client

    def check_limit(self, key: str, limit: int, window_seconds: int, error_message: str = "Rate limit exceeded."):
        """
        Fixed window rate limiter using Redis INCR and EXPIRE.
        """
        current = self.redis.get(key)
        
        if current and int(current) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=error_message
            )
        
        pipe = self.redis.pipeline()
        pipe.incr(key)
        # Set expiry only on the first increment (when key is created)
        if not current:
            pipe.expire(key, window_seconds)
        pipe.execute()

limiter = RateLimiter(redis_client)

def rate_limit_demo(request: Request):
    """
    IP-based rate limit for anonymous demo users.
    Max 3 requests per 24 hours.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    # Respect proxy headers if applicable
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    key = f"rate_limit:demo_upload:{client_ip}"
    
    # Limit: 3 requests per 24 hours (86400 seconds)
    limiter.check_limit(
        key, 
        limit=3, 
        window_seconds=86400,
        error_message="Demo limit reached! Please sign up to upload and organize unlimited screenshots."
    )


def rate_limit_user(user_id: str):
    """
    Account-based rate limit for authenticated users.
    Max 15 requests per 24 hours.
    """
    key = f"rate_limit:user_upload:{user_id}"
    
    # Limit: 15 requests per 24 hours (86400 seconds)
    limiter.check_limit(
        key, 
        limit=15, 
        window_seconds=86400,
        error_message="You have reached your daily upload limit of 15 screenshots."
    )
