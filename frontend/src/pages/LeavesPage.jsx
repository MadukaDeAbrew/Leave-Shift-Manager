import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../axiosConfig';
import LeaveForm from '../components/LeaveForm';

export default function LeavesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 4.5: banners + submitting + form reset
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0); // remount form to reset after success
  const alertRef = useRef(null);

  const fetchLeaves = async () => {
    setErr(''); setOk('');
    try {
      setLoading(true);
      // If your axios baseURL already includes /api, use '/leaves' instead
      const res = await axiosInstance.get('/api/leaves');
      const data = Array.isArray(res.data) ? res.data : (res.data?.leaves || []);
      setRows(data);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed to load leaves.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  // 4.5: auto-dismiss banners & focus for accessibility
  useEffect(() => {
    if (ok || err) {
      alertRef.current?.focus();
      const t = setTimeout(() => { setOk(''); setErr(''); }, 3000);
      return () => clearTimeout(t);
    }
  }, [ok, err]);

  // 4.3 + 4.5
  const handleCreate = async (form) => {
    setErr(''); setOk('');
    setSubmitting(true);
    try {
      const res = await axiosInstance.post('/api/leaves', form);
      setRows(prev => [res.data, ...prev]);  // optimistic prepend
      setOk('Leave request submitted successfully.');
      setFormKey(k => k + 1);                // reset LeaveForm
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusPill = (status) => {
    const base = 'px-2 py-1 rounded text-sm';
    if (status === 'Approved') return `${base} bg-green-100 text-green-800`;
    if (status === 'Rejected') return `${base} bg-red-100 text-red-800`;
    if (status === 'Cancelled') return `${base} bg-gray-100 text-gray-800`;
    return `${base} bg-yellow-100 text-yellow-800`; // Pending or unknown
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold text-[#1e3a8a] mb-4">Leaves</h1>

      {/* 4.5: success/error */}
      {(ok || err) && (
        <div
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className={`mb-4 p-3 rounded border ${
            ok ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          {ok || err}
        </div>
      )}

      <LeaveForm
  key={formKey}
  onSubmit={handleCreate}   // ✅ pass onSubmit
  disabled={submitting}     // ✅ pass disabled
/>


      {/* History list */}
      <div className="mt-6 bg-white border border-[#cbd5e1] rounded shadow overflow-x-auto">
        {loading ? (
          <div className="p-4">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-[#4b5563]">No leave records yet.</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#eef2ff] text-[#1e3a8a]">
                <th className="text-left p-3 border-b">Start</th>
                <th className="text-left p-3 border-b">End</th>
                <th className="text-left p-3 border-b">Type</th>
                <th className="text-left p-3 border-b">Reason</th>
                <th className="text-left p-3 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l._id} className="hover:bg-[#f9fafb]">
                  <td className="p-3 border-b">{l.startDate ? new Date(l.startDate).toLocaleDateString() : '-'}</td>
                  <td className="p-3 border-b">{l.endDate ? new Date(l.endDate).toLocaleDateString() : '-'}</td>
                  <td className="p-3 border-b">{l.leaveType || '-'}</td>
                  <td className="p-3 border-b">{l.reason || '-'}</td>
                  <td className="p-3 border-b">
                    <span className={`px-2 py-1 rounded text-sm ${
                      l.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      l.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      l.status === 'Cancelled' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {l.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      
      <div className="mt-3">
        <button
          onClick={fetchLeaves}
          className="bg-white border border-[#cbd5e1] text-[#1e3a8a] px-4 py-2 rounded hover:bg-[#eef2ff]"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
