from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.organization import OrganizationMembership
from app.models.project import Project
from app.models.release import Release
from app.models.user import User
from app.schemas.release import (
    ReleaseCreate,
    ReleaseResponse,
)


router = APIRouter()


@router.post(
    "",
    response_model=ReleaseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_release(
    payload: ReleaseCreate,
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

    release = Release(
        project_id=payload.project_id,
        name=payload.name.strip(),
        version=payload.version.strip(),
        description=(
            payload.description.strip()
            if payload.description
            else None
        ),
        status="PLANNED",
        planned_date=payload.planned_date,
        created_by_id=current_user.id,
    )

    db.add(release)
    db.commit()
    db.refresh(release)

    return release


@router.get(
    "/project/{project_id}",
    response_model=list[ReleaseResponse],
)
def list_releases(
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
        select(Release)
        .where(Release.project_id == project_id)
        .order_by(Release.created_at.desc())
    )

    return list(db.scalars(statement).all())