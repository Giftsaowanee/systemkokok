-- สร้างตาราง tb_financial_management สำหรับเก็บข้อมูลบัญชีการเงิน
CREATE TABLE tb_financial_management (
    finance_id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL COMMENT 'ประเภท (รายรับ/รายจ่าย)',
    income DECIMAL(15,2) DEFAULT 0 COMMENT 'รายรับ',
    expense DECIMAL(15,2) DEFAULT 0 COMMENT 'รายจ่าย',
    amount DECIMAL(15,2) NOT NULL COMMENT 'จำนวนเงิน',
    description TEXT COMMENT 'รายละเอียด',
    transaction_date DATE NOT NULL COMMENT 'วันที่ทำรายการ',
    profit DECIMAL(15,2) DEFAULT 0 COMMENT 'กำไร',
    dividend DECIMAL(15,2) DEFAULT 0 COMMENT 'เงินปันผล',
    share INT DEFAULT 0 COMMENT 'จำนวนหุ้น',
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้างระเบียน',
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'วันที่แก้ไข',
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_type (type),
    INDEX idx_created_date (created_date)
);

-- เพิ่มข้อมูลตัวอย่าง
INSERT INTO tb_financial_management 
    (type, income, expense, amount, description, transaction_date, profit, dividend, share) 
VALUES 
    ('รายรับ', 1000.00, 700.00, 1000.00, 'รายรับจากการขาย', '2024-10-16', 300.00, 90.00, 2);

-- แสดงโครงสร้างตาราง
DESCRIBE tb_financial_management;

-- แสดงข้อมูลในตาราง
SELECT * FROM tb_financial_management ORDER BY transaction_date DESC;