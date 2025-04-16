export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface UserResponse {
    user_id: string;
    email: string;
    admin: boolean;
    token: string;
  }
  
  export interface LoginResponse {
    status: 'success' | 'error';
    response?: UserResponse;
    message?: string;
  }
  