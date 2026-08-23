from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ConfigurationItem(Base):
    __tablename__ = "configuration_items"

    id: Mapped[int] = mapped_column(primary_key=True)

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    ci_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    version: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    owner_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="ACTIVE",
        nullable=False,
    )

    repository_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    project = relationship(
    "Project",
    back_populates="configuration_items",
    )

    owner = relationship(
        "User",
        foreign_keys=[owner_id],
    )

    outgoing_dependencies = relationship(
        "Dependency",
        foreign_keys="Dependency.source_ci_id",
        back_populates="source_ci",
        cascade="all, delete-orphan",
    )

    incoming_dependencies = relationship(
        "Dependency",
        foreign_keys="Dependency.target_ci_id",
        back_populates="target_ci",
        cascade="all, delete-orphan",
    )
    change_requests = relationship(
        "ChangeRequestCI",
        back_populates="configuration_item",
        cascade="all, delete-orphan",
    )