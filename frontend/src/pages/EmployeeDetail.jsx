import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../axiosConfig";
import { useAuth } from "../context/AuthContext";

export default function EmployeeDetail() {
  const { token } = useAuth();
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await axiosInstance.get(`/api/employees/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmployee(res.data);
      } catch (e) {
        console.error("Failed to fetch employee", e);
      }
    };
    if (token) fetchEmployee();
  }, [id, token]);

  if (!employee) return <div className="text-center mt-10">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10 border p-6 rounded shadow">
      <h1 className="text-xl font-bold mb-4">
        {employee.firstName} {employee.lastName}
      </h1>
      <p><strong>Email:</strong> {employee.email}</p>
      <p><strong>Role:</strong> {employee.jobRole}</p>
      <p><strong>Employment Type:</strong> {employee.employmentType}</p>
      <p><strong>Phone:</strong> {employee.phone}</p>
      <p><strong>Address:</strong> {employee.address}</p>
    </div>
  );
}
