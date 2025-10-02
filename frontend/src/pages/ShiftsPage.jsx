
import {useMemo, useState,useEffect} from 'react';
import axios from '../axiosConfig';
import { useAuth } from '../context/AuthContext';


export function AddShiftForm({onCreated}) {
  // input value for form
  const [shiftDate, setShiftDate] = useState('');       
  const [slotKey, setSlotKey] = useState('');  
  const [role, setRole] = useState('');        
  const [message, setMessage] = useState('');

  //only select time below
   const slots = [
    { key: 's08_10', label: '08:00–10:00' },
    { key: 's10_12', label: '10:00–12:00' },
    { key: 's12_14', label: '12:00–14:00' },
    { key: 's14_16', label: '14:00–16:00' },
    { key: 's16_18', label: '16:00–18:00' },
    { key: 's18_20', label: '18:00–20:00' },
  ];

  //submit form
  const handleSubmit = async (e) => {
    e.preventDefault();  
    try {
      const res = await axios.post('/api/shifts', {
        shiftDate,          
        slotKey,         
        roleInwork: role 
      });
      // if sucessful
      setMessage(`Shift created: ${res.data.shiftDate} ${res.data.startTime}-${res.data.endTime}`);
      setShiftDate('');
      setSlotKey('');
      setRole('');
      onCreated && onCreated(); 
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  return(
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded-lg"> 
      <h2 className="text-lg font-bold mb-4">Add New Shift</h2>

      <form onSubmit={handleSubmit} className="space-y-4">  {/* Form */}
        
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            className="border rounded px-3 py-2 w-full"
            value={shiftDate}
            onChange={(e) => setShiftDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Time Slot</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={slotKey}
            onChange={(e) => setSlotKey(e.target.value)}
            required
          >
            <option value="">Select a time slot</option>
            {slots.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            placeholder="e.g., Cashier"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          />
        </div>

       
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>

      {"remider!"}
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}

//Table//
export function ShiftTable({ reloadFlag, scope = 'all' }) {
  const [shifts, setShifts] = useState([]);
  const [msg, setMsg] = useState('');

  const fetchShifts = async () => {
    try {
      const res = await axios.get('/api/shifts', { params: { scope } }); 
      setShifts(res.data);
    } catch (err) {
      setMsg(`Failed to load shifts: ${err.response?.data?.message || err.message}`);
    }
  };

  
  useEffect(() => {
    fetchShifts();
  }, [reloadFlag]);

  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <h2 className="text-lg font-bold mb-4">Shift Table</h2>

      {"remider!"}
      {msg && <p className="mb-4 text-sm text-red-600">{msg}</p>}

      {"Table"}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Time</th>
              <th className="px-4 py-2 border">Role</th>
              <th className="px-4 py-2 border">Assigned To</th>
              <th className="px-4 py-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((s) => (
              <tr key={s._id} className="hover:bg-gray-50">
                {"Date"}
                <td className="px-4 py-2 border">{s.shiftDate}</td>
                {"time solt"}
                <td className="px-4 py-2 border">{s.startTime} - {s.endTime}</td>
                {"role"}
                <td className="px-4 py-2 border">{s.roleInWork || '-'}</td>
                {"assigned"}
                <td className="px-4 py-2 border">
                  {s.assignedTo && s.assignedTo.length > 0
                    ? s.assignedTo.join(', ')
                    : 'Unassigned'}
                </td>
                {"status"}
                <td className="px-4 py-2 border">
                  <span
                    className={
                      s.status === 'assigned'
                        ? 'px-2 py-1 text-xs bg-green-100 text-green-800 rounded'
                        : 'px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded'
                    }
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
            {"null"}
            {shifts.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No shifts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// week component

function WeekGrid({ weekStart, slots, shifts, isAdmin, onAssign, onUnassign, onCreateEmpty }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i);
    return d.toISOString().slice(0,10);
  });

  const map = new Map();
  for (const s of shifts) {
    const d = s.shiftDate || s.shiftDate;
    map.set(`${d}|${s.slotKey}`, s);
  }

  return (
    <table className="min-w-full border border-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-3 py-2 border text-left">Time / Date</th>
          {days.map(d => <th key={d} className="px-3 py-2 border text-left">{d}</th>)}
        </tr>
      </thead>
      <tbody>
        {slots.map(slot => (
          <tr key={slot.key}>
            <td className="px-3 py-2 border whitespace-nowrap">{slot.label}</td>
            {days.map(d => {
              const k = `${d}|${slot.key}`;
              const shift = map.get(k);
              const empty = !shift;
              return (
                <td key={k} className={`align-top px-2 py-2 border ${empty ? 'bg-yellow-50' : ''}`}>
                  {empty ? (
                    isAdmin ? (
                      <button className="text-sm underline" onClick={() => onCreateEmpty?.(d, slot.key)}>+ Create</button>
                    ) : <em className="text-gray-400">NUll</em>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="text-sm"><b>{shift.roleInwork || '-'}</b> <span className="text-xs">· {shift.status}</span></div>
                      <div className="text-xs text-gray-600">{shift.startTime} — {shift.endTime}</div>
                      <div className="text-xs">
                        {Array.isArray(shift.assignedTo) && shift.assignedTo.length > 0
                          ? shift.assignedTo.map(u => (u.name || u.email || String(u))).join(', ')
                          : <span className="text-amber-700">Unassigned</span>}
                      </div>
                      {isAdmin && (
                        Array.isArray(shift.assignedTo) && shift.assignedTo.length > 0
                          ? <button className="text-xs underline" onClick={() => onUnassign(shift._id)}>Cancel</button>
                          : <button className="text-xs underline" onClick={() => {
                              const uid = prompt('Type userId');
                              if (uid) onAssign(shift._id, uid);
                            }}>assign to</button>
                      )}
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Week component calculate
function startOfWeek(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();               // 0 Sun - 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; 
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
function addDays(iso, n) {
  const d = new Date(iso); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}


export default function ShiftsPage() {                      
  const { user } = useAuth();                   
  const isAdmin = user?.role === 'admin';       

  const [reloadFlag, setReloadFlag] = useState(0);

  // 
  const [anchorDate, setAnchorDate] = useState(() => new Date().toISOString().slice(0,10));
  const weekStart = useMemo(() => startOfWeek(anchorDate), [anchorDate]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const [filters, setFilters] = useState({ roleInwork:'', slotKey:'', status:'' });
  const [shifts, setShifts] = useState([]);
  const [msg, setMsg] = useState('');

const load = async () => {
    try {
      const params = {
        from: weekStart,
        to: weekEnd,
        scope: isAdmin ? 'all' : 'me',               
        ...(filters.roleInwork && { roleInwork: filters.roleInwork }),
        ...(filters.slotKey && { slotKey: filters.slotKey }),
        ...(filters.status && { status: filters.status }),
      };
      const { data } = await axios.get('/api/shifts', { params });
      setShifts(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    }
  };

  useEffect(() => { 
    load();
     /* eslint-disable-line */ }, 
     [reloadFlag, weekStart, weekEnd, isAdmin, filters.systemRole, filters.slotKey, filters.status]);

  const onAssign = async (shiftId, userId) => {
    await axios.post(`/api/shifts/${shiftId}/assign`, { userIds: [userId] });
    load();
  };
  const onUnassign = async (shiftId) => {
    await axios.post(`/api/shifts/${shiftId}/assign`, { userIds: [] });
    load();
  };
  const onCreateEmpty = async (date, slotKey) => {
    const role = filters.roleInwork || prompt('') || '';
    await axios.post('/api/shifts', { slotKey, roleInwork:filters.roleInwork });
    setReloadFlag(v => v + 1);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      <div className="flex items-center gap-2">
        <button className="px-2 py-1 border rounded" onClick={() => setAnchorDate(addDays(weekStart, -7))}>◀ previous</button>
        <strong>{weekStart} ~ {weekEnd}</strong>
        <button className="px-2 py-1 border rounded" onClick={() => setAnchorDate(addDays(weekStart, 7))}>next ▶</button>
        <input type="date" className="border rounded px-2 py-1" value={anchorDate} onChange={e=>setAnchorDate(e.target.value)} />
      </div>

      
      {isAdmin && (
        <>
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs">roleInWork</label>
              <input className="border rounded px-2 py-1" value={filters.roleInWork} onChange={e=>setFilters(f=>({...f, roleInWork:e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs">time</label>
              <select className="border rounded px-2 py-1" value={filters.slotKey} onChange={e=>setFilters(f=>({...f, slotKey:e.target.value}))}>
                <option value="">all</option>
                {[
                  { key: 's08_10', label: '08:00–10:00' },
                  { key: 's10_12', label: '10:00–12:00' },
                  { key: 's12_14', label: '12:00–14:00' },
                  { key: 's14_16', label: '14:00–16:00' },
                  { key: 's16_18', label: '16:00–18:00' },
                  { key: 's18_20', label: '18:00–20:00' },
                ].map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs">status</label>
              <select className="border rounded px-2 py-1" value={filters.status} onChange={e=>setFilters(f=>({...f, status:e.target.value}))}>
                <option value="">all</option>
                <option value="unassigned">unssign</option>
                <option value="assigned">assigned</option>
              </select>
            </div>
            <button className="px-3 py-1 border rounded" onClick={load}>Search</button>
          </div>
        </>
      )}

      {true && (
              <AddShiftForm onCreated={() => setReloadFlag(v => v + 1)} />
            )}

      {msg && <div className="text-sm text-red-600">{msg}</div>}

     
      <WeekGrid
        weekStart={weekStart}
        slots={[
          { key: 's08_10', label: '08:00–10:00' },
          { key: 's10_12', label: '10:00–12:00' },
          { key: 's12_14', label: '12:00–14:00' },
          { key: 's14_16', label: '14:00–16:00' },
          { key: 's16_18', label: '16:00–18:00' },
          { key: 's18_20', label: '18:00–20:00' },
        ]}
        shifts={shifts}
        isAdmin={isAdmin}
        onAssign={onAssign}
        onUnassign={onUnassign}
        onCreateEmpty={onCreateEmpty}
      />
      <ShiftTable reloadFlag={reloadFlag} scope={isAdmin ? 'all' : 'me'} />

    </div>
  );
}




