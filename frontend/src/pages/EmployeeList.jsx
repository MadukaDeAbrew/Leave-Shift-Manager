import { useEffect, useState } from "react";
import axiosInstance from "../axiosConfig";
import { useAuth } from "../context/AuthContext";

export default function EmployeeList() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/api/users", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setEmployees(res.data.users || []);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError("Failed to fetch employees.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) fetchEmployees();
  }, [user]);

  if (loading) return <div className="p-4">Loading employees...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Employee Management</h1>

      {employees.length === 0 ? (
        <p>No employees found.</p>
      ) : (
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Employee ID</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Job Role</th>
              <th className="p-2 border">Employment Type</th>
              <th className="p-2 border">Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id} className="hover:bg-gray-50">
                <td className="p-2 border">{emp.employeeId || "-"}</td>
                <td className="p-2 border">{emp.name || emp.fullName || "-"}</td>
                <td className="p-2 border">{emp.email}</td>
                <td className="p-2 border">{emp.jobRole || "-"}</td>
                <td className="p-2 border">{emp.employmentType || "-"}</td>
                <td className="p-2 border">
                  {emp.joinedDate ? new Date(emp.joinedDate).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
