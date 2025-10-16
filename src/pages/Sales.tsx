import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Plus, Minus, Trash2, Printer, Search, Check } from 'lucide-react';

interface Product {
  production_id: number;
  product_name: string;
  category: string;
  member_name: string;
  staff_name: string;
  quantity: number;
  unit: string;
  price: number;
}

interface CartItem extends Product {
  cartQuantity: number;
}

interface Customer {
  customer_id: number;
  customer_name: string;
  phone: string;
  address?: string;
}

const Sales = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    
    // รีเฟรชข้อมูลสินค้าทุก 30 วินาที เพื่อดูการเปลี่ยนแปลงสต็อก
    const interval = setInterval(() => {
      fetchProducts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:3001/products');
      if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลสินค้าได้');
      const data = await res.json();
      // แปลงข้อมูลให้เป็น number
      const processedData = data.map((product: any) => ({
        ...product,
        quantity: Number(product.quantity || 0),
        price: Number(product.price || 0)
      }));
      setProducts(processedData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลสินค้าได้",
        variant: "destructive"
      });
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('http://localhost:3001/customers');
      if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลลูกค้าได้');
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลลูกค้าได้",
        variant: "destructive"
      });
    }
  };

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      toast({
        title: "สินค้าหมด",
        description: "สินค้าชิ้นนี้หมดแล้ว",
        variant: "destructive"
      });
      return;
    }

    setCart(prev => {
      const existingItem = prev.find(item => item.production_id === product.production_id);
      if (existingItem) {
        if (existingItem.cartQuantity >= product.quantity) {
          toast({
            title: "จำนวนไม่พอ",
            description: "สินค้าในคลังไม่พอ",
            variant: "destructive"
          });
          return prev;
        }
        return prev.map(item =>
          item.production_id === product.production_id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...product, cartQuantity: 1 }];
      }
    });

    toast({
      title: "เพิ่มสินค้าแล้ว",
      description: `เพิ่ม ${product.product_name} ลงตะกร้าแล้ว`
    });
  };

  const updateCartQuantity = (productionId: number, newQuantity: number) => {
    const product = products.find(p => p.production_id === productionId);
    if (!product) return;

    if (newQuantity <= 0) {
      removeFromCart(productionId);
      return;
    }

    if (newQuantity > product.quantity) {
      toast({
        title: "จำนวนไม่พอ",
        description: "สินค้าในคลังไม่พอ",
        variant: "destructive"
      });
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.production_id === productionId
          ? { ...item, cartQuantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productionId: number) => {
    setCart(prev => prev.filter(item => item.production_id !== productionId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setShowCheckout(false);
    setOrderConfirmed(false);
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.cartQuantity, 0);
  };

  const handleConfirmOrder = async () => {
    if (!selectedCustomer) {
      toast({
        title: "กรุณาเลือกลูกค้า",
        description: "กรุณาเลือกลูกค้าก่อนยืนยันคำสั่งซื้อ",
        variant: "destructive"
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "ตะกร้าว่าง",
        description: "กรุณาเพิ่มสินค้าลงตะกร้าก่อน",
        variant: "destructive"
      });
      return;
    }

    try {
      // บันทึกคำสั่งซื้อ
      const orderNumber = 'ORD-' + Date.now();
      const orderData = {
        orderNumber: orderNumber,
        customerId: selectedCustomer.customer_id,
        customerName: selectedCustomer.customer_name,
        products: cart.map(item => ({
          name: item.product_name,
          category: item.category,
          quantity: item.cartQuantity,
          price: item.price,
          unit: item.unit
        })),
        totalAmount: getTotalAmount(),
        orderDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        paymentStatus: 'pending'
      };

      const res = await fetch('http://localhost:3001/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!res.ok) throw new Error('ไม่สามารถบันทึกคำสั่งซื้อได้');

      const result = await res.json();
      setCurrentOrderId(orderNumber);

      // บันทึกประวัติการซื้อสำหรับแต่ละสินค้าในตะกร้า
      for (const item of cart) {
        const purchaseHistoryData = {
          customer_id: selectedCustomer.customer_id,
          order_number: orderNumber,
          product_name: item.product_name,
          category: item.category,
          quantity: item.cartQuantity,
          unit: item.unit,
          price_per_unit: item.price,
          total_price: item.price * item.cartQuantity,
          purchase_date: new Date().toISOString().split('T')[0],
          staff_name: user?.name || 'ไม่ระบุ'
        };

        try {
          const historyRes = await fetch('http://localhost:3001/purchase-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(purchaseHistoryData)
          });

          if (!historyRes.ok) {
            console.error('Failed to save purchase history for item:', item.product_name);
          }
        } catch (historyError) {
          console.error('Error saving purchase history:', historyError);
        }
      }

      setOrderConfirmed(true);

      // เรียกคำนวณบัญชีอัตโนมัติหลังจากบันทึกการขายเสร็จ
      try {
        await fetch('http://localhost:3001/accounting/auto-calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (autoCalcError) {
        console.error('Error in auto-calculate:', autoCalcError);
        // ไม่แสดง error toast เพราะไม่ใช่ปัญหาหลัก
      }

      toast({
        title: "ยืนยันคำสั่งซื้อแล้ว",
        description: "บันทึกคำสั่งซื้อและประวัติการซื้อเรียบร้อยแล้ว"
      });

    } catch (error) {
      console.error('Error confirming order:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถยืนยันคำสั่งซื้อได้",
        variant: "destructive"
      });
    }
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptContent = `
      <html>
        <head>
          <title>ใบเสร็จ</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .customer-info { margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            .total { font-weight: bold; font-size: 18px; }
            .footer { margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>กลุ่มวิสาหกิจชุมชนโคกก่อ</h2>
            <p>ใบเสร็จรับเงิน</p>
            <p>เลขที่: ${currentOrderId}</p>
            <p>วันที่: ${new Date().toLocaleDateString('th-TH')}</p>
          </div>
          
          <div class="customer-info">
            <p><strong>ลูกค้า:</strong> ${selectedCustomer?.customer_name}</p>
            <p><strong>โทรศัพท์:</strong> ${selectedCustomer?.phone}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>รายการ</th>
                <th>จำนวน</th>
                <th>ราคา/หน่วย</th>
                <th>รวม</th>
              </tr>
            </thead>
            <tbody>
              ${cart.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.cartQuantity} ${item.unit}</td>
                  <td>฿${item.price.toLocaleString()}</td>
                  <td>฿${(item.price * item.cartQuantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            <p>ยอดรวมทั้งสิ้น: ฿${getTotalAmount().toLocaleString()}</p>
          </div>

          <div class="footer">
            <p>ขอบคุณที่ใช้บริการ</p>
            <p>เจ้าหน้าที่: ${user?.name || 'ไม่ระบุ'}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Filter products
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">รายการสินค้า</h1>
          <p className="text-muted-foreground">เลือกสินค้าเพื่อเพิ่มลงตะกร้า</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            ตะกร้า ({getTotalItems()})
          </Button>
          {orderConfirmed && (
            <Button onClick={printReceipt}>
              <Printer className="mr-2 h-4 w-4" />
              พิมพ์ใบเสร็จ
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="ค้นหาสินค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="เลือกหมวดหมู่" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.production_id} className="relative">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{product.product_name}</h3>
                  <Badge variant={product.quantity > 10 ? "default" : product.quantity > 0 ? "secondary" : "destructive"}>
                    {product.quantity > 0 ? `คงเหลือ ${product.quantity}` : "หมด"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{product.category}</p>
                <p className="text-sm">ผู้ผลิต: {product.member_name}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">฿{product.price.toLocaleString()}/{product.unit}</span>
                  <Button
                    size="sm"
                    onClick={() => addToCart(product)}
                    disabled={product.quantity <= 0}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>  

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>ตะกร้าสินค้า</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label>เลือกลูกค้า</Label>
              <Select onValueChange={(value) => {
                const customer = customers.find(c => c.customer_id.toString() === value);
                setSelectedCustomer(customer || null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกลูกค้า" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.customer_id} value={customer.customer_id.toString()}>
                      {customer.customer_name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cart Items */}
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">ตะกร้าว่าง</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>สินค้า</TableHead>
                    <TableHead>ราคา</TableHead>
                    <TableHead>จำนวน</TableHead>
                    <TableHead>รวม</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.production_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                      </TableCell>
                      <TableCell>฿{item.price.toLocaleString()}/{item.unit}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartQuantity(item.production_id, item.cartQuantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.cartQuantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartQuantity(item.production_id, item.cartQuantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>฿{(item.price * item.cartQuantity).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromCart(item.production_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Total */}
            {cart.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>ยอดรวมทั้งสิ้น:</span>
                  <span>฿{getTotalAmount().toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={clearCart}>
                ล้างตะกร้า
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCheckout(false)}>
                  ปิด
                </Button>
                {!orderConfirmed ? (
                  <Button onClick={handleConfirmOrder} disabled={cart.length === 0 || !selectedCustomer}>
                    <Check className="mr-2 h-4 w-4" />
                    ยืนยันคำสั่งซื้อ
                  </Button>
                ) : (
                  <Button onClick={printReceipt}>
                    <Printer className="mr-2 h-4 w-4" />
                    พิมพ์ใบเสร็จ
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;