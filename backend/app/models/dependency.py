from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Dependency(Base):
    __tablename__ = "dependencies"

    id: Mapped[int] = mapped_column(primary_key=True)

    source_ci_id: Mapped[int] = mapped_column(
        ForeignKey("configuration_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    target_ci_id: Mapped[int] = mapped_column(
        ForeignKey("configuration_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    dependency_type: Mapped[str] = mapped_column(
        String(50),
        default="DEPENDS_ON",
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    source_ci = relationship(
        "ConfigurationItem",
        foreign_keys=[source_ci_id],
        back_populates="outgoing_dependencies",
    )

    target_ci = relationship(
        "ConfigurationItem",
        foreign_keys=[target_ci_id],
        back_populates="incoming_dependencies",
    )