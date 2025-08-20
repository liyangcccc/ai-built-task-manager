// Simple auth utility for demo purposes
export const auth = {
  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Set token
  setToken: (token: string): void => {
    localStorage.setItem('token', token);
  },

  // Remove token
  removeToken: (): void => {
    localStorage.removeItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = auth.getToken();
    return !!token;
  },

  // Auto-login with demo user for development
  autoLoginDemo: async (): Promise<boolean> => {
    try {
      const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';
      console.log('Attempting auto-login to:', `${API_BASE_URL}/auth/login`);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'demo@example.com',
          password: 'demo123'
        }),
      });

      console.log('Auto-login response status:', response.status);
      const data = await response.json();
      console.log('Auto-login response data:', data);
      
      if (data.success) {
        auth.setToken(data.data.token);
        console.log('Token stored successfully');
        return true;
      }
      console.log('Auto-login response was not successful');
      return false;
    } catch (error) {
      console.error('Auto-login failed:', error);
      return false;
    }
  }
};