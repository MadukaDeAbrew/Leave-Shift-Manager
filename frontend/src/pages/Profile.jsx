import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const Profile = () => {
  const { user } = useAuth(); // includes token + systemRole
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    pronouns: '',
    secondaryEmail: '',
    address: '',
    employeeId: '',
    employmentType: '',
    jobRole: '',
    joinedDate: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setFormData({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          pronouns: response.data.pronouns || '',
          secondaryEmail: response.data.secondaryEmail || '',
          address: response.data.address || '',
          employeeId: response.data.employeeId || '',
          employmentType: response.data.employmentType || '',
          jobRole: response.data.jobRole || '',
          joinedDate: response.data.joinedDate
            ? response.data.joinedDate.substring(0, 10) // format date
            : '',
        });
      } catch (error) {
        alert('Failed to fetch profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Only send editable fields
      const updatePayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        pronouns: formData.pronouns,
        secondaryEmail: formData.secondaryEmail,
        address: formData.address,
      };
      await axiosInstance.put('/api/auth/profile', updatePayload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <h1 className="text-2xl font-bold mb-4 text-center">Your Profile</h1>

        {/* Editable personal fields */}
        <input
          type="text"
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
          type="text"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Secondary Email"
          value={formData.secondaryEmail}
          onChange={(e) => setFormData({ ...formData, secondaryEmail: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />

        {/* Frozen employee-only fields (readonly for employees) */}
        <input
          type="text"
          placeholder="Employee ID"
          value={formData.employeeId}
          readOnly
          className="w-full mb-4 p-2 border rounded bg-gray-100 cursor-not-allowed"
        />
        <input
          type="text"
          placeholder="Employment Type"
          value={formData.employmentType}
          readOnly
          className="w-full mb-4 p-2 border rounded bg-gray-100 cursor-not-allowed"
        />
        <input
          type="text"
          placeholder="Job Role"
          value={formData.jobRole}
          readOnly
          className="w-full mb-4 p-2 border rounded bg-gray-100 cursor-not-allowed"
        />
        <input
          type="date"
          placeholder="Joined Date"
          value={formData.joinedDate}
          readOnly
          className="w-full mb-4 p-2 border rounded bg-gray-100 cursor-not-allowed"
        />

        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
