// frontend/src/components/ShiftForm.jsx
import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

export default function ShiftForm({ onClose, onSaved, initial }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [useUserList, setUseUserList] = useState(true);
  const [users, setUsers] = useState([]);

  const [assignee, setAssignee] = useState({
    userId: initial?.userId?._id || initial?.userId || '',
  });

  const [form, setForm] = useState({
    shiftDate: initial?.shiftDate ? String(initial.shiftDate).slice(0,10) : '',
    startTime: initial?.startTime || '',
    endTime:   initial?.endTime || '',
    role:      initial?.role || '',
  });

  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  // admin-only list users (if available)
  useEffect(() => {
    const loadUsers = async () => {
      if (!isAdmin) return;
      try {
        const res = await axiosInstance.get('/api/users', { params: { limit: 1000 } });
        const list = Array.isArray(res.data?.users) ? res.data.users : (Array.isArray(res.data) ? res.data : []);
        setUsers(list);
        setUseUserList(true);
      } catch {
        setUseUserList(false);
      }
    };
    loadUsers();
  }, [isAdmin]);

  const onChange = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const errors = useMemo(() => {
    const e = {};
    if (!form.shiftDate) e.shiftDate = 'Date is required.';
    if (!form.startTime) e.startTime = 'Start time is required.';
    if (!form.endTime) e.endTime = 'End time is required.';
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      e.endTime = 'End time must be after start time.';
    }
    if (!form.role.trim()) e.role = 'Role/Position is required.';
    // assignee optional (unassigned shifts allowed). Only validate when dropdown is shown AND user picked empty on edit if you want to force it.
    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;
  const showErr = (name) => (!!errors[name] && (touched[name] || saving));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setOk('');
    setTouched({ shiftDate: true, startTime: true, endTime: true, role: true });

    if (hasErrors) return;

    try {
      setSaving(true);
      const payload = {
        shiftDate: form.shiftDate,
        startTime: form.startTime,
        endTime:   form.endTime,
        role:      form.role.trim(),
      };
      // Only include userId if chosen
      if (assignee.userId) payload.userId = assignee.userId;

      const res = initial?._id
        ? await axiosInstance.put(`/api/shifts/${initial._id}`, payload)
        : await axiosInstance.post('/api/shifts', payload);

      setOk(`Shift ${initial?._id ? 'updated' : 'created'} successfully.`);
      onSaved?.(res.data);
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save shift.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <form onSubmit={submit} noValidate className="bg-white border border-[#cbd5e1] rounded-xl shadow p-5 grid gap-4">
      <h3 className="text-lg font-semibold text-[#1e3a8a]">
        {initial?._id ? 'Edit Shift' : 'Assign Shift'}
      </h3>

      {error && <div className="p-2 bg-red-50 text-red-700 rounded">{error}</div>}
      {ok && <div className="p-2 bg-green-50 text-green-800 rounded">{ok}</div>}

      <label className="block">
        <span className="block text-sm text-[#4b5563] mb-1">Date</span>
        <input
          type="date"
          name="shiftDate"
          value={form.shiftDate}
          onChange={onChange('shiftDate')}
          onBlur={onBlur}
          className={`w-full p-2 border rounded ${showErr('shiftDate') ? 'border-red-500' : 'border-[#cbd5e1]'}`}
          required
        />
        {showErr('shiftDate') && <p className="text-sm text-red-600 mt-1">{errors.shiftDate}</p>}
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm text-[#4b5563] mb-1">Start Time</span>
          <input
            type="time"
            name="startTime"
            value={form.startTime}
            onChange={onChange('startTime')}
            onBlur={onBlur}
            className={`w-full p-2 border rounded ${showErr('startTime') ? 'border-red-500' : 'border-[#cbd5e1]'}`}
            required
          />
          {showErr('startTime') && <p className="text-sm text-red-600 mt-1">{errors.startTime}</p>}
        </label>

        <label className="block">
          <span className="block text-sm text-[#4b5563] mb-1">End Time</span>
          <input
            type="time"
            name="endTime"
            value={form.endTime}
            onChange={onChange('endTime')}
            onBlur={onBlur}
            className={`w-full p-2 border rounded ${showErr('endTime') ? 'border-red-500' : 'border-[#cbd5e1]'}`}
            required
          />
          {showErr('endTime') && <p className="text-sm text-red-600 mt-1">{errors.endTime}</p>}
        </label>
      </div>

      <label className="block">
        <span className="block text-sm text-[#4b5563] mb-1">Role / Position</span>
        <input
          type="text"
          name="role"
          value={form.role}
          onChange={onChange('role')}
          onBlur={onBlur}
          placeholder="e.g., Nurse, Cashier, Supervisor"
          className={`w-full p-2 border rounded ${showErr('role') ? 'border-red-500' : 'border-[#cbd5e1]'}`}
          required
        />
        {showErr('role') && <p className="text-sm text-red-600 mt-1">{errors.role}</p>}
      </label>

      {useUserList && (
        <label className="block">
          <span className="block text-sm text-[#4b5563] mb-1">Assign to (optional)</span>
          <select
            value={assignee.userId}
            onChange={(e) => setAssignee((a) => ({ ...a, userId: e.target.value }))}
            className="w-full p-2 border rounded bg-white border-[#cbd5e1]"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving || hasErrors}
          className={`text-white px-4 py-2 rounded ${
            saving || hasErrors ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1e3a8a] hover:bg-[#3b82f6]'
          }`}
        >
          {saving ? 'Saving…' : (initial?._id ? 'Save Changes' : 'Create Shift')}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="bg-white border border-[#cbd5e1] text-[#1e3a8a] px-4 py-2 rounded hover:bg-[#eef2ff]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
