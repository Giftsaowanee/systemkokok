-- สร้างตาราง tb_purchase_history สำหรับเก็บประวัติการซื้อของลูกค้า
CREATE TABLE tb_purchase_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL COMMENT 'รหัสลูกค้า',
    order_number VARCHAR(50) NOT NULL COMMENT 'เลขที่ออเดอร์',
    product_name VARCHAR(255) NOT NULL COMMENT 'ชื่อสินค้า',
    category VARCHAR(100) COMMENT 'หมวดหมู่สินค้า',
    quantity INT NOT NULL COMMENT 'จำนวนที่ซื้อ',
    unit VARCHAR(50) COMMENT 'หน่วย',
    price_per_unit DECIMAL(10,2) NOT NULL COMMENT 'ราคาต่อหน่วย',
    total_price DECIMAL(10,2) NOT NULL COMMENT 'รวมเป็นเงิน',
    purchase_date DATE NOT NULL COMMENT 'วันที่ซื้อ',
    staff_name VARCHAR(255) COMMENT 'ชื่อเจ้าหน้าที่ที่ขาย',
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้างระเบียน',
    INDEX idx_customer_id (customer_id),
    INDEX idx_purchase_date (purchase_date),
    INDEX idx_order_number (order_number),
    FOREIGN KEY (customer_id) REFERENCES tb_customer_management(customer_id) ON DELETE CASCADE
);

-- เพิ่มข้อมูลตัวอย่าง
INSERT INTO tb_purchase_history 
    (customer_id, order_number, product_name, category, quantity, unit, price_per_unit, total_price, purchase_date, staff_name) 
VALUES 
    (1, 'ORD-001', 'ข้าวหอมมะลิ', 'ข้าว', 10, 'กิโลกรัม', 45.00, 450.00, '2024-10-01', 'สุดา'),
    (1, 'ORD-001', 'น้ำผึ้งดิบ', 'ผึ้ง', 2, 'ขวด', 200.00, 400.00, '2024-10-01', 'สุดา'),
    (1, 'ORD-005', 'มันเทศ', 'ผักผลไม้', 5, 'กิโลกรัม', 30.00, 150.00, '2024-10-10', 'วิชัย');

-- แสดงโครงสร้างตาราง
DESCRIBE tb_purchase_history;

-- แสดงข้อมูลในตาราง
SELECT * FROM tb_purchase_history ORDER BY purchase_date DESC;