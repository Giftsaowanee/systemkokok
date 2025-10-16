import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Search, Edit, Trash2, Phone, MapPin, BookOpen, Calendar, ShoppingBag } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Customer {
  customer_id: number;
  customer_name: string;
  phone: string;
  address: string;
  created_date?: string;
}

interface PurchaseHistory {
  history_id: number;
  customer_id: number;
  order_number: string;
  product_name: string;
  category: string;
  quantity: number;
  unit: string;
  price_per_unit: number | string;
  total_price: number | string;
  purchase_date: string;
  staff_name: string;
  created_date: string;
  customer_name?: string;
  phone?: string;
}

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<Customer | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customer_name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchCustomers();
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
    try {
      const res = await fetch('http://localhost:3001/customers');
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลลูกค้าได้",
        variant: "destructive"
      });
    }
  };

  const fetchPurchaseHistory = async (customerId: number) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`http://localhost:3001/purchase-history/${customerId}`);
      if (!res.ok) throw new Error('Failed to fetch purchase history');
      const data = await res.json();
      setPurchaseHistory(data);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงประวัติการซื้อได้",
        variant: "destructive"
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleShowHistory = async (customer: Customer) => {
    setSelectedCustomerHistory(customer);
    setShowHistoryDialog(true);
    await fetchPurchaseHistory(customer.customer_id);
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(numAmount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalPurchaseAmount = () => {
    return purchaseHistory.reduce((total, item) => {
      const price = typeof item.total_price === 'string' ? parseFloat(item.total_price) : item.total_price;
      return total + (price || 0);
    }, 0);
  };

  const getUniqueOrdersCount = () => {
    const uniqueOrders = new Set(purchaseHistory.map(item => item.order_number));
    return uniqueOrders.size;
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.customer_name || !newCustomer.phone) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: "กรุณากรอกชื่อลูกค้าและเบอร์โทรศัพท์",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add customer');
      }

      await fetchCustomers();
      setNewCustomer({ customer_name: '', phone: '', address: '' });
      setShowAddDialog(false);

      toast({
        title: "บันทึกสำเร็จ",
        description: "เพิ่มลูกค้าใหม่เรียบร้อยแล้ว"
      });
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถเพิ่มลูกค้าได้",
        variant: "destructive"
      });
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowEditDialog(true);
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer?.customer_name || !editingCustomer?.phone) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: "กรุณากรอกชื่อลูกค้าและเบอร์โทรศัพท์",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/customers/${editingCustomer.customer_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCustomer)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update customer');
      }

      await fetchCustomers();
      setEditingCustomer(null);
      setShowEditDialog(false);

      toast({
        title: "บันทึกสำเร็จ",
        description: "แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว"
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถแก้ไขข้อมูลได้",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCustomer = async (customerId: number) => {
    if (!window.confirm('ต้องการลบข้อมูลลูกค้านี้ใช่หรือไม่?')) return;

    try {
      const res = await fetch(`http://localhost:3001/customers/${customerId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete customer');
      }

      await fetchCustomers();

      toast({
        title: "ลบสำเร็จ",
        description: "ลบข้อมูลลูกค้าเรียบร้อยแล้ว"
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถลบข้อมูลได้",
        variant: "destructive"
      });
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการข้อมูลลูกค้า</h1>
          <p className="text-muted-foreground">
            จัดการข้อมูลลูกค้าและการติดต่อสื่อสาร
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มลูกค้าใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่มลูกค้าใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อลูกค้า/บริษัท *</Label>
                <Input
                  id="name"
                  value={newCustomer.customer_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, customer_name: e.target.value })}
                  placeholder="ชื่อลูกค้า"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="เบอร์โทรศัพท์"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">ที่อยู่</Label>
                <Textarea
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="ที่อยู่"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>ยกเลิก</Button>
              <Button onClick={handleAddCustomer}>บันทึก</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ลูกค้าทั้งหมด</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">มีเบอร์โทร</p>
                <p className="text-2xl font-bold text-green-600">
                  {customers.filter(c => c.phone && c.phone.trim() !== '').length}
                </p>
              </div>
              <Phone className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">มีที่อยู่</p>
                <p className="text-2xl font-bold text-orange-600">
                  {customers.filter(c => c.address && c.address.trim() !== '').length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>ค้นหาข้อมูลลูกค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="ค้นหาตามชื่อหรือเบอร์โทร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
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
                <TableHead>ลำดับ</TableHead>
                <TableHead>ชื่อลูกค้า/บริษัท</TableHead>
                <TableHead>เบอร์โทรศัพท์</TableHead>
                <TableHead>ที่อยู่</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer, index) => (
                <TableRow key={customer.customer_id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{customer.customer_name}</TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{customer.address || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShowHistory(customer)}
                        className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                      >
                        <BookOpen className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                        onClick={() => handleDeleteCustomer(customer.customer_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    ไม่พบข้อมูลลูกค้า
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลลูกค้า</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">ชื่อลูกค้า/บริษัท *</Label>
                <Input
                  id="edit-name"
                  value={editingCustomer.customer_name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, customer_name: e.target.value })}
                  placeholder="ชื่อลูกค้า"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">เบอร์โทรศัพท์ *</Label>
                <Input
                  id="edit-phone"
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  placeholder="เบอร์โทรศัพท์"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">ที่อยู่</Label>
                <Textarea
                  id="edit-address"
                  value={editingCustomer.address}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  placeholder="ที่อยู่"
                  rows={3}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleUpdateCustomer}>บันทึก</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              สมุดลูกค้า - {selectedCustomerHistory?.customer_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomerHistory && (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">ชื่อลูกค้า:</span>
                      <span className="font-medium">{selectedCustomerHistory.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">เบอร์โทร:</span>
                      <span className="font-medium">{selectedCustomerHistory.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">ที่อยู่:</span>
                      <span className="font-medium">{selectedCustomerHistory.address || '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">จำนวนคำสั่งซื้อทั้งหมด</p>
                        <p className="text-2xl font-bold">{getUniqueOrdersCount()}</p>
                      </div>
                      <ShoppingBag className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">จำนวนรายการสินค้า</p>
                        <p className="text-2xl font-bold">{purchaseHistory.length}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">ยอดซื้อรวม</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalPurchaseAmount())}</p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        ฿
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Purchase History Table */}
              <Card>
                <CardHeader>
                  <CardTitle>ประวัติการซื้อ</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="flex justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
                      </div>
                    </div>
                  ) : purchaseHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">ยังไม่มีประวัติการซื้อ</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>เลขที่ออเดอร์</TableHead>
                            <TableHead>วันที่ซื้อ</TableHead>
                            <TableHead>ชื่อสินค้า</TableHead>
                            <TableHead>หมวดหมู่</TableHead>
                            <TableHead className="text-center">จำนวน</TableHead>
                            <TableHead>หน่วย</TableHead>
                            <TableHead className="text-right">ราคาต่อหน่วย</TableHead>
                            <TableHead className="text-right">รวมเป็นเงิน</TableHead>
                            <TableHead>เจ้าหน้าที่</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {purchaseHistory.map((item, index) => (
                            <TableRow key={item.history_id}>
                              <TableCell className="font-medium">{item.order_number}</TableCell>
                              <TableCell>{formatDate(item.purchase_date)}</TableCell>
                              <TableCell className="font-medium">{item.product_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.category}</Badge>
                              </TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell>{item.unit}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.price_per_unit)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(item.total_price)}</TableCell>
                              <TableCell>{item.staff_name}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>ปิด</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;