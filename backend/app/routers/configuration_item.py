from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.organization import OrganizationMembership
from app.models.project import Project
from app.models.configuration_item import ConfigurationItem
from app.models.user import User
from app.schemas.configuration_item import (
    ConfigurationItemCreate,
    ConfigurationItemResponse,
)


router = APIRouter()


@router.post(
    "",
    response_model=ConfigurationItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_configuration_item(
    payload: ConfigurationItemCreate,
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

    configuration_item = ConfigurationItem(
        project_id=payload.project_id,
        name=payload.name.strip(),
        ci_type=payload.ci_type.strip(),
        version=payload.version,
        owner_id=payload.owner_id,
        status=payload.status,
        repository_path=payload.repository_path,
        description=payload.description,
    )

    db.add(configuration_item)
    db.commit()
    db.refresh(configuration_item)

    return configuration_item


@router.get(
    "/project/{project_id}",
    response_model=list[ConfigurationItemResponse],
)
def list_configuration_items(
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
        select(ConfigurationItem)
        .where(ConfigurationItem.project_id == project_id)
        .order_by(ConfigurationItem.created_at.desc())
    )

    return list(db.scalars(statement).all())


@router.delete(
    "/{configuration_item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_configuration_item(
    configuration_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    configuration_item = db.get(
        ConfigurationItem,
        configuration_item_id,
    )

    if not configuration_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration item not found",
        )

    project = db.get(Project, configuration_item.project_id)

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

    db.delete(configuration_item)
    db.commit()