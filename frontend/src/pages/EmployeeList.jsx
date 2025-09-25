import { useEffect, useState } from "react";
import axiosInstance from "../axiosConfig";
import { useAuth } from "../context/AuthContext";

export default function EmployeeList() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axiosInstance.get("/api/employees", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmployees(res.data); 
      } catch (e) {
        console.error("Failed to fetch employees", e);
      }
    };
    if (token) fetchEmployees();
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Employees</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Employment Type</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id}>
              <td className="border p-2">{emp.employeeId}</td>
              <td className="border p-2">{emp.firstName} {emp.lastName}</td>
              <td className="border p-2">{emp.jobRole}</td>
              <td className="border p-2">{emp.employmentType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
