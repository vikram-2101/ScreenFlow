from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.session import SessionLocal
from app.core.security import decode_access_token
from app.models.user import User
from sqlalchemy.orm import Session

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Extract user from JWT token in Authorization header.
    Raises 401 if token is invalid or user not found.
    """
    token = credentials.credentials
    token_data = decode_access_token(token)

    if token_data is None or token_data.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == token_data.user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security_optional),
    db: Session = Depends(get_db),
) -> User | None:
    """
    Extract user from JWT token if present.
    Returns None if no token or invalid token is provided.
    """
    if not credentials:
        return None
        
    token = credentials.credentials
    try:
        token_data = decode_access_token(token)
        if token_data and token_data.user_id:
            return db.query(User).filter(User.id == token_data.user_id).first()
    except Exception:
        pass
    
    return None