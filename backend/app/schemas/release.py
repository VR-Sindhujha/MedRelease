from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReleaseCreate(BaseModel):
    project_id: int

    name: str = Field(
        min_length=1,
        max_length=255,
    )

    version: str = Field(
        min_length=1,
        max_length=50,
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )

    planned_date: datetime | None = None


class ReleaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    version: str
    description: str | None
    status: str
    planned_date: datetime | None
    created_by_id: int
    created_at: datetime