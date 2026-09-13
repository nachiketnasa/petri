from fastapi import APIRouter, Depends, HTTPException, status

from app import store
from app.errors import ConflictError, NotFoundError
from app.schemas import (
    CheckinRequest,
    Experiment,
    ExperimentEditRequest,
    MoveRequest,
    NewExperimentRequest,
    RetroRequest,
    User,
)
from app.security import get_current_user

router = APIRouter(tags=["experiments"])


def _not_found(err: NotFoundError) -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, str(err))


def _conflict(err: ConflictError) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, str(err))


@router.get("/experiments", response_model=list[Experiment])
def list_experiments(current_user: User = Depends(get_current_user)) -> list[Experiment]:
    return [e.to_schema() for e in store.list_experiments(current_user.id)]


@router.post("/experiments", response_model=Experiment, status_code=status.HTTP_201_CREATED)
def create_experiment(body: NewExperimentRequest, current_user: User = Depends(get_current_user)) -> Experiment:
    record = store.create_experiment(current_user.id, body)
    return record.to_schema()


@router.patch("/experiments/{experiment_id}", response_model=Experiment)
def edit_experiment(
    experiment_id: str, body: ExperimentEditRequest, current_user: User = Depends(get_current_user)
) -> Experiment:
    if body.title is None and body.hypothesis is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Provide a title or a hypothesis to update.")
    try:
        record = store.edit_experiment(current_user.id, experiment_id, body.title, body.hypothesis)
    except NotFoundError as err:
        raise _not_found(err) from err
    except ConflictError as err:
        raise _conflict(err) from err
    return record.to_schema()


@router.delete("/experiments/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experiment(experiment_id: str, current_user: User = Depends(get_current_user)) -> None:
    try:
        store.delete_experiment(current_user.id, experiment_id)
    except NotFoundError as err:
        raise _not_found(err) from err
    except ConflictError as err:
        raise _conflict(err) from err


@router.post("/experiments/{experiment_id}/move", response_model=Experiment)
def move_experiment(
    experiment_id: str, body: MoveRequest, current_user: User = Depends(get_current_user)
) -> Experiment:
    try:
        record = store.move_experiment(current_user.id, experiment_id, body.column)
    except NotFoundError as err:
        raise _not_found(err) from err
    except ConflictError as err:
        raise _conflict(err) from err
    return record.to_schema()


@router.post("/experiments/{experiment_id}/checkins", response_model=Experiment)
def log_checkin(
    experiment_id: str, body: CheckinRequest, current_user: User = Depends(get_current_user)
) -> Experiment:
    try:
        record = store.add_checkin(current_user.id, experiment_id, body.value, body.note)
    except NotFoundError as err:
        raise _not_found(err) from err
    except ConflictError as err:
        raise _conflict(err) from err
    return record.to_schema()


@router.post("/experiments/{experiment_id}/retro", response_model=Experiment)
def submit_retro(
    experiment_id: str, body: RetroRequest, current_user: User = Depends(get_current_user)
) -> Experiment:
    try:
        record = store.submit_retro(current_user.id, experiment_id, body.worked, body.notWorked, body.decision)
    except NotFoundError as err:
        raise _not_found(err) from err
    return record.to_schema()


@router.post("/experiments/{experiment_id}/share", response_model=Experiment)
def toggle_share(experiment_id: str, current_user: User = Depends(get_current_user)) -> Experiment:
    try:
        record = store.toggle_share(current_user.id, experiment_id)
    except NotFoundError as err:
        raise _not_found(err) from err
    return record.to_schema()
