// A2- MyProfile.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axiosConfig";

export default function MyProfile() {
  const { user,token } = useAuth();

  // Encapsulation: keep profile state private to this component 
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  //  Abstraction: fetching profile is separated into its own function 
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = response.data.user || response.data;
        setProfile(profileData);
        setForm(profileData);
      } catch (error) {
        console.error("Profile fetch error:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProfile();
  }, [token]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Template Method Pattern (Behavioural): common flow for saving profile
  const onSave = async () => {
    try {
      const res = await axiosInstance.put("/api/auth/profile", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data.user || res.data);
      setEditing(false);
    } catch (e) {
      console.error("Failed to update profile:", e);
      alert("Failed to update profile. Try again.");
    }
  };

  if (loading) return <div className="text-center mt-20">Loading…</div>;
  if (!profile) return <div className="text-center mt-20">No profile found</div>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>

      <div className="mb-6 border p-4 rounded">
        <h2 className="font-semibold mb-2">Employment Information</h2>
        <p><strong>Employee ID:</strong> {profile.employeeId || "—"}</p>
        <p><strong>Job Role:</strong> {profile.jobRole || "—"}</p>
        <p><strong>Employment Type:</strong> {profile.employmentType || "—"}</p>
        <p><strong>Joined Date:</strong> 
          {profile.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : "—"}
        </p>
      </div>

      <div className="mb-6 border p-4 rounded">
        <h2 className="font-semibold mb-2">Personal Information</h2>

        {!editing ? (
          <>
            {/*Polymorphism: same data fields behave differently in view vs edit mode  */}
            <p><strong>First Name:</strong> {profile.firstName || "—"}</p>
            <p><strong>Last Name:</strong> {profile.lastName || "—"}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Phone:</strong> {profile.phone || "—"}</p>
            <p><strong>Pronouns:</strong> {profile.pronouns}</p>
            <p><strong>Address:</strong> {profile.address || "—"}</p>
            <button
              onClick={() => setEditing(true)}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Edit
            </button>
          </>
        ) : (
          <div className="space-y-3">
            {/* Memento Pattern (Behavioural): edits stored in 'form', cancel restores original */}
            <label className="block">
              <span className="text-sm">First Name</span>
              <input
                type="text"
                name="firstName"
                value={form.firstName || ""}
                onChange={onChange}
                className="w-full p-2 border rounded"
              />
            </label>

            <label className="block">
              <span className="text-sm">Last Name</span>
              <input
                type="text"
                name="lastName"
                value={form.lastName || ""}
                onChange={onChange}
                className="w-full p-2 border rounded"
              />
            </label>

            <label className="block">
              <span className="text-sm">Email (read-only)</span>
              <input
                type="email"
                name="email"
                value={form.email || ""}
                disabled
                className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
              />
            </label>

            <label className="block">
              <span className="text-sm">Phone</span>
              <input
                type="text"
                name="phone"
                value={form.phone || ""}
                onChange={onChange}
                className="w-full p-2 border rounded"
              />
            </label>

            <label className="block">
              <span className="text-sm">Pronouns</span>
              <select
                name="pronouns"
                value={form.pronouns || "prefer not to say"}
                onChange={onChange}
                className="w-full p-2 border rounded"
              >
                <option value="she/her">She/Her</option>
                <option value="he/him">He/Him</option>
                <option value="they/them">They/Them</option>
                <option value="prefer not to say">Prefer not to say</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm">Address</span>
              <input
                type="text"
                name="address"
                value={form.address || ""}
                onChange={onChange}
                className="w-full p-2 border rounded"
              />
            </label>

            <div className="flex gap-2">
              <button
                onClick={onSave}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
