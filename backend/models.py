# backend/models.py

from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base


class AutomataType(enum.Enum):
    """Enum for automata types"""
    DFA = "DFA"
    NFA = "NFA"


class User(Base):
    """User model for authentication"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Nullable for OAuth users
    google_id = Column(String, unique=True, nullable=True, index=True)  # For Google OAuth
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    automatas = relationship("Automata", back_populates="user", cascade="all, delete-orphan")


class Automata(Base):
    """Automata model - stores DFA/NFA information"""
    __tablename__ = "automatas"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False, default="DFA")  # "DFA" or "NFA"
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="automatas")
    states = relationship("State", back_populates="automata", cascade="all, delete-orphan")
    transitions = relationship("Transition", back_populates="automata", cascade="all, delete-orphan")


class State(Base):
    """State model - represents a state in the automaton"""
    __tablename__ = "states"
    
    id = Column(Integer, primary_key=True, index=True)
    automata_id = Column(Integer, ForeignKey("automatas.id", ondelete="CASCADE"), nullable=False)
    state_id = Column(String, nullable=False)  # e.g., "state-123456789"
    label = Column(String, nullable=False)  # e.g., "q0", "q1"
    position_x = Column(Float, nullable=False)
    position_y = Column(Float, nullable=False)
    is_initial = Column(Boolean, default=False)
    is_final = Column(Boolean, default=False)
    
    # Relationships
    automata = relationship("Automata", back_populates="states")


class Transition(Base):
    """Transition model - represents a transition between states"""
    __tablename__ = "transitions"
    
    id = Column(Integer, primary_key=True, index=True)
    automata_id = Column(Integer, ForeignKey("automatas.id", ondelete="CASCADE"), nullable=False)
    from_state_id = Column(String, nullable=False)  # References State.state_id
    to_state_id = Column(String, nullable=False)    # References State.state_id
    symbol = Column(String, nullable=False)
    
    # Relationships
    automata = relationship("Automata", back_populates="transitions")