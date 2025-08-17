import { useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'];
const LIMIT = 10;

export default function AdminSwapRequests() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusTab, setStatusTab] = useState('Pending');

  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const alertRef = useRef(null);

  const queryStatus = useMemo(() => (statusTab === 'All' ? undefined : statusTab), [statusTab]);

  const fetchSwaps = async () => {
    setErr(''); setOk('');
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/swaps', {
        params: { page, limit: LIMIT, ...(queryStatus ? { status: queryStatus } : {}) },
      });
      const data = res.data || {};
      setRows(Array.isArray(data.swaps) ? data.swaps : []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Failed to load swap requests.';
      setErr(`Failed to load swap requests${status ? ` (HTTP ${status})` : ''}. ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSwaps(); }, [page, queryStatus]);

  useEffect(() => {
    if (ok || err) {
      alertRef.current?.focus();
      const t = setTimeout(() => { setOk(''); setErr(''); }, 2500);
      return () => clearTimeout(t);
    }
  }, [ok, err]);

  const approve = async (id) => {
    try {
      const res = await axiosInstance.patch(`/api/swaps/${id}/approve`);
      const updated = res.data;
      setRows(prev => prev.map(r => (r._id === id ? updated : r)));
      setOk('Swap approved and shifts reassigned.');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to approve swap.';
      setErr(msg);
    }
  };

  const reject = async (id) => {
    try {
      const res = await axiosInstance.patch(`/api/swaps/${id}/reject`);
      const updated = res.data;
      setRows(prev => prev.map(r => (r._id === id ? updated : r)));
      setOk('Swap rejected.');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to reject swap.';
      setErr(msg);
    }
  };

  const canPrev = page > 1;
  const canNext = page < pages;

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded">
          Admins only.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#1e3a8a]">Admin: Swap Requests</h1>
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
          <div className="p-4 text-[#4b5563]">No swap requests.</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#eef2ff] text-[#1e3a8a]">
                <th className="text-left p-3 border-b">Requester</th>
                <th className="text-left p-3 border-b">From (requester’s shift)</th>
                <th className="text-left p-3 border-b">To (target shift)</th>
                <th className="text-left p-3 border-b">Reason</th>
                <th className="text-left p-3 border-b">Status</th>
                <th className="text-left p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const from = r.fromShift;
                const to   = r.toShift;
                return (
                  <tr key={r._id} className="hover:bg-[#f9fafb]">
                    <td className="p-3 border-b">
                      {r.requester?.name || '—'} <span className="text-xs text-gray-500">{r.requester?.email || ''}</span>
                    </td>
                    <td className="p-3 border-b">
                      {from?.shiftDate ? new Date(from.shiftDate).toLocaleDateString() : '—'} • {from?.startTime || '—'}–{from?.endTime || '—'}
                      <div className="text-xs text-gray-500">
                        {from?.userId?.name ? `Owner: ${from.userId.name}` : ''}
                      </div>
                    </td>
                    <td className="p-3 border-b">
                      {to?.shiftDate ? new Date(to.shiftDate).toLocaleDateString() : '—'} • {to?.startTime || '—'}–{to?.endTime || '—'}
                      <div className="text-xs text-gray-500">
                        {to?.userId?.name ? `Owner: ${to.userId.name}` : ''}
                      </div>
                    </td>
                    <td className="p-3 border-b">{r.reason || '—'}</td>
                    <td className="p-3 border-b">{r.status}</td>
                    <td className="p-3 border-b">
                      <div className="flex gap-2">
                        <button
                          onClick={() => approve(r._id)}
                          disabled={r.status !== 'Pending'}
                          className={`px-3 py-1 rounded ${
                            r.status !== 'Pending'
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => reject(r._id)}
                          disabled={r.status !== 'Pending'}
                          className={`px-3 py-1 rounded ${
                            r.status !== 'Pending'
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
