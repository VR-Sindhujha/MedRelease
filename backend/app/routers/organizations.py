from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.organization import Organization, OrganizationMembership
from app.models.user import User
from app.schemas.organization import OrganizationCreate, OrganizationResponse

router = APIRouter()

@router.get("", response_model=list[OrganizationResponse])
def list_my_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Organization)
        .join(OrganizationMembership)
        .where(OrganizationMembership.user_id == current_user.id)
        .order_by(Organization.name)
    )
    return list(db.scalars(stmt).all())

@router.post("", response_model=OrganizationResponse, status_code=201)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exists = db.scalar(select(Organization).where(Organization.name == payload.name.strip()))
    if exists:
        raise HTTPException(status_code=409, detail="Organization already exists")

    org = Organization(
        name=payload.name.strip(),
        description=payload.description,
    )
    db.add(org)
    db.flush()

    membership = OrganizationMembership(
        user_id=current_user.id,
        organization_id=org.id,
        role="ADMIN",
    )
    db.add(membership)
    db.commit()
    db.refresh(org)
    return org
