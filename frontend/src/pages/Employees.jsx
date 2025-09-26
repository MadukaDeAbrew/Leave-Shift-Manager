// EmployeesPage.jsx- view,add,update and delete employee records
import { useEffect, useState } from "react";
import axiosInstance from "../axiosConfig";
import { useAuth } from "../context/AuthContext";

export default function Employees() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // employee being edited or null

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobRole: "",
    employmentType: "",
    joinedDate: "",
  });

  const [errors, setErrors] = useState({});

  // 🔹 Validation
  const validate = () => {
    const newErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      newErrors.email = "Invalid email format";
    if (!form.employmentType.trim())
      newErrors.employmentType = "Employment type is required";
    return newErrors;
  };

  // 🔹 Save handler
  const onSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (editing) {
        // Update existing
        await axiosInstance.put(`/api/employees/${editing._id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create new
        await axiosInstance.post("/api/employees", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowModal(false);
      fetchEmployees();
    } catch (e) {
      console.error("Save employee error:", e.response?.data || e.message);
      alert(e.response?.data?.message || "Failed to save employee");
    }
  };

  // 🔹 Fetch employees
  const fetchEmployees = async () => {
    try {
      const res = await axiosInstance.get("/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data);
    } catch (e) {
      console.error("Failed to load employees:", e);
      setError("Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchEmployees();
  }, [token]);

  // 🔹 Open modal
  const openCreate = () => {
    setEditing(null);
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      jobRole: "",
      employmentType: "",
      joinedDate: "",
    });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm(emp);
    setErrors({});
    setShowModal(true);
  };

  // 🔹 Delete
  const onDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      await axiosInstance.delete(`/api/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEmployees();
    } catch (e) {
      console.error("Delete employee error:", e);
      alert("Failed to delete employee");
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // === UI ===
  if (loading) return <div className="p-4">Loading employees…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Employees</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          + Add Employee
        </button>
      </div>

      {employees.length === 0 ? (
        <p>No employees yet.</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">First Name</th>
              <th className="p-2 border">Last Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Job Role</th>
              <th className="p-2 border">Employment Type</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id}>
                <td className="p-2 border">{emp.firstName}</td>
                <td className="p-2 border">{emp.lastName}</td>
                <td className="p-2 border">{emp.email}</td>
                <td className="p-2 border">{emp.jobRole}</td>
                <td className="p-2 border">{emp.employmentType}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => openEdit(emp)}
                    className="px-2 py-1 bg-yellow-500 text-white rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(emp._id)}
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

      {/* === Modal === */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded p-6 w-96">
            <h2 className="text-xl font-bold mb-4">
              {editing ? "Edit Employee" : "Add Employee"}
            </h2>

            {/* First Name */}
            <label className="block mb-2">
              <span className="text-sm">First Name</span>
              <input
                type="text"
                name="firstName"
                value={form.firstName || ""}
                onChange={onChange}
                className={`w-full p-2 border rounded ${
                  errors.firstName ? "border-red-500" : ""
                }`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm">{errors.firstName}</p>
              )}
            </label>

            {/* Last Name */}
            <label className="block mb-2">
              <span className="text-sm">Last Name</span>
              <input
                type="text"
                name="lastName"
                value={form.lastName || ""}
                onChange={onChange}
                className={`w-full p-2 border rounded ${
                  errors.lastName ? "border-red-500" : ""
                }`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm">{errors.lastName}</p>
              )}
            </label>

            {/* Email */}
            <label className="block mb-2">
              <span className="text-sm">Email</span>
              <input
                type="email"
                name="email"
                value={form.email || ""}
                onChange={onChange}
                disabled={!!editing} // Email not editable in edit mode
                className={`w-full p-2 border rounded ${
                  errors.email ? "border-red-500" : ""
                } ${editing ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </label>

            {/* Job Role */}
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

            {/* Employment Type */}
            <label className="block mb-2">
              <span className="text-sm">Employment Type</span>
              <select
                name="employmentType"
                value={form.employmentType || ""}
                onChange={onChange}
                className={`w-full p-2 border rounded ${
                  errors.employmentType ? "border-red-500" : ""
                }`}
              >
                <option value="">-- Select --</option>
                <option>Full Time</option>
                <option>Part Time</option>
                <option>Casual</option>
                <option>Contract</option>
              </select>
              {errors.employmentType && (
                <p className="text-red-500 text-sm">{errors.employmentType}</p>
              )}
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
