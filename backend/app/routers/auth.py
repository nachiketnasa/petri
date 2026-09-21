from fastapi import APIRouter, Depends, HTTPException, status

from app import store
from app.captcha import verify_captcha
from app.disposable_email import is_disposable_email
from app.email import send_verification_email
from app.errors import ConflictError
from app.schemas import (
    AuthResponse,
    LoginRequest,
    ResendVerificationRequest,
    SignupRequest,
    SignupResponse,
    User,
    VerifyEmailRequest,
)
from app.security import get_bearer_token, get_current_user

router = APIRouter(tags=["auth"])


@router.post("/auth/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest) -> SignupResponse:
    if not verify_captcha(body.captchaToken):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Captcha verification failed.")
    if is_disposable_email(body.email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please use a permanent email address.")
    try:
        user = store.create_user(name=body.name.strip(), email=body.email.lower(), password=body.password)
    except ConflictError as err:
        raise HTTPException(status.HTTP_409_CONFLICT, str(err)) from err
    if user.verification_token:
        send_verification_email(user.email, user.verification_token)
    return SignupResponse(email=user.email)


@router.post("/auth/verify", response_model=AuthResponse)
def verify_email(body: VerifyEmailRequest) -> AuthResponse:
    user = store.verify_email_token(body.token)
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired verification link.")
    token = store.issue_token(user.id)
    return AuthResponse(user=user.to_schema(), token=token)


@router.post("/auth/resend-verification", status_code=status.HTTP_204_NO_CONTENT)
def resend_verification(body: ResendVerificationRequest) -> None:
    user = store.get_user_by_email(body.email.lower())
    if user is not None:
        token = store.regenerate_verification_token(user.id)
        if token:
            send_verification_email(user.email, token)
    # Always 204, whether or not the account exists — don't leak signups.


@router.post("/auth/login", response_model=AuthResponse)
def login(body: LoginRequest) -> AuthResponse:
    if not verify_captcha(body.captchaToken):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Captcha verification failed.")
    user = store.authenticate(email=body.email.lower(), password=body.password)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")
    if not user.email_verified:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Please verify your email before logging in.")
    token = store.issue_token(user.id)
    return AuthResponse(user=user.to_schema(), token=token)


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    token: str = Depends(get_bearer_token),
    _current_user: User = Depends(get_current_user),
) -> None:
    store.revoke_token(token)
