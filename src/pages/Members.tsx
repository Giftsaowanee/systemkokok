import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Edit, Eye, MapPin, Printer, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Member {
  member_id: number;
  name: string;
  address: string;
  occupation: string;
  funds_amount: string;
  Share_value: string;
  phone: string;
}

const Members = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    address: '',
    career: '',
    shares: 0,
    phone: ''
  });
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch('http://localhost:3001/members');
        if (!res.ok) throw new Error('API error: ' + res.status);
        const data = await res.json();
        setMembers(data);
      } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + (err as Error).message);
      }
    };
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMember = async () => {
    // Mapping ให้ตรงกับ backend/database
    const payload = {
      name: newMember.name,
      phone: newMember.phone,
      address: newMember.address,
      funds_amount: newMember.shares,      // จำนวนหุ้น
      Share_value: newMember.shares ? newMember.shares * 1000 : 0, // มูลค่าหุ้น
      occupation: newMember.career
    };

    const res = await fetch('http://localhost:3001/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    setNewMember({
      name: '',
      address: '',
      career: '',
      shares: 0,
      phone: ''
    });

    // ดึงข้อมูลใหม่หลังบันทึก
    const res2 = await fetch('http://localhost:3001/members');
    const membersData = await res2.json();
    setMembers(membersData);
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingMember) return;
      
      // สร้าง payload สำหรับส่งไป backend
      const payload = {
        name: editingMember.name,
        phone: editingMember.phone,
        address: editingMember.address,
        funds_amount: editingMember.funds_amount,
        Share_value: (Number(editingMember.funds_amount) * 1000).toString(),
        occupation: editingMember.occupation
      };

      const res = await fetch(`http://localhost:3001/members/${editingMember.member_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to update member');
      }

      const data = await res.json();
      console.log('Updated member:', data);

      // ปิด dialog
      setEditingMember(null);

      // โหลดข้อมูลใหม่หลังบันทึก
      const res2 = await fetch('http://localhost:3001/members');
      const membersData = await res2.json();
      setMembers(membersData);

      // แสดง toast แจ้งเตือนสำเร็จ
      toast({
        title: "บันทึกสำเร็จ",
        description: "แก้ไขข้อมูลสมาชิกเรียบร้อยแล้ว"
      });
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขข้อมูลได้",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการข้อมูลสมาชิก</h1>
          <p className="text-muted-foreground">
            จัดการข้อมูลสมาชิกในกลุ่มวิสาหกิจชุมชน
          </p>                                                                                                  
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover" onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มสมาชิกใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>เพิ่มสมาชิกใหม่</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                  <Input
                    id="name"
                    placeholder="กรอกชื่อ-นามสกุล"
                    value={newMember.name || ''}
                    onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="career">อาชีพ</Label>
                  <Input
                    id="career"
                    placeholder="เช่น เกษตรกร, หัวหน้ากลุ่ม"
                    value={newMember.career || ''}
                    onChange={e => setNewMember({ ...newMember, career: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">ที่อยู่</Label>
                  <Input
                    id="address"
                    placeholder="ที่อยู่เต็ม"
                    value={newMember.address || ''}
                    onChange={e => setNewMember({ ...newMember, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">เบอร์โทร</Label>
                  <Input
                    id="phone"
                    placeholder="เบอร์โทรศัพท์"
                    className="col-span-3"
                    value={newMember.phone}
                    maxLength={10}
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setNewMember(f => ({ ...f, phone: value }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shares">จำนวนหุ้น</Label>
                  <Input
                    id="shares"
                    type="number"
                    placeholder="จำนวนหุ้น"
                    value={newMember.shares || 0}
                    min={0}
                    onChange={e => setNewMember({ ...newMember, shares: Number(e.target.value) })}
                  />
                  <div className="text-xs text-muted-foreground">(1 หุ้น = 1,000 บาท)</div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>ยกเลิก</Button>
                <Button className="bg-primary hover:bg-primary-hover" onClick={async () => {
                  await handleAddMember();
                  setShowAddDialog(false);
                }}>
                  บันทึก
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>ค้นหาสมาชิก</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ค้นหาชื่อหรือที่อยู่..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">ค้นหา</Button>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            รายชื่อสมาชิก
            <span className="ml-4 text-base text-muted-foreground font-normal">
              จำนวนสมาชิกทั้งหมด: {filteredMembers.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>ที่อยู่</TableHead>
                <TableHead>อาชีพ</TableHead>
                <TableHead>เบอร์โทร</TableHead>
                <TableHead>จำนวนหุ้น</TableHead>
                <TableHead>มูลค่าหุ้น (บาท)</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.address}</TableCell>
                  <TableCell>
                    <Badge variant={member.occupation === 'หัวหน้ากลุ่ม' ? 'default' : 'secondary'}>
                      {member.occupation}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.phone || '-'}</TableCell>
                  <TableCell>
                    {member.funds_amount
                      ? parseInt(member.funds_amount).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {member.Share_value
                      ? `฿${parseInt(member.Share_value).toLocaleString()}`
                      : member.funds_amount
                        ? `฿${(parseInt(member.funds_amount) * 1000).toLocaleString()}`
                        : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditMember(member)}
                    >
                      <Edit className="h-4 w-4" />
                      แก้ไข
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog สำหรับแก้ไขข้อมูลสมาชิก */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลสมาชิก</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">ชื่อ-นามสกุล</Label>
                <Input
                  id="edit-name"
                  value={editingMember.name}
                  onChange={e => setEditingMember({ ...editingMember, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-occupation">อาชีพ</Label>
                <Input
                  id="edit-occupation"
                  value={editingMember.occupation}
                  onChange={e => setEditingMember({ ...editingMember, occupation: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-address">ที่อยู่</Label>
                <Input
                  id="edit-address"
                  value={editingMember.address}
                  onChange={e => setEditingMember({ ...editingMember, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">เบอร์โทร</Label>
                <Input
                  id="edit-phone"
                  value={editingMember.phone || ''}
                  maxLength={10}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setEditingMember({ ...editingMember, phone: value });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-funds">จำนวนหุ้น</Label>
                <Input
                  id="edit-funds"
                  type="number"
                  placeholder="จำนวนหุ้น"
                  value={editingMember.funds_amount ?? 0}
                  min={0}
                  onChange={e => setEditingMember({ 
                    ...editingMember, 
                    funds_amount: e.target.value,
                    Share_value: (Number(e.target.value) * 1000).toString()
                  })}
                />
                <div className="text-xs text-muted-foreground">(1 หุ้น = 1,000 บาท)</div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingMember(null)}>ยกเลิก</Button>
            <Button className="bg-primary hover:bg-primary-hover" onClick={handleSaveEdit}>
              บันทึก
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;