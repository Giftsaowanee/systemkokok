-- เพิ่มคอลัมน์ product_name และ category ในตาราง tb_production_management
ALTER TABLE tb_production_management
  ADD COLUMN product_name VARCHAR(255) COMMENT 'ชื่อสินค้า',
  ADD COLUMN category VARCHAR(100) COMMENT 'หมวดหมู่สินค้า';

-- อัปเดตข้อมูลตัวอย่าง (ถ้ามีข้อมูลอยู่แล้ว)
UPDATE tb_production_management 
SET 
  product_name = 'ข้าวหอมมะลิ',
  category = 'ข้าว'
WHERE production_id = 1;

-- ตรวจสอบโครงสร้างตารางใหม่
DESCRIBE tb_production_management;

-- แสดงข้อมูลในตาราง
SELECT * FROM tb_production_management;