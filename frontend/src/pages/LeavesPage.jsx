// frontend/src/pages/LeavesPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../axiosConfig';
import LeaveForm from '../components/LeaveForm';

const STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected'];
const LIMIT = 10;

export default function LeavesPage() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusTab, setStatusTab] = useState('All');

  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const alertRef = useRef(null);

  // which row is being edited (null when creating)
  const [editTarget, setEditTarget] = useState(null);

  const queryStatus = useMemo(
    () => (statusTab === 'All' ? undefined : statusTab),
    [statusTab]
  );

  const fetchLeaves = async () => {
    setErr(''); setOk('');
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/leaves', {
        params: { page, limit: LIMIT, ...(queryStatus ? { status: queryStatus } : {}) },
      });
      const data = res.data || {};
      setRows(Array.isArray(data.leaves) ? data.leaves : []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Failed to load leaves.';
      console.error('Leaves fetch failed:', status, msg);
      setErr(`Failed to load leaves${status ? ` (HTTP ${status})` : ''}. ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, [page, queryStatus]);

  useEffect(() => {
    if (ok || err) {
      alertRef.current?.focus();
      const t = setTimeout(() => { setOk(''); setErr(''); }, 3000);
      return () => clearTimeout(t);
    }
  }, [ok, err]);

  //control the request windows
  const [showPopup, setShowPopup] = useState(false);

  const Popup = ({children, onClose}) =>(
    <div className='flex fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50'>
      <div className='bg-white p-6 rounded shadow-lg relative w-full max-w-md'>
        <button  
          onClick = {onClose}
          className='absolute top-2 right-2 text-grey-500 hover:text-gray-700'
            >
           x
        </button>
        {children}
      </div>
    </div>
  );

  // Create new leave
  const handleCreate = async (form) => {
    setErr(''); setOk('');
    setSubmitting(true);
    try {
      await axiosInstance.post('/api/leaves', form);
      setOk('Leave request submitted successfully.');
      setFormKey(k => k + 1); // reset form
      setPage(1);
      fetchLeaves();
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Failed to submit leave request.';
      console.error('Create leave failed:', status, msg);
      setErr(`Failed to submit leave request${status ? ` (HTTP ${status})` : ''}. ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel (delete) a Pending leave
  const cancelLeave = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return;
    setErr(''); setOk('');
    try {
      await axiosInstance.delete(`/api/leaves/${id}`);
      setRows(prev => prev.filter(r => r._id !== id));
      setOk('Leave request cancelled.');
      if (editTarget?._id === id) setEditTarget(null);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Failed to cancel leave.';
      console.error('Cancel leave failed:', status, msg);
      setErr(`Failed to cancel leave${status ? ` (HTTP ${status})` : ''}. ${msg}`);
    }
  };

  // Save edits for a Pending leave
  const saveEdit = async (patch) => {
    if (!editTarget) return;
    setErr(''); setOk('');
    setSubmitting(true);
    try {
      const res = await axiosInstance.put(`/api/leaves/${editTarget._id}`, patch);
      const updated = res.data;
      setRows(prev => prev.map(r => (r._id === updated._id ? updated : r)));
      setOk('Leave updated.');
      setEditTarget(null);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Failed to update leave.';
      console.error('Update leave failed:', status, msg);
      setErr(`Failed to update leave${status ? ` (HTTP ${status})` : ''}. ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const statusPill = (status) => {
    const base = 'px-2 py-1 rounded text-sm';
    if (status === 'Approved') return `${base} bg-green-100 text-green-800`;
    if (status === 'Rejected') return `${base} bg-red-100 text-red-800`;
    if (status === 'Cancelled') return `${base} bg-gray-100 text-gray-800`;
    return `${base} bg-yellow-100 text-yellow-800`;
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

  return (
    <div className="max-w-5xl mx-auto mt-8 p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#1e3a8a]">Leaves</h1>
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
      <button
        onClick = {()=> setShowPopup(true)}
        className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
      >
        New Leave Request
      </button>
      {showPopup && (
        <Popup onClose={()=>setShowPopup(false)}>
           <LeaveForm
            initial={{
              startDate: '',
              endDate: '',
              leaveType:'',
              reason:'s',
            }}
            onSubmit={handleCreate} 
            disabled={submitting}
          />
        </Popup>
      )}

      {/* Inline Edit (reuses LeaveForm with initial values) */}
      {editTarget && (
        <Popup onClose={()=>setEditTarget(false)}>
        <div className="mb-6">
          <div className="mb-2 font-semibold text-[#1e3a8a]">
            Editing request from {new Date(editTarget.startDate).toLocaleDateString()}
            {editTarget.endDate ? ` to ${new Date(editTarget.endDate).toLocaleDateString()}` : ''}
          </div>
          <LeaveForm
            initial={{
              startDate: editTarget.startDate,
              endDate: editTarget.endDate,
              leaveType: editTarget.leaveType,
              reason: editTarget.reason,
            }}
            onSubmit={saveEdit}
            onCancel={() => setEditTarget(null)}
            disabled={submitting}
          />
        </div>
        </Popup>
      )}

      {/* List */}
      <div className="mt-6 bg-white border border-[#cbd5e1] rounded shadow overflow-x-auto">
        {loading ? (
          <div className="p-4">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-[#4b5563]">No leave records.</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#eef2ff] text-[#1e3a8a]">
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
                  <td className="p-3 border-b">
                    {l.startDate ? new Date(l.startDate).toLocaleDateString() : '-'}
                  </td>
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
                    {l.status === 'Pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditTarget(l)}
                          className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => cancelLeave(l._id)}
                          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </div>
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
