-- สร้างตาราง tb_customer_management สำหรับเก็บข้อมูลลูกค้า
CREATE TABLE tb_customer_management (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL COMMENT 'ชื่อลูกค้า/บริษัท',
    phone VARCHAR(20) NOT NULL COMMENT 'เบอร์โทรศัพท์',
    address TEXT COMMENT 'ที่อยู่',
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้าง',
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'วันที่แก้ไข'
);

-- เพิ่มข้อมูลตัวอย่าง
INSERT INTO tb_customer_management 
    (customer_name, phone, address) 
VALUES 
    ('บริษัท ABC จำกัด', '02-123-4567', '123 ถนนสุขุมวิท กรุงเทพฯ 10110'),
    ('คุณสมชาย ใจดี', '081-234-5678', '456 หมู่ 1 ตำบลโคกก่อ อำเภอเมือง จังหวัดมหาสารคาม'),
    ('ร้านค้าชุมชน', '089-345-6789', '789 หมู่ 2 ตำบลโคกก่อ อำเภอเมือง จังหวัดมหาสารคาม'),
    ('นางสาวสุดา รักการค้า', '092-456-7890', '321 หมู่ 3 ตำบลโคกก่อ อำเภอเมือง จังหวัดมหาสารคาม'),
    ('บริษัท XYZ (ประเทศไทย) จำกัด', '02-987-6543', '654 ถนนเพชรบุรี กรุงเทพฯ 10400');

-- แสดงโครงสร้างตาราง
DESCRIBE tb_customer_management;

-- แสดงข้อมูลในตาราง
SELECT * FROM tb_customer_management;