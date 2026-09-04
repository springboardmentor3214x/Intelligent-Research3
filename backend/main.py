from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from database import engine, Base
from routers import auth, research_papers
from schemas import APIResponse

# Initialize Database Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Research Funding & Innovation Intelligence Platform API",
    description="Backend Authentication & User Management Service (Member 1)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for local development (React Vite frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production origin URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Auth Router
app.include_router(auth.router)
app.include_router(research_papers.router)

# Custom Exception Handler for HTTP Exceptions (400, 401, 404, 409, etc.)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=APIResponse(
            success=False,
            message=str(exc.detail),
            data=None,
            errors={"status_code": exc.status_code, "detail": exc.detail}
        ).model_dump()
    )

# Custom Exception Handler for Pydantic Input Validation Errors (422)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    formatted_errors = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err["loc"] if loc != "body")
        formatted_errors.append({"field": field, "message": err["msg"]})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=APIResponse(
            success=False,
            message="Input validation failed.",
            data=None,
            errors=formatted_errors
        ).model_dump()
    )

# Global Catch-all Exception Handler (500 Internal Server Error)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=APIResponse(
            success=False,
            message="An unexpected server error occurred.",
            data=None,
            errors={"detail": str(exc)}
        ).model_dump()
    )

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "service": "AI Research Funding & Innovation Intelligence Platform API",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
