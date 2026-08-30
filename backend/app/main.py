from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import Base, engine

from app.routers.auth import router as auth_router
from app.routers.organizations import router as organizations_router
from app.routers.project import router as project_router
from app.routers.configuration_item import router as configuration_item_router
from app.routers.dependency import router as dependency_router
from app.routers.change_request import router as change_request_router
from app.routers.change_request_ci import router as change_request_ci_router
from app.routers.approval import router as approval_router
from app.routers.release import router as release_router
from app.routers.release_change_request import (
    router as release_change_request_router,
)


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Healthcare Software Configuration & Release Management",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"],
)

app.include_router(
    organizations_router,
    prefix="/api/organizations",
    tags=["Organizations"],
)

app.include_router(
    project_router,
    prefix="/api/projects",
    tags=["Projects"],
)

app.include_router(
    configuration_item_router,
    prefix="/api/configuration-items",
    tags=["Configuration Items"],
)

app.include_router(
    dependency_router,
    prefix="/api/dependencies",
    tags=["Dependencies"],
)

app.include_router(
    change_request_router,
    prefix="/api/change-requests",
    tags=["Change Requests"],
)

app.include_router(
    change_request_ci_router,
    prefix="/api/change-request-cis",
    tags=["Change Request CIs"],
)

app.include_router(
    approval_router,
    prefix="/api/approvals",
    tags=["Approvals"],
)

app.include_router(
    release_router,
    prefix="/api/releases",
    tags=["Releases"],
)

app.include_router(
    release_change_request_router,
    prefix="/api/release-change-requests",
    tags=["Release Change Requests"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "medrelease-api",
    }