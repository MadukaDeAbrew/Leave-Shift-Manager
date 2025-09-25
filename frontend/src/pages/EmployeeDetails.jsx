import { useParams } from "react-router-dom";

export default function EmployeeDetails() {
  const { id } = useParams();

  // later fetch by id from backend
  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-2xl font-bold mb-4">Employee Details</h1>
      <p><strong>ID:</strong> {id}</p>
      <p><strong>Name:</strong> (will fetch from backend)</p>
      <p><strong>Email:</strong> (will fetch from backend)</p>
      <p><strong>Role:</strong> (will fetch from backend)</p>
    </div>
  );
}
