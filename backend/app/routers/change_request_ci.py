from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.change_request import ChangeRequest
from app.models.change_request_ci import ChangeRequestCI
from app.models.configuration_item import ConfigurationItem
from app.models.organization import OrganizationMembership
from app.models.project import Project
from app.models.user import User
from app.schemas.change_request_ci import (
    ChangeRequestCICreate,
    ChangeRequestCIResponse,
)


router = APIRouter()


@router.post(
    "",
    response_model=ChangeRequestCIResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_affected_configuration_item(
    payload: ChangeRequestCICreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    change_request = db.get(ChangeRequest, payload.change_request_id)

    if not change_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Change request not found",
        )

    configuration_item = db.get(
        ConfigurationItem,
        payload.configuration_item_id,
    )

    if not configuration_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration item not found",
        )

    project = db.get(Project, change_request.project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if configuration_item.project_id != project.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuration item must belong to the same project",
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
        select(ChangeRequestCI).where(
            ChangeRequestCI.change_request_id
            == payload.change_request_id,
            ChangeRequestCI.configuration_item_id
            == payload.configuration_item_id,
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Configuration item is already linked to this change request",
        )

    affected_item = ChangeRequestCI(
        change_request_id=payload.change_request_id,
        configuration_item_id=payload.configuration_item_id,
        impact_type=payload.impact_type.upper(),
        notes=payload.notes,
    )

    db.add(affected_item)
    db.commit()
    db.refresh(affected_item)

    return affected_item


@router.get(
    "/change-request/{change_request_id}",
    response_model=list[ChangeRequestCIResponse],
)
def list_affected_configuration_items(
    change_request_id: int,
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

    statement = (
        select(ChangeRequestCI)
        .where(
            ChangeRequestCI.change_request_id == change_request_id
        )
        .order_by(ChangeRequestCI.created_at.desc())
    )

    return list(db.scalars(statement).all())