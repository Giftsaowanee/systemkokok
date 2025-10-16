import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'president' | 'staff';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: Record<string, User & { password: string }> = {
  'admin@kokko.com': {
    id: '1',
    name: 'ผู้ดูแลระบบ',
    email: 'admin@kokko.com',
    role: 'admin',
    password: 'admin123'
  },
  'president@kokko.com': {
    id: '2', 
    name: 'ประธานกลุ่มวิสาหกิจ',
    email: 'president@kokko.com',
    role: 'president',
    password: 'president123'
  },
  'staff@kokko.com': {
    id: '3',
    name: 'เจ้าหน้าที่วิสาหกิจ', 
    email: 'staff@kokko.com',
    role: 'staff',
    password: 'staff123'
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    const userData = mockUsers[email];
    if (userData && userData.password === password) {
      const { password: _, ...userWithoutPassword } = userData;
      setUser(userWithoutPassword);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}