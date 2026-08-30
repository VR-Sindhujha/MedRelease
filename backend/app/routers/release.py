from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models.approval import Approval
from app.models.change_request import ChangeRequest
from app.models.organization import OrganizationMembership
from app.models.project import Project
from app.models.release import Release
from app.models.release_change_request import ReleaseChangeRequest
from app.models.user import User

from app.schemas.release import ReleaseCreate, ReleaseResponse


router = APIRouter()


# =========================================================
# Create Release
# =========================================================

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

    existing_release = db.scalar(
        select(Release).where(
            Release.project_id == payload.project_id,
            Release.version == payload.version.strip(),
        )
    )

    if existing_release:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A release with this version already exists for this project",
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


# =========================================================
# List Releases
# =========================================================

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


# =========================================================
# Update Release Status
# =========================================================

@router.patch(
    "/{release_id}/status",
    response_model=ReleaseResponse,
)
def update_release_status(
    release_id: int,
    new_status: str,
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

    new_status = new_status.upper()

    # -----------------------------------------------------
    # Valid statuses
    # -----------------------------------------------------

    allowed_statuses = {
        "PLANNED",
        "IN_PROGRESS",
        "RELEASED",
        "FAILED",
        "CANCELLED",
    }

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid status. Allowed values: "
                f"{sorted(allowed_statuses)}"
            ),
        )

    # -----------------------------------------------------
    # Valid state transitions
    # -----------------------------------------------------

    allowed_transitions = {
        "PLANNED": {
            "IN_PROGRESS",
            "CANCELLED",
        },
        "IN_PROGRESS": {
            "RELEASED",
            "FAILED",
        },
        "FAILED": {
            "IN_PROGRESS",
        },
        "RELEASED": set(),
        "CANCELLED": set(),
    }

    current_status = release.status.upper()

    if new_status not in allowed_transitions[current_status]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Invalid release status transition: "
                f"{current_status} -> {new_status}"
            ),
        )

    # -----------------------------------------------------
    # Release readiness validation
    # -----------------------------------------------------

    if new_status == "RELEASED":

        links = db.scalars(
            select(ReleaseChangeRequest).where(
                ReleaseChangeRequest.release_id == release_id
            )
        ).all()

        if not links:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Release cannot be released because "
                    "it has no change requests"
                ),
            )

        for link in links:

            change_request = db.get(
                ChangeRequest,
                link.change_request_id,
            )

            if not change_request:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Change request {link.change_request_id} "
                        "not found"
                    ),
                )

            # Change request must be approved
            if change_request.status.upper() != "APPROVED":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Release cannot be released because "
                        f"change request {change_request.id} "
                        "is not approved"
                    ),
                )

            # Get approvals
            approvals = db.scalars(
                select(Approval).where(
                    Approval.change_request_id == change_request.id
                )
            ).all()

            if not approvals:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Release cannot be released because "
                        f"change request {change_request.id} "
                        "has no approvals"
                    ),
                )

            # At least one approval must be approved
            has_approved = any(
                approval.decision.upper() == "APPROVED"
                for approval in approvals
            )

            if not has_approved:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Release cannot be released because "
                        f"change request {change_request.id} "
                        "has no approved approval"
                    ),
                )

    # -----------------------------------------------------
    # Update release
    # -----------------------------------------------------

    release.status = new_status

    db.commit()
    db.refresh(release)

    return release


# =========================================================
# Check Release Readiness
# =========================================================

@router.get(
    "/{release_id}/readiness",
)
def check_release_readiness(
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

    # -----------------------------------------------------
    # Get linked change requests
    # -----------------------------------------------------

    links = db.scalars(
        select(ReleaseChangeRequest).where(
            ReleaseChangeRequest.release_id == release_id
        )
    ).all()

    if not links:
        return {
            "release_id": release_id,
            "ready": False,
            "message": "Release has no change requests",
        }

    # -----------------------------------------------------
    # Check every change request
    # -----------------------------------------------------

    for link in links:

        change_request = db.get(
            ChangeRequest,
            link.change_request_id,
        )

        if not change_request:
            return {
                "release_id": release_id,
                "ready": False,
                "message": (
                    f"Change request {link.change_request_id} "
                    "not found"
                ),
            }

        # Change request must be approved
        if change_request.status.upper() != "APPROVED":
            return {
                "release_id": release_id,
                "ready": False,
                "message": (
                    f"Change request {change_request.id} "
                    "is not approved"
                ),
            }

        # Get approvals
        approvals = db.scalars(
            select(Approval).where(
                Approval.change_request_id == change_request.id
            )
        ).all()

        if not approvals:
            return {
                "release_id": release_id,
                "ready": False,
                "message": (
                    f"Change request {change_request.id} "
                    "has no approvals"
                ),
            }

        # At least one approval must be approved
        has_approved = any(
            approval.decision.upper() == "APPROVED"
            for approval in approvals
        )

        if not has_approved:
            return {
                "release_id": release_id,
                "ready": False,
                "message": (
                    f"Change request {change_request.id} "
                    "has no approved approval"
                ),
            }

    # -----------------------------------------------------
    # Release is ready
    # -----------------------------------------------------

    return {
        "release_id": release_id,
        "ready": True,
        "message": "Release is ready for deployment",
    }