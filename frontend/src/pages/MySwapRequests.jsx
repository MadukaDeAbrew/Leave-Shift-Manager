// frontend/src/pages/MySwapRequests.jsx
import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../axiosConfig';

export default function MySwapRequests() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const alertRef = useRef(null);

  const load = async () => {
    setErr(''); setOk('');
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/swaps');
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load swap requests.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (ok || err) {
      alertRef.current?.focus();
      const t = setTimeout(() => { setOk(''); setErr(''); }, 2500);
      return () => clearTimeout(t);
    }
  }, [ok, err]);

  return (
    <div className="max-w-5xl mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold text-[#1e3a8a] mb-4">My Swap Requests</h1>

      {(ok || err) && (
        <div
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className={`mb-4 p-3 rounded border ${ok ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}
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
                <th className="text-left p-3 border-b">From</th>
                <th className="text-left p-3 border-b">To</th>
                <th className="text-left p-3 border-b">Reason</th>
                <th className="text-left p-3 border-b">Status</th>
                <th className="text-left p-3 border-b">Requested At</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="hover:bg-[#f9fafb]">
                  <td className="p-3 border-b">
                    {r.fromShiftId?.shiftDate ? new Date(r.fromShiftId.shiftDate).toLocaleDateString() : '—'}
                    {' • '}
                    {r.fromShiftId?.startTime || '—'}–{r.fromShiftId?.endTime || '—'}
                    {' • '}
                    {r.fromShiftId?.role || '—'}
                  </td>
                  <td className="p-3 border-b">
                    {r.toShiftId?.shiftDate ? new Date(r.toShiftId.shiftDate).toLocaleDateString() : '—'}
                    {' • '}
                    {r.toShiftId?.startTime || '—'}–{r.toShiftId?.endTime || '—'}
                    {' • '}
                    {r.toShiftId?.role || '—'}
                  </td>
                  <td className="p-3 border-b">{r.reason || '—'}</td>
                  <td className="p-3 border-b">
                    <span className={`px-2 py-1 rounded text-sm ${
                      r.status === 'Approved' ? 'bg-green-100 text-green-800'
                      : r.status === 'Rejected' ? 'bg-red-100 text-red-800'
                      : r.status === 'Cancelled' ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 border-b">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
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
