from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta

from app.api.deps import get_db, get_current_user
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, Token
from app.models.screenshot import Screenshot
from app.models.category import Category

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=Token)
def signup(request: Request, user_create: UserCreate, db: Session = Depends(get_db)):
    """Create a new user and return a token."""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_create.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create new user
    new_user = User(
        email=user_create.email,
        password_hash=hash_password(user_create.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Convert any demo data uploaded during this session
    session_id = request.headers.get("X-Session-ID")
    if session_id:
        db.query(Screenshot).filter(
            Screenshot.session_id == session_id,
            Screenshot.user_id == None
        ).update({"user_id": new_user.id}, synchronize_session=False)
        
        db.query(Category).filter(
            Category.session_id == session_id,
            Category.user_id == None
        ).update({"user_id": new_user.id}, synchronize_session=False)
        
        db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": new_user.email, "user_id": new_user.id}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
def login(request: Request, user_create: UserCreate, db: Session = Depends(get_db)):
    """Authenticate user and return a token."""
    
    # Find user by email
    user = db.query(User).filter(User.email == user_create.email).first()
    
    if not user or not verify_password(user_create.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Convert any demo data uploaded during this session
    session_id = request.headers.get("X-Session-ID")
    if session_id:
        db.query(Screenshot).filter(
            Screenshot.session_id == session_id,
            Screenshot.user_id == None
        ).update({"user_id": user.id}, synchronize_session=False)
        
        db.query(Category).filter(
            Category.session_id == session_id,
            Category.user_id == None
        ).update({"user_id": user.id}, synchronize_session=False)
        
        db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Logout user (stateless JWT — just return 200)."""
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserRead)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    return current_user
