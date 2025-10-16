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
import { ShoppingCart, Plus, Search, Eye, Edit, TrendingUp, Package, DollarSign, Printer, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

interface Sale {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  products: string[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  orderDate: string;
  deliveryDate?: string;
  paymentMethod: 'cash' | 'transfer' | 'credit';
  paymentStatus: 'paid' | 'pending' | 'overdue';
}

const Sales = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]); // State for products
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('10');
  const [newSale, setNewSale] = useState<Partial<Sale>>({
    orderNumber: '',
    customerName: '',
    customerEmail: '',
    products: [],
    totalAmount: 0,
    status: 'pending',
    orderDate: '',
    deliveryDate: '',
    paymentMethod: 'cash',
    paymentStatus: 'pending'
  });
  const [editingSale, setEditingSale] = useState<Partial<Sale> | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { cart, setCart } = useCart();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const navigate = useNavigate();

  // สร้างรายการหมวดหมู่จาก products
  interface Product {
    id: string;
    name: string;
    category: string;
    stock: number;
    unit: string;
    pricePerUnit: number;
    status: string;
    [key: string]: any;
  }
  const categories = Array.from(new Set(products.map((prod: Product) => prod.category))).filter(Boolean);

  const fetchSales = async () => {
    try {
      const res = await fetch('http://localhost:3001/sales');
      if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลได้');
      const data = await res.json();
      setSales(data);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + (err as Error).message);
    }
  };

  const fetchCustomers = async () => {
    const res = await fetch('http://localhost:3001/customers');
    const data = await res.json();
    setCustomers(data); // เพิ่มบรรทัดนี้
  };

  const fetchProducts = async () => {
    const res = await fetch('http://localhost:3001/products');
    let data = await res.json();
    // อัปเดตสถานะอัตโนมัติ
    data = data.map((prod: any) => ({
      ...prod,
      status: prod.stock === 0
        ? 'out-of-stock'
        : 'available'
    }));
    setProducts(data);
  };

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchProducts(); // Fetch products on mount
  }, []);

  // Only staff can access this page
  if (user?.role !== 'staff' && user?.role !== 'president') {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-muted-foreground">คุณไม่มีสิทธิ์ในการเข้าถึงระบบจัดการการขาย</p>
      </div>
    );
  }

  // กรองออเดอร์ตามปีและเดือนที่เลือก
  const filteredSales = sales.filter(sale => {
    const orderNumber = (sale.orderNumber ?? '').toLowerCase();
    const customerName = (sale.customerName ?? '').toLowerCase();
    const customerEmail = (sale.customerEmail ?? '').toLowerCase();
    const matchesSearch =
      orderNumber.includes(searchTerm.toLowerCase()) ||
      customerName.includes(searchTerm.toLowerCase()) ||
      customerEmail.includes(searchTerm.toLowerCase());
    const saleDate = sale.orderDate.split('-'); // ['2025', '10', ...]
    const matchesYear = saleDate[0] === selectedYear;
    const matchesMonth = selectedMonth === 'all' ? true : saleDate[1] === selectedMonth;
    return matchesSearch && matchesYear && matchesMonth;
  });

  const filteredProducts = products.filter(product => {
    const name = (product.name ?? '').toLowerCase();
    const category = (product.category ?? '').toLowerCase();
    const matchesSearch =
      name.includes(searchText.toLowerCase()) ||
      category.includes(searchText.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddSale = async () => {
    setNewSale({
      orderNumber: getNextOrderNumber(sales),
      customerName: '',
      customerEmail: '',
      products: cart.map(item => item.name), // ใช้สินค้าจากตะกร้า
      totalAmount: cart.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0),
      status: 'pending',
      orderDate: '',
      deliveryDate: '',
      paymentMethod: 'cash',
      paymentStatus: 'pending'
    });
    setIsDialogOpen(true);
  };

  const handleViewSale = (sale: Sale) => {
    setViewingSale(sale);
  };

  const handleStatusChange = async (id: string, newStatus: Sale['status']) => {
    try {
      // อัพเดทสถานะในฐานข้อมูล
      const res = await fetch(`http://localhost:3001/sales/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('อัพเดทสถานะไม่สำเร็จ');
      // โหลดข้อมูลใหม่หลังอัพเดท
      fetchSales();
      toast({
        title: "อัพเดทสถานะสำเร็จ",
        description: "สถานะคำสั่งซื้อถูกอัพเดทแล้ว"
      });
    } catch (err) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: (err as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleSaveSale = async () => {
    try {
      // สมมติว่าคุณมีตัวแปร selectedCustomerId ที่เก็บ id ของลูกค้าที่เลือก
      const selectedCustomer = customers.find((c: any) => c.id === newSale.customerName || c.name === newSale.customerName);
      if (!selectedCustomer) {
        alert('กรุณาเลือกลูกค้า');
        return;
      }
      const res = await fetch('http://localhost:3001/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id, // ต้องตรงกับ id ใน customers
          customerName: selectedCustomer.name,
          products: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.pricePerUnit
          })),
          totalAmount: cart.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0),
          orderDate: new Date().toISOString().slice(0, 10),
          paymentMethod: newSale.paymentMethod,
          paymentStatus: 'completed'
        })
      });
      const data = await res.json();
      if (data.error) {
        alert('เกิดข้อผิดพลาด: ' + data.error);
        return;
      }
      setIsDialogOpen(false);
      fetchSales(); // โหลดข้อมูลใหม่หลังบันทึก
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err);
    }
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale({ ...sale }); // สำเนาข้อมูลเพื่อแก้ไข
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSale?.id) return;
    try {
      const res = await fetch(`http://localhost:3001/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSale)
      });
      const data = await res.json();
      if (data.error) {
        alert('เกิดข้อผิดพลาด: ' + data.error);
        return;
      }
      setEditDialogOpen(false);
      setEditingSale(null);
      fetchSales(); // โหลดข้อมูลใหม่หลังบันทึก
      toast({
        title: "อัพเดทออเดอร์สำเร็จ",
        description: "ข้อมูลออเดอร์ถูกอัพเดทแล้ว"
      });
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err);
    }
  };

  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
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
  };

  const getStatusColor = (status: Sale['status']) => {
    switch (status) {
      case 'pending': return 'default';
      case 'confirmed': return 'secondary';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusText = (status: Sale['status']) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'confirmed': return 'ยืนยันแล้ว';
      case 'delivered': return 'จัดส่งแล้ว';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  function getNextOrderNumber(sales: Sale[]): string {
    // หาเลขออเดอร์สูงสุดที่มีอยู่
    const numbers = sales
      .map(s => s.orderNumber)
      .map(num => {
        const match = num.match(/ORD-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    return `ORD-${nextNum}`;
  }

  return (
    <div className="p-6 space-y-6">
      {/* ไอคอนรถเข็นมุมขวาบน */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="ค้นหาสินค้า หรือหมวดหมู่..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <Select
            value={selectedCategory}
            onValueChange={val => setSelectedCategory(val)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="เลือกหมวดหมู่" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCartDialogOpen(true)}
          >
            <ShoppingCart className="h-6 w-6" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full px-2 text-xs">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ตารางสินค้า */}
      <Card>
        <CardHeader>
          <CardTitle>รายการสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead>จำนวน</TableHead>
                <TableHead>ราคา (บาท)</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ตะกร้า</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((prod: any) => {
                const cartItem = cart.find(item => item.id === prod.id);
                const availableStock = prod.stock - (cartItem?.quantity || 0);
                return (
                  <TableRow key={prod.id}>
                    <TableCell>{prod.name}</TableCell>
                    <TableCell>{prod.category}</TableCell>
                    <TableCell>
                      {prod.stock > 0
                        ? `${prod.stock.toLocaleString()} ${prod.unit}`
                        : <span className="text-destructive font-bold">หมดแล้ว</span>
                      }
                    </TableCell>
                    <TableCell>
                      {prod.pricePerUnit !== undefined ? `฿${prod.pricePerUnit}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        prod.status === 'out-of-stock'
                          ? 'destructive'
                          : 'default'
                      }>
                        {prod.status === 'out-of-stock'
                          ? 'หมดแล้ว'
                          : 'พร้อมขาย'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCart(prev => {
                            const found = prev.find(item => item.id === prod.id);
                            if (found) {
                              if (found.quantity < prod.stock) {
                                return prev.map(item =>
                                  item.id === prod.id
                                    ? { ...item, quantity: item.quantity + 1 }
                                    : item
                                );
                              }
                              return prev;
                            }
                            return [...prev, { ...prod, quantity: 1 }];
                          });
                        }}
                        disabled={prod.stock <= 0}
                      >
                        หยิบใส่ตะกร้า
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cart Dialog */}
      <Dialog open={cartDialogOpen} onOpenChange={setCartDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <ShoppingCart className="inline-block mr-2" /> ตะกร้าสินค้า
            </DialogTitle>
          </DialogHeader>
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">ยังไม่มีสินค้าในตะกร้า</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อสินค้า</TableHead>
                    <TableHead>หมวดหมู่</TableHead>
                    <TableHead>จำนวน</TableHead>
                    <TableHead>ราคา (บาท)</TableHead>
                    <TableHead>ลบ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map(item => {
                    const prod = products.find((p: any) => p.id === item.id);
                    const maxQty = prod ? prod.stock : 1;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (item.quantity > 1) {
                                  setCart(prev =>
                                    prev.map(prod =>
                                      prod.id === item.id
                                        ? { ...prod, quantity: prod.quantity - 1 }
                                        : prod
                                    )
                                  );
                                }
                              }}
                              disabled={item.quantity <= 1}
                            >
                              -
                            </Button>
                            <span className="min-w-[32px] text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (item.quantity < maxQty) {
                                  setCart(prev =>
                                    prev.map(prod =>
                                      prod.id === item.id
                                        ? { ...prod, quantity: prod.quantity + 1 }
                                        : prod
                                    )
                                  );
                                }
                              }}
                              disabled={item.quantity >= maxQty || maxQty <= 0}
                            >
                              +
                            </Button>
                            <span className="text-xs text-muted-foreground ml-2">
                              (เหลือ {maxQty})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>฿{item.pricePerUnit}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setCart(prev => prev.filter(prod => prod.id !== item.id))}
                          >
                            ลบ
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-2 text-right font-bold">
                ยอดรวม: ฿{cart.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0).toLocaleString()}
              </div>
              {cart.length > 0 && (
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    onClick={() => {
                      setCartDialogOpen(false);
                      navigate('/checkout');
                    }}
                    className="bg-primary text-white"
                  >
                    สั่งสินค้า
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;