import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Search, Edit, Trash2, UserCheck, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Director {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  role: 'admin' | 'president' | 'staff';
  isActive: boolean;
  joinDate: string;
  address: string;
  households: number;
  income: number;
}

const Directors = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [directors, setDirectors] = useState<Director[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDirector, setEditingDirector] = useState<Director | null>(null);
  const [form, setForm] = useState<Director>({
    id: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    role: 'staff',
    isActive: true,
    joinDate: '',
    address: '',
    households: 0,
    income: 0
  });
  const [multiForm, setMultiForm] = useState<Director[]>([
    {
      id: '',
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      role: 'staff',
      isActive: true,
      joinDate: '',
      address: '',
      households: 0,
      income: 0
    }
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:3001/directors')
      .then(res => res.json())
      .then(data => setDirectors(data));
  }, []);

  // Only admins can access this page
  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-muted-foreground">คุณไม่มีสิทธิ์ในการเข้าถึงระบบจัดการกรรมการ</p>
      </div>
    );
  }

  const filteredDirectors = directors.filter(director =>
    director.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    director.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    director.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = () => {
    const printDate = new Date().toLocaleString('th-TH');
    const activeDirectors = directors.filter(d => d.isActive).length;
    const adminDirectors = directors.filter(d => d.role === 'admin').length;
    
    let tableRows = '';
    filteredDirectors.forEach((director, index) => {
      const roleText = director.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                      director.role === 'president' ? 'ประธาน' : 'เจ้าหน้าที่';
      const statusText = director.isActive ? 'ใช้งาน' : 'ระงับ';
      const statusClass = director.isActive ? 'active' : 'inactive';
      
      tableRows += `
        <tr>
          <td>${index + 1}</td>
          <td>${director.name}</td>
          <td>${director.email}</td>
          <td>${director.phone}</td>
          <td>${director.position}</td>
          <td>${director.address}</td>
          <td>${director.households}</td>
          <td>฿${director.income.toLocaleString()}</td>
          <td>${roleText}</td>
          <td class="${statusClass}">${statusText}</td>
        </tr>
      `;
    });

    const printContent = `
      <html>
        <head>
          <title>รายงานข้อมูลกรรมการ</title>
          <style>
            body { font-family: 'Sarabun', sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin-bottom: 5px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; padding: 15px; background: #f8f9fa; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #2563eb; color: white; }
            .active { color: #22c55e; font-weight: bold; }
            .inactive { color: #ef4444; font-weight: bold; }
            .print-date { text-align: right; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>รายงานข้อมูลกรรมการ</h1>
            <p>กลุ่มวิสาหกิจชุมชน ตำบลโคกก่อ</p>
          </div>
          
          <div class="stats">
            <div><strong>กรรมการทั้งหมด:</strong> ${directors.length} คน</div>
            <div><strong>กรรมการที่ใช้งาน:</strong> ${activeDirectors} คน</div>
            <div><strong>ผู้ดูแลระบบ:</strong> ${adminDirectors} คน</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>ชื่อ-นามสกุล</th>
                <th>อีเมล</th>
                <th>โทรศัพท์</th>
                <th>ตำแหน่ง</th>
                <th>ที่อยู่</th>
                <th>ครัวเรือน</th>
                <th>รายได้</th>
                <th>บทบาท</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div class="print-date">
            พิมพ์เมื่อ: ${printDate}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleAddDirector = () => {
    setEditingDirector(null);
    setForm({
      id: '',
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      role: 'staff',
      isActive: true,
      joinDate: '',
      address: '',
      households: 0,
      income: 0
    });
    setIsDialogOpen(true);
  };

  // แก้ไขกรรมการ
  const handleEditDirector = (director: Director) => {
    setEditingDirector(director);
    setForm({ ...director });
    setIsDialogOpen(true);
  };

  // ลบกรรมการ
  const handleDeleteDirector = async (director: Director) => {
    if (director.role === 'admin') {
      toast({
        title: "ไม่สามารถลบผู้ดูแลระบบได้",
        description: "ผู้ดูแลระบบไม่สามารถลบออกจากระบบได้",
        variant: "destructive"
      });
      return;
    }
    const res = await fetch(`http://localhost:3001/directors/${director.id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      setDirectors(prev => prev.filter(d => d.id !== director.id));
      toast({
        title: "ลบข้อมูลสำเร็จ",
        description: "กรรมการถูกลบออกจากระบบแล้ว"
      });
    }
  };

  const handleToggleStatus = (id: string) => {
    setDirectors(prev => prev.map(d => 
      d.id === id ? { ...d, isActive: !d.isActive } : d
    ));
    toast({
      title: "อัพเดทสถานะสำเร็จ",
      description: "สถานะกรรมการถูกอัพเดทแล้ว"
    });
  };

  // เพิ่มกรรมการ
  const handleSaveDirector = async () => {
    if (!form.name || !form.email || !form.phone || !form.position) {
      toast({
        title: "กรอกข้อมูลไม่ครบ",
        description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
        variant: "destructive"
      });
      return;
    }
    if (form.phone.length !== 10) {
      toast({
        title: "เบอร์โทรศัพท์ไม่ถูกต้อง",
        description: "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก",
        variant: "destructive"
      });
      return;
    }
    if (editingDirector) {
      // แก้ไขกรรมการเดิม
      await fetch(`http://localhost:3001/directors/${editingDirector.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      toast({
        title: "บันทึกสำเร็จ",
        description: "แก้ไขข้อมูลกรรมการแล้ว"
      });
    } else {
      // เพิ่มกรรมการใหม่
      await fetch('http://localhost:3001/directors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          position: form.position,
          department: form.department,
          role: form.role,
          isActive: form.isActive,
          joinDate: form.joinDate,
          address: form.address,
          households: form.households,
          income: form.income
        })
      });
      toast({
        title: "บันทึกสำเร็จ",
        description: "เพิ่มกรรมการใหม่แล้ว"
      });
    }
    setIsDialogOpen(false);
    setEditingDirector(null);
    // โหลดข้อมูลใหม่มาแสดง
    fetch('http://localhost:3001/directors')
      .then(res => res.json())
      .then(data => setDirectors(data));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ...login logic...
    if (loginSuccess) {
      // เปลี่ยน path เป็นหน้าจัดการกรรมการ
      navigate('/directors');
    }
    // ...existing code...
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการกรรมการ</h1>
          <p className="text-muted-foreground">จัดการข้อมูลกรรมการและคณะผู้บริหาร</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handlePrint}
          >
            <Printer className="mr-2 h-4 w-4" />
            พิมพ์รายงาน
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddDirector} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มกรรมการ
              </Button>
            </DialogTrigger>
            <DialogContent>
  <DialogHeader>
    <DialogTitle>
      {editingDirector ? 'แก้ไขข้อมูลกรรมการ' : 'เพิ่มกรรมการใหม่'}
    </DialogTitle>
  </DialogHeader>
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="name" className="text-right">ชื่อ-นามสกุล</Label>
      <Input
        id="name"
        placeholder="ชื่อ-นามสกุล"
        className="col-span-3"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="email" className="text-right">อีเมล</Label>
      <Input
        id="email"
        type="email"
        placeholder="อีเมล"
        className="col-span-3"
        value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="phone" className="text-right">โทรศัพท์</Label>
      <Input
        id="phone"
        placeholder="เบอร์โทรศัพท์"
        className="col-span-3"
        value={form.phone}
        maxLength={10}
        onChange={e => {
          // รับเฉพาะตัวเลขและจำกัด 10 หลัก
          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
          setForm(f => ({ ...f, phone: value }));
        }}
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="position" className="text-right">ตำแหน่ง</Label>
      <Input
        id="position"
        placeholder="ตำแหน่ง"
        className="col-span-3"
        value={form.position}
        onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="address" className="text-right">ที่อยู่</Label>
      <Input
        id="address"
        placeholder="ที่อยู่"
        className="col-span-3"
        value={form.address}
        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="households" className="text-right">สมาชิกครัวเรือน</Label>
      <Input
        id="households"
        type="number"
        placeholder="จำนวนสมาชิกครัวเรือน"
        className="col-span-3"
        value={form.households}
        onChange={e => setForm(f => ({ ...f, households: Number(e.target.value) }))}
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="income" className="text-right">รายได้</Label>
      <Input
        id="income"
        type="number"
        placeholder="รายได้ต่อปี"
        className="col-span-3"
        value={form.income}
        onChange={e => setForm(f => ({ ...f, income: Number(e.target.value) }))}
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="role" className="text-right">บทบาท</Label>
      <Select
        value={form.role}
        onValueChange={val => setForm(f => ({ ...f, role: val as Director['role'] }))}
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="เลือกบทบาท" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
          <SelectItem value="president">ประธาน</SelectItem>
          <SelectItem value="staff">เจ้าหน้าที่</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="isActive" className="text-right">สถานะ</Label>
      <Select
        value={form.isActive ? 'active' : 'inactive'}
        onValueChange={val => setForm(f => ({ ...f, isActive: val === 'active' }))}
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="เลือกสถานะ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">ใช้งาน</SelectItem>
          <SelectItem value="inactive">ระงับการใช้งาน</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
  <div className="flex justify-end space-x-2">
    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
    <Button
      onClick={handleSaveDirector}
    >
      บันทึก
    </Button>
  </div>
</DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กรรมการทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{directors.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กรรมการที่ใช้งาน</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {directors.filter(d => d.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ผู้ดูแลระบบ</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {directors.filter(d => d.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหากรรมการ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Directors Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายชื่อกรรมการ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>โทรศัพท์</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead>ที่อยู่</TableHead>
                <TableHead>สมาชิกครัวเรือน</TableHead>
                <TableHead>รายได้</TableHead>
                <TableHead>บทบาท</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDirectors.map((director) => (
                <TableRow key={director.id}>
                  <TableCell className="font-medium">{director.name}</TableCell>
                  <TableCell>{director.email}</TableCell>
                  <TableCell>{director.phone}</TableCell>
                  <TableCell>{director.position}</TableCell>
                  <TableCell className="max-w-xs truncate">{director.address}</TableCell>
                  <TableCell>{director.households}</TableCell>
                  <TableCell>฿{director.income.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={director.role === 'admin' ? 'default' : 'secondary'}>
                      {director.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                       director.role === 'president' ? 'ประธาน' : 'เจ้าหน้าที่'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={director.isActive ? 'default' : 'destructive'}
                      className="cursor-pointer"
                      onClick={() => handleToggleStatus(director.id)}
                    >
                      {director.isActive ? 'ใช้งาน' : 'ระงับการใช้งาน'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditDirector(director)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={director.role === 'admin'}
                        onClick={() => handleDeleteDirector(director)}
                      >
                        ลบ
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Directors;