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
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Search, Edit, Trash2, UserCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface UserManagement {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  address: string;
  household_members: number;
  income: number;
  role: 'เจ้าหน้าที่' | 'ประธาน';
  status: 'ใช้งาน' | 'ระงับ';
  created_date: string;
  updated_date?: string;
}

const Directors = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagement | null>(null);
  const [newUser, setNewUser] = useState<Partial<UserManagement>>({
    full_name: '',
    email: '',
    phone: '',
    position: '',
    address: '',
    household_members: 0,
    income: 0,
    role: 'เจ้าหน้าที่',
    status: 'ใช้งาน'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3001/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลผู้ใช้ได้",
        variant: "destructive"
      });
    }
  };

  const handleAddUser = async () => {
    if (!newUser.full_name || !newUser.email) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: "กรุณากรอกชื่อ-นามสกุล และอีเมล",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add user');
      }

      await fetchUsers();
      setNewUser({
        full_name: '',
        email: '',
        phone: '',
        position: '',
        address: '',
        household_members: 0,
        income: 0,
        role: 'เจ้าหน้าที่',
        status: 'ใช้งาน'
      });
      setShowAddDialog(false);

      toast({
        title: "บันทึกสำเร็จ",
        description: "เพิ่มข้อมูลผู้ใช้เรียบร้อยแล้ว"
      });
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถเพิ่มข้อมูลได้",
        variant: "destructive"
      });
    }
  };

  const handleEditUser = (userData: UserManagement) => {
    setEditingUser(userData);
    setShowEditDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser?.full_name || !editingUser?.email) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: "กรุณากรอกชื่อ-นามสกุล และอีเมล",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/users/${editingUser.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editingUser.full_name,
          email: editingUser.email,
          phone: editingUser.phone,
          position: editingUser.position,
          address: editingUser.address,
          household_members: editingUser.household_members,
          income: editingUser.income,
          role: editingUser.role,
          status: editingUser.status
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      await fetchUsers();
      setEditingUser(null);
      setShowEditDialog(false);

      toast({
        title: "บันทึกสำเร็จ",
        description: "แก้ไขข้อมูลผู้ใช้เรียบร้อยแล้ว"
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถแก้ไขข้อมูลได้",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('ต้องการลบข้อมูลผู้ใช้นี้ใช่หรือไม่?')) return;

    try {
      const res = await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      await fetchUsers();

      toast({
        title: "ลบสำเร็จ",
        description: "ลบข้อมูลผู้ใช้เรียบร้อยแล้ว"
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถลบข้อมูลได้",
        variant: "destructive"
      });
    }
  };

  // Only admins can access this page
  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-muted-foreground">คุณไม่มีสิทธิ์ในการเข้าถึงระบบจัดการกรรมการ</p>
      </div>
    );
  }

  const filteredUsers = users.filter(userData =>
    userData.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userData.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userData.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการกรรมการ</h1>
          <p className="text-muted-foreground">
            จัดการข้อมูลกรรมการและคณะผู้บริหาร
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มกรรมการใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>เพิ่มกรรมการใหม่</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">ชื่อ-นามสกุล *</Label>
                <Input
                  id="full_name"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="อีเมล"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">โทรศัพท์</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="โทรศัพท์"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">ตำแหน่ง</Label>
                <Input
                  id="position"
                  value={newUser.position}
                  onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                  placeholder="ตำแหน่ง"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">ที่อยู่</Label>
                <Textarea
                  id="address"
                  value={newUser.address}
                  onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                  placeholder="ที่อยู่"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="household_members">สมาชิกครัวเรือน</Label>
                <Input
                  id="household_members"
                  type="number"
                  value={newUser.household_members}
                  onChange={(e) => setNewUser({ ...newUser, household_members: Number(e.target.value) })}
                  placeholder="จำนวนสมาชิกครัวเรือน"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income">รายได้</Label>
                <Input
                  id="income"
                  type="number"
                  value={newUser.income}
                  onChange={(e) => setNewUser({ ...newUser, income: Number(e.target.value) })}
                  placeholder="รายได้"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">บทบาท *</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: 'เจ้าหน้าที่' | 'ประธาน') => 
                    setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกบทบาท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="เจ้าหน้าที่">เจ้าหน้าที่</SelectItem>
                    <SelectItem value="ประธาน">ประธาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">สถานะ</Label>
                <Select
                  value={newUser.status}
                  onValueChange={(value: 'ใช้งาน' | 'ระงับ') => 
                    setNewUser({ ...newUser, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ใช้งาน">ใช้งาน</SelectItem>
                    <SelectItem value="ระงับ">ระงับ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>ยกเลิก</Button>
              <Button onClick={handleAddUser}>บันทึก</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">กรรมการทั้งหมด</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ประธาน</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.role === 'ประธาน').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">เจ้าหน้าที่</p>
                <p className="text-2xl font-bold text-orange-600">
                  {users.filter(u => u.role === 'เจ้าหน้าที่').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ใช้งาน</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.status === 'ใช้งาน').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>ค้นหาข้อมูลกรรมการ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="ค้นหาตามชื่อ, อีเมล, หรือตำแหน่ง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
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
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((userData) => (
                <TableRow key={userData.user_id}>
                  <TableCell className="font-medium">{userData.full_name}</TableCell>
                  <TableCell>{userData.email}</TableCell>
                  <TableCell>{userData.phone || '-'}</TableCell>
                  <TableCell>{userData.position || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{userData.address || '-'}</TableCell>
                  <TableCell className="text-center">{userData.household_members}</TableCell>
                  <TableCell>฿{userData.income.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={userData.role === 'ประธาน' ? 'default' : 'secondary'}>
                      {userData.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={userData.status === 'ใช้งาน' ? 'default' : 'destructive'}>
                      {userData.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(userData)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                        onClick={() => handleDeleteUser(userData.user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    ไม่พบข้อมูลกรรมการ
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลกรรมการ</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-full_name">ชื่อ-นามสกุล *</Label>
                <Input
                  id="edit-full_name"
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">อีเมล *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="อีเมล"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">โทรศัพท์</Label>
                <Input
                  id="edit-phone"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  placeholder="โทรศัพท์"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-position">ตำแหน่ง</Label>
                <Input
                  id="edit-position"
                  value={editingUser.position}
                  onChange={(e) => setEditingUser({ ...editingUser, position: e.target.value })}
                  placeholder="ตำแหน่ง"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-address">ที่อยู่</Label>
                <Textarea
                  id="edit-address"
                  value={editingUser.address}
                  onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                  placeholder="ที่อยู่"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-household_members">สมาชิกครัวเรือน</Label>
                <Input
                  id="edit-household_members"
                  type="number"
                  value={editingUser.household_members}
                  onChange={(e) => setEditingUser({ ...editingUser, household_members: Number(e.target.value) })}
                  placeholder="จำนวนสมาชิกครัวเรือน"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-income">รายได้</Label>
                <Input
                  id="edit-income"
                  type="number"
                  value={editingUser.income}
                  onChange={(e) => setEditingUser({ ...editingUser, income: Number(e.target.value) })}
                  placeholder="รายได้"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">บทบาท *</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value: 'เจ้าหน้าที่' | 'ประธาน') => 
                    setEditingUser({ ...editingUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกบทบาท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="เจ้าหน้าที่">เจ้าหน้าที่</SelectItem>
                    <SelectItem value="ประธาน">ประธาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">สถานะ</Label>
                <Select
                  value={editingUser.status}
                  onValueChange={(value: 'ใช้งาน' | 'ระงับ') => 
                    setEditingUser({ ...editingUser, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ใช้งาน">ใช้งาน</SelectItem>
                    <SelectItem value="ระงับ">ระงับ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleUpdateUser}>บันทึก</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Directors;