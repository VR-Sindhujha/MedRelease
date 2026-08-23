from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ApprovalCreate(BaseModel):
    change_request_id: int
    decision: str = Field(
        min_length=2,
        max_length=30,
    )
    comments: str | None = Field(
        default=None,
        max_length=5000,
    )


class ApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    change_request_id: int
    approver_id: int
    decision: str
    comments: str | None
    created_at: datetime