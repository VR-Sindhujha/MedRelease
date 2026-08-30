from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ReleaseChangeRequest(Base):
    __tablename__ = "release_change_requests"

    id: Mapped[int] = mapped_column(primary_key=True)

    release_id: Mapped[int] = mapped_column(
        ForeignKey("releases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    change_request_id: Mapped[int] = mapped_column(
        ForeignKey("change_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    release = relationship(
        "Release",
        back_populates="release_change_requests",
    )

    change_request = relationship(
        "ChangeRequest",
        back_populates="release_change_requests",
    )