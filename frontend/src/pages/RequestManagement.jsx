// frontend/src/pages/LeavesPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../axiosConfig';
//import LeaveForm from '../components/LeaveForm';
//import SwapForm from '../components/SwapForm';
import { useAuth } from '../context/AuthContext';

const STATUS_TABS = ['All', 'Queue', 'Processed'];
const LIMIT = 10;

export default function RequestManagement() {
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
  const [swapTarget, setSwapTarget] = useState(null);
  const [showSwapDialog, setShowSwapDialog] = useState(null);

  const queryStatus = useMemo(
    () => (statusTab === 'All' ? undefined : statusTab),
    [statusTab]
  );

  const{token} =useAuth();
  const fetchLeaves = async () => {
    setErr(''); setOk('');
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/admin/requests', {
        params: { page, limit: LIMIT, ...(queryStatus ? { status: queryStatus } : {}) },
        headers:{
          Authorization:`Bearer ${token}`,
        }
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

  const Popup = ({children, onClose}) =>(
    <div className='flex fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50'>
      <div className='bg-white p-6 rounded shadow-lg relative w-full max-w-md overflow-auto'>
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


  //convert the datetime-local data to display.
  const formatDateTimeLocal = (isoString) =>{
      if(!isoString) return '';
      const d=new Date(isoString);
      
      const pad = (n)=>n.toString().padStart(2,'0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() +1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const min = pad(d.getMinutes());

      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    }

  // Save edits for an approved shift swap
  const saveEdit = async (patch) => {
    if (!editTarget) return;
    setErr(''); setOk('');
    setSubmitting(true);
    try {
      const res = await axiosInstance.put(`/api/leaves/${editTarget._id}`, patch);
      const updated = res.data;
      setRows(prev => prev.map(r => (r._id === updated._id ? updated : r)));
      setOk('Shifts updated.');
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

  const rejectLeave = async (id) => {
    if (!window.confirm('Reject this leave request?')) return;
    setErr(''); setOk('');
    try {
      const res = await axiosInstance.patch(`/api/admin/requests/${id}/reject`);
      const updated = res.data;
      
      setRows(prev =>prev.map(r=>
        r._id ===id ? {...r,status: updated.status} : r
      ));

      setOk('Leave request rejected.');
      if (editTarget?._id === id) setEditTarget(null);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Failed to reject leave.';
      console.error('Reject leave failed:', status, msg);
      setErr(`Failed to reject leave${status ? ` (HTTP ${status})` : ''}. ${msg}`);
    }
  };

  const approveLeave = async (patch) => {
    try {

      if(patch.isAcceptSwap === true){
        setSwapTarget(patch);
        setShowSwapDialog(true);
        return;
      }

      const res = await axiosInstance.patch(`/api/admin/requests/${patch._id}/approve`);
      const updated = res.data;
      
      setRows(prev =>prev.map(r=>
        r._id ===patch._id ? {...r,status: updated.status} : r
      ));

      setOk('Leave request approved.');

      if (editTarget?._id === patch._id) setEditTarget(null);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Failed to reject leave.';
      console.error('Approve leave failed:', status, msg);
      setErr(`Failed to approve leave${status ? ` (HTTP ${status})` : ''}. ${msg}`);
    }
  };
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [availableShifts, setAvailableShifts] = useState([]);

  useEffect(()=>{
     const fetchAvailableShifts = async () => {
    if (!swapTarget?._id) return;

     try {
      //all search by filter
      /*const params={
        from:new Date().toISOString().split('T')[0],
        to:new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString.split('T')[0],
        scope:'all',
        //jobrole:userId.jobrole,
      }*/
      const res = await axiosInstance.get(`/api/shifts/`);
      setAvailableShifts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch available shifts:", err);
      setAvailableShifts([]);
    }
  };

  if (showSwapDialog) {
    fetchAvailableShifts();
  }
  },[showSwapDialog, swapTarget]);

  const handleSaveShiftSwap = async (shiftId) => {
    if (!shiftId) return alert("Please select a shift first");

    try {
      const res = await axiosInstance.patch(`/api/admin/requests/${swapTarget._id}/approve`, { newShiftId: shiftId });
      const updated = res.data;

      setRows(prev =>
      prev.map(r => (r._id === swapTarget._id ? { ...r, status: updated.status } : r))
    );

      setShowSwapDialog(false);
      setSwapTarget(null);
      alert("Shift swap saved successfully!");

    } catch (err) {
      console.error(err);
      alert("Failed to save shift swap.");
    }
  };

  /*const handleConvertToLeave = async (leaveId) => {
  try {
    const res = await axiosInstance.patch(`/api/admin/requests/${leaveId}/approve`, {
      forceAsLeave: true, 
    });

    setRows(prev => prev.map(r => 
      r._id === leaveId ? { ...r, status: res.data.status } : r
    ));

    setOk("Converted to leave and approved.");
    setShowSwapDialog(false);
  } catch (err) {
    console.error("Convert to leave failed:", err);
    setErr("Failed to convert to leave.");
  }
};*/


  const statusPill = (status) => {
    const base = 'px-2 py-1 rounded text-sm';
    if (status==='Pending') return `${base} bg-blue-400 text-white`
    //if (status === 'Approved') return `${base} bg-grey-100 text-grey-800`;
    //if (status === 'Rejected') return `${base} bg-grey-100 text-grey-800`;
    //if (status === 'Cancelled') return `${base} bg-gray-100 text-gray-800`;
    return `${base} bg-blue-700 text-white`;
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
        <h1 className="text-2xl font-bold text-[#1e3a8a]">Requests</h1>
        <div className="text-sm text-[#4b5563]">Total: {total}</div>
      </div>

      {/* Tabs */}
      <div className='flex items-center justify-between mb-4'>
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
        <div>
      {/* Inline Edit (reuses LeaveForm with initial values) */}
      {showSwapDialog && (
        <Popup onClose={() => setShowSwapDialog(false)}>
            <div className="mb-4 font-semibold text-blue-800">
              Assign a replacement shift for {swapTarget.userName}
              <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                  <h2 className="text-xl font-semibold mb-4">
                    {swapTarget.userName}
                  </h2>

                  {swapTarget.preferences && swapTarget.preferences.length > 0 && (
                    <ul className="list-disc pl-6 mb-4 text-blue-700">
                      Preferences:
                    {swapTarget.preferences?.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                  )}
      
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-2">Available Shifts</h3>
                    <ul className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                      {availableShifts?.map((shift) => (
                        <li
                          key={shift._id}
                          className={`p-2 border rounded cursor-pointer hover:bg-blue-50 ${
                            selectedShiftId === shift._id ? "bg-blue-100 border-blue-500" : ""
                          }`}
                          onClick={() => setSelectedShiftId(shift._id)}
                        >
                          <div className="font-semibold text-gray-800">
                            {shift.shiftDate} ({shift.startTime} - {shift.endTime})
                          </div>
                          <div className="text-sm text-gray-600">{shift.department}</div>
                        </li>
                      ))}
                      {(!availableShifts || availableShifts.length === 0) && (
                        <li className="text-gray-500 italic text-sm">No available shifts found.</li>
                      )}
                    </ul>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      type='submit'
                      onClick={() => handleSaveShiftSwap(selectedShiftId)}
                      disabled={!selectedShiftId}
                      className={`px-3 py-1 rounded text-white ${
                        selectedShiftId ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Save Shift Swap
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSwapDialog(false)}
                      className="px-3 py-1 rounded border border-gray-400 text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
            </div>
        </Popup>
      )}
      </div>
        
    </div>
      
      
      {/* List */}
      <div className="mt-6 bg-white border border-[#cbd5e1] rounded shadow overflow-x-auto">
        {loading ? (
          <div className="p-4">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-[#4b5563]">No request records.</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#eef2ff] text-[#1e3a8a]">
                <th className="text-left p-3 border-b">Employee Name</th>
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
                    {l.userName? l.userName: '-'}
                    </td>
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
                    <span className={statusPill(l.status || 'Pending')}>
                      {l.status === 'Pending'?'Queue' : 'Processed'}
                      </span>
                  </td>
                  <td className="p-3 border-b">
                    {l.status === 'Pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveLeave(l)}
                          className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectLeave(l._id)}
                          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Decline
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
