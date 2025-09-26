import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axiosConfig";

const ChangePassword = () => {
  const { token } = useAuth();   // ✅ use token directly
  const [form, setForm] = useState({ oldPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await axiosInstance.put("/api/auth/change-password", form, {
        headers: { Authorization: `Bearer ${token}` }, // ✅ fixed
      });
      setMsg(res.data.message || "Password updated successfully!");
      setForm({ oldPassword: "", newPassword: "" });
    } catch (error) {
      setMsg(error.response?.data?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Change Password</h1>

      {msg && (
        <div className="mb-4 p-2 rounded bg-blue-100 text-blue-800">{msg}</div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm">Old Password</span>
          <input
            type="password"
            name="oldPassword"
            value={form.oldPassword}
            onChange={onChange}
            className="w-full p-2 border rounded"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm">New Password</span>
          <input
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={onChange}
            className="w-full p-2 border rounded"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
