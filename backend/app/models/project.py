from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="PLANNING",
        nullable=False,
    )

    project_manager_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    github_repository: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    current_version: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    organization = relationship(
        "Organization",
        back_populates="projects",
    )
    configuration_items = relationship(
        "ConfigurationItem",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    change_requests = relationship(
        "ChangeRequest",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    releases = relationship(
        "Release",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    project_manager = relationship(
        "User",
        foreign_keys=[project_manager_id],
    )