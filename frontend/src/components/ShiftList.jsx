import { useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 10;

export default function ShiftList() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const alertRef = useRef(null);

  const fetchShifts = async () => {
    setErr('');
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/shifts', {
        params: { page, limit: PAGE_SIZE },
      });
      const data = res.data || {};
      setRows(Array.isArray(data.shifts) ? data.shifts : []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Failed to load shifts.';
      setErr(`Failed to load shifts${status ? ` (HTTP ${status})` : ''}. ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShifts(); }, [page]);

  useEffect(() => {
    if (err) {
      alertRef.current?.focus();
    }
  }, [err]);

  const statusPill = useMemo(() => (status) => {
    const base = 'px-2 py-1 rounded text-sm';
    if (status === 'Scheduled') return `${base} bg-blue-100 text-blue-800`;
    if (status === 'Completed') return `${base} bg-green-100 text-green-800`;
    if (status === 'Cancelled') return `${base} bg-gray-100 text-gray-800`;
    return `${base} bg-yellow-100 text-yellow-800`;
  }, []);

  const canPrev = page > 1;
  const canNext = page < pages;

  return (
    <div className="bg-white border border-[#cbd5e1] rounded shadow overflow-x-auto">
      <div className="flex items-center justify-between p-3">
        <h2 className="text-lg font-semibold text-[#1e3a8a]">Assigned Shifts</h2>
        <div className="text-sm text-[#4b5563]">Total: {total}</div>
      </div>

      {err && (
        <div
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          className="mx-3 mb-3 p-3 rounded border bg-red-50 border-red-300 text-red-800"
        >
          {err}
        </div>
      )}

      {loading ? (
        <div className="p-4">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="p-4 text-[#4b5563]">No shifts found.</div>
      ) : (
        <table className="min-w-full">
          <thead>
            <tr className="bg-[#eef2ff] text-[#1e3a8a]">
              {isAdmin && <th className="text-left p-3 border-b">Employee</th>}
              <th className="text-left p-3 border-b">Date</th>
              <th className="text-left p-3 border-b">Start</th>
              <th className="text-left p-3 border-b">End</th>
              <th className="text-left p-3 border-b">Role</th>
              <th className="text-left p-3 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s._id} className="hover:bg-[#f9fafb]">
                {isAdmin && (
                  <td className="p-3 border-b">
                    {s.userId?.name || '-'} <span className="text-xs text-gray-500">{s.userId?.email || ''}</span>
                  </td>
                )}
                <td className="p-3 border-b">
                  {s.shiftDate ? new Date(s.shiftDate).toLocaleDateString() : '-'}
                </td>
                <td className="p-3 border-b">{s.startTime || '-'}</td>
                <td className="p-3 border-b">{s.endTime || '-'}</td>
                <td className="p-3 border-b">{s.role || '-'}</td>
                <td className="p-3 border-b">
                  <span className={statusPill(s.status || 'Scheduled')}>
                    {s.status || 'Scheduled'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pager */}
      <div className="p-3 flex items-center gap-2">
        <button
          onClick={() => canPrev && setPage((p) => p - 1)}
          disabled={!canPrev}
          className={`px-3 py-1 rounded border ${
            canPrev
              ? 'bg-white text-[#1e3a8a] border-[#cbd5e1] hover:bg-[#eef2ff]'
              : 'bg-gray-100 text-gray-400 border-[#e5e7eb] cursor-not-allowed'
          }`}
        >
          Prev
        </button>

        <span className="text-sm text-[#4b5563]">
          Page {page} of {pages}
        </span>

        <button
          onClick={() => canNext && setPage((p) => p + 1)}
          disabled={!canNext}
          className={`px-3 py-1 rounded border ${
            canNext
              ? 'bg-white text-[#1e3a8a] border-[#cbd5e1] hover:bg-[#eef2ff]'
              : 'bg-gray-100 text-gray-400 border-[#e5e7eb] cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
