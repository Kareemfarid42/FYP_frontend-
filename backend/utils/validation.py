# backend/utils/validation.py

import re
from typing import Optional


def sanitize_html(text: str) -> str:
    """
    Remove all HTML tags and potentially dangerous content
    Uses regex instead of bleach for Python 3.13 compatibility
    
    Args:
        text: Input string that may contain HTML
    
    Returns:
        Sanitized string with HTML removed
    """
    if not text:
        return ""
    
    # Remove script and style tags with content
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove all HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove HTML entities
    text = re.sub(r'&[a-zA-Z]+;', '', text)
    
    return text.strip()


def sanitize_email(email: str) -> str:
    """
    Sanitize email address
    
    Args:
        email: Email address string
    
    Returns:
        Sanitized email (lowercase, trimmed)
    """
    if not email:
        return ""
    
    # Remove HTML
    email = sanitize_html(email)
    
    # Convert to lowercase and trim
    email = email.lower().strip()
    
    # Basic email pattern validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise ValueError("Invalid email format")
    
    return email


def sanitize_string(text: str, max_length: int = 1000, allow_special: bool = False) -> str:
    """
    Sanitize general string input
    
    Args:
        text: Input string
        max_length: Maximum allowed length
        allow_special: If False, only alphanumeric + spaces allowed
    
    Returns:
        Sanitized string
    """
    if not text:
        return ""
    
    # Remove HTML
    text = sanitize_html(text)
    
    # Remove control characters
    text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
    
    if not allow_special:
        # Only allow alphanumeric, spaces, hyphens, underscores
        text = re.sub(r'[^\w\s\-]', '', text)
    
    # Trim and limit length
    text = text.strip()[:max_length]
    
    return text


def sanitize_automata_symbol(symbol: str) -> str:
    """
    Sanitize transition symbol for automata
    Allows: alphanumeric, epsilon (ε), spaces, hyphens
    
    Args:
        symbol: Transition symbol
    
    Returns:
        Sanitized symbol
    """
    if not symbol:
        return ""
    
    # Remove HTML
    symbol = sanitize_html(symbol)
    
    # Allow alphanumeric, epsilon symbols, spaces, hyphens
    symbol = re.sub(r'[^\w\s\-εε]', '', symbol)
    
    # Trim and limit to 10 characters
    symbol = symbol.strip()[:10]
    
    if not symbol:
        raise ValueError("Symbol cannot be empty after sanitization")
    
    return symbol


def sanitize_state_label(label: str) -> str:
    """
    Sanitize state label for automata
    Allows: alphanumeric, hyphens, underscores
    
    Args:
        label: State label (e.g., "q0", "q1")
    
    Returns:
        Sanitized label
    """
    if not label:
        raise ValueError("State label cannot be empty")
    
    # Remove HTML
    label = sanitize_html(label)
    
    # Only alphanumeric, hyphens, underscores
    label = re.sub(r'[^\w\-]', '', label)
    
    # Trim and limit to 50 characters
    label = label.strip()[:50]
    
    if not label:
        raise ValueError("State label cannot be empty after sanitization")
    
    return label


def validate_position(x: float, y: float) -> tuple[float, float]:
    """
    Validate and sanitize position coordinates
    
    Args:
        x: X coordinate
        y: Y coordinate
    
    Returns:
        Tuple of validated (x, y) coordinates
    """
    # Ensure they're floats
    try:
        x = float(x)
        y = float(y)
    except (ValueError, TypeError):
        raise ValueError("Invalid coordinate values")
    
    # Limit to reasonable canvas size (0 to 10000)
    x = max(0, min(x, 10000))
    y = max(0, min(y, 10000))
    
    return x, y


def sanitize_automata_name(name: str) -> str:
    """
    Sanitize automata name
    
    Args:
        name: Automata name
    
    Returns:
        Sanitized name
    """
    if not name:
        raise ValueError("Automata name cannot be empty")
    
    # Remove HTML and limit length
    name = sanitize_string(name, max_length=100, allow_special=False)
    
    if not name:
        raise ValueError("Automata name cannot be empty after sanitization")
    
    return name


def sanitize_description(description: Optional[str]) -> Optional[str]:
    """
    Sanitize automata description
    
    Args:
        description: Optional description text
    
    Returns:
        Sanitized description or None
    """
    if not description:
        return None
    
    # Remove HTML and limit length
    description = sanitize_string(description, max_length=500, allow_special=True)
    
    return description if description else None