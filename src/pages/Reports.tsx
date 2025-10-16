import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, TrendingUp, TrendingDown, BarChart3, PieChart, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import { Label } from '@/components/ui/label';

interface ReportData {
  period: string;
  sales: number;
  expenses: number;
  profit: number;
  orders: number;
  customers: number;
}

interface ProductReport {
  product: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

interface Member {
  id: number;
  name: string;
  shares: number;
  // Add other member properties as needed
}

const mockMonthlyData: ReportData[] = [
  {
    period: '2024-01',
    sales: 45000,
    expenses: 32000,
    profit: 13000,
    orders: 28,
    customers: 15
  },
  {
    period: '2023-12',
    sales: 38000,
    expenses: 28000,
    profit: 10000,
    orders: 22,
    customers: 12
  },
  {
    period: '2023-11',
    sales: 42000,
    expenses: 30000,
    profit: 12000,
    orders: 25,
    customers: 14
  }
];

const mockProductData: ProductReport[] = [
  {
    product: 'ลิ้นจี่สด',
    quantity: 120,
    revenue: 18000,
    percentage: 40
  },
  {
    product: 'ลำไย',
    quantity: 80,
    revenue: 12000,
    percentage: 27
  },
  {
    product: 'มะม่วงน้ำดอกไม้',
    quantity: 60,
    revenue: 9000,
    percentage: 20
  },
  {
    product: 'มะม่วงพันธุ์อื่น',
    quantity: 40,
    revenue: 6000,
    percentage: 13
  }
];

const Reports = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedReport, setSelectedReport] = useState('financial');
  const [selectedMonth, setSelectedMonth] = useState('01'); // ค่าเริ่มต้นเป็นเดือนมกราคม
  const [members, setMembers] = useState<Member[]>([]);
  interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    // Add other customer properties as needed
  }
  const [customers, setCustomers] = useState<Customer[]>([]);
  interface Sale {
    orderNumber: string;
    customerName: string;
    products?: string[];
    totalAmount?: number;
    orderDate?: string;
    status?: string;
    // Add other sale properties as needed
  }
  const [sales, setSales] = useState<Sale[]>([]);
  interface Transaction {
    id?: number;
    type: string;
    amount: number;
    date: string;
    customerId?: number;
    description?: string;
    // Add other transaction properties as needed
  }
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const monthOptions = [
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

  useEffect(() => {
    fetch('http://localhost:3001/transactions')
      .then(res => res.json())
      .then(data => setTransactions(data));
  }, []);

  useEffect(() => {
    // โหลดข้อมูลสมาชิก
    fetch('http://localhost:3001/members')
      .then(res => res.json())
      .then(data => setMembers(data));
  }, []);

  useEffect(() => {
    fetch('http://localhost:3001/customers')
      .then(res => res.json())
      .then(data => setCustomers(data));
  }, []);

  useEffect(() => {
    fetch('http://localhost:3001/sales')
      .then(res => res.json())
      .then(data => setSales(data));
  }, []);

  const getSummaryFromAccounting = () => {
    let sales = 0, expenses = 0, profit = 0, orders = 0, customers = 0;
    transactions.forEach(item => {
      if (item.type === 'sale') {
        sales += item.amount;
        orders += 1;
        if (item.customerId) customers += 1;
      }
      if (item.type === 'expense') {
        expenses += item.amount;
      }
    });
    profit = sales - expenses;
    return { sales, expenses, profit, orders, customers };
  };

  const summary = getSummaryFromAccounting();

  // Only president and staff can access this page
  if (!['president', 'staff'].includes(user?.role || '')) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-muted-foreground">คุณไม่มีสิทธิ์ในการเข้าถึงระบบรายงาน</p>
      </div>
    );
  };

  const monthlyReportData = getMonthlyReportData();

  const currentData = monthlyReportData[0] || {
    sales: 0, expenses: 0, profit: 0, orders: 0, customers: 0
  };
  const previousData = monthlyReportData[1] || {
    sales: 0, expenses: 0, profit: 0, orders: 0, customers: 0
  };

  const calculateGrowth = (current: number, previous: number) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const handleExportReport = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);

    if (selectedReport === 'financial') {
      doc.text('รายงานการเงิน', 20, 20);
      doc.text('เดือน', 20, 35);
      doc.text('ยอดขาย', 45, 35);
      doc.text('รายจ่าย', 75, 35);
      doc.text('กำไรสุทธิ', 105, 35);
      doc.text('ออเดอร์', 135, 35);
      doc.text('ลูกค้า', 165, 35);

      monthlyReportData.forEach((data, idx) => {
        const y = 45 + idx * 10;
        doc.text(data.period, 20, y);
        doc.text(data.sales.toLocaleString(), 45, y);
        doc.text(data.expenses.toLocaleString(), 75, y);
        doc.text(data.profit.toLocaleString(), 105, y);
        doc.text(data.orders.toString(), 135, y);
        doc.text(data.customers.toString(), 165, y);
      });
    } else if (selectedReport === 'sales') {
      doc.text('รายงานยอดขาย', 20, 20);
      doc.text('หมายเลขออเดอร์', 20, 35);
      doc.text('ชื่อลูกค้า', 60, 35);
      doc.text('ประเภทสินค้า', 100, 35);
      doc.text('ยอดรวม', 140, 35);

      sales.forEach((sale, idx) => {
        const y = 45 + idx * 10;
        doc.text(sale.orderNumber, 20, y);
        doc.text(sale.customerName, 60, y);
        doc.text((sale.products || []).join(', '), 100, y);
        doc.text('฿' + (sale.totalAmount || 0).toLocaleString(), 140, y);
      });
    } else if (selectedReport === 'customers') {
      doc.text('รายงานลูกค้า', 20, 20);
      doc.text('ชื่อลูกค้า', 20, 35);
      doc.text('อีเมล', 70, 35);
      doc.text('เบอร์โทร', 120, 35);
      doc.text('ที่อยู่', 170, 35);

      customers.forEach((customer, idx) => {
        const y = 45 + idx * 10;
        doc.text(customer.name, 20, y);
        doc.text(customer.email || '', 70, y);
        doc.text(customer.phone || '', 120, y);
        doc.text(customer.address || '', 170, y);
      });
    } else if (selectedReport === 'dividends') {
      doc.text('รายงานปันผล', 20, 20);
      doc.text('วันที่', 20, 35);
      doc.text('รายละเอียด', 70, 35);
      doc.text('จำนวนเงิน', 140, 35);

      dividendTransactions.forEach((row, idx) => {
        const y = 45 + idx * 10;
        doc.text(row.date, 20, y);
        doc.text(row.description || '', 70, y);
        doc.text('฿' + (row.amount || 0).toLocaleString(), 140, y);
      });

      // เพิ่มข้อมูลสมาชิกและหุ้น
      doc.text('สมาชิกและหุ้น', 20, 65 + dividendTransactions.length * 10);
      doc.text('ชื่อสมาชิก', 20, 80 + dividendTransactions.length * 10);
      doc.text('จำนวนหุ้น', 70, 80 + dividendTransactions.length * 10);
      doc.text('ปันผลที่ได้รับ', 120, 80 + dividendTransactions.length * 10);

      const totalDividend = dividendTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalShares = members.reduce((sum, m) => sum + (m.shares || 0), 0);
      const dividendPerShare = totalShares > 0 ? totalDividend / totalShares : 0;

      members.forEach((m, idx) => {
        const y = 90 + dividendTransactions.length * 10 + idx * 10;
        doc.text(m.name, 20, y);
        doc.text((m.shares || 0).toString(), 70, y);
        doc.text('฿' + ((m.shares || 0) * dividendPerShare).toLocaleString(undefined, { minimumFractionDigits: 2 }), 120, y);
      });
    }

    doc.save(`report-${selectedReport}-${selectedPeriod}.pdf`);
  };

  const renderFinancialReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดขาย</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ฿{currentData.sales.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              +{calculateGrowth(currentData.sales, previousData.sales)}% จากเดือนที่แล้ว
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายจ่าย</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ฿{currentData.expenses.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              +{calculateGrowth(currentData.expenses, previousData.expenses)}% จากเดือนที่แล้ว
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำไรสุทธิ</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ฿{currentData.profit.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              +{calculateGrowth(currentData.profit, previousData.profit)}% จากเดือนที่แล้ว
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ออเดอร์</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {currentData.orders}
            </div>
            <div className="text-xs text-muted-foreground">
              +{calculateGrowth(currentData.orders, previousData.orders)}% จากเดือนที่แล้ว
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>เปรียบเทียบรายเดือน</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เดือน</TableHead>
                <TableHead>ยอดขาย</TableHead>
                <TableHead>รายจ่าย</TableHead>
                <TableHead>กำไรสุทธิ</TableHead>
                <TableHead>ออเดอร์</TableHead>
                <TableHead>ลูกค้า</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyReportData.map((data) => (
                <TableRow key={data.period}>
                  <TableCell className="font-medium">{data.period}</TableCell>
                  <TableCell className="text-green-600">฿{data.sales.toLocaleString()}</TableCell>
                  <TableCell className="text-red-600">฿{data.expenses.toLocaleString()}</TableCell>
                  <TableCell className="text-blue-600">฿{data.profit.toLocaleString()}</TableCell>
                  <TableCell>{data.orders}</TableCell>
                  <TableCell>{data.customers}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderSalesReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>รายงานยอดขาย</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>หมายเลขออเดอร์</TableHead>
                <TableHead>ชื่อลูกค้า</TableHead>
                <TableHead>ประเภทสินค้า</TableHead>
                <TableHead>ยอดรวม</TableHead>
                <TableHead>วันที่สั่ง</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => {
                const customer = customers.find(c => c.name === sale.customerName);
                return (
                  <TableRow key={sale.orderNumber}>
                    <TableCell>{sale.orderNumber}</TableCell>
                    <TableCell>
                      {customer ? (
                        <>
                          {customer.name}
                          <div className="text-xs text-muted-foreground">{customer.email}</div>
                        </>
                      ) : sale.customerName}
                    </TableCell>
                    <TableCell>{sale.products?.join(', ')}</TableCell>
                    <TableCell>฿{sale.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>{sale.orderDate}</TableCell>
                    <TableCell>{sale.status}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderCustomerReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>รายชื่อลูกค้าทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อลูกค้า</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>เบอร์โทร</TableHead>
                <TableHead>ที่อยู่</TableHead> {/* เปลี่ยนจากวันที่สมัครเป็นที่อยู่ */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.address || '-'}</TableCell> {/* แสดงที่อยู่ */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // กรองเฉพาะรายการปันผล
  const dividendTransactions = transactions.filter(t => t.type === 'dividend');

  // คำนวณยอดรวมปันผล
  const totalDividend = dividendTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  const renderDividendReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>รายงานปันผล</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead>จำนวนเงิน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dividendTransactions.map((t, idx) => (
                <TableRow key={idx}>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>฿{t.amount?.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} className="font-bold text-right">รวม</TableCell>
                <TableCell className="font-bold text-green-600">฿{totalDividend.toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  function getMonthlyReportData() {
    const monthlyMap: { [period: string]: ReportData } = {};

    transactions.forEach(item => {
      const period = item.date.slice(0, 7); // 'YYYY-MM'
      if (!monthlyMap[period]) {
        monthlyMap[period] = {
          period,
          sales: 0,
          expenses: 0,
          profit: 0,
          orders: 0,
          customers: 0
        };
      }
      if (item.type === 'sale') {
        monthlyMap[period].sales += item.amount;
        monthlyMap[period].orders += 1;
        if (item.customerId) monthlyMap[period].customers += 1;
      }
      if (item.type === 'expense') {
        monthlyMap[period].expenses += item.amount;
      }
      monthlyMap[period].profit = monthlyMap[period].sales - monthlyMap[period].expenses;
    });

    return Object.values(monthlyMap).sort((a, b) => b.period.localeCompare(a.period));
  }

  return (
    <div className="p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-2xl font-bold">รายงาน</h1>
          <Button onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            ดาวน์โหลดรายงาน
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full md:w-auto">
              <SelectValue placeholder="เลือกช่วงเวลา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">รายวัน</SelectItem>
              <SelectItem value="monthly">รายเดือน</SelectItem>
              <SelectItem value="yearly">รายปี</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-full md:w-auto">
              <SelectValue placeholder="เลือกรายงาน" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financial">รายงานการเงิน</SelectItem>
              <SelectItem value="sales">รายงานยอดขาย</SelectItem>
              <SelectItem value="customers">รายงานลูกค้า</SelectItem>
              <SelectItem value="dividends">รายงานปันผล</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedReport === 'financial' && renderFinancialReport()}
        {selectedReport === 'sales' && renderSalesReport()}
        {selectedReport === 'customers' && renderCustomerReport()}
        {selectedReport === 'dividends' && renderDividendReport()}
      </div>
    </div>
  );
};

export default Reports;