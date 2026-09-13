from fastapi import APIRouter, HTTPException, status

from app import store
from app.schemas import PublicExperiment

router = APIRouter(tags=["shared"])


@router.get("/shared/{token}", response_model=PublicExperiment)
def get_shared_experiment(token: str) -> PublicExperiment:
    record = store.get_shared_experiment(token)
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No experiment is shared under this token.")
    return record.to_public_schema()
