// A2 - EmployeesPage.jsx

import { useEffect, useState } from "react";
import axiosInstance from "../axiosConfig";
import { useAuth } from "../context/AuthContext";

export default function EmployeesPage() {
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobRole: "",
    employmentType: "",
    joinedDate: "",
    employeeId: "",
    systemRole: "employee", // default is set to employee
  });

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get("/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (e) {
      console.error("Failed to load users:", e);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      jobRole: "",
      employmentType: "Full Time",
      joinedDate: "",
      employeeId: "",
      systemRole: "employee",
    });
    setShowModal(true);
  };

  const onSave = async () => {
    try {
      if (editing) {
        await axiosInstance.put(`/api/employees/${editing._id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axiosInstance.post("/api/employees", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowModal(false);
      fetchUsers();
    } catch (e) {
      console.error("Save user error:", e.response?.data || e.message);
      alert("Failed to save user");
    }
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm(user);
    setShowModal(true);
  };

  // added prompt to validate delete command
  const onDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axiosInstance.delete(`/api/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (e) {
      console.error("Delete user error:", e);
      alert("Failed to delete user");
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  if (loading) return <div className="p-4">Loading users…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">All Employees </h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          + Add User
        </button>
      </div>

      {users.length === 0 ? (
        <p>No users yet.</p>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Employee ID</th>
              <th className="p-2 border">First Name</th>
              <th className="p-2 border">Last Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Job Role</th>
              <th className="p-2 border">Employment Type</th>
              <th className="p-2 border">Joined Date</th>
              <th className="p-2 border">System Role</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td className="p-2 border">{u.employeeId}</td>
                <td className="p-2 border">{u.firstName}</td>
                <td className="p-2 border">{u.lastName}</td>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border">{u.jobRole}</td>
                <td className="p-2 border">{u.employmentType}</td>
                <td className="p-2 border">
                  {u.joinedDate
                    ? new Date(u.joinedDate).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-2 border font-semibold">
                  {u.systemRole === "admin" ? (
                    <span className="text-red-600">Admin</span>
                  ) : (
                    "Employee"
                  )}
                </td>
                <td className="p-2 border">
                  <button
                    onClick={() => openEdit(u)}
                    className="px-2 py-1 bg-yellow-500 text-white rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(u._id)}
                    className="px-2 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal to Create/Edit User */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded p-6 w-96">
            <h2 className="text-xl font-bold mb-4">
              {editing ? "Edit User" : "Add User"}
            </h2>

            <label className="block mb-2">
              <span className="text-sm">Employee ID</span>
              <input
                type="text"
                name="employeeId"
                value={form.employeeId || ""}
                onChange={onChange}
                className="w-full p-2 border rounded"
              />
            </label>

            <label className="block mb-2">
              <span className="text-sm">First Name</span>
              <input
                type="text"
                name="firstName"
                value={form.firstName || ""}
                onChange={onChange}
                className="w-full p-2 border rounded"
              />
            </label>

            <label className="block mb-2">
              <span className="text-sm">Last Name</span>
              <input
                type="text"
                name="lastName"
                value={form.lastName || ""}
                onChange={onChange}
                className="w-full p-2 border rounded"
              />
            </label>

            <label className="block mb-2">
              <span className="text-sm">Email</span>
              <input
                type="email"
                name="email"
                value={form.email || ""}
                onChange={onChange}
                disabled={!!editing}
                className="w-full p-2 border rounded bg-gray-100"
              />
            </label>

            <label className="block mb-2">
              <span className="text-sm">Job Role</span>
              <input
                type="text"
                name="jobRole"
                value={form.jobRole || ""}
                onChange={onChange}
                className="w-full p-2 border rounded"
              />
            </label>

            <label className="block mb-2">
              <span className="text-sm">Employment Type</span>
              <select
                name="employmentType"
                value={form.employmentType || "Full Time"}
                onChange={onChange}
                className="w-full p-2 border rounded"
              >
                <option>Full Time</option>
                <option>Part Time</option>
                <option>Casual</option>
                <option>Contract</option>
              </select>
            </label>

            <label className="block mb-2">
              <span className="text-sm">Joined Date</span>
              <input
                type="date"
                name="joinedDate"
                value={
                  form.joinedDate
                    ? new Date(form.joinedDate).toISOString().substring(0, 10)
                    : ""
                }
                onChange={onChange}
                className="w-full p-2 border rounded"
              />
            </label>

            <label className="block mb-2">
              <span className="text-sm">System Role</span>
              <select
                name="systemRole"
                value={form.systemRole || "employee"}
                onChange={onChange}
                className="w-full p-2 border rounded"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <div className="flex gap-2 mt-4">
              <button
                onClick={onSave}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Save
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
