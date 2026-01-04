# backend/routers/__init__.py

"""
API route modules for the automata visualizer backend
"""

from .auth import router as auth_router
from .automata import router as automata_router
from .users import router as users_router

__all__ = [
    "auth_router",
    "automata_router",
    "users_router",
]