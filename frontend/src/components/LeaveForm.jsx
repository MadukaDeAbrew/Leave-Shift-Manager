import { useState } from 'react';

/**
 * 4.1
 * - Emits { startDate, endDate, leaveType, reason } via props.onSubmit(form)
 * - Styling in ash & blue palette to match the app
 *
 * Props:
 *  - onSubmit: (form) => void
 *  - onCancel?: () => void  (optional)
 *  - initial?: { startDate, endDate, leaveType, reason } (optional for edit flows)
 */
export default function LeaveForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState({
    startDate: initial?.startDate?.slice(0, 10) || '',
    endDate:   initial?.endDate?.slice(0, 10)   || '',
    leaveType: initial?.leaveType || 'Annual',
    reason:    initial?.reason || '',
  });

  const update = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (typeof onSubmit === 'function') onSubmit(form);
  };

  return (
    <form
      onSubmit={submit}
      className="bg-[#f4f6f8] border border-[#cbd5e1] rounded-xl shadow p-5 grid gap-4"
    >
      <h3 className="text-lg font-semibold text-[#1e3a8a]">Request Leave</h3>

      {/* Start Date */}
      <label className="block">
        <span className="block text-sm text-[#4b5563] mb-1">Start Date</span>
        <input
          type="date"
          value={form.startDate}
          onChange={update('startDate')}
          className="w-full p-2 border border-[#cbd5e1] rounded"
          required
        />
      </label>

      {/* End Date */}
      <label className="block">
        <span className="block text-sm text-[#4b5563] mb-1">End Date</span>
        <input
          type="date"
          value={form.endDate}
          onChange={update('endDate')}
          className="w-full p-2 border border-[#cbd5e1] rounded"
          required
        />
      </label>

      {/* Leave Type */}
      <label className="block">
        <span className="block text-sm text-[#4b5563] mb-1">Leave Type</span>
        <select
          value={form.leaveType}
          onChange={update('leaveType')}
          className="w-full p-2 border border-[#cbd5e1] rounded bg-white"
        >
          <option>Annual</option>
          <option>Sick</option>
          <option>Casual</option>
          <option>Unpaid</option>
          <option>Study</option>
          <option>Other</option>
        </select>
      </label>

      {/* Reason */}
      <label className="block">
        <span className="block text-sm text-[#4b5563] mb-1">Reason (optional)</span>
        <textarea
          rows={3}
          value={form.reason}
          onChange={update('reason')}
          className="w-full p-2 border border-[#cbd5e1] rounded"
          placeholder="Add a short reason here…"
        />
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="bg-[#1e3a8a] hover:bg-[#3b82f6] text-white px-4 py-2 rounded"
        >
          Submit Request
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-white border border-[#cbd5e1] text-[#1e3a8a] px-4 py-2 rounded hover:bg-[#eef2ff]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
