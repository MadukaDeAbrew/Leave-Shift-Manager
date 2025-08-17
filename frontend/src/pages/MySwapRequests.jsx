import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../axiosConfig';

const LIMIT = 10;

export default function MySwapRequests() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const alertRef = useRef(null);

  const fetchMine = async () => {
    setErr(''); setOk('');
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/swaps', { params: { page, limit: LIMIT } });
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

  useEffect(() => { fetchMine(); }, [page]);

  useEffect(() => {
    if (ok || err) {
      alertRef.current?.focus();
      const t = setTimeout(() => { setOk(''); setErr(''); }, 2500);
      return () => clearTimeout(t);
    }
  }, [ok, err]);

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

  const canPrev = page > 1;
  const canNext = page < pages;

  return (
    <div className="max-w-5xl mx-auto mt-8 p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#1e3a8a]">My Swap Requests</h1>
        <div className="text-sm text-[#4b5563]">Total: {total}</div>
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
                <th className="text-left p-3 border-b">From</th>
                <th className="text-left p-3 border-b">To</th>
                <th className="text-left p-3 border-b">Reason</th>
                <th className="text-left p-3 border-b">Status</th>
                <th className="text-left p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="hover:bg-[#f9fafb]">
                  <td className="p-3 border-b">
                    {r.fromShift?.shiftDate ? new Date(r.fromShift.shiftDate).toLocaleDateString() : '—'} • {r.fromShift?.startTime || '—'}–{r.fromShift?.endTime || '—'}
                  </td>
                  <td className="p-3 border-b">
                    {r.toShift?.shiftDate ? new Date(r.toShift.shiftDate).toLocaleDateString() : '—'} • {r.toShift?.startTime || '—'}–{r.toShift?.endTime || '—'}
                    {r.toShift?.userId?.name ? <span className="text-xs text-gray-500 ml-1">({r.toShift.userId.name})</span> : null}
                  </td>
                  <td className="p-3 border-b">{r.reason || '—'}</td>
                  <td className="p-3 border-b">{r.status}</td>
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
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
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
          ))}
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
