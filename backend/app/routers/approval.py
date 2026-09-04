from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.approval import Approval
from app.models.change_request import ChangeRequest
from app.models.organization import OrganizationMembership
from app.models.project import Project
from app.models.user import User
from app.schemas.approval import (
    ApprovalCreate,
    ApprovalResponse,
)


router = APIRouter()


@router.post(
    "",
    response_model=ApprovalResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_approval(
    payload: ApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    change_request = db.get(
        ChangeRequest,
        payload.change_request_id,
    )

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
                detail="You are not authorized to approve or reject change requests",
            )
    if change_request.status in {"APPROVED", "REJECTED"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Change request is already {change_request.status.lower()} "
                "and cannot receive another approval"
            ),
        )

    decision = payload.decision.upper()

    allowed_decisions = {
        "APPROVED",
        "REJECTED",
    }

    if decision not in allowed_decisions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid decision. Allowed values: {sorted(allowed_decisions)}",
        )

    approval = Approval(
        change_request_id=payload.change_request_id,
        approver_id=current_user.id,
        decision=decision,
        comments=payload.comments.strip() if payload.comments else None,
    )

    db.add(approval)
    change_request.status = decision
    db.commit()
    db.refresh(approval)

    return approval


@router.get(
    "/change-request/{change_request_id}",
    response_model=list[ApprovalResponse],
)
def list_approvals(
    change_request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    change_request = db.get(
        ChangeRequest,
        change_request_id,
    )

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
        select(Approval)
        .where(
            Approval.change_request_id == change_request_id
        )
        .order_by(Approval.created_at.desc())
    )

    return list(db.scalars(statement).all())