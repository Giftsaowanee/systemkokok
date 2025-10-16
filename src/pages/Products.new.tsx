import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Production {
  production_id: number;
  member_name: string;
  staff_name: string;
  quantity: string;
  unit: string;
  price: string;
}

const Products = () => {
  const [products, setProducts] = useState<Production[]>([]);
  const [editingProduct, setEditingProduct] = useState<Partial<Production> | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Production>>({
    member_name: '',
    staff_name: '',
    quantity: '',
    unit: '',
    price: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
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
        member_name: '',
        staff_name: '',
        quantity: '',
        unit: '',
        price: ''
      });
      setShowAddDialog(false);
      
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
    const matchesSearch = product.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.staff_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate total value from price and quantity
  const totalValue = products.reduce((sum, product) => {
    return sum + (Number(product.quantity) * Number(product.price));
  }, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการข้อมูลผลผลิต</h1>
          <p className="text-muted-foreground">จัดการข้อมูลผลผลิตในกลุ่มวิสาหกิจชุมชน</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มข้อมูลผลผลิต
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>เพิ่มข้อมูลผลผลิต</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
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
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>ยกเลิก</Button>
              <Button onClick={handleAddProduct}>บันทึก</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
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

      {/* Table */}
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
                <TableRow className="bg-muted/50">
                  <TableHead>ลำดับ</TableHead>
                  <TableHead>ชื่อสมาชิก</TableHead>
                  <TableHead>ชื่อเจ้าหน้าที่</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead>หน่วย</TableHead>
                  <TableHead className="text-right">ราคาต่อหน่วย (บาท)</TableHead>
                  <TableHead className="text-right">รวมเป็นเงิน</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <TableRow key={product.production_id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{product.member_name}</TableCell>
                    <TableCell>{product.staff_name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(product.quantity).toLocaleString()}
                    </TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(product.price).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {(Number(product.quantity) * Number(product.price)).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleEditProduct(product)}
                      >
                        แก้ไข
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Summary Row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={6} className="text-right">รวมมูลค่าทั้งหมด</TableCell>
                  <TableCell className="text-right">{totalValue.toLocaleString()}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลผลผลิต</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-member-name">ชื่อสมาชิก</Label>
                <Input
                  id="edit-member-name"
                  value={editingProduct.member_name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, member_name: e.target.value })}
                  placeholder="ชื่อสมาชิก"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-staff-name">ชื่อเจ้าหน้าที่</Label>
                <Input
                  id="edit-staff-name"
                  value={editingProduct.staff_name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, staff_name: e.target.value })}
                  placeholder="ชื่อเจ้าหน้าที่"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">จำนวน</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={editingProduct.quantity}
                  onChange={(e) => setEditingProduct({ ...editingProduct, quantity: e.target.value })}
                  placeholder="จำนวน"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit">หน่วย</Label>
                <Input
                  id="edit-unit"
                  value={editingProduct.unit}
                  onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                  placeholder="หน่วย"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">ราคาต่อหน่วย (บาท)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                  placeholder="ราคา"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingProduct(null)}>ยกเลิก</Button>
            <Button onClick={handleUpdateProduct}>บันทึก</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;