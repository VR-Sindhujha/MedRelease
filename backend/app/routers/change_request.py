from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.change_request import ChangeRequest
from app.models.organization import OrganizationMembership
from app.models.project import Project
from app.models.user import User
from app.schemas.change_request import (
    ChangeRequestCreate,
    ChangeRequestResponse,
)


router = APIRouter()


@router.post(
    "",
    response_model=ChangeRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_change_request(
    payload: ChangeRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.get(Project, payload.project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    membership = db.scalar(
        select(OrganizationMembership).where(
            OrganizationMembership.user_id == current_user.id,
            OrganizationMembership.organization_id == project.organization_id,
        )
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this organization",
        )

    change_request = ChangeRequest(
        project_id=payload.project_id,
        requested_by_id=current_user.id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        reason=payload.reason.strip() if payload.reason else None,
        priority=payload.priority.upper(),
        status="PENDING",
    )

    db.add(change_request)
    db.commit()
    db.refresh(change_request)

    return change_request


@router.get(
    "/project/{project_id}",
    response_model=list[ChangeRequestResponse],
)
def list_change_requests(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.get(Project, project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    membership = db.scalar(
        select(OrganizationMembership).where(
            OrganizationMembership.user_id == current_user.id,
            OrganizationMembership.organization_id == project.organization_id,
        )
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this organization",
        )

    statement = (
        select(ChangeRequest)
        .where(ChangeRequest.project_id == project_id)
        .order_by(ChangeRequest.created_at.desc())
    )

    return list(db.scalars(statement).all())


@router.patch(
    "/{change_request_id}/status",
    response_model=ChangeRequestResponse,
)
def update_change_request_status(
    change_request_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    change_request = db.get(ChangeRequest, change_request_id)

    if not change_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Change request not found",
        )

    project = db.get(Project, change_request.project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    membership = db.scalar(
        select(OrganizationMembership).where(
            OrganizationMembership.user_id == current_user.id,
            OrganizationMembership.organization_id == project.organization_id,
        )
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this organization",
        )
    if membership.role.upper() not in {"ADMIN", "MANAGER"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to change change request status",
        )

    allowed_statuses = {
        "PENDING",
        "APPROVED",
        "REJECTED",
        "IMPLEMENTING",
        "COMPLETED",
    }
    allowed_transitions = {
        "PENDING": {"APPROVED", "REJECTED"},
        "APPROVED": {"IMPLEMENTING"},
        "REJECTED": {"PENDING"},
        "IMPLEMENTING": {"COMPLETED"},
        "COMPLETED": set(),
    }
    new_status = new_status.upper()

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed values: {sorted(allowed_statuses)}",
        )

    current_status = change_request.status.upper()

    if new_status not in allowed_transitions.get(current_status, set()):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Invalid status transition: "
                f"{current_status} → {new_status}"
            ),
        )

    change_request.status = new_status

    db.commit()
    db.refresh(change_request)

    return change_request