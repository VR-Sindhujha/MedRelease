from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DependencyCreate(BaseModel):
    source_ci_id: int
    target_ci_id: int
    dependency_type: str = Field(
        default="DEPENDS_ON",
        min_length=2,
        max_length=50,
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
    )


class DependencyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_ci_id: int
    target_ci_id: int
    dependency_type: str
    description: str | None
    created_at: datetime