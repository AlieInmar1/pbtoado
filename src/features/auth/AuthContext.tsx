import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface Workspace {
  id: string;
  name: string;
  isDefault: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setCurrentWorkspace: (workspace: Workspace) => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sample mock data
const MOCK_USER: User = {
  id: 'user-1',
  name: 'Demo User',
  email: 'demo@example.com',
  role: 'admin',
};

const MOCK_WORKSPACES: Workspace[] = [
  { id: 'ws-1', name: 'Main Workspace', isDefault: true },
  { id: 'ws-2', name: 'Development Team', isDefault: false },
  { id: 'ws-3', name: 'Product Design', isDefault: false },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Set to true for demo
  const [user, setUser] = useState<User | null>(MOCK_USER); // Set mock user
  const [workspaces, setWorkspaces] = useState<Workspace[]>(MOCK_WORKSPACES);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(MOCK_WORKSPACES[0]);

  // Mock login function
  const login = async (email: string, password: string) => {
    // In a real app, this would call an API
    setUser(MOCK_USER);
    setIsAuthenticated(true);
  };

  // Mock logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const authContextValue: AuthContextType = {
    isAuthenticated,
    user,
    workspaces,
    currentWorkspace,
    login,
    logout,
    setCurrentWorkspace,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
