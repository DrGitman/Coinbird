from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from db.database import close_db_pool

from routers import auth, budget, categories, transactions, users

app = FastAPI(title="Coinbird Botanical Ledger API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(budget.router)
app.include_router(categories.router)
app.include_router(transactions.router)
app.include_router(users.router)

@app.on_event("shutdown")
async def shutdown_event():
    await close_db_pool()

@app.get("/health", tags=["system"])
async def health_check():
    import datetime
    return {
        "status": "🌿 Coinbird API is growing (Python/FastAPI)",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
