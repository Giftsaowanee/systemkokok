import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, TrendingUp, TrendingDown, CreditCard, Banknote, Printer, Filter, X } from 'lucide-react';

interface AccountingRecord {
  finance_id: number;
  type: string;
  income: number;
  expense: number;
  amount: number;
  description: string;
  transaction_date: string;
  profit: number;
  dividend: number;
  share: number;
  person_name: string;
  category: string;
  is_loss?: boolean;
}

const Accounting = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accountingData, setAccountingData] = useState<AccountingRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AccountingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dividendPerShare, setDividendPerShare] = useState(0);
  const [isProfit, setIsProfit] = useState(true);
  
  // ตัวแปรสำหรับการกรอง
  const [typeFilter, setTypeFilter] = useState<string>('ทั้งหมด');
  const [categoryFilter, setCategoryFilter] = useState<string>('ทั้งหมด');
  const [personFilter, setPersonFilter] = useState<string>('');

  // Only president and staff can access this page
  if (user?.role !== 'president' && user?.role !== 'staff') {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-muted-foreground">คุณไม่มีสิทธิ์ในการเข้าถึงระบบจัดการบัญชี</p>
      </div>
    );
  }

  // ดึงข้อมูลบัญชี
  const fetchAccountingRecords = async () => {
    setLoading(true);
    try {
      console.log('Fetching accounting records...');
      const response = await fetch('http://localhost:3001/accounting');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched accounting data:', data);
      setAccountingData(data.data || data);
      setFilteredData(data.data || data);
      setDividendPerShare(data.dividend_per_share || 0);
      setIsProfit(data.is_profit !== false);
    } catch (error) {
      console.error('Error fetching accounting records:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลบัญชีได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // กรองข้อมูล
  const applyFilters = () => {
    let filtered = [...accountingData];

    // กรองตามประเภท (รายรับ/รายจ่าย)
    if (typeFilter !== 'ทั้งหมด') {
      filtered = filtered.filter(record => record.type === typeFilter);
    }

    // กรองตามหมวดหมู่ (หุ้น/การขาย/ผลผลิต)
    if (categoryFilter !== 'ทั้งหมด') {
      filtered = filtered.filter(record => record.category === categoryFilter);
    }

    // กรองตามชื่อบุคคล
    if (personFilter) {
      filtered = filtered.filter(record => 
        record.person_name.toLowerCase().includes(personFilter.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  // เคลียร์ตัวกรอง
  const clearFilters = () => {
    setTypeFilter('ทั้งหมด');
    setCategoryFilter('ทั้งหมด');
    setPersonFilter('');
    setFilteredData(accountingData);
  };

  // คำนวณสรุปยอด
  const calculateSummary = () => {
    const totalIncome = filteredData.reduce((sum, record) => sum + record.income, 0);
    const totalExpense = filteredData.reduce((sum, record) => sum + record.expense, 0);
    const netProfit = totalIncome - totalExpense;
    
    return { totalIncome, totalExpense, netProfit };
  };

  // ใช้ useEffect เพื่อกรองข้อมูลเมื่อตัวกรองเปลี่ยน
  useEffect(() => {
    applyFilters();
  }, [typeFilter, categoryFilter, personFilter, accountingData]);

  // ดึงข้อมูลเมื่อ component โหลด
  useEffect(() => {
    fetchAccountingRecords();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const { totalIncome, totalExpense, netProfit } = calculateSummary();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">บัญชีรายบุคคล</h1>
          <p className="text-muted-foreground">แสดงข้อมูลรายรับ-รายจ่ายแยกตามบุคคล</p>
        </div>
        <Button onClick={fetchAccountingRecords} disabled={loading} variant="outline">
          {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายรับรวม</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              จากรายการที่แสดง {filteredData.filter(r => r.type === 'รายรับ').length} รายการ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายจ่ายรวม</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground">
              จากรายการที่แสดง {filteredData.filter(r => r.type === 'รายจ่าย').length} รายการ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำไรสุทธิ</CardTitle>
            <Banknote className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              รายรับ - รายจ่าย
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              ตัวกรองข้อมูล
            </CardTitle>
            <Button 
              onClick={clearFilters} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              ล้างตัวกรอง
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ประเภท */}
            <div>
              <label className="text-sm font-medium mb-2 block">ประเภท</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
                  <SelectItem value="รายรับ">รายรับ</SelectItem>
                  <SelectItem value="รายจ่าย">รายจ่าย</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* หมวดหมู่ */}
            <div>
              <label className="text-sm font-medium mb-2 block">หมวดหมู่</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
                  <SelectItem value="หุ้น">หุ้น</SelectItem>
                  <SelectItem value="การขาย">การขาย</SelectItem>
                  <SelectItem value="ผลผลิต">ผลผลิต</SelectItem>
                  <SelectItem value="ปันผล">ปันผล</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ชื่อบุคคล */}
            <div>
              <label className="text-sm font-medium mb-2 block">ชื่อบุคคล</label>
              <Input
                type="text"
                placeholder="ค้นหาชื่อบุคคล..."
                value={personFilter}
                onChange={(e) => setPersonFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>ข้อมูลบัญชีรายบุคคล</span>
            <Badge variant="secondary">
              แสดง {filteredData.length} รายการ จากทั้งหมด {accountingData.length} รายการ
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ลำดับ</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ชื่อบุคคล</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="text-right">จำนวนหุ้น</TableHead>
                  <TableHead className="text-right">รายรับปันผล</TableHead>
                  <TableHead className="text-right">รายรับ</TableHead>
                  <TableHead className="text-right">รายจ่าย</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      กำลังโหลดข้อมูล...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((record, index) => (
                    <TableRow key={record.finance_id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{formatDate(record.transaction_date)}</TableCell>
                      <TableCell className="font-medium">{record.person_name}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={record.type === 'รายรับ' ? 'default' : 'destructive'}
                          className={record.type === 'รายรับ' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {record.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {record.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={record.description}>
                        {record.description}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {record.category === 'หุ้น' ? (
                          <span className="text-blue-600 font-semibold">
                            {Math.round(record.amount / 1000)} หุ้น
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {record.category === 'หุ้น' ? (
                          // แสดงปันผลสำหรับคนที่ซื้อหุ้น โดยคำนวณจากจำนวนหุ้น
                          dividendPerShare > 0 ? (
                            isProfit ? (
                              <span className="text-purple-600 font-semibold">
                                +{formatCurrency(Math.round(record.amount / 1000) * dividendPerShare)}
                              </span>
                            ) : (
                              <span className="text-red-600 font-semibold">
                                -{formatCurrency(Math.round(record.amount / 1000) * dividendPerShare)}
                              </span>
                            )
                          ) : (
                            <span className="text-gray-400">-</span>
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {record.income > 0 && record.category !== 'ปันผล' ? (
                          <span className="text-green-600 font-semibold">
                            +{formatCurrency(record.income)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {record.expense > 0 ? (
                          <span className="text-red-600 font-semibold">
                            -{formatCurrency(record.expense)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Accounting;
