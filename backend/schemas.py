# backend/schemas.py

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
import re
from pydantic import computed_field
from utils.encoding import encode_id


# ==================== AUTH SCHEMAS ====================

class UserLogin(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=100)
    
    @field_validator('password')
    @classmethod
    def sanitize_password(cls, v: str) -> str:
        """Remove any potential HTML/script tags from password"""
        return re.sub(r'<[^>]*>', '', v).strip()


class UserRegister(BaseModel):
    """Registration request schema"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password strength"""
        # Remove HTML tags
        v = re.sub(r'<[^>]*>', '', v).strip()
        
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        # Check for at least one uppercase letter
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        
        # Check for at least one lowercase letter
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        
        # Check for at least one digit
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        
        # Check for at least one special character
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character (!@#$%^&*...)')
        
        return v
    
    @field_validator('confirm_password')
    @classmethod
    def sanitize_confirm_password(cls, v: str) -> str:
        """Remove HTML tags from confirm password"""
        return re.sub(r'<[^>]*>', '', v).strip()
    
    def model_post_init(self, __context):
        """Validate that passwords match"""
        if self.password != self.confirm_password:
            raise ValueError('Passwords do not match')


class Token(BaseModel):
    """JWT token response schema"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data"""
    email: Optional[str] = None


class UserResponse(BaseModel):
    """User information response"""
    id: int
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== AUTOMATA SCHEMAS ====================

class StateBase(BaseModel):
    """Base state schema"""
    state_id: str = Field(..., max_length=100)
    label: str = Field(..., max_length=50)
    position_x: float
    position_y: float
    is_initial: bool = False
    is_final: bool = False
    
    @field_validator('state_id', 'label')
    @classmethod
    def sanitize_strings(cls, v: str) -> str:
        """Remove HTML tags and limit length"""
        v = re.sub(r'<[^>]*>', '', v)
        v = re.sub(r'[^\w\s\-]', '', v)  # Only alphanumeric, spaces, hyphens
        return v.strip()[:100]


class StateCreate(StateBase):
    """Schema for creating a state"""
    pass


class StateResponse(StateBase):
    """Schema for state response"""
    id: int
    automata_id: int
    
    class Config:
        from_attributes = True


class TransitionBase(BaseModel):
    """Base transition schema"""
    from_state_id: str = Field(..., max_length=100)
    to_state_id: str = Field(..., max_length=100)
    symbol: str = Field(..., max_length=10)
    
    @field_validator('from_state_id', 'to_state_id', 'symbol')
    @classmethod
    def sanitize_strings(cls, v: str) -> str:
        """Remove HTML tags and limit characters"""
        v = re.sub(r'<[^>]*>', '', v)
        v = re.sub(r'[^\w\s\-εε]', '', v)  # Allow alphanumeric, epsilon symbols
        return v.strip()[:100]


class TransitionCreate(TransitionBase):
    """Schema for creating a transition"""
    pass


class TransitionResponse(TransitionBase):
    """Schema for transition response"""
    id: int
    automata_id: int
    
    class Config:
        from_attributes = True


class AutomataBase(BaseModel):
    """Base automata schema"""
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., pattern="^(DFA|NFA)$")
    description: Optional[str] = Field(None, max_length=500)
    
    @field_validator('name', 'description')
    @classmethod
    def sanitize_strings(cls, v: Optional[str]) -> Optional[str]:
        """Remove HTML tags"""
        if v is None:
            return v
        v = re.sub(r'<[^>]*>', '', v)
        return v.strip()


class AutomataCreate(AutomataBase):
    """Schema for creating automata"""
    states: List[StateCreate]
    transitions: List[TransitionCreate]


class AutomataUpdate(BaseModel):
    """Schema for updating automata"""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    states: Optional[List[StateCreate]] = None
    transitions: Optional[List[TransitionCreate]] = None


class AutomataListItem(BaseModel):
    """Schema for automata list item (summary)"""
    id: int
    name: str
    type: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    states_count: int
    transitions_count: int
    
    # ADD THIS: Computed field for encoded ID
    @computed_field
    @property
    def encoded_id(self) -> str:
        """Return URL-safe encoded version of ID"""
        return encode_id(self.id)
    
    class Config:
        from_attributes = True


class AutomataResponse(AutomataBase):
    """Schema for full automata response"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    states: List[StateResponse]
    transitions: List[TransitionResponse]
    
    # ADD THIS: Computed field for encoded ID
    @computed_field
    @property
    def encoded_id(self) -> str:
        """Return URL-safe encoded version of ID"""
        return encode_id(self.id)
    
    class Config:
        from_attributes = True


# ==================== AI GENERATION SCHEMAS ====================

class AIGenerateRequest(BaseModel):
    """Schema for AI automata generation request"""
    prompt: str = Field(..., min_length=1, max_length=1000)
    type: str = Field(default="DFA", pattern="^(DFA|NFA)$")
    
    @field_validator('prompt')
    @classmethod
    def sanitize_prompt(cls, v: str) -> str:
        """Sanitize AI prompt"""
        v = re.sub(r'<[^>]*>', '', v)
        return v.strip()[:1000]