from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ChangeRequestCI(Base):
    __tablename__ = "change_request_cis"

    id: Mapped[int] = mapped_column(primary_key=True)

    change_request_id: Mapped[int] = mapped_column(
        ForeignKey("change_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    configuration_item_id: Mapped[int] = mapped_column(
        ForeignKey("configuration_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    impact_type: Mapped[str] = mapped_column(
        String(50),
        default="DIRECT",
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    change_request = relationship(
        "ChangeRequest",
        back_populates="affected_items",
    )

    configuration_item = relationship(
        "ConfigurationItem",
        back_populates="change_requests",
    )