from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReleaseChangeRequestCreate(BaseModel):
    release_id: int
    change_request_id: int


class ReleaseChangeRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    release_id: int
    change_request_id: int
    created_at: datetime