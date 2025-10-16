import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  // โหลด user จาก localStorage เมื่อ app เริ่มทำงาน
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('kokko_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem('kokko_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const userData = mockUsers[email];
    if (userData && userData.password === password) {
      const { password: _, ...userWithoutPassword } = userData;
      setUser(userWithoutPassword);
      // เก็บ user ใน localStorage
      localStorage.setItem('kokko_user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    // ลบ user จาก localStorage
    localStorage.removeItem('kokko_user');
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>
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