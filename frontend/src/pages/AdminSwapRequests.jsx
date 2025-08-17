// frontend/src/pages/AdminSwapRequests.jsx
import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../axiosConfig';

export default function AdminSwapRequests() {
  const [rows, setRows] = useState([]);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const alertRef = useRef(null);

  const load = async () => {
    setErr(''); setOk('');
    try {
      const res = await axiosInstance.get('/api/swaps');
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed to load swap requests.');
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

  const setStatus = async (id, status) => {
    try {
      await axiosInstance.patch(`/api/swaps/${id}/status`, { status });
      setRows(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      setOk(`Request ${status.toLowerCase()}.`);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed to update status.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold text-[#1e3a8a] mb-4">Admin: Swap Requests</h1>

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
        {rows.length === 0 ? (
          <div className="p-4 text-[#4b5563]">No swap requests.</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#eef2ff] text-[#1e3a8a]">
                <th className="text-left p-3 border-b">Requester</th>
                <th className="text-left p-3 border-b">From</th>
                <th className="text-left p-3 border-b">To</th>
                <th className="text-left p-3 border-b">Status</th>
                <th className="text-left p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r._id} className="hover:bg-[#f9fafb]">
                  <td className="p-3 border-b">{r.requester?.name} ({r.requester?.email})</td>
                  <td className="p-3 border-b">
                    {r.fromShift?.shiftDate ? new Date(r.fromShift.shiftDate).toLocaleDateString() : '—'}
                    {' • '}{r.fromShift?.startTime}–{r.fromShift?.endTime} • {r.fromShift?.role || '—'}
                  </td>
                  <td className="p-3 border-b">
                    {r.toShift?.shiftDate ? new Date(r.toShift.shiftDate).toLocaleDateString() : '—'}
                    {' • '}{r.toShift?.startTime}–{r.toShift?.endTime} • {r.toShift?.role || '—'}
                  </td>
                  <td className="p-3 border-b">{r.status}</td>
                  <td className="p-3 border-b">
                    {r.status === 'Pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setStatus(r._id, 'Approved')}
                          className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setStatus(r._id, 'Declined')}
                          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Decline
                        </button>
                      </div>
                    ) : <span className="text-sm text-gray-400">—</span>}
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
