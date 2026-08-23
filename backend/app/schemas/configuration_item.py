from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ConfigurationItemCreate(BaseModel):
    project_id: int
    name: str = Field(min_length=2, max_length=200)
    ci_type: str = Field(min_length=2, max_length=50)
    version: str | None = Field(default=None, max_length=50)
    owner_id: int | None = None
    status: str = Field(default="ACTIVE", max_length=30)
    repository_path: str | None = Field(default=None, max_length=500)
    description: str | None = Field(default=None, max_length=2000)


class ConfigurationItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    ci_type: str
    version: str | None
    owner_id: int | None
    status: str
    repository_path: str | None
    description: str | None
    created_at: datetime