-- สร้างตาราง tb_user_management สำหรับเก็บข้อมูลผู้ใช้งาน/กรรมการ
CREATE TABLE tb_user_management (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL COMMENT 'ชื่อ-นามสกุล',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT 'อีเมล',
    phone VARCHAR(20) COMMENT 'โทรศัพท์',
    position VARCHAR(100) COMMENT 'ตำแหน่ง',
    address TEXT COMMENT 'ที่อยู่',
    household_members INT DEFAULT 0 COMMENT 'สมาชิกครัวเรือน',
    income DECIMAL(15,2) DEFAULT 0.00 COMMENT 'รายได้',
    role ENUM('เจ้าหน้าที่', 'ประธาน') NOT NULL COMMENT 'บทบาท',
    status ENUM('ใช้งาน', 'ระงับ') DEFAULT 'ใช้งาน' COMMENT 'สถานะ',
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้าง',
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'วันที่แก้ไข'
);

-- เพิ่มข้อมูลตัวอย่าง
INSERT INTO tb_user_management 
    (full_name, email, phone, position, address, household_members, income, role, status) 
VALUES 
    ('นายสมชาย ใจดี', 'somchai@kokko.com', '081-234-5678', 'ประธานกลุ่มวิสาหกิจ', '123 หมู่ 1 ตำบลโคกก่อ อำเภอเมือง จังหวัดมหาสารคาม', 4, 25000.00, 'ประธาน', 'ใช้งาน'),
    ('นางสาวสุดา รักงาน', 'suda@kokko.com', '082-345-6789', 'เจ้าหน้าที่บริหาร', '456 หมู่ 2 ตำบลโคกก่อ อำเภอเมือง จังหวัดมหาสารคาม', 3, 18000.00, 'เจ้าหน้าที่', 'ใช้งาน'),
    ('นายวิชัย มุ่งมั่น', 'wichai@kokko.com', '083-456-7890', 'เจ้าหน้าที่การตลาด', '789 หมู่ 3 ตำบลโคกก่อ อำเภอเมือง จังหวัดมหาสารคาม', 5, 20000.00, 'เจ้าหน้าที่', 'ใช้งาน');

-- แสดงโครงสร้างตาราง
DESCRIBE tb_user_management;

-- แสดงข้อมูลในตาราง
SELECT * FROM tb_user_management;