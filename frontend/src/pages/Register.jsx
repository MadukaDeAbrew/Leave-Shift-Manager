//1.1 + 1.2
import { useState } from 'react';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validateForm = () => {
    let newErrors = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email) {
      newErrors.email = 'Email address is a required field';
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = 'Invalid email address. Please check the format';
    }

    // Password validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!form.password) {
      newErrors.password = 'Password is a required field';
    } else if (!passwordRegex.test(form.password)) {
      newErrors.password =
        'Password must be at least 8 characters,and should include at least 1 uppercase, 1 lowercase, 1 number, and 1 special character';
    }

    // Confirm Password
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Signup UI submit clicked (stub):', form);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#f4f6f8] p-4">
      <div className="w-full max-w-xl bg-white border border-[#cbd5e1] rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-[#1e3a8a] mb-1">Create your account</h1>
        <p className="text-sm text-[#4b5563] mb-6">Fill in your details to get started.</p>

        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4">
          {/* Name */}
          <label>
            <span className="block text-sm mb-1">Full Name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              className="w-full p-2 border rounded"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </label>

          {/* Email */}
          <label>
            <span className="block text-sm mb-1">Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              className="w-full p-2 border rounded"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </label>

          {/* Password */}
          <label>
            <span className="block text-sm mb-1">Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              className="w-full p-2 border rounded"
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          </label>

          {/* Confirm Password */}
          <label>
            <span className="block text-sm mb-1">Confirm Password</span>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={onChange}
              className="w-full p-2 border rounded"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
            )}
          </label>

          <button
            type="submit"
            className="mt-2 bg-[#1e3a8a] hover:bg-[#3b82f6] text-white px-4 py-2 rounded"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
