import { useMemo, useState } from 'react';

/**
 * LeaveForm with validation (Subtask 4.2)
 * Props:
 *  - onSubmit(form)   -> required
 *  - onCancel()       -> optional
 *  - initial          -> optional (prefill)
 *  - allowPast=false  -> optional
 *  - disabled=false   -> optional (external submit lock)
 */
const LEAVE_TYPES = ['Annual', 'Sick', 'Casual', 'Unpaid', 'Study', 'Other'];

export default function LeaveForm({
  onSubmit,
  onCancel,
  initial,
  allowPast = false,
  disabled = false,          // ✅ accept disabled from parent
}) {
  const [form, setForm] = useState({
    startDate: initial?.startDate?.slice(0, 10) || '',
    endDate:   initial?.endDate?.slice(0, 10)   || '',
    leaveType: initial?.leaveType || 'Annual',
    reason:    initial?.reason || '',
  });
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const update = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  // Helpers
  const toDate = (s) => (s ? new Date(s + 'T00:00:00') : null);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Validation
  const errors = useMemo(() => {
    const e = {};
    const start = toDate(form.startDate);
    const end   = toDate(form.endDate);

    if (!form.startDate) e.startDate = 'Start date is required.';
    if (!form.endDate) e.endDate = 'End date is required.';
    if (start && end && start > end) e.endDate = 'End date must be on or after the start date.';
    if (!allowPast && start && start < today) e.startDate = 'Start date cannot be in the past.';
    if (!LEAVE_TYPES.includes(form.leaveType)) e.leaveType = 'Please choose a valid leave type.';
    if (form.reason && form.reason.length > 500) e.reason = 'Reason must be 500 characters or less.';
    return e;
  }, [form, allowPast, today]);

  const hasErrors = Object.keys(errors).length > 0;
  const showErr = (name) => (submitAttempted || touched[name]) && errors[name];

  const submit = (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (hasErrors || disabled) return;
    onSubmit?.({
      startDate: form.startDate,
      endDate: form.endDate,
      leaveType: form.leaveType,
      reason: form.reason.trim(),
    });
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="bg-[#f4f6f8] border border-[#cbd5e1] rounded-xl shadow p-5 grid gap-4"
    >
      <h3 className="text-lg font-semibold text-[#1e3a8a]">Request Leave</h3>

      {/* Start Date */}
      <label className="block">
        <span className="block text-sm text-[#4b5563] mb-1">Start Date</span>
        <input
          type="date"
          name="startDate"
          value={form.startDate}
          onChange={update('startDate')}
          onBlur={onBlur}
          className={`w-full p-2 border rounded ${showErr('startDate') ? 'border-red-500' : 'border-[#cbd5e1]'}`}
          required
        />
        {showErr('startDate') && <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>}
      </label>

      {/* End Date */}
      <label className="block">
        <span className="block text-sm text-[#4b5563] mb-1">End Date</span>
        <input
          type="date"
          name="endDate"
          value={form.endDate}
          onChange={update('endDate')}
          onBlur={onBlur}
          className={`w-full p-2 border rounded ${showErr('endDate') ? 'border-red-500' : 'border-[#cbd5e1]'}`}
          required
        />
        {showErr('endDate') && <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>}
      </label>

      {/* Leave Type */}
      <label className="block">
        <span className="block text-sm text-[#4b5563] mb-1">Leave Type</span>
        <select
          name="leaveType"
          value={form.leaveType}
          onChange={update('leaveType')}
          onBlur={onBlur}
          className={`w-full p-2 border rounded bg-white ${showErr('leaveType') ? 'border-red-500' : 'border-[#cbd5e1]'}`}
        >
          {LEAVE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {showErr('leaveType') && <p className="text-red-600 text-sm mt-1">{errors.leaveType}</p>}
      </label>

      {/* Reason */}
      <label className="block">
        <span className="block text-sm text-[#4b5563] mb-1">
          Reason (optional) <span className="text-xs text-gray-500">(max 500 chars)</span>
        </span>
        <textarea
          name="reason"
          rows={3}
          value={form.reason}
          onChange={update('reason')}
          onBlur={onBlur}
          className={`w-full p-2 border rounded ${showErr('reason') ? 'border-red-500' : 'border-[#cbd5e1]'}`}
          placeholder="Add a short reason…"
        />
        <div className="flex justify-between">
          {showErr('reason') && <p className="text-red-600 text-sm mt-1">{errors.reason}</p>}
          <p className="text-xs text-gray-500 ml-auto">{form.reason.length}/500</p>
        </div>
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={disabled || hasErrors}
          className={`text-white px-4 py-2 rounded ${
            disabled || hasErrors
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-[#1e3a8a] hover:bg-[#3b82f6]'
          }`}
        >
          {disabled ? 'Submitting…' : 'Submit Request'}
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
