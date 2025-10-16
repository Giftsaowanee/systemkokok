import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
//import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Plus, Search, Edit, TrendingUp, TrendingDown, CreditCard, Banknote, Printer } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  subcategory?: string;
  type: 'income' | 'expense' | 'stock' | 'dividend';
  amount: number;
  paymentMethod: 'cash' | 'transfer' | 'credit';
  reference?: string;
  unit?: string;
  status?: 'completed' | 'pending' | 'cancelled'; // Add status if used elsewhere
}

interface Member {
  id: number;
  name: string;
  shares?: number;
  // ...other fields...
}

// สมมติว่ามีข้อมูลสมาชิก
//const [members, setMembers] = useState<{ id: string; name: string; shares: number }[]>([]);

const monthOptions = [
  { value: 'all', label: 'ทุกเดือน' },
  { value: '01', label: 'มกราคม' },
  { value: '02', label: 'กุมภาพันธ์' },
  { value: '03', label: 'มีนาคม' },
  { value: '04', label: 'เมษายน' },
  { value: '05', label: 'พฤษภาคม' },
  { value: '06', label: 'มิถุนายน' },
  { value: '07', label: 'กรกฎาคม' },
  { value: '08', label: 'สิงหาคม' },
  { value: '09', label: 'กันยายน' },
  { value: '10', label: 'ตุลาคม' },
  { value: '11', label: 'พฤศจิกายน' },
  { value: '12', label: 'ธันวาคม' },
];

