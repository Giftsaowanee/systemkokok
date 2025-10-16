import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Plus, Search, Printer, Trash } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Production {
  production_id: number;
  product_name: string;
  category: string;
  member_name: string;
  staff_name: string;
  quantity: string;
  unit: string;
  price: string;
}

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [products, setProducts] = useState<Production[]>([]);

  const [newProduct, setNewProduct] = useState<Partial<Production>>({
    product_name: '',
    category: '',
    member_name: '',
    staff_name: '',
    quantity: '',
    unit: '',
    price: ''
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Partial<Production> | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    
    // ตั้งการรีเฟรชข้อมูลทุก 30 วินาที เพื่อดูการเปลี่ยนแปลงสต็อกแบบ real-time
    const interval = setInterval(() => {
      fetchProducts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:3001/products');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลผลผลิตได้",
        variant: "destructive"
      });
    }
  };

  const handleAddProduct = async () => {
    try {
      const res = await fetch('http://localhost:3001/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: newProduct.product_name,
          category: newProduct.category,
          member_name: newProduct.member_name,
          staff_name: newProduct.staff_name,
          quantity: newProduct.quantity,
          unit: newProduct.unit,
          price: newProduct.price
        })
      });

      if (!res.ok) throw new Error('Failed to add');
      
      await fetchProducts();
      setNewProduct({
        product_name: '',
        category: '',
        member_name: '',
        staff_name: '',
        quantity: '',
        unit: '',
        price: ''
      });
      setDialogOpen(false);
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "เพิ่มข้อมูลผลผลิตเรียบร้อยแล้ว"
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มข้อมูลผลผลิตได้",
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = (product: Production) => {
    setEditingProduct(product);
    setEditDialogOpen(true);
  };

  const handleUpdateProduct = async () => {
    try {
      if (!editingProduct?.production_id) return;
      
      const res = await fetch(`http://localhost:3001/products/${editingProduct.production_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           product_name: editingProduct.product_name,
          category: editingProduct.category,
          member_name: editingProduct.member_name,
          staff_name: editingProduct.staff_name,
          quantity: editingProduct.quantity,
          unit: editingProduct.unit,
          price: editingProduct.price
        })
      });

      if (!res.ok) throw new Error('Failed to update');

      await fetchProducts();
      setEditDialogOpen(false);
      setEditingProduct(null);
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "แก้ไขข้อมูลผลผลิตเรียบร้อยแล้ว"
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขข้อมูลผลผลิตได้",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('ต้องการลบข้อมูลนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch(`http://localhost:3001/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      await fetchProducts();
      toast({
        title: "ลบสำเร็จ",
        description: "ลบข้อมูลผลผลิตเรียบร้อยแล้ว"
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบข้อมูลผลผลิตได้",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      (product.product_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (product.category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      product.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.staff_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate total value from price and quantity
  const totalValue = products.reduce((sum, product) => {
    return sum + (Number(product.quantity) * Number(product.price));
  }, 0);

  // Calculate total quantity
  const totalQuantity = products.reduce((sum, product) => {
    return sum + Number(product.quantity);
  }, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการข้อมูลผลผลิต</h1>
          <p className="text-muted-foreground">
            จัดการสต็อกและข้อมูลผลผลิตของกลุ่มวิสาหกิจ
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => window.print()}
        >
          <Printer className="mr-2 h-4 w-4" />
          พิมพ์รายงาน
        </Button>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มผลผลิตใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>เพิ่มผลผลิตใหม่</DialogTitle>
              <DialogDescription>
                บันทึกข้อมูลผลผลิตใหม่เข้าสู่ระบบ
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">ชื่อสินค้า</Label>
                <Input
                  id="product-name"
                  value={newProduct.product_name}
                  onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
                  placeholder="ชื่อสินค้า"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">หมวดหมู่</Label>
                <Input
                  id="category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  placeholder="หมวดหมู่สินค้า"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-name">ชื่อสมาชิก</Label>
                <Input
                  id="member-name"
                  value={newProduct.member_name}
                  onChange={(e) => setNewProduct({ ...newProduct, member_name: e.target.value })}
                  placeholder="ชื่อสมาชิก"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-name">ชื่อเจ้าหน้าที่</Label>
                <Input
                  id="staff-name"
                  value={newProduct.staff_name}
                  onChange={(e) => setNewProduct({ ...newProduct, staff_name: e.target.value })}
                  placeholder="ชื่อเจ้าหน้าที่"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">จำนวน</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                  placeholder="จำนวน"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">หน่วย</Label>
                <Input
                  id="unit"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                  placeholder="หน่วย"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">ราคาต่อหน่วย (บาท)</Label>
                <Input
                  id="price"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="ราคา"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
              <Button className="bg-primary hover:bg-primary-hover" onClick={handleAddProduct}>บันทึก</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>แก้ไขข้อมูลผลผลิต</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-product-name">ชื่อสินค้า</Label>
                <Input
                  id="edit-product-name"
                  value={editingProduct?.product_name}
                  onChange={(e) => setEditingProduct({ ...editingProduct!, product_name: e.target.value })}
                  placeholder="ชื่อสินค้า"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">หมวดหมู่</Label>
                <Input
                  id="edit-category"
                  value={editingProduct?.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct!, category: e.target.value })}
                  placeholder="หมวดหมู่สินค้า"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-member-name">ชื่อสมาชิก</Label>
                <Input
                  id="edit-member-name"
                  value={editingProduct?.member_name}
                  onChange={(e) => setEditingProduct({ ...editingProduct!, member_name: e.target.value })}
                  placeholder="ชื่อสมาชิก"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-staff-name">ชื่อเจ้าหน้าที่</Label>
                <Input
                  id="edit-staff-name"
                  value={editingProduct?.staff_name}
                  onChange={(e) => setEditingProduct({ ...editingProduct!, staff_name: e.target.value })}
                  placeholder="ชื่อเจ้าหน้าที่"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">จำนวน</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={editingProduct?.quantity}
                  onChange={(e) => setEditingProduct({ ...editingProduct!, quantity: e.target.value })}
                  placeholder="จำนวน"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit">หน่วย</Label>
                <Input
                  id="edit-unit"
                  value={editingProduct?.unit}
                  onChange={(e) => setEditingProduct({ ...editingProduct!, unit: e.target.value })}
                  placeholder="หน่วย"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">ราคาต่อหน่วย (บาท)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editingProduct?.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct!, price: e.target.value })}
                  placeholder="ราคา"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>ยกเลิก</Button>
              <Button className="bg-primary" onClick={handleUpdateProduct}>บันทึก</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ค้นหาข้อมูลผลผลิต</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ค้นหาตามชื่อสมาชิก..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader className="flex flex-col space-y-2">
          <CardTitle>รายการผลผลิต</CardTitle>
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              จำนวนรายการทั้งหมด: {products.length}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ลำดับ</TableHead>
                  <TableHead>ชื่อสินค้า</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>ชื่อสมาชิก</TableHead>
                  <TableHead>ชื่อเจ้าหน้าที่</TableHead>
                  <TableHead className="text-right">จำนวนคงเหลือ</TableHead>
                  <TableHead>หน่วย</TableHead>
                  <TableHead className="text-right">ราคาต่อหน่วย (บาท)</TableHead>
                  <TableHead className="text-right">รวมเป็นเงิน</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                  <TableHead className="w-32 text-center">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => {
                  const quantity = Number(product.quantity);
                  const price = Number(product.price);
                  const totalValue = quantity * price;
                  const isOutOfStock = quantity === 0;
                  
                  return (
                    <TableRow key={product.production_id} className={isOutOfStock ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className={isOutOfStock ? 'text-red-600 font-medium' : ''}>
                        {product.product_name || '-'}
                      </TableCell>
                      <TableCell>{product.category || '-'}</TableCell>
                      <TableCell>{product.member_name}</TableCell>
                      <TableCell>{product.staff_name}</TableCell>
                      <TableCell className={`text-right font-medium ${isOutOfStock ? 'text-red-600' : quantity <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                        {quantity.toLocaleString()}
                      </TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell className="text-right font-medium">
                        {price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            หมดแล้ว
                          </span>
                        ) : quantity <= 5 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            เหลือน้อย
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            พร้อมขาย
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            แก้ไข
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                            onClick={() => handleDeleteProduct(product.production_id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Summary Row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={8} className="text-right">รวมมูลค่าทั้งหมด</TableCell>
                  <TableCell className="text-right">{totalValue.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;