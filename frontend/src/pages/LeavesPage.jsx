import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import LeaveForm from '../components/LeaveForm';

export default function LeavesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const fetchLeaves = async () => {
    setErr(''); setOk('');
    try {
      setLoading(true);
      // If your axiosInstance baseURL already ends with /api, use '/leaves' instead
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

  // 4.3: wire UI form to backend
  const handleCreate = async (form) => {
    setErr(''); setOk('');
    try {
      // POST /api/leaves { startDate, endDate, leaveType, reason }
      const res = await axiosInstance.post('/api/leaves', form);
      // Optimistic prepend, or just refetch:
      setRows((prev) => [res.data, ...prev]);
      setOk('Leave request submitted.');
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed to submit leave request.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold text-[#1e3a8a] mb-4">Leaves</h1>

      {/* Alerts */}
      {err && <div className="mb-3 p-2 rounded bg-red-100 text-red-800">{err}</div>}
      {ok && <div className="mb-3 p-2 rounded bg-green-100 text-green-800">{ok}</div>}

      {/* Create form (from 4.2) */}
      <LeaveForm onSubmit={handleCreate} />

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
