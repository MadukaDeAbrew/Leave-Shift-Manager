// frontend/src/components/SwapRequestForm.jsx
import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../axiosConfig';

export default function SwapRequestForm({ sourceShift, onClose, onSaved }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const loadOptions = async () => {
    setError('');
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/shifts/available-for-swap', {
        params: { excludeShiftId: sourceShift?._id },
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setOptions(list);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load available shifts.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sourceShift?._id) loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceShift?._id]);

  const errors = useMemo(() => {
    const e = {};
    if (!sourceShift?._id) e.source = 'Source shift missing.';
    if (!targetId) e.targetId = 'Please choose a shift to swap with.';
    if (reason.length > 300) e.reason = 'Reason must be 300 characters or less.';
    return e;
  }, [sourceShift, targetId, reason]);

  const hasErrors = Object.keys(errors).length > 0;

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setOk('');
    if (hasErrors) {
      setError(Object.values(errors)[0]);
      return;
    }

    try {
      setSaving(true);
      const res = await axiosInstance.post('/api/swaps', {
        fromShiftId: sourceShift._id,
        toShiftId: targetId,
        reason: reason.trim(),
      });
      setOk('Swap request submitted.');
      onSaved?.(res.data);
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to submit swap request.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="text-sm text-[#4b5563]">
        <div>
          <span className="font-semibold text-[#1e3a8a]">Your Shift:</span>{' '}
          {sourceShift?.shiftDate ? new Date(sourceShift.shiftDate).toLocaleDateString() : '—'} •{' '}
          {sourceShift?.startTime || '—'}–{sourceShift?.endTime || '—'} • {sourceShift?.role || '—'}
        </div>
      </div>

      {error && <div className="p-2 bg-red-50 text-red-700 rounded">{error}</div>}
      {ok && <div className="p-2 bg-green-50 text-green-800 rounded">{ok}</div>}

      <label className="block">
        <span className="block text-sm text-[#4b5563] mb-1">Swap with shift</span>
        {loading ? (
          <div className="p-2 border rounded border-[#cbd5e1]">Loading options…</div>
        ) : options.length === 0 ? (
          <div className="p-2 border rounded border-[#cbd5e1] text-[#6b7280]">
            No compatible shifts found for this day.
          </div>
        ) : (
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className={`w-full p-2 border rounded bg-white ${errors.targetId ? 'border-red-500' : 'border-[#cbd5e1]'}`}
          >
            <option value="">Select a shift…</option>
            {options.map((s) => (
              <option key={s._id} value={s._id}>
                {s.userId?.name || 'Employee / Unassigned'} • {s.startTime}-{s.endTime} • {s.role || '—'}
              </option>
            ))}
          </select>
        )}
        {errors.targetId && <p className="text-sm text-red-600 mt-1">{errors.targetId}</p>}
      </label>

      <label className="block">
        <span className="block text-sm text-[#4b5563] mb-1">
          Reason (optional) <span className="text-xs text-gray-500">(max 300 chars)</span>
        </span>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={`w-full p-2 border rounded ${errors.reason ? 'border-red-500' : 'border-[#cbd5e1]'}`}
          placeholder="Short note to admin / the other user…"
        />
        <div className="flex justify-between">
          {errors.reason && <p className="text-sm text-red-600 mt-1">{errors.reason}</p>}
          <p className="text-xs text-gray-500 ml-auto">{reason.length}/300</p>
        </div>
      </label>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || loading || hasErrors || options.length === 0}
          className={`text-white px-4 py-2 rounded ${
            saving || loading || hasErrors || options.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-[#1e3a8a] hover:bg-[#3b82f6]'
          }`}
        >
          {saving ? 'Submitting…' : 'Send Swap Request'}
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="bg-white border border-[#cbd5e1] text-[#1e3a8a] px-4 py-2 rounded hover:bg-[#eef2ff]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
