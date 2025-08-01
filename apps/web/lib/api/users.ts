const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

// Types
export interface UserCreateRequest {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
  bio?: string;
  isActive: boolean;
  siteName?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  avatar: string | null;
  bio: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteResponse {
  id: string;
  name: string;
  domain: string | null;
  apiKey: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateUserResponse {
  success: boolean;
  user: UserResponse;
  site?: SiteResponse | null;
  message: string;
}

export interface ApiError {
  error: string;
  code: string;
}

// API Functions
export const userApi = {
  // Create new user
  createUser: async (userData: UserCreateRequest): Promise<CreateUserResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'User creation failed');
    }

    return response.json();
  },

  // Get all users
  getUsers: async (): Promise<{ users: UserResponse[] }> => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'Failed to fetch users');
    }

    return response.json();
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<{ user: UserResponse; sites: SiteResponse[] }> => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user');
    }

    return response.json();
  },

  // Update user
  updateUser: async (userId: string, userData: Partial<UserResponse>): Promise<{ success: boolean; user: UserResponse; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'Failed to update user');
    }

    return response.json();
  },

  // Delete user
  deleteUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }

    return response.json();
  }
};

export default userApi;
