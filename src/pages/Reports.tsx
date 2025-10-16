import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Plus, Edit, Trash2, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Report {
  report_id: number;
  title: string;
  content: string;
  created_date: string;
}

interface AccountingRecord {
  finance_id: number;
  type: string;
  income: string | number;
  expense: string | number;
  amount: string | number;
  description: string;
  transaction_date: string;
  profit: string | number;
  dividend: string | number;
  share: string | number;
}

interface Member {
  member_id: number;
  name: string;
  funds_amount: string | number;
  Share_value: string | number;
}

interface Production {
  production_id: number;
  product_name?: string;
  category?: string;
  member_name: string;
  staff_name: string;
  quantity: string | number;
  unit: string;
  price: string | number;
}

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [accounting, setAccounting] = useState<AccountingRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newReport, setNewReport] = useState({
    title: '',
    content: ''
  });
  
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch reports
      const reportsRes = await fetch('http://localhost:3001/reports');
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData);
      }

      // Fetch accounting data
      const accountingRes = await fetch('http://localhost:3001/accounting');
      if (accountingRes.ok) {
        const accountingData = await accountingRes.json();
        console.log('Accounting data:', accountingData);
        // ตรวจสอบว่าเป็น object ที่มี data property หรือ array
        const dataArray = accountingData.data || accountingData;
        setAccounting(Array.isArray(dataArray) ? dataArray : []);
      }

      // Fetch members
      const membersRes = await fetch('http://localhost:3001/members');
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }

      // Fetch products
      const productsRes = await fetch('http://localhost:3001/products');
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        console.log('Products data:', productsData);
        setProductions(productsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('ไม่สามารถดึงข้อมูลได้');
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddReport = async () => {
    if (!newReport.title || !newReport.content) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: "กรุณากรอกหัวข้อและเนื้อหารายงาน",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport)
      });

      if (!res.ok) throw new Error('Failed to add report');
      
      await fetchAllData();
      setNewReport({ title: '', content: '' });
      setShowAddDialog(false);
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "เพิ่มรายงานเรียบร้อยแล้ว"
      });
    } catch (error) {
      console.error('Error adding report:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มรายงานได้",
        variant: "destructive"
      });
    }
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setShowEditDialog(true);
  };

  const handleUpdateReport = async () => {
    if (!editingReport?.title || !editingReport?.content) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: "กรุณากรอกหัวข้อและเนื้อหารายงาน",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/reports/${editingReport.report_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingReport.title,
          content: editingReport.content
        })
      });

      if (!res.ok) throw new Error('Failed to update report');
      
      await fetchAllData();
      setEditingReport(null);
      setShowEditDialog(false);
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "แก้ไขรายงานเรียบร้อยแล้ว"
      });
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขรายงานได้",
        variant: "destructive"
      });
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm('ต้องการลบรายงานนี้ใช่หรือไม่?')) return;

    try {
      const res = await fetch(`http://localhost:3001/reports/${reportId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete report');
      
      await fetchAllData();
      
      toast({
        title: "ลบสำเร็จ",
        description: "ลบรายงานเรียบร้อยแล้ว"
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบรายงานได้",
        variant: "destructive"
      });
    }
  };

  // Calculate summary data with proper number conversion
  const totalIncome = accounting.reduce((sum, record) => {
    const income = typeof record.income === 'string' ? parseFloat(record.income) : record.income;
    return sum + (income || 0);
  }, 0);
  
  const totalExpense = accounting.reduce((sum, record) => {
    const expense = typeof record.expense === 'string' ? parseFloat(record.expense) : record.expense;
    return sum + (expense || 0);
  }, 0);
  
  const netProfit = totalIncome - totalExpense;
  
  const totalProduction = productions.reduce((sum, product) => {
    const quantity = typeof product.quantity === 'string' ? parseFloat(product.quantity) : product.quantity;
    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    return sum + ((quantity || 0) * (price || 0));
  }, 0);

  // Debug calculations
  console.log('Calculation Debug:', {
    totalIncome,
    totalExpense, 
    netProfit,
    totalProduction,
    accountingRecords: accounting.length,
    productionRecords: productions.length
  });

  const totalMembers = members.length;
  const totalShares = members.reduce((sum, member) => {
    const fundsAmount = typeof member.funds_amount === 'string' ? parseFloat(member.funds_amount) : member.funds_amount;
    return sum + (fundsAmount || 0);
  }, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-8">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchAllData} className="mt-4">
            ลองใหม่อีกครั้ง
          </Button>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">รายงาน</h1>
              <p className="text-muted-foreground">
                ระบบจัดการรายงานและสรุปข้อมูลกลุ่มวิสาหกิจ
              </p>
            </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มรายงานใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>เพิ่มรายงานใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">หัวข้อรายงาน</Label>
                <Input
                  id="title"
                  value={newReport.title}
                  onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                  placeholder="หัวข้อรายงาน"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">เนื้อหารายงาน</Label>
                <Textarea
                  id="content"
                  value={newReport.content}
                  onChange={(e) => setNewReport({ ...newReport, content: e.target.value })}
                  placeholder="เนื้อหารายงาน"
                  rows={10}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>ยกเลิก</Button>
              <Button onClick={handleAddReport}>บันทึก</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">รายได้รวม</p>
                <p className="text-2xl font-bold text-green-600">
                  ฿{totalIncome.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">รายจ่ายรวม</p>
                <p className="text-2xl font-bold text-red-600">
                  ฿{totalExpense.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">กำไรสุทธิ</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ฿{netProfit.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">มูลค่าผลผลิต</p>
                <p className="text-2xl font-bold text-blue-600">
                  ฿{totalProduction.toLocaleString()}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>สรุปข้อมูลสมาชิก</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>จำนวนสมาชิกทั้งหมด:</span>
                <span className="font-medium">{totalMembers} คน</span>
              </div>
              <div className="flex justify-between">
                <span>หุ้นรวมทั้งหมด:</span>
                <span className="font-medium">{totalShares.toLocaleString()} หุ้น</span>
              </div>
              <div className="flex justify-between">
                <span>มูลค่าหุ้นรวม:</span>
                <span className="font-medium">฿{(totalShares * 1000).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>สรุปข้อมูลผลผลิต</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>จำนวนรายการผลผลิต:</span>
                <span className="font-medium">{productions.length} รายการ</span>
              </div>
              <div className="flex justify-between">
                <span>ปริมาณรวม:</span>
                <span className="font-medium">
                  {productions.reduce((sum, p) => sum + Number(p.quantity), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>มูลค่ารวม:</span>
                <span className="font-medium">฿{totalProduction.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>รายการรายงาน</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>หัวข้อ</TableHead>
                <TableHead>เนื้อหา</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.report_id}>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate text-sm text-muted-foreground">
                      {report.content.length > 100 
                        ? `${report.content.substring(0, 100)}...` 
                        : report.content}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(report.created_date).toLocaleDateString('th-TH')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditReport(report)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                        onClick={() => handleDeleteReport(report.report_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    ยังไม่มีรายงาน
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
            <DialogTitle>แก้ไขรายงาน</DialogTitle>
          </DialogHeader>
          {editingReport && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">หัวข้อรายงาน</Label>
                <Input
                  id="edit-title"
                  value={editingReport.title}
                  onChange={(e) => setEditingReport({ ...editingReport, title: e.target.value })}
                  placeholder="หัวข้อรายงาน"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">เนื้อหารายงาน</Label>
                <Textarea
                  id="edit-content"
                  value={editingReport.content}
                  onChange={(e) => setEditingReport({ ...editingReport, content: e.target.value })}
                  placeholder="เนื้อหารายงาน"
                  rows={10}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleUpdateReport}>บันทึก</Button>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
};

export default Reports;