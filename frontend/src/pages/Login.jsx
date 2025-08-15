
//2.1,2.2
import { useMemo, useState } from 'react';
import axiosInstance from '../axiosConfig';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [ok, setOk] = useState('');
  const [error, setError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onBlur = (e) => {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
  };

  const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);

  const errors = useMemo(() => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!isEmail(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;
  const showError = (name) => (submitAttempted || touched[name]) && errors[name];

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setOk('');
    setError('');
    if (hasErrors) return;

    try {
      setSubmitting(true);
      //API path setting
      const res = await axiosInstance.post('/api/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

     //API path success
      const { token, user } = res.data || {};
      setOk('Login successful. (Next step 2.4: store token & redirect)');
      console.log('Login success payload:', { token, user });
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 400) setError(msg || 'Invalid credentials.');
      else setError(msg || 'Login failed. Please try again.');
      console.error('Login failed:', status, err?.response?.data || err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#f4f6f8] p-4">
      <div className="w-full max-w-md bg-white border border-[#cbd5e1] rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-[#1e3a8a] mb-1">Welcome back</h1>
        <p className="text-sm text-[#4b5563] mb-6">Sign in to continue.</p>

        {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        {ok && <div className="mb-3 p-2 bg-green-100 text-green-800 rounded">{ok}</div>}

        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          {/* Email */}
          <label className="block">
            <span className="block text-sm text-[#4b5563] mb-1">Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              onBlur={onBlur}
              autoComplete="email"
              aria-invalid={!!showError('email')}
              aria-describedby={showError('email') ? 'login-email-err' : undefined}
              className={`w-full p-2 border rounded ${
                showError('email') ? 'border-red-500' : 'border-[#cbd5e1]'
              }`}
              placeholder="you@example.com"
            />
            {showError('email') && (
              <p id="login-email-err" className="mt-1 text-sm text-red-600">
                {errors.email}
              </p>
            )}
          </label>

          {/* Password */}
          <label className="block">
            <span className="block text-sm text-[#4b5563] mb-1">Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              onBlur={onBlur}
              autoComplete="current-password"
              aria-invalid={!!showError('password')}
              aria-describedby={showError('password') ? 'login-pwd-err' : undefined}
              className={`w-full p-2 border rounded ${
                showError('password') ? 'border-red-500' : 'border-[#cbd5e1]'
              }`}
              placeholder="********"
            />
            {showError('password') && (
              <p id="login-pwd-err" className="mt-1 text-sm text-red-600">
                {errors.password}
              </p>
            )}
          </label>

          <button
            type="submit"
            disabled={submitting}
            className={`mt-2 text-white px-4 py-2 rounded ${
              hasErrors && submitAttempted
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#1e3a8a] hover:bg-[#3b82f6]'
            }`}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
