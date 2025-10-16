import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, Package, Printer } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  productCount: number;
  createdDate: string;
  isActive: boolean;
}

const initialCategories: ProductCategory[] = [
  {
    id: '1',
    name: 'ข้าว',
    description: 'ข้าวหอมมะลิ ข้าวเหนียว และข้าวพันธุ์ต่างๆ',
    productCount: 15,
    createdDate: '2024-01-15',
    isActive: true
  },
  {
    id: '2',
    name: 'ผักใบเขียว',
    description: 'ผักโขม ผักบุ้ง ใบเหลียง และผักใบเขียวอื่นๆ',
    productCount: 8,
    createdDate: '2024-01-10',
    isActive: true
  },
  {
    id: '3',
    name: 'ผลไม้',
    description: 'มะม่วง ส้ม กล้วย และผลไม้ตามฤดูกาล',
    productCount: 12,
    createdDate: '2024-01-05',
    isActive: true
  },
  {
    id: '4',
    name: 'ผลิตภัณฑ์แปรรูป',
    description: 'น้ำผึ้ง น้ำปลา น้ำพริก และผลิตภัณฑ์แปรรูปอื่นๆ',
    productCount: 6,
    createdDate: '2024-01-01',
    isActive: true
  },
  {
    id: '5',
    name: 'เครื่องปรุงรส',
    description: 'พริกแกง เครื่องเทศ และเครื่องปรุงรสธรรมชาติ',
    productCount: 4,
    createdDate: '2023-12-20',
    isActive: false
  }
];

const ProductCategories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<ProductCategory[]>(initialCategories);

  // State สำหรับข้อมูลประเภทใหม่
  const [newCategory, setNewCategory] = useState<Partial<ProductCategory>>({
    name: '',
    description: '',
    productCount: 0,
    createdDate: new Date().toISOString().slice(0, 10),
    isActive: true
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCategories = categories.filter(c => c.isActive).length;
  const totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0);

  // ฟังก์ชันบันทึกข้อมูลประเภทใหม่
  const handleAddCategory = () => {
    if (!newCategory.name) return;
    const newId = (categories.length + 1).toString();
    setCategories(prev => [
      ...prev,
      {
        id: newId,
        name: newCategory.name || '',
        description: newCategory.description || '',
        productCount: newCategory.productCount || 0,
        createdDate: newCategory.createdDate || new Date().toISOString().slice(0, 10),
        isActive: newCategory.isActive ?? true
      }
    ]);
    setNewCategory({
      name: '',
      description: '',
      productCount: 0,
      createdDate: new Date().toISOString().slice(0, 10),
      isActive: true
    });
    setDialogOpen(false);
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>รายงานประเภทผลผลิต</title>
          <style>
            body { font-family: 'Sarabun', sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin-bottom: 5px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; padding: 15px; background: #f8f9fa; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #2563eb; color: white; }
            .active { color: #22c55e; font-weight: bold; }
            .inactive { color: #ef4444; font-weight: bold; }
            .print-date { text-align: right; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>รายงานประเภทผลผลิต</h1>
            <p>กลุ่มวิสาหกิจชุมชน ตำบลโคกก่อ</p>
          </div>
          
          <div class="stats">
            <div><strong>ประเภททั้งหมด:</strong> ${categories.length} ประเภท</div>
            <div><strong>ประเภทที่ใช้งาน:</strong> ${activeCategories} ประเภท</div>
            <div><strong>ผลผลิตรวม:</strong> ${totalProducts} รายการ</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>ชื่อประเภท</th>
                <th>คำอธิบาย</th>
                <th>จำนวนผลผลิต</th>
                <th>วันที่สร้าง</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCategories.map((category, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${category.name}</td>
                  <td>${category.description}</td>
                  <td>${category.productCount} รายการ</td>
                  <td>${new Date(category.createdDate).toLocaleDateString('th-TH')}</td>
                  <td class="${category.isActive ? 'active' : 'inactive'}">
                    ${category.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="print-date">
            พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการประเภทผลผลิต</h1>
          <p className="text-muted-foreground">
            จัดการและแยกประเภทผลผลิตของกลุ่มวิสาหกิจ
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={handlePrint}
          >
            <Printer className="mr-2 h-4 w-4" />
            พิมพ์รายงาน
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover">
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มประเภทใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>เพิ่มประเภทผลผลิตใหม่</DialogTitle>
                <DialogDescription>
                  สร้างประเภทใหม่สำหรับจัดกลุ่มผลผลิต
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">ชื่อประเภท</Label>
                  <Input
                    id="categoryName"
                    placeholder="เช่น ข้าว, ผัก, ผลไม้"
                    value={newCategory.name || ''}
                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryDescription">คำอธิบาย</Label>
                  <Textarea
                    id="categoryDescription"
                    placeholder="อธิบายรายละเอียดของประเภทนี้"
                    rows={3}
                    value={newCategory.description || ''}
                    onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productCount">จำนวนผลผลิต</Label>
                  <Input
                    id="productCount"
                    type="number"
                    placeholder="จำนวนผลผลิต"
                    value={newCategory.productCount || 0}
                    onChange={e => setNewCategory({ ...newCategory, productCount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="createdDate">วันที่สร้าง</Label>
                  <Input
                    id="createdDate"
                    type="date"
                    value={newCategory.createdDate || new Date().toISOString().slice(0, 10)}
                    onChange={e => setNewCategory({ ...newCategory, createdDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isActive">สถานะ</Label>
                  <select
                    id="isActive"
                    value={newCategory.isActive ? 'true' : 'false'}
                    onChange={e => setNewCategory({ ...newCategory, isActive: e.target.value === 'true' })}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="true">ใช้งาน</option>
                    <option value="false">ไม่ใช้งาน</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
                <Button className="bg-primary hover:bg-primary-hover" onClick={handleAddCategory}>บันทึก</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>ค้นหาประเภทผลผลิต</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="ค้นหาชื่อประเภทหรือคำอธิบาย..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ประเภททั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{categories.length}</div>
            <p className="text-xs text-muted-foreground">ประเภท</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ประเภทที่ใช้งาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{activeCategories}</div>
            <p className="text-xs text-muted-foreground">ประเภท</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ผลผลิตรวม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            รายการประเภทผลผลิต
          </CardTitle>
          <CardDescription>
            ประเภทผลผลิตทั้งหมด ({filteredCategories.length} ประเภท)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อประเภท</TableHead>
                <TableHead>คำอธิบาย</TableHead>
                <TableHead>จำนวนผลผลิต</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{category.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{category.productCount}</span>
                      <span className="text-xs text-muted-foreground">รายการ</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(category.createdDate).toLocaleDateString('th-TH')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={category.isActive ? "default" : "secondary"}
                      className={category.isActive ? "bg-success text-success-foreground" : ""}
                    >
                      {category.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductCategories;