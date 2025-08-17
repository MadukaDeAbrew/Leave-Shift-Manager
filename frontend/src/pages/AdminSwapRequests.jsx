// frontend/src/pages/AdminSwapRequests.jsx
import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

export default function AdminSwapRequests() {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded">
          Admin only
        </div>
      </div>
    );
  }

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

  const doApprove = async (id) => {
    setErr(''); setOk('');
    try {
      await axiosInstance.patch(`/api/swaps/${id}/approve`);
      setRows(prev => prev.map(x => x._id === id ? { ...x, status: 'Approved' } : x));
      setOk('Swap approved.');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to approve.';
      setErr(msg);
    }
  };

  const doReject = async (id) => {
    setErr(''); setOk('');
    try {
      await axiosInstance.patch(`/api/swaps/${id}/reject`);
      setRows(prev => prev.map(x => x._id === id ? { ...x, status: 'Rejected' } : x));
      setOk('Swap rejected.');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to reject.';
      setErr(msg);
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
          className={`mb-4 p-3 rounded border ${ok ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}
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
                    {r.requester?.name || '—'}{r.requester?.email ? ` (${r.requester.email})` : ''}
                  </td>
                  <td className="p-3 border-b">
                    {r.fromShiftId?.shiftDate ? new Date(r.fromShiftId.shiftDate).toLocaleDateString() : '—'}
                    {' • '}
                    {r.fromShiftId?.startTime || '—'}–{r.fromShiftId?.endTime || '—'}
                    {' • '}
                    {r.fromShiftId?.role || '—'}
                    {r.fromShiftId?.userId?.name ? ` • ${r.fromShiftId.userId.name}` : ' • Unassigned'}
                  </td>
                  <td className="p-3 border-b">
                    {r.toShiftId?.shiftDate ? new Date(r.toShiftId.shiftDate).toLocaleDateString() : '—'}
                    {' • '}
                    {r.toShiftId?.startTime || '—'}–{r.toShiftId?.endTime || '—'}
                    {' • '}
                    {r.toShiftId?.role || '—'}
                    {r.toShiftId?.userId?.name ? ` • ${r.toShiftId.userId.name}` : ' • Unassigned'}
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => doApprove(r._id)}
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
                        onClick={() => doReject(r._id)}
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
