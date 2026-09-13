from fastapi import APIRouter, Depends, HTTPException, status

from app import store
from app.schemas import ProfilePatch, User
from app.security import get_current_user

router = APIRouter(tags=["profile"])


@router.get("/me", response_model=User)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=User)
def update_me(body: ProfilePatch, current_user: User = Depends(get_current_user)) -> User:
    if not body.name.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Display name can't be empty.")
    record = store.update_user(current_user.id, body)
    return record.to_schema()


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(current_user: User = Depends(get_current_user)) -> None:
    store.delete_user(current_user.id)
