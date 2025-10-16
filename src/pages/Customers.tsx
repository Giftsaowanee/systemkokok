import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Search, Edit, Eye, Phone, MapPin, Printer } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  joinDate?: string;
  status?: 'active' | 'inactive';
  product?: string;
}

interface Sale {
  id: number;
  customerId: number;
  customerName: string;
  products: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  orderDate: string;
  deliveryDate?: string;
  paymentMethod?: 'cash' | 'credit' | 'debit';
  paymentStatus?: 'pending' | 'completed' | 'failed';
}

const Customers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [viewingOrders, setViewingOrders] = useState<{ customer: Customer, orders: Sale[] } | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    totalOrders: 0,
    totalSpent: 0,
    product: ''
  });
  const [viewOrderDetail, setViewOrderDetail] = useState<Sale | null>(null);

  // ดึงข้อมูลลูกค้าทั้งหมดและการขาย (ออเดอร์) ทั้งหมดจาก backend
  useEffect(() => {
    fetchCustomers();
    fetchSales();
  }, []);

  // Only staff can access this page
  if (user?.role !== 'staff') {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-muted-foreground">คุณไม่มีสิทธิ์ในการเข้าถึงระบบจัดการลูกค้า</p>
      </div>
    );
  }

  const fetchCustomers = async () => {
    const res = await fetch('http://localhost:3001/customers');
    setCustomers(await res.json());
  };

  const fetchSales = async () => {
    const res = await fetch('http://localhost:3001/sales');
    setSales(await res.json());
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      totalOrders: 0,
      totalSpent: 0,
      product: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email ?? '',
      phone: customer.phone,
      address: customer.address ?? '',
      totalOrders: customer.totalOrders ?? 0,
      totalSpent: customer.totalSpent ?? 0,
      product: customer.product ?? ''
    });
    setIsDialogOpen(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setViewingCustomer(customer);
  };

  // ฟังก์ชันบันทึกข้อมูลลูกค้าใหม่
  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
    // เพิ่มลูกค้าใหม่
    const res = await fetch('http://localhost:3001/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    const data = await res.json();
    setCustomers(prev => [data, ...prev]);
    setIsDialogOpen(false);
    toast({
      title: "บันทึกสำเร็จ",
      description: "เพิ่มลูกค้าใหม่แล้ว"
    });

    // สร้างออเดอร์ใหม่ให้อัตโนมัติ
    const newOrder = {
      orderNumber: `ORD-${String(Date.now()).slice(-3)}`, // สร้างเลขออเดอร์ใหม่
      customerId: data.id, // id ลูกค้าที่สั่งซื้อ
      customerName: data.name,
      products: data.product ? [data.product] : [],
      totalAmount: data.totalSpent || 0,
      status: 'pending',
      orderDate: new Date().toISOString().slice(0, 10),
      deliveryDate: '',
      paymentMethod: 'cash',
      paymentStatus: 'pending'
    };
    await fetch('http://localhost:3001/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: data.id, // id ลูกค้าที่สั่งซื้อ
        customerName: data.name,
        products: data.product ? [data.product] : [],
        totalAmount: data.totalSpent || 0,
        orderDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'cash',
        paymentStatus: 'pending'
      })
    });
  };

  // ฟังก์ชันบันทึกการแก้ไขลูกค้า
  const handleUpdateCustomer = async (customerId: number, customerData: Partial<Customer>) => {
    const res = await fetch(`http://localhost:3001/customers/${customerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    const data = await res.json();
    setCustomers(prev => prev.map(c => c.id === customerId ? data : c));
    setIsDialogOpen(false);
    toast({
      title: "บันทึกสำเร็จ",
      description: "แก้ไขข้อมูลลูกค้าแล้ว"
    });
  };

  const handleDeleteCustomer = async (customerId: number) => {
    if (!window.confirm('คุณต้องการลบลูกค้ารายนี้ใช่หรือไม่?')) return;
    const res = await fetch(`http://localhost:3001/customers/${customerId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      toast({
        title: "ลบข้อมูลสำเร็จ",
        description: "ลูกค้าถูกลบออกจากระบบแล้ว"
      });
    } else {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบลูกค้าได้",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการข้อมูลลูกค้า</h1>
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
            <Button onClick={handleAddCustomer} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มลูกค้า
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
  <DialogHeader>
    <DialogTitle>
      {editingCustomer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
    </DialogTitle>
  </DialogHeader>
  <div className="grid gap-4 py-4">
    {/* ชื่อลูกค้า */}
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="name" className="text-right">ชื่อลูกค้า</Label>
      <Input
        id="name"
        placeholder="ชื่อลูกค้า/บริษัท"
        className="col-span-3"
        value={customerForm.name}
        onChange={e => setCustomerForm(f => ({ ...f, name: e.target.value }))}
      />
    </div>
    {/* โทรศัพท์ */}
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="phone" className="text-right">โทรศัพท์</Label>
      <Input
        id="phone"
        placeholder="เบอร์โทรศัพท์"
        className="col-span-3"
        value={customerForm.phone}
        maxLength={10}
        onChange={e => {
          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
          setCustomerForm(f => ({ ...f, phone: value }));
        }}
      />
    </div>
    {/* ที่อยู่ */}
    <div className="grid grid-cols-4 items-start gap-4">
      <Label htmlFor="address" className="text-right mt-2">ที่อยู่</Label>
      <Textarea
        id="address"
        placeholder="ที่อยู่"
        className="col-span-3"
        value={customerForm.address}
        onChange={e => setCustomerForm(f => ({ ...f, address: e.target.value }))}
      />
    </div>
  </div>
  <div className="flex justify-end space-x-2">
    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
    <Button
      onClick={() => {
        if (editingCustomer) {
          handleUpdateCustomer(editingCustomer.id, customerForm);
        } else {
          handleSaveCustomer(customerForm);
        }
      }}
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
            <CardTitle className="text-sm font-medium">ลูกค้าทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาลูกค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายชื่อลูกค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อลูกค้า</TableHead>
                <TableHead>โทรศัพท์</TableHead>
                <TableHead>ที่อยู่</TableHead>
                <TableHead>จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.address}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setViewingOrders({
                            customer,
                            orders: sales.filter(sale => sale.customerId === customer.id)
                          })
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCustomer(customer.id)}
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

      {/* View Customer Dialog */}
      <Dialog open={!!viewingCustomer} onOpenChange={() => setViewingCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ข้อมูลลูกค้า</DialogTitle>
          </DialogHeader>
          {viewingCustomer && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">ชื่อลูกค้า</Label>
                  <p className="text-sm text-muted-foreground">{viewingCustomer.name}</p>
                </div>
                <div>
                  <Label className="font-semibold">โทรศัพท์</Label>
                  <p className="text-sm text-muted-foreground">{viewingCustomer.phone}</p>
                </div>
                <div>
                  <Label className="font-semibold">สถานะ</Label>
                  <Badge variant={viewingCustomer.status === 'active' ? 'default' : 'destructive'}>
                    {viewingCustomer.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <Label className="font-semibold">ที่อยู่</Label>
                  <p className="text-sm text-muted-foreground">{viewingCustomer.address}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog ดูการสั่งซื้อ */}
      <Dialog open={!!viewingOrders} onOpenChange={() => setViewingOrders(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              ประวัติการซื้อของ&nbsp;
              <span className="inline-block mr-2">{viewingOrders?.customer?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่สั่งซื้อ</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>จำนวน</TableHead>
                <TableHead>ยอดรวม (บาท)</TableHead>
                <TableHead>ดูรายละเอียด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(viewingOrders?.orders ?? []).map(sale => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.orderDate}</TableCell>
                  <TableCell>{sale.products.map(p => p.name).join(', ')}</TableCell>
                  <TableCell>{sale.products.reduce((sum, p) => sum + p.quantity, 0)}</TableCell>
                  <TableCell>฿{sale.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewOrderDetail(sale)}
                    >
                      ดูรายละเอียด
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(viewingOrders?.orders.length ?? 0) === 0 && (
            <div className="text-muted-foreground py-4 text-center">ยังไม่มีประวัติการซื้อ</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase History Card */}
  

      {/* Dialog แสดงรายละเอียดสินค้าในออเดอร์ */}
      <Dialog open={!!viewOrderDetail} onOpenChange={() => setViewOrderDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              <span className="inline-block mr-2">รายละเอียดการสั่งซื้อ</span>
              {viewOrderDetail?.customerName}
            </DialogTitle>
          </DialogHeader>
          {viewOrderDetail && (
            <form className="space-y-4">
        <div>
          <Label className="font-semibold">วันที่สั่งซื้อ</Label>
          <Input readOnly value={viewOrderDetail.orderDate} />
        </div>
        <div>
          <Label className="font-semibold">ชื่อลูกค้า</Label>
          <Input readOnly value={viewOrderDetail.customerName} />
        </div>
        <div>
          <Label className="font-semibold">วิธีการชำระเงิน</Label>
          <Input readOnly value={
            viewOrderDetail.paymentMethod === 'cash' ? 'เงินสด'
            : viewOrderDetail.paymentMethod === 'credit' ? 'บัตรเครดิต'
            : viewOrderDetail.paymentMethod === 'debit' ? 'บัตรเดบิต'
            : '-'
          } />
        </div>
        <div>
          <Label className="font-semibold">สถานะการชำระเงิน</Label>
          <Input readOnly value={
            viewOrderDetail.paymentStatus === 'completed' ? 'ชำระแล้ว'
            : viewOrderDetail.paymentStatus === 'pending' ? 'รอชำระ'
            : viewOrderDetail.paymentStatus === 'failed' ? 'ไม่สำเร็จ'
            : '-'
          } />
        </div>
        <div>
          <Label className="font-semibold">รายการสินค้า</Label>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead>จำนวน</TableHead>
                <TableHead>ราคา/หน่วย</TableHead>
                <TableHead>รวม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewOrderDetail.products.map((p, idx) => (
                <TableRow key={idx}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.quantity}</TableCell>
                  <TableCell>฿{p.price}</TableCell>
                  <TableCell>฿{(p.price * p.quantity).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="text-right font-bold mt-2">
          ยอดรวม: ฿{viewOrderDetail.totalAmount.toLocaleString()}
        </div>
      </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;