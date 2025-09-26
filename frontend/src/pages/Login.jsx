// 2.1, 2.2, 2.3, 2.4, 2.5 + flash message support
import { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth(); // from AuthContext

  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState('');
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(location.state?.msg || '');

  // Clear router state so flash doesn't persist on refresh/back
  useEffect(() => {
    if (location.state?.msg) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
  const errors = useMemo(() => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!isEmail(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    return e;
  }, [form]);
  const hasErrors = Object.keys(errors).length > 0;
  const showError = (name) => (submitAttempted || touched[name]) && errors[name];

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setOk(''); setError('');
    if (hasErrors) return;

    try {
      setSubmitting(true);
      const res = await axiosInstance.post('/api/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      const { token, user } = res.data || {};
      if (!token) throw new Error('No token returned');

      // 2.4: store token & user, set header, persist (handled by AuthContext)
      login(token, user);

      // 2.5: redirect based on systemRole
      if (user.systemRole === 'admin') {
        navigate('/employees', { replace: true }); // admin dashboard
      } else {
        navigate('/profile', { replace: true });   // employee profile
      }
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
        {/* Flash message from redirects (ProtectedRoute/logout) */}
        {flash && (
          <div className="mb-3 p-2 rounded bg-blue-100 text-blue-800">
            {flash}
          </div>
        )}

        {/* API error */}
        {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        {/* Optional success (not commonly used on login, but keeping your state) */}
        {ok && <div className="mb-3 p-2 bg-green-100 text-green-800 rounded">{ok}</div>}

        <h1 className="text-2xl font-bold text-[#1e3a8a] mb-1">Welcome back</h1>
        <p className="text-sm text-[#4b5563] mb-6">Sign in to continue.</p>

        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <label className="block">
            <span className="block text-sm text-[#4b5563] mb-1">Email</span>
            <input
              type="email" name="email" value={form.email}
              onChange={onChange} onBlur={onBlur} autoComplete="email"
              aria-invalid={!!showError('email')}
              className={`w-full p-2 border rounded ${showError('email') ? 'border-red-500' : 'border-[#cbd5e1]'}`}
              placeholder="you@example.com"
            />
            {showError('email') && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </label>

          <label className="block">
            <span className="block text-sm text-[#4b5563] mb-1">Password</span>
            <input
              type="password" name="password" value={form.password}
              onChange={onChange} onBlur={onBlur} autoComplete="current-password"
              aria-invalid={!!showError('password')}
              className={`w-full p-2 border rounded ${showError('password') ? 'border-red-500' : 'border-[#cbd5e1]'}`}
              placeholder="********"
            />
            {showError('password') && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </label>

          <button
            type="submit" disabled={submitting}
            className={`mt-2 text-white px-4 py-2 rounded ${
              hasErrors && submitAttempted ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1e3a8a] hover:bg-[#3b82f6]'
            }`}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