const Accounting = () => {
  // ✅ ประกาศ useState สำหรับ members ในฟังก์ชันหลัก
  const [members, setMembers] = useState<Member[]>([]);
  // ...existing state...
  const [state, setState] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    date: '',
    description: '',
    category: '',
    amount: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('all'); // default เป็นทุกเดือน
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // เปลี่ยน state สำหรับกรองประเภท
  const [selectedType, setSelectedType] = useState<string>('all');

  // Only president and staff can access this page
  if (!['president', 'staff'].includes(user?.role || '')) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-muted-foreground">คุณไม่มีสิทธิ์ในการเข้าถึงระบบจัดการบัญชี</p>
      </div>
    );
  }

  const fetchTransactions = async () => {
    const res = await fetch('http://localhost:3001/transactions');
    const data = await res.json();
    setTransactions(data);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    // โหลดข้อมูลสมาชิก
    fetch('http://localhost:3001/members')
      .then(res => res.json())
      .then(data => setMembers(data));
  }, []);

  // คำนวณรายรับรวมและหุ้นรวม
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalStock = transactions
    .filter(t => t.type === 'stock')
    .reduce((sum, t) => sum + t.amount, 0);

  // คำนวณจำนวนหุ้นทั้งหมด
  const totalShares = members.reduce((sum, m) => sum + (m.shares ?? 0), 0);
  const totalSharesValue = totalShares * 1000;

  // คำนวณปันผลต่อหุ้น
  const dividendPerShare = totalShares > 0 ? (totalIncome + totalStock) / totalShares : 0;

  // กำหนด 1 หุ้น = 1,000 บาท
  const totalStockAmount = transactions
    .filter(t => t.type === 'stock')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalStocks = Math.floor(totalStockAmount / 1000);

  const handleAddTransaction = async () => {
    // ไม่ต้องเช็คข้อมูลครบทุกช่อง
    const res = await fetch('http://localhost:3001/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTransaction)
    });
    const data = await res.json();
    if (data.error) {
      toast({ title: "เกิดข้อผิดพลาด", description: data.error, variant: "destructive" });
      return;
    }
    // รีเซ็ตข้อมูลฟอร์ม
    setNewTransaction({
      date: '',
      description: '',
      category: '',
      amount: 0,
      reference: '',
      type: undefined,
      paymentMethod: undefined,
      unit: ''
    });
    fetchTransactions(); // ดึงข้อมูลใหม่หลังบันทึก
  };

  // ปรับ filteredTransactions ให้กรองตามเดือนที่เลือก (ถ้าเลือก 'all' ให้แสดงทุกเดือน)
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    const matchesYear = transaction.date.startsWith(selectedYear);
    const matchesMonth = selectedMonth === 'all' || transaction.date.slice(5, 7) === selectedMonth;
    return matchesSearch && matchesCategory && matchesType && matchesYear && matchesMonth;
  });

  const totalExpense = transactions
    .filter(
      t =>
        t.type === 'expense' &&
        t.status === 'completed' &&
        t.date.startsWith(selectedYear)
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const handleStatusChange = async (id: string, newStatus: Transaction['status']) => {
    // อัปเดตสถานะใน backend
    const res = await fetch(`http://localhost:3001/transactions/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: data.error,
        variant: "destructive"
      });
      return;
    }
    // โหลดข้อมูลใหม่
    fetchTransactions();
    toast({
      title: "อัพเดทสถานะสำเร็จ",
      description: "สถานะรายการถูกอัพเดทแล้ว"
    });
  };

  const getTypeColor = (type: Transaction['type']) => {
    return type === 'income' ? 'default' : 'destructive';
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusText = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return 'สำเร็จ';
      case 'pending': return 'รอดำเนินการ';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    const res = await fetch(`http://localhost:3001/transactions/${editingTransaction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingTransaction)
    });
    const data = await res.json();
    if (data.error) {
      toast({ title: "เกิดข้อผิดพลาด", description: data.error, variant: "destructive" });
      return;
    }
    setEditDialogOpen(false);
    setEditingTransaction(null);
    fetchTransactions(); // โหลดข้อมูลใหม่
    toast({
      title: "บันทึกการแก้ไขสำเร็จ",
      description: "รายการถูกแก้ไขแล้ว"
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการบัญชี</h1>
          <p className="text-muted-foreground">จัดการรายรับ-รายจ่าย และติดตามงบการเงิน</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => window.print()}
          >
            <Printer className="mr-2 h-4 w-4" />
            พิมพ์รายงาน
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setIsDialogOpen(true)} 
              className="bg-primary hover:bg-primary/90"
              disabled={user.role !== 'staff' && user.role !== 'president'}
            >
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มรายการ
            </Button>
          </DialogTrigger>
          {/* Dialog เพิ่มรายการใหม่ */}
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>เพิ่มรายการใหม่</DialogTitle>
              <DialogDescription>
                กรอกข้อมูลรายละเอียดรายการบัญชีให้ครบถ้วน
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* อ้างอิง (ลำดับ) */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reference" className="text-right">ลำดับ</Label>
                <Input
                  id="reference"
                  placeholder="หมายเลขลำดับ/อ้างอิง (ถ้ามี)"
                  className="col-span-3"
                  value={newTransaction.reference || ''}
                  onChange={e => setNewTransaction({ ...newTransaction, reference: e.target.value })}
                />
              </div>
              {/* รายละเอียด */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right mt-2">รายละเอียด</Label>
                <Textarea
                  id="description"
                  placeholder="รายละเอียดรายการ"
                  className="col-span-3"
                  value={newTransaction.description || ''}
                  onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
                />
              </div>
              {/* หมวดหมู่ */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">หมวดหมู่</Label>
                <Select
                  value={newTransaction.category || ''}
                  onValueChange={val => setNewTransaction({ ...newTransaction, category: val })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="สมุนไพรสด">สมุนไพรสด</SelectItem>
                    <SelectItem value="สมุนไพรแปรรูป">สมุนไพรแปรรูป</SelectItem>
                    <SelectItem value="อื่นๆ">อื่นๆ</SelectItem> {/* เพิ่มตรงนี้ */}
                  </SelectContent>
                </Select>
              </div>
              {/* ประเภท */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">ประเภท</Label>
                <Select
                  value={newTransaction.type}
                  onValueChange={val => setNewTransaction({ ...newTransaction, type: val as Transaction['type'] })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">รายรับ</SelectItem>
                    <SelectItem value="expense">รายจ่าย</SelectItem>
                    <SelectItem value="stock">หุ้น</SelectItem>
                    <SelectItem value="dividend">ปันผล</SelectItem> {/* เพิ่มตรงนี้ */}
                  </SelectContent>
                </Select>
              </div>
              {/* จำนวนเงิน */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">จำนวนเงิน</Label>
                <Input
                  id="amount"
                  placeholder="จำนวนเงิน (บาท)"
                  className="col-span-3"
                  type="number"
                  value={newTransaction.amount || ''}
                  onChange={e => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                />
              </div>
              {/* วิธีชำระ */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentMethod" className="text-right">วิธีชำระ</Label>
                <Select
                  value={newTransaction.paymentMethod}
                  onValueChange={val => setNewTransaction({ ...newTransaction, paymentMethod: val as Transaction['paymentMethod'] })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="เลือกวิธีชำระเงิน" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">เงินสด</SelectItem>
                    <SelectItem value="transfer">โอนเงิน</SelectItem>
                    <SelectItem value="credit">เครดิต</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* หน่วยน้ำหนัก */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">หน่วยน้ำหนัก</Label>
                <Select
                  value={newTransaction.unit || ''}
                  onValueChange={val => setNewTransaction({ ...newTransaction, unit: val })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="เลือกหน่วย" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="กรัม">กรัม</SelectItem>
                    <SelectItem value="กิโลกรัม">กิโลกรัม</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* วันที่ (ย้ายไปล่างสุด) */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">วันที่</Label>
                <Input
                  id="date"
                  type="date"
                  className="col-span-3"
                  value={newTransaction.date || ''}
                  onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
              <Button onClick={() => {
                setIsDialogOpen(false);
                handleAddTransaction();
                toast({
                  title: "เพิ่มรายการสำเร็จ",
                  description: "รายการใหม่ถูกเพิ่มแล้ว"
                });
              }}>
                บันทึก
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base font-semibold text-green-700">รายรับรวม</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              ฿{Number(totalIncome).toLocaleString('th-TH', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-sm text-green-800 mt-2">
              รวม {transactions.filter(t => t.type === 'income').length} รายการบัญชีรายรับ
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base font-semibold text-blue-700">หุ้นรวม</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {totalShares.toLocaleString()} หุ้น
            </div>
            <div className="text-md text-green-700 mt-2">
              มูลค่ารวม: ฿{totalSharesValue.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">(1 หุ้น = 1,000 บาท)</div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-base font-semibold text-yellow-700">ปันผลต่อหุ้น</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700">
              ฿{Number(dividendPerShare).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-yellow-800 mt-2">
              ปันผลรวม = รายรับ + หุ้น / จำนวนหุ้นทั้งหมด
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ค้นหาและกรองข้อมูล</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ค้นหารายการ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Label>ประเภท</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="stock">หุ้น</SelectItem>
                  <SelectItem value="income">รายรับ</SelectItem>
                  <SelectItem value="expense">รายจ่าย</SelectItem>
                  <SelectItem value="dividend">ปันผล</SelectItem> {/* เพิ่มตรงนี้ */}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ปี</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกปี" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>เดือน</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกเดือน" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      
      {/* Edit Transaction Dialog */}
      {editingTransaction && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>แก้ไขรายการบัญชี</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* ลำดับ/อ้างอิง */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reference" className="text-right">ลำดับ</Label>
                <Input
                  id="reference"
                  placeholder="หมายเลขลำดับ/อ้างอิง (ถ้ามี)"
                  className="col-span-3"
                  value={editingTransaction.reference || ''}
                  onChange={e => setEditingTransaction({ ...editingTransaction, reference: e.target.value })}
                />
              </div>
              {/* รายละเอียด */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right mt-2">รายละเอียด</Label>
                <Textarea
                  id="description"
                  placeholder="รายละเอียดรายการ"
                  className="col-span-3"
                  value={editingTransaction.description || ''}
                  onChange={e => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                />
              </div>
              {/* หมวดหมู่ */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">หมวดหมู่</Label>
                <Select
                  value={editingTransaction.category}
                  onValueChange={val => setEditingTransaction({ ...editingTransaction, category: val })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="สมุนไพรสด">สมุนไพรสด</SelectItem>
                    <SelectItem value="สมุนไพรแปรรูป">สมุนไพรแปรรูป</SelectItem>
                    <SelectItem value="อื่นๆ">อื่นๆ</SelectItem> {/* เพิ่มตรงนี้ */}
                  </SelectContent>
                </Select>
              </div>
              {/* ประเภท */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">ประเภท</Label>
                <Select
                  value={editingTransaction.type}
                  onValueChange={val => setEditingTransaction({ ...editingTransaction, type: val as Transaction['type'] })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">รายรับ</SelectItem>
                    <SelectItem value="expense">รายจ่าย</SelectItem>
                    <SelectItem value="stock">หุ้น</SelectItem>
                    <SelectItem value="dividend">ปันผล</SelectItem> {/* เพิ่มตรงนี้ */}
                  </SelectContent>
                </Select>
              </div>
              {/* จำนวนเงิน */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">จำนวนเงิน</Label>
                <Input
                  id="amount"
                  placeholder="จำนวนเงิน (บาท)"
                  className="col-span-3"
                  type="number"
                  value={editingTransaction.amount}
                  onChange={e => setEditingTransaction({ ...editingTransaction, amount: Number(e.target.value) })}
                />
              </div>
              {/* วิธีชำระ */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentMethod" className="text-right">วิธีชำระ</Label>
                <Select
                  value={editingTransaction.paymentMethod}
                  onValueChange={val => setEditingTransaction({ ...editingTransaction, paymentMethod: val as Transaction['paymentMethod'] })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="เลือกวิธีชำระเงิน" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">เงินสด</SelectItem>
                    <SelectItem value="transfer">โอนเงิน</SelectItem>
                    <SelectItem value="credit">เครดิต</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* สถานะ */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">สถานะ</Label>
                <Select
                  value={editingTransaction.status}
                  onValueChange={val => setEditingTransaction({ ...editingTransaction, status: val as Transaction['status'] })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">สำเร็จ</SelectItem>
                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                    <SelectItem value="cancelled">ยกเลิก</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* วันที่ */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">วันที่</Label>
                <Input
                  id="date"
                  type="date"
                  className="col-span-3"
                  value={editingTransaction.date}
                  onChange={e => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setEditDialogOpen(false);
                setEditingTransaction(null);
              }}>
                ยกเลิก
              </Button>
              <Button onClick={handleSaveEdit}>บันทึกการแก้ไข</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* แสดงปันผลตามสมาชิก เฉพาะเมื่อเลือกประเภท "ปันผล" */}
      {selectedType === 'dividend' && (
        <Card>
          <CardHeader>
            <CardTitle>ปันผลตามสมาชิก</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อสมาชิก</TableHead>
                  <TableHead>จำนวนหุ้น</TableHead>
                  <TableHead>ปันผลที่ได้รับ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.shares}</TableCell>
                    <TableCell>
                      ฿{Number(member.shares * dividendPerShare).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* แสดงรายการหุ้น เฉพาะเมื่อเลือกประเภท "หุ้น" */}
      {selectedType === 'stock' && (
        <Card className="bg-blue-50 mb-4">
          <CardHeader>
            <CardTitle>หุ้นรวมจากสมาชิก</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-700">
              จำนวนหุ้น: {totalShares.toLocaleString()} หุ้น
            </div>
            <div className="text-md text-green-700">
              มูลค่ารวม: ฿{totalSharesValue.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">(1 หุ้น = 1,000 บาท)</div>
            {/* ตารางรายชื่อสมาชิกที่มีหุ้น */}
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อสมาชิก</TableHead>
                    <TableHead>จำนวนหุ้น</TableHead>
                    <TableHead>มูลค่าหุ้น (บาท)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members
                    .filter(m => (m.shares ?? 0) > 0)
                    .map(m => (
                      <TableRow key={m.id}>
                        <TableCell>{m.name}</TableCell>
                        <TableCell>{m.shares?.toLocaleString() ?? 0}</TableCell>
                        <TableCell>฿{((m.shares ?? 0) * 1000).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* แสดงตารางบัญชีเฉพาะเมื่อไม่ได้เลือก "หุ้น" */}
      {selectedType !== 'stock' && selectedType !== 'dividend' && (
        <Card>
          <CardHeader>
            <CardTitle>รายการบัญชี</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ลำดับ</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead>จำนวนเงิน</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>วิธีชำระ</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions
                  .slice() // copy array
                  .sort((a, b) => {
                    // แปลง reference เป็นตัวเลข ถ้าไม่มีให้เป็น 0
                    const refA = Number(a.reference) || 0;
                    const refB = Number(b.reference) || 0;
                    return refA - refB;
                  })
                  .map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.reference || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.type === 'income' ? 'default' :
                          transaction.type === 'expense' ? 'destructive' :
                          transaction.type === 'stock' ? 'secondary' : 'outline'
                        }>
                          {transaction.type === 'income' ? 'รายรับ' :
                           transaction.type === 'expense' ? 'รายจ่าย' :
                           transaction.type === 'stock' ? 'หุ้น' : 'ปันผล'}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        ฿{transaction.amount.toLocaleString()}
                      </TableCell>
                      {/* ลบ TableCell ของหน่วยน้ำหนักออก */}
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {transaction.paymentMethod === 'cash' ? (
                            <Banknote className="h-4 w-4" />
                          ) : (
                            <CreditCard className="h-4 w-4" />
                          )}
                          <span className="text-sm">
                            {transaction.paymentMethod === 'cash' ? 'เงินสด' : 
                             transaction.paymentMethod === 'transfer' ? 'โอนเงิน' : 'เครดิต'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setEditingTransaction(transaction);
                            setEditDialogOpen(true);
                          }}
                        >
                          แก้ไข
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Accounting;