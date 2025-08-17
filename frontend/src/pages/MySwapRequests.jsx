// frontend/src/pages/MySwapRequests.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../axiosConfig';

const LIMIT = 10;
const STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'];
const AUTO_REFRESH_MS = 10000; // set to 0 to disable auto-refresh

export default function MySwapRequests() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [statusTab, setStatusTab] = useState('All');

  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const alertRef = useRef(null);

  const queryStatus = useMemo(
    () => (statusTab === 'All' ? undefined : statusTab),
    [statusTab]
  );

  const fetchMine = async () => {
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
      const msg = e?.response?.data?.message || e?.message || 'Failed to load swap requests.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  // Initial & on tab/page change
  useEffect(() => { fetchMine(); }, [page, queryStatus]);

  // Auto-dismiss banners & focus
  useEffect(() => {
    if (ok || err) {
      alertRef.current?.focus();
      const t = setTimeout(() => { setOk(''); setErr(''); }, 2500);
      return () => clearTimeout(t);
    }
  }, [ok, err]);

  // Optional auto-refresh to reflect admin updates in near real-time
  useEffect(() => {
    if (!AUTO_REFRESH_MS) return;
    const id = setInterval(fetchMine, AUTO_REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, queryStatus]);

  // Cancel a pending request
  const cancelReq = async (id) => {
    if (!window.confirm('Cancel this request?')) return;
    try {
      const res = await axiosInstance.patch(`/api/swaps/${id}/cancel`);
      const updated = res.data;
      setRows(prev => prev.map(r => (r._id === id ? updated : r)));
      setOk('Swap request cancelled.');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to cancel request.';
      setErr(msg);
    }
  };

  const statusPill = (status) => {
    const base = 'px-2 py-1 rounded text-sm';
    if (status === 'Approved')  return `${base} bg-green-100 text-green-800`;
    if (status === 'Rejected')  return `${base} bg-red-100 text-red-800`;
    if (status === 'Cancelled') return `${base} bg-gray-100 text-gray-800`;
    return `${base} bg-yellow-100 text-yellow-800`; // Pending (default)
    };

  const canPrev = page > 1;
  const canNext = page < pages;

  const PageBtn = ({ n }) => (
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

  const refreshNow = () => fetchMine();

  return (
    <div className="max-w-5xl mx-auto mt-8 p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold text-[#1e3a8a]">My Swap Requests</h1>
        <div className="flex items-center gap-2">
          <div className="text-sm text-[#4b5563]">Total: {total}</div>
          <button
            onClick={refreshNow}
            className="ml-2 bg-white border border-[#cbd5e1] text-[#1e3a8a] px-3 py-1 rounded hover:bg-[#eef2ff]"
            title="Refresh"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Status Tabs */}
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
                <th className="text-left p-3 border-b">From (your shift)</th>
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
                      {from?.shiftDate ? new Date(from.shiftDate).toLocaleDateString() : '—'} • {from?.startTime || '—'}–{from?.endTime || '—'}
                      {from?.role ? <span className="text-xs text-gray-500 ml-1">({from.role})</span> : null}
                    </td>
                    <td className="p-3 border-b">
                      {to?.shiftDate ? new Date(to.shiftDate).toLocaleDateString() : '—'} • {to?.startTime || '—'}–{to?.endTime || '—'}
                      {to?.userId?.name ? <span className="text-xs text-gray-500 ml-1">({to.userId.name})</span> : null}
                    </td>
                    <td className="p-3 border-b">{r.reason || '—'}</td>
                    <td className="p-3 border-b">
                      <span className={statusPill(r.status)}>{r.status}</span>
                    </td>
                    <td className="p-3 border-b">
                      <button
                        onClick={() => cancelReq(r._id)}
                        disabled={r.status !== 'Pending'}
                        className={`px-3 py-1 rounded ${
                          r.status !== 'Pending'
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        Cancel
                      </button>
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
                  <PageBtn n={n} />
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
