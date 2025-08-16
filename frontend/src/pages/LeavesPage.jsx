import { useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../axiosConfig';
import LeaveForm from '../components/LeaveForm';

const STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected'];
const LIMIT = 10; // rows per page

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

  const queryStatus = useMemo(() => (statusTab === 'All' ? undefined : statusTab), [statusTab]);

  const fetchLeaves = async () => {
    setErr(''); setOk('');
    try {
      setLoading(true);
      const res = await axiosInstance.get('/leaves', {
        params: {
          page,
          limit: LIMIT,
          ...(queryStatus ? { status: queryStatus } : {}),
        },
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

  // load whenever page or status changes
  useEffect(() => { fetchLeaves(); }, [page, queryStatus]);

  // auto-dismiss banners & focus 
  useEffect(() => {
    if (ok || err) {
      alertRef.current?.focus();
      const t = setTimeout(() => { setOk(''); setErr(''); }, 3000);
      return () => clearTimeout(t);
    }
  }, [ok, err]);

  // Create leave
  const handleCreate = async (form) => {
    setErr(''); setOk('');
    setSubmitting(true);
    try {
      await axiosInstance.post('/leaves', form);
      setOk('Leave request submitted successfully.');
      setFormKey(k => k + 1);     // reset form
      setPage(1);                 // go to first page to see newest
      fetchLeaves();              // refresh list
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Failed to submit leave request.';
      console.error('Create leave failed:', status, msg);
      setErr(`Failed to submit leave request${status ? ` (HTTP ${status})` : ''}. ${msg}`);
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

  // simple pager helpers
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

      {/* Success/Error */}
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

      {/* Create Form */}
      <LeaveForm key={formKey} onSubmit={handleCreate} disabled={submitting} />

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
                <th className="text-left p-3 border-b">Employee</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l._id} className="hover:bg-[#f9fafb]">
                  <td className="p-3 border-b">{l.startDate ? new Date(l.startDate).toLocaleDateString() : '-'}</td>
                  <td className="p-3 border-b">{l.endDate ? new Date(l.endDate).toLocaleDateString()
                    : (l.startDate ? new Date(l.startDate).toLocaleDateString() : '-')}</td>
                  <td className="p-3 border-b">{l.leaveType || '-'}</td>
                  <td className="p-3 border-b">{l.reason || '-'}</td>
                  <td className="p-3 border-b">
                    <span className={statusPill(l.status || 'Pending')}>{l.status || 'Pending'}</span>
                  </td>
                  <td className="p-3 border-b">{l.userId?.name || 'Me'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pager */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => canPrev && setPage(p => p - 1)}
          disabled={!canPrev}
          className={`px-3 py-1 rounded border ${
            canPrev ? 'bg-white text-[#1e3a8a] border-[#cbd5e1] hover:bg-[#eef2ff]'
                    : 'bg-gray-100 text-gray-400 border-[#e5e7eb] cursor-not-allowed'
          }`}
        >
          Prev
        </button>

        {/* show up to 5 numbered buttons around current page */}
        <div className="flex gap-1">
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter(n => Math.abs(n - page) <= 2 || n === 1 || n === pages) 
            .map((n, idx, arr) => {
              
              const prev = arr[idx - 1];
              const showDots = prev && n - prev > 1;
              return (
                <span key={n} className="flex items-center">
                  {showDots && <span className="mx-1 text-gray-400">…</span>}
                  <PageBadge n={n} />
                </span>
              );
            })}
        </div>

        <button
          onClick={() => canNext && setPage(p => p + 1)}
          disabled={!canNext}
          className={`px-3 py-1 rounded border ${
            canNext ? 'bg-white text-[#1e3a8a] border-[#cbd5e1] hover:bg-[#eef2ff]'
                    : 'bg-gray-100 text-gray-400 border-[#e5e7eb] cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
