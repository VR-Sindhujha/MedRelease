from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChangeRequestCreate(BaseModel):
    project_id: int
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=3, max_length=5000)
    reason: str | None = Field(default=None, max_length=5000)
    priority: str = Field(default="MEDIUM", max_length=30)


class ChangeRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    requested_by_id: int
    title: str
    description: str
    reason: str | None
    priority: str
    status: str
    created_at: datetime