import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Printer } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CartItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  pricePerUnit: number;
  unit?: string;
}

const paymentMethods = [
  { value: 'cash', label: 'เงินสด' },
  { value: 'transfer', label: 'โอนเงิน' },
  { value: 'credit', label: 'บัตรเครดิต' }
];

const Checkout = () => {
  const { cart, setCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderedItems, setOrderedItems] = useState<any[]>([]);
  const navigate = useNavigate();

  const totalAmount = cart.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0);

  // สำหรับพิมพ์ใบเสร็จ
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleConfirmOrder = async () => {
    for (const item of cart) {
      const res = await fetch(`http://localhost:3001/products/${item.id}`);
      const prod = await res.json();
      const newStock = prod.stock - item.quantity;
      await fetch(`http://localhost:3001/products/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock < 0 ? 0 : newStock })
      });
    }
    await fetch('http://localhost:3001/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: customerName,
        products: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.pricePerUnit
        })),
        totalAmount: cart.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0),
        orderDate: new Date().toISOString().slice(0, 10),
        paymentMethod,
        paymentStatus: 'completed'
      })
    });
    setOrderedItems(cart);
    setCart([]); // เคลียร์ตะกร้า
    setShowOrderDialog(true); // แสดงสรุป
    navigate('/sales'); // เด้งกลับหน้าการขาย
  };

  // ฟังก์ชันพิมพ์ใบเสร็จ
  const handlePrint = () => {
    if (!receiptRef.current) return;
    const printContents = receiptRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // reload เพื่อกลับสู่หน้าเดิม
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ทำการสั่งซื้อ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">ชื่อ-นามสกุลลูกค้า</label>
            <Input
              placeholder="กรอกชื่อ-นามสกุล"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">รายการสินค้า</label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อสินค้า</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>จำนวน</TableHead>
                  <TableHead>หน่วย</TableHead>
                  <TableHead>ราคา (บาท)</TableHead>
                  <TableHead>รวม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit || '-'}</TableCell>
                    <TableCell>฿{item.pricePerUnit}</TableCell>
                    <TableCell>฿{(item.pricePerUnit * item.quantity).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-between items-center font-bold text-lg">
            <span>ยอดรวมที่ต้องจ่าย</span>
            <span className="text-primary">฿{totalAmount.toLocaleString()}</span>
          </div>
          <div>
            <label className="block mb-1 font-medium">วิธีการจ่าย</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกวิธีการจ่าย" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(pm => (
                  <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              className="bg-primary text-white"
              onClick={handleConfirmOrder}
              disabled={!customerName.trim()} // ต้องกรอกชื่อก่อนถึงจะกดได้
            >
              ยืนยันการสั่งซื้อ
            </Button>
            <Button
              className="bg-primary text-white"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" />
              พิมพ์ใบเสร็จ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ใบเสร็จสำหรับพิมพ์ */}
      <div style={{ display: 'none' }}>
        <div ref={receiptRef}>
          <h2 style={{ textAlign: 'center', marginBottom: 8 }}>ใบเสร็จรับเงิน</h2>
          <div>ชื่อลูกค้า: {customerName}</div>
          <div>วิธีการจ่าย: {paymentMethods.find(pm => pm.value === paymentMethod)?.label}</div>
          <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: 4 }}>ชื่อสินค้า</th>
                <th style={{ border: '1px solid #ccc', padding: 4 }}>จำนวน</th>
                <th style={{ border: '1px solid #ccc', padding: 4 }}>หน่วย</th>
                <th style={{ border: '1px solid #ccc', padding: 4 }}>ราคา</th>
                <th style={{ border: '1px solid #ccc', padding: 4 }}>รวม</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.id}>
                  <td style={{ border: '1px solid #ccc', padding: 4 }}>{item.name}</td>
                  <td style={{ border: '1px solid #ccc', padding: 4 }}>{item.quantity}</td>
                  <td style={{ border: '1px solid #ccc', padding: 4 }}>{item.unit || '-'}</td>
                  <td style={{ border: '1px solid #ccc', padding: 4 }}>฿{item.pricePerUnit}</td>
                  <td style={{ border: '1px solid #ccc', padding: 4 }}>฿{(item.pricePerUnit * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', marginTop: 12, fontWeight: 'bold' }}>
            ยอดรวม: ฿{totalAmount.toLocaleString()}
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>ขอบคุณที่ใช้บริการ</div>
        </div>
      </div>

      {/* Dialog สรุปการสั่งซื้อ */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สรุปรายการสั่งซื้อ</DialogTitle>
          </DialogHeader>
          <div>
            <ul className="mb-4">
              {orderedItems.map(item => (
                <li key={item.id}>
                  {item.name} ({item.category}) จำนวน {item.quantity} {item.unit} ราคา ฿{item.pricePerUnit} รวม ฿{(item.pricePerUnit * item.quantity).toLocaleString()}
                </li>
              ))}
            </ul>
            <div className="font-bold text-right">
              ยอดรวม: ฿{orderedItems.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0).toLocaleString()}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowOrderDialog(false)}>ปิด</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;