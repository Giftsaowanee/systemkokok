import { useState, useEffect } from 'react';

const AdminMembers = () => {
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ name: '', email: '' });

  // โหลดข้อมูลสมาชิก
  const fetchMembers = async () => {
    try {
      const res = await fetch('http://localhost:3001/members');
      if (!res.ok) throw new Error('API error: ' + res.status);
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // บันทึกข้อมูลสมาชิกใหม่
  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) return;
    const res = await fetch('http://localhost:3001/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMember)
    });
    const data = await res.json();
    setNewMember({ name: '', email: '' });
    fetchMembers();
  };

  return (
    <div>
      <h2>เพิ่มสมาชิกใหม่</h2>
      <input
        placeholder="ชื่อ"
        value={newMember.name}
        onChange={e => setNewMember({ ...newMember, name: e.target.value })}
      />
      <input
        placeholder="อีเมล"
        value={newMember.email}
        onChange={e => setNewMember({ ...newMember, email: e.target.value })}
      />
      <button onClick={handleAddMember}>บันทึก</button>

      <h2>รายชื่อสมาชิกที่บันทึกแล้ว</h2>
      <table>
        <thead>
          <tr>
            <th>ชื่อ</th>
            <th>อีเมล</th>
          </tr>
        </thead>
        <tbody>
          {members.map(m => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>{m.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminMembers;