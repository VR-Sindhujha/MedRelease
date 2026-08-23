from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChangeRequestCICreate(BaseModel):
    change_request_id: int
    configuration_item_id: int
    impact_type: str = Field(
        default="DIRECT",
        min_length=2,
        max_length=50,
    )
    notes: str | None = Field(
        default=None,
        max_length=2000,
    )


class ChangeRequestCIResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    change_request_id: int
    configuration_item_id: int
    impact_type: str
    notes: str | None
    created_at: datetime