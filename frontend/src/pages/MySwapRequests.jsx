// frontend/src/pages/MySwapRequests.jsx
import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../axiosConfig';

export default function MySwapRequests() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const alertRef = useRef(null);

  const fetchMine = async () => {
    setErr(''); setOk('');
    try {
      setLoading(true);
      // backend returns: user -> own swaps, admin -> all
      const res = await axiosInstance.get('/api/swaps');
      const list = Array.isArray(res.data) ? res.data : [];
      setRows(list);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load swap requests.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMine(); }, []);

  useEffect(() => {
    if (ok || err) {
      alertRef.current?.focus();
      const t = setTimeout(() => { setOk(''); setErr(''); }, 2500);
      return () => clearTimeout(t);
    }
  }, [ok, err]);

  const cancelSwap = async (id) => {
    if (!window.confirm('Cancel this swap request? This cannot be undone.')) return;
    try {
      await axiosInstance.delete(`/api/swaps/${id}`);
      setRows(prev => prev.filter(r => r._id !== id));
      setOk('Swap request cancelled.');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to cancel swap.';
      setErr(msg);
    }
  };

  const pill = (status) => {
    const base = 'px-2 py-1 rounded text-sm';
    if (status === 'Approved') return `${base} bg-green-100 text-green-800`;
    if (status === 'Rejected') return `${base} bg-red-100 text-red-800`;
    return `${base} bg-yellow-100 text-yellow-800`; // Pending
  };

  const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold text-[#1e3a8a]">My Swap Requests</h1>
        <button
          onClick={fetchMine}
          className="bg-white border border-[#cbd5e1] text-[#1e3a8a] px-3 py-1 rounded hover:bg-[#eef2ff]"
        >
          Refresh
        </button>
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
          <div className="p-4 text-[#4b5563]">No swap requests yet.</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#eef2ff] text-[#1e3a8a]">
                <th className="text-left p-3 border-b">From Shift</th>
                <th className="text-left p-3 border-b">To Shift</th>
                <th className="text-left p-3 border-b">Reason</th>
                <th className="text-left p-3 border-b">Status</th>
                <th className="text-left p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="hover:bg-[#f9fafb]">
                  <td className="p-3 border-b">
                    {fmt(r.fromShiftId?.shiftDate)} • {r.fromShiftId?.startTime || '—'}–{r.fromShiftId?.endTime || '—'} • {r.fromShiftId?.role || '—'}
                  </td>
                  <td className="p-3 border-b">
                    {fmt(r.toShiftId?.shiftDate)} • {r.toShiftId?.startTime || '—'}–{r.toShiftId?.endTime || '—'} • {r.toShiftId?.role || '—'}
                  </td>
                  <td className="p-3 border-b">{r.reason || '—'}</td>
                  <td className="p-3 border-b">
                    <span className={pill(r.status || 'Pending')}>{r.status || 'Pending'}</span>
                  </td>
                  <td className="p-3 border-b">
                    {r.status === 'Pending' ? (
                      <button
                        onClick={() => cancelSwap(r._id)}
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
