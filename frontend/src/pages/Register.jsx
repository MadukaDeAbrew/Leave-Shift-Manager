/*import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/auth/register', formData);
      alert('Registration successful. Please log in.');
      navigate('/login');
    } catch (error) {
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
*/

import { useState } from 'react';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // 1.1
  const onSubmit = (e) => {
    e.preventDefault();
    console.log('Signup UI submit clicked (stub):', form);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#f4f6f8] p-4">
      <div className="w-full max-w-xl bg-white border border-[#cbd5e1] rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-[#1e3a8a] mb-1">Create your account</h1>
        <p className="text-sm text-[#4b5563] mb-6">Fill in your details to get started.</p>

        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4">
          {/* Name */}
          <label className="block">
            <span className="block text-sm text-[#4b5563] mb-1">Full Name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              className="w-full p-2 border border-[#cbd5e1] rounded"
              placeholder="Jane Doe"
            />
          </label>

          {/* Email */}
          <label className="block">
            <span className="block text-sm text-[#4b5563] mb-1">Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              className="w-full p-2 border border-[#cbd5e1] rounded"
              placeholder="jane@example.com"
            />
          </label>

          

          {/* Password */}
          <label className="block">
            <span className="block text-sm text-[#4b5563] mb-1">Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              className="w-full p-2 border border-[#cbd5e1] rounded"
              placeholder="********"
            />
          </label>

          {/* Confirm Password */}
          <label className="block">
            <span className="block text-sm text-[#4b5563] mb-1">Confirm Password</span>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={onChange}
              className="w-full p-2 border border-[#cbd5e1] rounded"
              placeholder="********"
            />
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
