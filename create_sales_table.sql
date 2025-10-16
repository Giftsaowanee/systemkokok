-- สร้างตาราง tb_sales_management สำหรับเก็บข้อมูลการขาย
CREATE TABLE tb_sales_management (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'เลขที่ออเดอร์',
    customer_id INT COMMENT 'รหัสลูกค้า',
    customer_name VARCHAR(255) NOT NULL COMMENT 'ชื่อลูกค้า',
    customer_email VARCHAR(255) COMMENT 'อีเมลลูกค้า',
    products JSON COMMENT 'รายการสินค้า (JSON format)',
    total_amount DECIMAL(15,2) NOT NULL COMMENT 'ยอดรวม',
    order_date DATE NOT NULL COMMENT 'วันที่สั่งซื้อ',
    delivery_date DATE COMMENT 'วันที่จัดส่ง',
    status ENUM('pending', 'confirmed', 'delivered', 'cancelled') DEFAULT 'pending' COMMENT 'สถานะ',
    payment_method ENUM('cash', 'transfer', 'credit') DEFAULT 'cash' COMMENT 'วิธีการชำระเงิน',
    payment_status ENUM('paid', 'pending', 'overdue') DEFAULT 'pending' COMMENT 'สถานะการชำระเงิน',
    notes TEXT COMMENT 'หมายเหตุ',
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้าง',
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'วันที่แก้ไข',
    INDEX idx_customer_id (customer_id),
    INDEX idx_order_date (order_date),
    INDEX idx_status (status)
);

-- เพิ่มข้อมูลตัวอย่าง
INSERT INTO tb_sales_management 
    (order_number, customer_id, customer_name, customer_email, products, total_amount, order_date, delivery_date, status, payment_method, payment_status, notes) 
VALUES 
    ('ORD-001', 1, 'นายสมชาย ใจดี', 'somchai@example.com', 
     '[{"name":"ข้าวหอมมะลิ","quantity":10,"price":45}]', 
     450.00, '2024-10-01', '2024-10-02', 'delivered', 'cash', 'paid', 'จัดส่งแล้ว'),
    ('ORD-002', 2, 'นางสาวสุดา รักงาน', 'suda@example.com', 
     '[{"name":"น้ำผึ้งดิบ","quantity":2,"price":200}]', 
     400.00, '2024-10-05', '2024-10-06', 'confirmed', 'transfer', 'paid', 'ยืนยันแล้ว'),
    ('ORD-003', 3, 'นายวิชัย มุ่งมั่น', 'wichai@example.com', 
     '[{"name":"มันเทศ","quantity":5,"price":30}]', 
     150.00, '2024-10-10', NULL, 'pending', 'cash', 'pending', 'รอดำเนินการ');

-- แสดงโครงสร้างตาราง
DESCRIBE tb_sales_management;

-- แสดงข้อมูลในตาราง
SELECT * FROM tb_sales_management;