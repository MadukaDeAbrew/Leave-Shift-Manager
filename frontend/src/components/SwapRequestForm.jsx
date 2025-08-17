// frontend/src/components/SwapRequestForm.jsx
import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../axiosConfig';

/**
 * Shift Swap Request Form (User Story 11.1 + 11.2)
 *
 * Props:
 *  - sourceShift: the user's shift they want to swap FROM (required)
 *  - onClose?: () => void
 *  - onSaved?: (swapRequest) => void
 *
 * Backend:
 *  - GET  /api/shifts/available-for-swap?excludeShiftId=<id>
 *  - POST /api/swaps  { sourceShiftId, targetShiftId, message }
 */
export default function SwapRequestForm({ sourceShift, onClose, onSaved }) {
  const [options, setOptions] = useState([]); // other users' shifts
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [targetId, setTargetId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const canLoad = Boolean(sourceShift?._id);

  // Load available target shifts (same-day, not mine)
  const loadOptions = async () => {
    setError('');
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/shifts/available-for-swap', {
        params: { excludeShiftId: sourceShift?._id },
      });
      setOptions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load available shifts.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canLoad) loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceShift?._id]);

  const errors = useMemo(() => {
    const e = {};
    if (!canLoad) e.source = 'Source shift missing.';
    if (!targetId) e.targetId = 'Please choose a shift to swap with.';
    if (message.length > 300) e.message = 'Message must be 300 characters or less.';
    return e;
  }, [canLoad, targetId, message]);

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
      const payload = {
        sourceShiftId: sourceShift._id,
        targetShiftId: targetId,
        message: message.trim(),
      };
      const res = await axiosInstance.post('/api/swaps', payload);
      setOk('Swap request submitted.');
      onSaved?.(res.data);
      onClose?.();
    } catch (err) {
      // Show useful server messages incl. 400/403/409
      const msg = err?.response?.data?.message || 'Failed to submit swap.';
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

      {/* Target shift select */}
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
                {s.userId?.name || 'Employee'} — {s.shiftDate ? new Date(s.shiftDate).toLocaleDateString() : '—'} • {s.startTime}-{s.endTime} • {s.role || '—'}
              </option>
            ))}
          </select>
        )}
        {errors.targetId && <p className="text-sm text-red-600 mt-1">{errors.targetId}</p>}
      </label>

      {/* Message (optional) */}
      <label className="block">
        <span className="block text-sm text-[#4b5563] mb-1">
          Message (optional) <span className="text-xs text-gray-500">(max 300 chars)</span>
        </span>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`w-full p-2 border rounded ${errors.message ? 'border-red-500' : 'border-[#cbd5e1]'}`}
          placeholder="Short note to admin / the other user…"
        />
        <div className="flex justify-between">
          {errors.message && <p className="text-sm text-red-600 mt-1">{errors.message}</p>}
          <p className="text-xs text-gray-500 ml-auto">{message.length}/300</p>
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
