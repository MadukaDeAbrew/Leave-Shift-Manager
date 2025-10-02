//1.1 + 1.2
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; //1.5
import axiosInstance from '../axiosConfig';

const Register = () => {
  const [formData, setFormData] = useState({
    firstname: '', lastname: '', email: '', password: '', confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate(); //1.5

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
    // clear field-level error as user edits
    if (fieldErrors[name]) setFieldErrors((fe) => ({ ...fe, [name]: undefined }));
  };

  // keep 1.2 validation rules (client-side); 1.3 focuses on API wiring

const validate = () => {
  const fe = {};
  const emailOk = /^\S+@\S+\.\S+$/.test(formData.email);
  const strongPwd =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/.test(formData.password);

  if (!formData.firstName.trim()) fe.firstName = 'First name is required.';
  if (!formData.lastName.trim()) fe.lastName = 'Last name is required.';
  if (!formData.email) fe.email = 'Email is required.';
  else if (!emailOk) fe.email = 'Invalid email format.';
  if (!formData.password) fe.password = 'Password is required.';
  else if (!strongPwd) fe.password = 'Min 8 characters, incl. upper, lower, number, special char.';
  if (!formData.confirmPassword) fe.confirmPassword = 'Please confirm password.';
  else if (formData.confirmPassword !== formData.password) fe.confirmPassword = 'Passwords do not match.';

  setFieldErrors(fe);
  return Object.keys(fe).length === 0;
};


  const normalize = () => ({
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
  });


  // 1.3
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setOk('');
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = normalize();
      await axiosInstance.post('/api/auth/register', payload);
      setOk('Account created. You can now log in.'); // 1.5 will redirect
      // 1.5: redirect after success
      setTimeout(() => navigate('/login'), 2000);
    
    }
     catch (err) {
     console.error('Register failed:', err?.response?.status, err?.response?.data);
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 409) setError(msg || 'An account with this email already exists.');
      else if (status === 400) setError(msg || 'Please check your details and try again.');
      else setError(msg || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <form onSubmit={handleSubmit} noValidate className="bg-white p-6 shadow-md rounded">
        <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>

        {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        {ok && <div className="mb-3 p-2 bg-green-100 text-green-800 rounded">{ok}</div>}

        {/* First Name */}
        <label className="block mb-2">
          <span className="block text-sm mb-1">First Name</span>
          <input
            type="text"
            name="firstName"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={onChange}
            aria-invalid={!!fieldErrors.firstName}
            aria-describedby={fieldErrors.firstName ? 'fname-err' : undefined}
            className={`w-full p-2 border rounded ${fieldErrors.firstName ? 'border-red-500' : ''}`}
            placeholder="Alex"
          />
          {fieldErrors.firstName && <p id="fname-err" className="text-red-600 text-sm mt-1">{fieldErrors.firstName}</p>}
        </label>

        {/* Last Name */}
        <label className="block mb-2">
          <span className="block text-sm mb-1">Last Name</span>
          <input
            type="text"
            name="lastName"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={onChange}
            aria-invalid={!!fieldErrors.lastName}
            aria-describedby={fieldErrors.lastName ? 'lname-err' : undefined}
            className={`w-full p-2 border rounded ${fieldErrors.lastName ? 'border-red-500' : ''}`}
            placeholder="Smith"
          />
          {fieldErrors.lastName && <p id="lname-err" className="text-red-600 text-sm mt-1">{fieldErrors.lastName}</p>}
        </label>

        {/* Email */}
        <label className="block mb-2">
          <span className="block text-sm mb-1">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={onChange}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'email-err' : undefined}
            className={`w-full p-2 border rounded ${fieldErrors.email ? 'border-red-500' : ''}`}
            placeholder="alex@example.com"
          />
          {fieldErrors.email && <p id="email-err" className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>}
        </label>

        {/* Password */}
        <label className="block mb-2">
          <span className="block text-sm mb-1">Password</span>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={onChange}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'pwd-err pwd-hint' : 'pwd-hint'}
            className={`w-full p-2 border rounded ${fieldErrors.password ? 'border-red-500' : ''}`}
            placeholder="********"
          />
          {fieldErrors.password && <p id="pwd-err" className="text-red-600 text-sm mt-1">{fieldErrors.password}</p>}
          <p id="pwd-hint" className="text-xs text-gray-500 mt-1">
            Use at least 8 characters with a mix of upper/lowercase, numbers, and a special character.
          </p>
        </label>

        {/* Confirm Password */}
        <label className="block mb-4">
          <span className="block text-sm mb-1">Confirm Password</span>
          <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={onChange}
            aria-invalid={!!fieldErrors.confirmPassword}
            aria-describedby={fieldErrors.confirmPassword ? 'cpwd-err' : undefined}
            className={`w-full p-2 border rounded ${fieldErrors.confirmPassword ? 'border-red-500' : ''}`}
            placeholder="********"
          />
          {fieldErrors.confirmPassword && (
            <p id="cpwd-err" className="text-red-600 text-sm mt-1">{fieldErrors.confirmPassword}</p>
          )}
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-green-600 text-white p-2 rounded disabled:opacity-60"
        >
          {submitting ? 'Registering…' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default Register;
