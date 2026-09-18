from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routes import router

app = FastAPI(
    title="GeoCopilot GIS Engine",
    description="Deterministic Python GIS engine and dataset profiling service for GeoCopilot.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Explicit local CORS origins (strictly avoiding wildcard *)
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Include core routes
app.include_router(router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
