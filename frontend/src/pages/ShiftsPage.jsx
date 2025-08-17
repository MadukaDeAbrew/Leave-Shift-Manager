// src/pages/ShiftsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ShiftForm from '../components/ShiftForm';
import { useAuth } from '../context/AuthContext';

export default function ShiftsPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const { data } = await axios.get('/api/shifts', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setShifts(data);
      } catch (err) {
        console.error('Error fetching shifts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShifts();
  }, [user]);

  if (loading) return <p>Loading shifts...</p>;

  return (
    <div>
      <h2>Shifts</h2>
      {user.role === 'admin' && <ShiftForm onShiftAdded={setShifts} />}
      <ul>
        {shifts.map((shift) => (
          <li key={shift._id}>
            {shift.date} — {shift.time} — {shift.assignedTo?.name || 'Unassigned'}
          </li>
        ))}
      </ul>
    </div>
  );
}
