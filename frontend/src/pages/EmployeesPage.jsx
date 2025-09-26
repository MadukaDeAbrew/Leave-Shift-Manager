// A2 - EmployeesPage.jsx
import { useEffect, useState } from "react";
import axiosInstance from "../axiosConfig";
import { useAuth } from "../context/AuthContext";

export default function EmployeesPage() {
  const { token } = useAuth();

  // Encapsulation: state is private to this component 
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // holds the employee being edited
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobRole: "",
    employmentType: "",
    joinedDate: "",
  });

  // Observer Design Pattern (Behavioural): React automatically re-renders when state changes 
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

  // Factory Pattern (Creational): creates a new employee object with defaults 
  const openCreate = () => {
    setEditing(null);
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      jobRole: "",
      employmentType: "Full Time",
      joinedDate: "",
    });
    setShowModal(true);
  };

  // Template Method Pattern (Behavioural): common save flow (decide PUT or POST) 
  const onSave = async () => {
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
      alert("Failed to save employee");
    }
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm(emp); // Memento Pattern (Behavioural): clone current state of employee
    setShowModal(true);
  };

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

      {/* Modal for encapsulates editing/creating employee */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded p-6 w-96">
            <h2 className="text-xl font-bold mb-4">
              {editing ? "Edit Employee" : "Add Employee"}
            </h2>

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
                disabled={!!editing} // Abstraction: cannot edit email
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
