from fastapi import APIRouter, Depends, HTTPException, status

from app import store
from app.captcha import verify_captcha
from app.disposable_email import is_disposable_email
from app.errors import ConflictError
from app.schemas import AuthResponse, LoginRequest, SignupRequest, User
from app.security import get_bearer_token, get_current_user

router = APIRouter(tags=["auth"])


@router.post("/auth/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest) -> AuthResponse:
    if not verify_captcha(body.captchaToken):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Captcha verification failed.")
    if is_disposable_email(body.email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please use a permanent email address.")
    try:
        user = store.create_user(name=body.name.strip(), email=body.email.lower(), password=body.password)
    except ConflictError as err:
        raise HTTPException(status.HTTP_409_CONFLICT, str(err)) from err
    token = store.issue_token(user.id)
    return AuthResponse(user=user.to_schema(), token=token)


@router.post("/auth/login", response_model=AuthResponse)
def login(body: LoginRequest) -> AuthResponse:
    user = store.authenticate(email=body.email.lower(), password=body.password)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")
    token = store.issue_token(user.id)
    return AuthResponse(user=user.to_schema(), token=token)


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    token: str = Depends(get_bearer_token),
    _current_user: User = Depends(get_current_user),
) -> None:
    store.revoke_token(token)
