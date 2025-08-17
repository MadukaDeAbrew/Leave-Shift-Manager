import React, { useMemo } from 'react';

function groupByDay(shifts) {
  const map = new Map();
  shifts.forEach((s) => {
    const key = s.shiftDate ? new Date(s.shiftDate).toISOString().slice(0, 10) : 'Unknown';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  });
  // sort each day's shifts by start time
  for (const arr of map.values()) {
    arr.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }
  // return array sorted by date desc (newest first)
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function ShiftDayView({ shifts = [], isAdmin = false, onEdit, onDelete }) {
  const grouped = useMemo(() => groupByDay(shifts), [shifts]);

  if (!shifts.length) {
    return <div className="p-4 text-[#4b5563]">No shifts found.</div>;
  }

  return (
    <div className="space-y-6">
      {grouped.map(([dateKey, items]) => {
        const pretty = dateKey !== 'Unknown'
          ? new Date(dateKey + 'T00:00:00').toLocaleDateString()
          : 'Unknown date';

        return (
          <section key={dateKey} className="border border-[#cbd5e1] rounded-lg overflow-hidden">
            <div className="bg-[#eef2ff] text-[#1e3a8a] px-4 py-2 font-semibold">
              {pretty} <span className="text-sm text-[#4b5563]">({items.length})</span>
            </div>

            <ul className="divide-y divide-[#e5e7eb]">
              {items.map((s) => (
                <li key={s._id} className="p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium">
                      {s.startTime} – {s.endTime} {s.role ? <span className="text-[#4b5563]">· {s.role}</span> : null}
                    </div>
                    <div className="text-sm text-[#6b7280]">
                      {s.userId?.name ? s.userId.name : '—'}
                      {s.userId?.email ? <span className="text-xs ml-1">({s.userId.email})</span> : null}
                    </div>
                    <div className="text-xs text-[#6b7280] mt-0.5">
                      Status: <span className="font-medium">{s.status || 'Scheduled'}</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit?.(s)}
                        className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete?.(s._id)}
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
