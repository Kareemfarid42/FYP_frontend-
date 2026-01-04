// src/lib/validation.ts

/**
 * Frontend input validation and sanitization
 * Matches backend validation rules
 */

export function sanitizeEmail(email: string): string {
  // Remove HTML tags
  let sanitized = email.replace(/<[^>]*>/g, '');
  
  // Lowercase and trim
  sanitized = sanitized.toLowerCase().trim();
  
  return sanitized;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function sanitizeString(text: string, maxLength: number = 1000): string {
  if (!text) return '';
  
  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  
  // Trim and limit length
  return sanitized.trim().slice(0, maxLength);
}

export function sanitizeAutomataName(name: string): string {
  if (!name) return '';
  
  // Remove HTML tags
  let sanitized = name.replace(/<[^>]*>/g, '');
  
  // Only allow alphanumeric, spaces, hyphens, underscores
  sanitized = sanitized.replace(/[^\w\s\-]/g, '');
  
  // Trim and limit to 100 characters
  return sanitized.trim().slice(0, 100);
}

export function sanitizeDescription(description: string): string {
  if (!description) return '';
  
  // Remove HTML tags
  let sanitized = description.replace(/<[^>]*>/g, '');
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  
  // Trim and limit to 500 characters
  return sanitized.trim().slice(0, 500);
}

export function sanitizeStateLabel(label: string): string {
  if (!label) return '';
  
  // Remove HTML tags
  let sanitized = label.replace(/<[^>]*>/g, '');
  
  // Only alphanumeric, hyphens, underscores
  sanitized = sanitized.replace(/[^\w\-]/g, '');
  
  // Trim and limit to 50 characters
  return sanitized.trim().slice(0, 50);
}

export function sanitizeTransitionSymbol(symbol: string): string {
  if (!symbol) return '';
  
  // Remove HTML tags
  let sanitized = symbol.replace(/<[^>]*>/g, '');
  
  // Allow alphanumeric, epsilon symbols, spaces, hyphens
  sanitized = sanitized.replace(/[^\w\s\-εε]/g, '');
  
  // Trim and limit to 10 characters
  return sanitized.trim().slice(0, 10);
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 4) {
    return { valid: false, error: 'Password must be at least 4 characters' };
  }
  
  if (password.length > 100) {
    return { valid: false, error: 'Password is too long' };
  }
  
  return { valid: true };
}

export function validateAutomataName(name: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeAutomataName(name);
  
  if (!sanitized) {
    return { valid: false, error: 'Automata name is required' };
  }
  
  if (sanitized.length < 1) {
    return { valid: false, error: 'Automata name cannot be empty' };
  }
  
  return { valid: true };
}

export function validateCoordinates(x: number, y: number): { valid: boolean; error?: string } {
  if (isNaN(x) || isNaN(y)) {
    return { valid: false, error: 'Invalid coordinates' };
  }
  
  if (x < 0 || x > 10000 || y < 0 || y > 10000) {
    return { valid: false, error: 'Coordinates out of range (0-10000)' };
  }
  
  return { valid: true };
}

export function sanitizeAIPrompt(prompt: string): string {
  if (!prompt) return '';
  
  // Remove HTML tags
  let sanitized = prompt.replace(/<[^>]*>/g, '');
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  
  // Trim and limit to 1000 characters
  return sanitized.trim().slice(0, 1000);
}

export function validateAIPrompt(prompt: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeAIPrompt(prompt);
  
  if (!sanitized) {
    return { valid: false, error: 'Prompt is required' };
  }
  
  if (sanitized.length < 5) {
    return { valid: false, error: 'Prompt is too short (minimum 5 characters)' };
  }
  
  return { valid: true };
}

/**
 * Sanitize all fields in login form
 */
export function sanitizeLoginForm(email: string, password: string): {
  email: string;
  password: string;
} {
  return {
    email: sanitizeEmail(email),
    password: password.replace(/<[^>]*>/g, '').trim(),
  };
}

/**
 * Validate login form
 */
export function validateLoginForm(email: string, password: string): {
  valid: boolean;
  errors: { email?: string; password?: string };
} {
  const errors: { email?: string; password?: string } = {};
  
  if (!email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Invalid email format';
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error;
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}