import { useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import ShiftForm from '../components/ShiftForm';

const LIMIT = 10;

// Lightweight modal so you don't need extra deps
function Modal({ open, onClose, children, title = 'Dialog' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 w-[95%] max-w-2xl bg-white rounded-xl border border-[#cbd5e1] shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-[#1e3a8a]">{title}</h3>
          <button onClick={onClose} className="px-2 py-1 rounded border border-[#cbd5e1] hover:bg-[#f3f4f6]">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ShiftsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [shifts, setShifts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const alertRef = useRef(null);

  // Modal state for create/edit
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const fetchShifts = async () => {
    setErr(''); setOk('');
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/shifts', { params: { page, limit: LIMIT } });
      const data = res.data || {};
      setShifts(Array.isArray(data.shifts) ? data.shifts : []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Failed to load shifts.';
      console.error('Load shifts failed:', status, msg);
      setErr(`Failed to load shifts${status ? ` (HTTP ${status})` : ''}. ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShifts(); }, [page]);

  // Auto-dismiss banners & focus for a11y
  useEffect(() => {
    if (ok || err) {
      alertRef.current?.focus();
      const t = setTimeout(() => { setOk(''); setErr(''); }, 2500);
      return () => clearTimeout(t);
    }
  }, [ok, err]);

  const openCreate = () => { setEditTarget(null); setShowForm(true); };
  const openEdit = (row) => { setEditTarget(row); setShowForm(true); };

  // Called by ShiftForm after successful POST/PUT
  const handleSaved = (saved) => {
    // If create, prepend; if edit, replace in list
    setShifts(prev => {
      const idx = prev.findIndex(s => s._id === saved._id);
      if (idx === -1) return [saved, ...prev];
      const clone = prev.slice();
      clone[idx] = saved;
      return clone;
    });
    setOk(editTarget?._id ? 'Shift updated successfully.' : 'Shift created successfully.');
    setShowForm(false);
    setEditTarget(null);
  };

  // Delete (admin)
  const removeShift = async (id) => {
    if (!window.confirm('Delete this shift?')) return;
    try {
      await axiosInstance.delete(`/api/shifts/${id}`);
      setShifts(prev => prev.filter(s => s._id !== id));
      setOk('Shift deleted.');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to delete shift.';
      setErr(msg);
    }
  };

  const canPrev = page > 1;
  const canNext = page < pages;

  const PageBadge = ({ n }) => (
    <button
      onClick={() => setPage(n)}
      disabled={n === page}
      className={`px-3 py-1 rounded border ${
        n === page
          ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
          : 'bg-white text-[#1e3a8a] border-[#cbd5e1] hover:bg-[#eef2ff]'
      }`}
    >
      {n}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#1e3a8a]">Shifts</h1>
        <div className="text-sm text-[#4b5563]">Total: {total}</div>
      </div>

      {/* Success/Error */}
      {(ok || err) && (
        <div
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className={`mb-4 p-3 rounded border ${
            ok ? 'bg-green-50 border-green-300 text-green-800'
               : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          {ok || err}
        </div>
      )}

      {/* Admin controls */}
      {isAdmin && (
        <div className="mb-4">
          <button
            onClick={openCreate}
            className="bg-[#1e3a8a] hover:bg-[#3b82f6] text-white px-4 py-2 rounded"
          >
            + Assign Shift
          </button>
        </div>
      )}

      {/* Shifts table */}
      <div className="bg-white border border-[#cbd5e1] rounded shadow overflow-x-auto">
        {loading ? (
          <div className="p-4">Loading…</div>
        ) : shifts.length === 0 ? (
          <div className="p-4 text-[#4b5563]">No shifts found.</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#eef2ff] text-[#1e3a8a]">
                <th className="text-left p-3 border-b">Employee</th>
                <th className="text-left p-3 border-b">Date</th>
                <th className="text-left p-3 border-b">Start</th>
                <th className="text-left p-3 border-b">End</th>
                <th className="text-left p-3 border-b">Role</th>
                <th className="text-left p-3 border-b">Status</th>
                {isAdmin && <th className="text-left p-3 border-b">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s._id} className="hover:bg-[#f9fafb]">
                  <td className="p-3 border-b">{s.userId?.name || '—'}</td>
                  <td className="p-3 border-b">
                    {s.shiftDate ? new Date(s.shiftDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-3 border-b">{s.startTime}</td>
                  <td className="p-3 border-b">{s.endTime}</td>
                  <td className="p-3 border-b">{s.role || '—'}</td>
                  <td className="p-3 border-b">{s.status || 'Scheduled'}</td>
                  {isAdmin && (
                    <td className="p-3 border-b">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeShift(s._id)}
                          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pager */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => canPrev && setPage(p => p - 1)}
          disabled={!canPrev}
          className={`px-3 py-1 rounded border ${
            canPrev ? 'bg-white text-[#1e3a8a] border-[#cbd5e1] hover:bg-[#eef2ff]'
                    : 'bg-gray-100 text-gray-400 border-[#e5e7eb] cursor-not-allowed'
          }`}
        >
          Prev
        </button>

        <div className="flex gap-1">
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter(n => Math.abs(n - page) <= 2 || n === 1 || n === pages)
            .map((n, idx, arr) => {
              const prev = arr[idx - 1];
              const dots = prev && n - prev > 1;
              return (
                <span key={n} className="flex items-center">
                  {dots && <span className="mx-1 text-gray-400">…</span>}
                  <PageBadge n={n} />
                </span>
              );
            })}
        </div>

        <button
          onClick={() => canNext && setPage(p => p + 1)}
          disabled={!canNext}
          className={`px-3 py-1 rounded border ${
            canNext ? 'bg-white text-[#1e3a8a] border-[#cbd5e1] hover:bg-[#eef2ff]'
                    : 'bg-gray-100 text-gray-400 border-[#e5e7eb] cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>

      {/* Modal with ShiftForm (create/edit) */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditTarget(null); }}
        title={editTarget?._id ? 'Edit Shift' : 'Assign Shift'}
      >
        <ShiftForm
          initial={editTarget || undefined}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      </Modal>
    </div>
  );
}
