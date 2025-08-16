import { useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected'];
const LIMIT = 10;

export default function AdminLeaves() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusTab, setStatusTab] = useState('Pending'); // start on Pending for admins

  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const alertRef = useRef(null);

  const queryStatus = useMemo(
    () => (statusTab === 'All' ? undefined : statusTab),
    [statusTab]
  );

  const fetchLeaves = async () => {
    setErr(''); setOk('');
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/leaves', {
        params: {
          page,
          limit: LIMIT,
          ...(queryStatus ? { status: queryStatus } : {}),
        },
      });
      const data = res.data || {};
      setRows(Array.isArray(data.leaves) ? data.leaves : []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Failed to load leaves.';
      console.error('AdminLeaves fetch failed:', status, msg);
      setErr(`Failed to load leaves${status ? ` (HTTP ${status})` : ''}. ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, [page, queryStatus]);

  useEffect(() => {
    if (ok || err) {
      alertRef.current?.focus();
      const t = setTimeout(() => { setOk(''); setErr(''); }, 2500);
      return () => clearTimeout(t);
    }
  }, [ok, err]);

  const statusPill = (status) => {
    const base = 'px-2 py-1 rounded text-sm';
    if (status === 'Approved') return `${base} bg-green-100 text-green-800`;
    if (status === 'Rejected') return `${base} bg-red-100 text-red-800`;
    if (status === 'Cancelled') return `${base} bg-gray-100 text-gray-800`;
    return `${base} bg-yellow-100 text-yellow-800`; // Pending or unknown
  };

  const approve = async (id) => {
    try {
      await axiosInstance.patch(`/api/leaves/${id}/approve`);
      setOk('Leave approved.');
      setRows(prev => prev.map(r => (r._id === id ? { ...r, status: 'Approved' } : r)));
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to approve.';
      setErr(msg);
    }
  };

  const reject = async (id) => {
    try {
      await axiosInstance.patch(`/api/leaves/${id}/reject`);
      setOk('Leave rejected.');
      setRows(prev => prev.map(r => (r._id === id ? { ...r, status: 'Rejected' } : r)));
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to reject.';
      setErr(msg);
    }
  };

  // ✅ NEW: Admin delete (always allowed by your backend controller)
  const remove = async (id) => {
    if (!window.confirm('Delete this leave request? This cannot be undone.')) return;
    setErr(''); setOk('');
    try {
      await axiosInstance.delete(`/api/leaves/${id}`);
      setRows(prev => prev.filter(r => r._id !== id));
      setOk('Leave request deleted.');
      // Optionally refresh counters/pagination if you like:
      // fetchLeaves();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to delete leave.';
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

  // Guard: admin-only
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded">
          You need admin privileges to view this page.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#1e3a8a]">Admin: Leave Requests</h1>
        <div className="text-sm text-[#4b5563]">Total: {total}</div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setStatusTab(t); setPage(1); }}
            className={`px-4 py-2 rounded border transition-colors ${
              statusTab === t
                ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                : 'bg-white text-[#1e3a8a] border-[#cbd5e1] hover:bg-[#eef2ff]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

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

      <div className="bg-white border border-[#cbd5e1] rounded shadow overflow-x-auto">
        {loading ? (
          <div className="p-4">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-[#4b5563]">No requests.</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#eef2ff] text-[#1e3a8a]">
                <th className="text-left p-3 border-b">Employee</th>
                <th className="text-left p-3 border-b">Start</th>
                <th className="text-left p-3 border-b">End</th>
                <th className="text-left p-3 border-b">Type</th>
                <th className="text-left p-3 border-b">Reason</th>
                <th className="text-left p-3 border-b">Status</th>
                <th className="text-left p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l._id} className="hover:bg-[#f9fafb]">
                  <td className="p-3 border-b">{l.userId?.name || '-'}</td>
                  <td className="p-3 border-b">{l.startDate ? new Date(l.startDate).toLocaleDateString() : '-'}</td>
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
                  <td className="p-3 border-b">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => approve(l._id)}
                        disabled={l.status === 'Approved'}
                        className={`px-3 py-1 rounded ${
                          l.status === 'Approved'
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => reject(l._id)}
                        disabled={l.status === 'Rejected'}
                        className={`px-3 py-1 rounded ${
                          l.status === 'Rejected'
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        Reject
                      </button>
                      {/* ✅ NEW: Delete button (always enabled for admin) */}
                      <button
                        onClick={() => remove(l._id)}
                        className="px-3 py-1 rounded bg-gray-800 text-white hover:bg-black"
                        title="Delete request"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pager */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => page > 1 && setPage(p => p - 1)}
          disabled={page <= 1}
          className={`px-3 py-1 rounded border ${
            page > 1 ? 'bg-white text-[#1e3a8a] border-[#cbd5e1] hover:bg-[#eef2ff]'
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
          onClick={() => page < pages && setPage(p => p + 1)}
          disabled={page >= pages}
          className={`px-3 py-1 rounded border ${
            page < pages ? 'bg-white text-[#1e3a8a] border-[#cbd5e1] hover:bg-[#eef2ff]'
                         : 'bg-gray-100 text-gray-400 border-[#e5e7eb] cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
