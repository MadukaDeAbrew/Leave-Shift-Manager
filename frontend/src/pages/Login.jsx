
//2.1
import { useMemo, useState } from 'react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

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

  //2.2 
  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (hasErrors) return;
    console.log('Login validation passed; ready for 2.3 API call:', form);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#f4f6f8] p-4">
      <div className="w-full max-w-md bg-white border border-[#cbd5e1] rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-[#1e3a8a] mb-1">Welcome back</h1>
        <p className="text-sm text-[#4b5563] mb-6">Sign in to continue.</p>

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
            className={`mt-2 text-white px-4 py-2 rounded ${
              hasErrors && submitAttempted
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#1e3a8a] hover:bg-[#3b82f6]'
            }`}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
