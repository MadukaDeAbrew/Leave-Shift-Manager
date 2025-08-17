// frontend/src/components/ShiftForm.jsx
import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM 24h
const toMinutes = (t) => {
  if (!TIME_RE.test(t)) return NaN;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export default function ShiftForm({ onClose, onSaved, initial }) {
  const { user } = useAuth(); // only admins should see this

  const [useUserList, setUseUserList] = useState(true);
  const [users, setUsers] = useState([]);

  const [assignee, setAssignee] = useState({
    userId: initial?.userId?._id || initial?.userId || '',
    email: '',
  });

  const [form, setForm] = useState({
    shiftDate: initial?.shiftDate?.slice(0, 10) || '',
    startTime: initial?.startTime || '',
    endTime: initial?.endTime || '',
    role: initial?.role || '',
    allowPast: false, // frontend preference flag; sent to backend
    step15: true,     // require 15-min increments by default
  });

  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  // Try to fetch user list (admin only endpoint). If it fails, fall back to email entry.
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await axiosInstance.get('/api/users', { params: { limit: 1000 } });
        const list = Array.isArray(res.data?.users)
          ? res.data.users
          : (Array.isArray(res.data) ? res.data : []);
        setUsers(list);
        setUseUserList(true);
      } catch {
        setUseUserList(false);
      }
    };
    loadUsers();
  }, []);

  const onChange = (name) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [name]: val }));
  };
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const errors = useMemo(() => {
    const e = {};

    // Date
    if (!form.shiftDate) {
      e.shiftDate = 'Date is required.';
    } else {
      const d = new Date(form.shiftDate);
      if (Number.isNaN(d.getTime())) {
        e.shiftDate = 'Invalid date.';
      } else if (!form.allowPast) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const sel = new Date(form.shiftDate); sel.setHours(0, 0, 0, 0);
        if (sel < today) e.shiftDate = 'Date cannot be in the past.';
      }
    }

    // Time
    if (!form.startTime) e.startTime = 'Start time is required.';
    else if (!TIME_RE.test(form.startTime)) e.startTime = 'Use HH:MM (24h).';

    if (!form.endTime) e.endTime = 'End time is required.';
    else if (!TIME_RE.test(form.endTime)) e.endTime = 'Use HH:MM (24h).';

    if (TIME_RE.test(form.startTime) && TIME_RE.test(form.endTime)) {
      const s = toMinutes(form.startTime);
      const eMin = toMinutes(form.endTime);
      if (!Number.isNaN(s) && !Number.isNaN(eMin)) {
        if (s >= eMin) e.endTime = 'End time must be after start time.';
        if (form.step15 && ((s % 15 !== 0) || (eMin % 15 !== 0))) {
          e.endTime = 'Times must be on 15-minute increments.';
        }
      }
    }

    // Role
    if (!form.role.trim()) e.role = 'Role/Position is required.';

    // Assignee
    if (useUserList) {
      if (!assignee.userId) e.userId = 'Select an assignee.';
    } else {
      const email = assignee.email.trim();
      if (!email) e.email = 'Enter the assignee email.';
      else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Invalid email format.';
    }

    return e;
  }, [form, assignee, useUserList]);

  const hasErrors = Object.keys(errors).length > 0;
  const showErr = (name) => (!!errors[name] && (touched[name] || saving));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setOk('');
    setTouched({
      shiftDate: true, startTime: true, endTime: true, role: true, userId: true, email: true,
    });
    if (hasErrors) return;

    try {
      setSaving(true);
      const payload = {
        shiftDate: form.shiftDate,   // "YYYY-MM-DD"
        startTime: form.startTime,   // "HH:MM"
        endTime: form.endTime,       // "HH:MM"
        role: form.role.trim(),
        allowPast: !!form.allowPast,
        step15: !!form.step15,
      };
      if (useUserList) payload.userId = assignee.userId;
      else payload.userEmail = assignee.email.trim();

      // Helpful debug in case of 500s
      // console.log('Shift payload:', payload);

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

  if (user?.role !== 'admin') return null;

  return (
    <form onSubmit={submit} noValidate className="bg-white border border-[#cbd5e1] rounded-xl shadow p-5 grid gap-4">
      <h3 className="text-lg font-semibold text-[#1e3a8a]">
        {initial?._id ? 'Edit Shift' : 'Assign Shift'}
      </h3>

      {error && <div className="p-2 bg-red-50 text-red-700 rounded">{error}</div>}
      {ok && <div className="p-2 bg-green-50 text-green-800 rounded">{ok}</div>}

      {/* Date */}
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

      {/* Time */}
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

      {/* Role */}
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

      {/* Assignee */}
      {useUserList ? (
        <label className="block">
          <span className="block text-sm text-[#4b5563] mb-1">Assign to</span>
          <select
            value={assignee.userId}
            onChange={(e) => setAssignee((a) => ({ ...a, userId: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, userId: true }))}
            className={`w-full p-2 border rounded bg-white ${showErr('userId') ? 'border-red-500' : 'border-[#cbd5e1]'}`}
          >
            <option value="">Select user…</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          {showErr('userId') && <p className="text-sm text-red-600 mt-1">{errors.userId}</p>}
        </label>
      ) : (
        <label className="block">
          <span className="block text-sm text-[#4b5563] mb-1">Assignee Email</span>
          <input
            type="email"
            value={assignee.email}
            onChange={(e) => setAssignee((a) => ({ ...a, email: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            placeholder="user@example.com"
            className={`w-full p-2 border rounded ${showErr('email') ? 'border-red-500' : 'border-[#cbd5e1]'}`}
          />
          {showErr('email') && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
          <p className="text-xs text-gray-500 mt-1">Couldn’t load user list—enter the employee’s email instead.</p>
        </label>
      )}

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.allowPast}
            onChange={onChange('allowPast')}
          />
          <span className="text-sm text-[#4b5563]">Allow past date</span>
        </label>

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.step15}
            onChange={onChange('step15')}
          />
          <span className="text-sm text-[#4b5563]">Require 15-min increments</span>
        </label>
      </div>

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
