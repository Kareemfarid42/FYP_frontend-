// src/lib/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ==================== TYPES ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirm_password: string;  // Match backend snake_case
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface AutomataListItem {
  id: number;
  encoded_id: string;
  name: string;
  type: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  states_count: number;
  transitions_count: number;
}

export interface State {
  state_id: string;
  label: string;
  position_x: number;
  position_y: number;
  is_initial: boolean;
  is_final: boolean;
}

export interface Transition {
  from_state_id: string;
  to_state_id: string;
  symbol: string;
}

export interface Automata {
  id: number;
  encoded_id: string;
  name: string;
  type: string;
  description: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  states: State[];
  transitions: Transition[];
}

export interface AutomataCreate {
  name: string;
  type: string;
  description?: string;
  states: State[];
  transitions: Transition[];
}

// ==================== AUTH FUNCTIONS ====================

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
}

// NEW: Registration function
export async function register(credentials: RegisterCredentials): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return response.json();
}

export async function logout(): Promise<void> {
  const token = getToken();
  
  if (token) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  // Always remove token from localStorage
  removeToken();
}

// ==================== USER FUNCTIONS ====================

export async function getCurrentUser(): Promise<User> {
  const token = getToken();
  
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/users/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch user');
  }

  return response.json();
}

// ==================== AUTOMATA FUNCTIONS ====================

export async function getAutomataList(): Promise<AutomataListItem[]> {
  const token = getToken();
  
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/automata/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch automata list');
  }

  return response.json();
}

export async function getAutomata(encodedId: string): Promise<Automata> {
  const token = getToken();
  
  if (!token) {
    throw new Error('No token found');
  }

  // Use encoded_id directly in URL
  const response = await fetch(`${API_URL}/automata/${encodedId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch automata');
  }

  return response.json();
}

export async function createAutomata(data: AutomataCreate): Promise<Automata> {
  const token = getToken();
  
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/automata/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create automata');
  }

  return response.json();
}

export async function updateAutomata(encodedId: string, data: Partial<AutomataCreate>): Promise<Automata> {
  const token = getToken();
  
  if (!token) {
    throw new Error('No token found');
  }

  // Use encoded_id directly in URL
  const response = await fetch(`${API_URL}/automata/${encodedId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update automata');
  }

  return response.json();
}

export async function deleteAutomata(encodedId: string): Promise<void> {
  const token = getToken();
  
  if (!token) {
    throw new Error('No token found');
  }

  // Use encoded_id directly in URL
  const response = await fetch(`${API_URL}/automata/${encodedId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete automata');
  }
}

export async function generateAutomata(prompt: string, type: string = 'DFA'): Promise<any> {
  const token = getToken();
  
  // DEBUG: Log what we're about to send
  console.log("🔧 API Function - Prompt received:", prompt)
  console.log("🔧 API Function - Type received:", type)
  
  const requestBody = { prompt, type }
  console.log("🔧 API Function - Request body:", requestBody)
  console.log("🔧 API Function - Stringified:", JSON.stringify(requestBody))
  
  // Build headers - token is OPTIONAL for generate endpoint
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Include token if available (for rate limiting, analytics)
  // But DON'T require it - preview works for everyone
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/automata/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate automata');
  }

  const result = await response.json();
  console.log("🔧 API Function - Response received:", result)
  
  return result;
}

// ==================== TOKEN MANAGEMENT ====================

export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}