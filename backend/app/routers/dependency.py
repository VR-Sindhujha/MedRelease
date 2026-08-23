from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.configuration_item import ConfigurationItem
from app.models.dependency import Dependency
from app.models.organization import OrganizationMembership
from app.models.project import Project
from app.models.user import User
from app.schemas.dependency import (
    DependencyCreate,
    DependencyResponse,
)


router = APIRouter()


@router.post(
    "",
    response_model=DependencyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_dependency(
    payload: DependencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    source_ci = db.get(ConfigurationItem, payload.source_ci_id)
    target_ci = db.get(ConfigurationItem, payload.target_ci_id)

    if not source_ci:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source configuration item not found",
        )

    if not target_ci:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target configuration item not found",
        )

    if source_ci.id == target_ci.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A configuration item cannot depend on itself",
        )

    source_project = db.get(Project, source_ci.project_id)
    target_project = db.get(Project, target_ci.project_id)

    if not source_project or not target_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if source_project.organization_id != target_project.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuration items must belong to the same organization",
        )

    membership = db.scalar(
        select(OrganizationMembership).where(
            OrganizationMembership.user_id == current_user.id,
            OrganizationMembership.organization_id == source_project.organization_id,
        )
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this organization",
        )

    existing = db.scalar(
        select(Dependency).where(
            Dependency.source_ci_id == payload.source_ci_id,
            Dependency.target_ci_id == payload.target_ci_id,
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This dependency already exists",
        )

    dependency = Dependency(
        source_ci_id=payload.source_ci_id,
        target_ci_id=payload.target_ci_id,
        dependency_type=payload.dependency_type,
        description=payload.description,
    )

    db.add(dependency)
    db.commit()
    db.refresh(dependency)

    return dependency


@router.get(
    "/project/{project_id}",
    response_model=list[DependencyResponse],
)
def list_project_dependencies(
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

    project_ci_ids = select(ConfigurationItem.id).where(
        ConfigurationItem.project_id == project_id
    )

    statement = (
        select(Dependency)
        .where(
            Dependency.source_ci_id.in_(project_ci_ids)
            | Dependency.target_ci_id.in_(project_ci_ids)
        )
        .order_by(Dependency.created_at.desc())
    )

    return list(db.scalars(statement).all())