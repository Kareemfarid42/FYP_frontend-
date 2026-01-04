# CRITICAL: Import patches BEFORE anything else
import patch_imports  # This must be first!

import sys
from pathlib import Path
from contextlib import asynccontextmanager
import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add backend directory to Python path
sys.path.append(str(Path(__file__).parent))
from config import settings
from database import init_db
from routers import auth_router, automata_router, users_router
from utils.ai_integration import load_local_model

# ==================== Lifespan Handler ====================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown events."""
    print("🚀 Starting Automata Visualizer API...")
    
    init_db()
    print("✅ Database initialized")

    try:
        print("🤖 Loading local fine-tuned Gemma 2 model...")
        model, tokenizer = load_local_model()
        app.state.model = model
        app.state.tokenizer = tokenizer
        print("✅ AI Model loaded and ready on GPU")
    except Exception as e:
        print(f"❌ Error loading AI model: {e}")
        import traceback
        traceback.print_exc()
        print("⚠️ Server will continue without local model")
        app.state.model = None
        app.state.tokenizer = None

    yield

    print("🛑 Shutting down server...")
    if hasattr(app.state, 'model') and app.state.model is not None:
        del app.state.model
        del app.state.tokenizer
        torch.cuda.empty_cache()
    print("👋 Shutdown complete")

# ==================== App Configuration ====================
app = FastAPI(
    title="Automata Visualizer API",
    description="Backend API with Local Gemma 2 Integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Automata Visualizer API",
        "status": "running",
        "ai_status": "Gemma-2-2B-Local-Active"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

app.include_router(auth_router)
app.include_router(automata_router)
app.include_router(users_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=False
    )