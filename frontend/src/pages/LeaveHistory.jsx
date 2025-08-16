import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../axiosConfig';

const TABS = ['Upcoming', 'Pending', 'Previous', 'All'];

const statusPill = (status) => {
  const base = 'px-2 py-1 rounded text-sm';
  if (status === 'Approved') return `${base} bg-green-100 text-green-800`;
  if (status === 'Rejected') return `${base} bg-red-100 text-red-800`;
  if (status === 'Cancelled') return `${base} bg-gray-100 text-gray-800`;
  return `${base} bg-yellow-100 text-yellow-800`; // Pending or unknown
};

/**
 * LeaveHistory (Subtask 5.1)
 * - Fetches from GET /api/leaves
 * - Tabs: Upcoming | Pending | Previous | All
 * - Shows loading, error, and empty states
 *
 * Optional props:
 *   adminView?: boolean  // purely cosmetic label if you want to reuse for admin
 */
export default function LeaveHistory({ adminView = false }) {
  const [tab, setTab] = useState('Upcoming');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchLeaves = async () => {
      try {
        setErr('');
        setLoading(true);
        const res = await axiosInstance.get('/api/leaves');
        const data = Array.isArray(res.data) ? res.data : (res.data?.leaves || []);
        if (mounted) setRows(data);
      } catch (e) {
        if (mounted) setErr(e?.response?.data?.message || 'Failed to load leave history.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchLeaves();
    return () => { mounted = false; };
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = useMemo(() => {
    return rows.filter((l) => {
      const start = l.startDate ? new Date(l.startDate) : null;
      const end = new Date(l.endDate || l.startDate || today);
      if (tab === 'Upcoming') return end >= today;
      if (tab === 'Pending') return (l.status || '').toLowerCase() === 'pending';
      if (tab === 'Previous') return end < today;
      return true; // All
    });
  }, [rows, tab]);

  return (
    <div className="max-w-5xl mx-auto mt-6 p-6 bg-[#f4f6f8] border border-[#cbd5e1] rounded shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#1e3a8a]">
          {adminView ? 'All Leave History' : 'My Leave History'}
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded border transition-colors ${
              tab === t
                ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                : 'bg-white text-[#1e3a8a] border-[#cbd5e1] hover:bg-[#eef2ff]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <div>Loading…</div>}
      {err && <div className="text-red-600 mb-3">{err}</div>}

      {!loading && !err && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-[#cbd5e1] rounded">
            <thead>
              <tr className="bg-[#eef2ff] text-[#1e3a8a]">
                <th className="text-left p-3 border-b">Employee</th>
                <th className="text-left p-3 border-b">Start</th>
                <th className="text-left p-3 border-b">End</th>
                <th className="text-left p-3 border-b">Type</th>
                <th className="text-left p-3 border-b">Reason</th>
                <th className="text-left p-3 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-[#4b5563]">
                    No records.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l._id} className="hover:bg-[#f9fafb]">
                    <td className="p-3 border-b">
                      {/* Admin gets populated user (if controller populates); user can show “Me” */}
                      {l.userId?.name || l.user?.name || 'Me'}
                    </td>
                    <td className="p-3 border-b">
                      {l.startDate ? new Date(l.startDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-3 border-b">
                      {l.endDate
                        ? new Date(l.endDate).toLocaleDateString()
                        : (l.startDate ? new Date(l.startDate).toLocaleDateString() : '-')}
                    </td>
                    <td className="p-3 border-b">{l.leaveType || '-'}</td>
                    <td className="p-3 border-b">{l.reason || '-'}</td>
                    <td className="p-3 border-b">
                      <span className={statusPill(l.status || 'Pending')}>{l.status || 'Pending'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
