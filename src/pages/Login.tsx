import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Leaf } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [directors, setDirectors] = useState<{ email: string; role: string }[]>([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // ดึงข้อมูลกรรมการจาก backend
    fetch('http://localhost:3001/directors')
      .then(res => res.json())
      .then(data => setDirectors(data.map((d: any) => ({ email: d.email, role: d.role }))));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      if (user) {
        // ตรวจสอบบทบาทสำหรับหน้าประธาน
        if (window.location.pathname === '/president') {
          // ตรวจสอบจาก directors ว่า email นี้เป็นประธานจริง
          const isPresident = directors.some(d => d.email === email && d.role === 'president');
          if (isPresident) {
            navigate('/president-dashboard');
          } else {
            setError('เฉพาะประธานเท่านั้นที่เข้าสู่ระบบนี้ได้');
          }
        }
        // ตัวอย่าง: ถ้าอยู่หน้า /admin
        else if (window.location.pathname === '/admin') {
          if (user.role === 'president' || user.role === 'staff') {
            navigate('/dashboard');
          } else {
            setError('เฉพาะประธานหรือเจ้าหน้าที่เท่านั้นที่เข้าสู่ระบบผู้ดูแลได้');
          }
        }
        // หน้าอื่นๆ
        else {
          navigate('/dashboard');
        }
      } else {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@kokko.com', password: 'admin123', role: 'ผู้ดูแลระบบ' },
    { email: 'president@kokko.com', password: 'president123', role: 'ประธานกลุ่มวิสาหกิจ' },
    { email: 'staff@kokko.com', password: 'staff123', role: 'เจ้าหน้าที่วิสาหกิจ' }
  ];

  const fillDemoAccount = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center text-white space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="h-8 w-8 text-accent" />
            <MapPin className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-3xl font-bold">ระบบบริหารจัดการผลิตภัณฑ์</h1>
          <p className="text-lg opacity-90">ตำบลโคกก่อ อำเภอเมือง จังหวัดมหาสารคาม</p>
        </div>

        {/* Login Form */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">เข้าสู่ระบบ</CardTitle>
            <CardDescription>
              กรุณาใส่อีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert className="border-destructive">
                  <AlertDescription className="text-destructive">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="กรุณาใส่อีเมล"
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรุณาใส่รหัสผ่าน"
                  required
                  className="h-12"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                {demoAccounts.map((account, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="font-medium">{account.role}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fillDemoAccount(account.email, account.password)}
                      className="h-8 px-3 text-xs"
                    >
                      ใช้บัญชีนี้
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;