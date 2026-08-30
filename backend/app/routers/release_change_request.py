from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.change_request import ChangeRequest
from app.models.organization import OrganizationMembership
from app.models.project import Project
from app.models.release import Release
from app.models.release_change_request import ReleaseChangeRequest
from app.models.user import User
from app.schemas.release_change_request import (
    ReleaseChangeRequestCreate,
    ReleaseChangeRequestResponse,
)


router = APIRouter()


@router.post(
    "",
    response_model=ReleaseChangeRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_change_request_to_release(
    payload: ReleaseChangeRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    release = db.get(Release, payload.release_id)

    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not found",
        )

    change_request = db.get(ChangeRequest, payload.change_request_id)

    if not change_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Change request not found",
        )

    if release.project_id != change_request.project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Release and change request must belong to the same project",
        )

    project = db.get(Project, release.project_id)

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

    existing = db.scalar(
        select(ReleaseChangeRequest).where(
            ReleaseChangeRequest.release_id == payload.release_id,
            ReleaseChangeRequest.change_request_id
            == payload.change_request_id,
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Change request is already linked to this release",
        )

    release_change_request = ReleaseChangeRequest(
        release_id=payload.release_id,
        change_request_id=payload.change_request_id,
    )

    db.add(release_change_request)
    db.commit()
    db.refresh(release_change_request)

    return release_change_request


@router.get(
    "/release/{release_id}",
    response_model=list[ReleaseChangeRequestResponse],
)
def list_release_change_requests(
    release_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    release = db.get(Release, release_id)

    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not found",
        )

    project = db.get(Project, release.project_id)

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
        select(ReleaseChangeRequest)
        .where(
            ReleaseChangeRequest.release_id == release_id
        )
        .order_by(ReleaseChangeRequest.created_at.desc())
    )

    return list(db.scalars(statement).all())