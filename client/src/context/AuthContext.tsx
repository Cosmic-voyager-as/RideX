import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Role } from '../types';
import { RoleConfig, RoleConfigFactory } from '../config/RoleConfig';
import { authApi } from '../services/AuthApiService';
import { useOOP } from './OOPContext';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  roleConfig: RoleConfig | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  loginWithGoogle: (credential: string) => Promise<UserProfile>;
  register: (payload: any) => Promise<UserProfile>;
  logout: () => void;
  quickLogin: (role: Role, email?: string) => Promise<UserProfile>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ridex_token'));
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { logOOPEvent } = useOOP();

  const handleAuthSuccess = (userData: UserProfile, tokenStr: string) => {
    localStorage.setItem('ridex_token', tokenStr);
    setToken(tokenStr);
    setUser(userData);
    // POLYMORPHISM: Factory instantiates polymorphic RoleConfig subclass
    const config = RoleConfigFactory.getConfig(userData.role);
    setRoleConfig(config);

    logOOPEvent(
      'Polymorphism',
      `RoleConfig Dynamic Resolution (${userData.role})`,
      `User logged in as ${userData.role}. RoleConfigFactory dynamically resolved ${config.constructor.name} without UI type branching.`,
      `const config: RoleConfig = RoleConfigFactory.getConfig(user.role);\n// theme = ${config.getThemeColor()}, menu items = ${config.getMenuItems().length}`
    );
  };

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      handleAuthSuccess(res.user, res.token);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await authApi.loginWithGoogle(credential);
      handleAuthSuccess(res.user, res.token);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await authApi.register(payload);
      handleAuthSuccess(res.user, res.token);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ridex_token');
    setToken(null);
    setUser(null);
    setRoleConfig(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const refreshed = await authApi.getMe();
      setUser(refreshed);
      setRoleConfig(RoleConfigFactory.getConfig(refreshed.role));
    } catch (e) {
      console.warn('Failed to refresh user profile:', e);
    }
  };

  const quickLogin = async (role: Role, customEmail?: string): Promise<UserProfile> => {
    let email = customEmail;
    let password = 'Password@123';

    if (!email) {
      if (role === 'CUSTOMER') {
        email = 'ananya@ridex.com';
        password = 'cust123';
      } else if (role === 'DRIVER') {
        email = 'manoj.sedan@ridex.com';
        password = 'driver123';
      } else if (role === 'ADMIN') {
        email = 'admin@ridex.com';
        password = 'admin123';
      } else {
        email = 'ananya@ridex.com';
        password = 'cust123';
      }
    } else {
      // Resolve matching seed password by account type
      if (email.includes('admin')) {
        password = 'admin123';
      } else if (
        role === 'DRIVER' ||
        email.includes('driver') ||
        email.includes('.bike') ||
        email.includes('.auto') ||
        email.includes('.mini') ||
        email.includes('.sedan') ||
        email.includes('.suv') ||
        email.includes('manoj') ||
        email.includes('rajesh') ||
        email.includes('suresh') ||
        email.includes('vikram') ||
        email.includes('karan')
      ) {
        password = 'driver123';
      } else {
        password = 'cust123';
      }
    }

    return await login(email, password);
  };

  // Re-hydrate user profile on page reload
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('ridex_token');
      if (storedToken) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
          setRoleConfig(RoleConfigFactory.getConfig(profile.role));
        } catch (err) {
          console.error('Session expired or invalid token:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        roleConfig,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        quickLogin,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

