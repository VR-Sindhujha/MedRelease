from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    organization_id: int
    name: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    status: str = Field(default="PLANNING", max_length=30)
    project_manager_id: int | None = None
    github_repository: str | None = Field(default=None, max_length=500)
    current_version: str | None = Field(default=None, max_length=50)


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    name: str
    description: str | None
    status: str
    project_manager_id: int | None
    github_repository: str | None
    current_version: str | None
    created_at: datetime