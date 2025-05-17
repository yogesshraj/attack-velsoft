import { useState, useEffect, createContext, useContext } from 'react';
import api from '../utils/axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await api.get('/auth/profile');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const loginWithGoogle = async () => {
    // Open Google OAuth popup
    const popup = window.open(
      `${process.env.REACT_APP_API_URL}/api/auth/google`,
      'Google Sign In',
      'width=500,height=600'
    );

    if (popup) {
      return new Promise<void>((resolve, reject) => {
        window.addEventListener('message', async (event) => {
          if (event.origin !== process.env.REACT_APP_API_URL) return;

          if (event.data.token) {
            localStorage.setItem('token', event.data.token);
            setUser(event.data.user);
            popup.close();
            resolve();
          } else {
            reject(new Error('Google login failed'));
          }
        });
      });
    } else {
      throw new Error('Could not open Google login popup');
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 