import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Plus, UserCheck, ShoppingBag } from 'lucide-react';
import apiClient from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import AddUserModal from '../../components/modals/AddUserModal';
import { toast } from '../../components/common/Toaster';

export default function ManageStaff({ userRole, title }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/users/my-staff', {
        params: { role: userRole }
      });
      setUsers(response.data);
    } catch (error) {
      toast.error(`Failed to fetch ${title}.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userRole]);

  const handleUserAdded = () => {
    setIsModalOpen(false);
    fetchUsers();
  };

  const toggleUserStatus = async (userToUpdate) => {
    const action = userToUpdate.is_active ? 'Deactivate' : 'Activate';
    if (window.confirm(`Are you sure you want to ${action} ${userToUpdate.full_name}?`)) {
        try {
            await apiClient.put(`/api/users/${userToUpdate.id}`, { is_active: !userToUpdate.is_active });
            toast.success(`User status updated for ${userToUpdate.full_name}`);
            fetchUsers();
        } catch (error) {
            toast.error('Failed to update user status.');
        }
    }
  }

  const handleResetPassword = async (userToReset) => {
    if (window.confirm(`Are you sure you want to initiate a password reset for ${userToReset.full_name}?`)) {
      try {
        const response = await apiClient.post(`/api/users/${userToReset.id}/reset-password`);
        toast.success(response.data.msg);
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to reset password.');
      }
    }
  };

  const getIcon = () => {
    switch (userRole) {
      case 'nurse': return <UserCheck className="h-6 w-6 text-green-600" />;
      case 'medical_shop': return <ShoppingBag className="h-6 w-6 text-orange-600" />;
      default: return null;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className='flex items-center space-x-3'>
            {getIcon()}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage {title}</h1>
                <p className="text-gray-600 mt-1">Add, view, and manage accounts.</p>
            </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>Add New {title.slice(0, -1)}</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Full Name</th>
              <th scope="col" className="px-6 py-3 hidden md:table-cell">Email</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="text-center p-6">Loading...</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {user.full_name}
                    <p className="md:hidden text-xs font-normal text-gray-500">{user.email}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">{user.email}</td>
                  <td className="px-6 py-4"><StatusBadge status={user.is_active ? 'active' : 'inactive'} type='user' /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col sm:flex-row justify-end items-end sm:space-x-4 space-y-2 sm:space-y-0">
                      <button 
                          onClick={() => toggleUserStatus(user)}
                          className={`text-sm font-medium ${user.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>
                          {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                          onClick={() => handleResetPassword(user)}
                          className="text-sm font-medium text-gray-600 hover:text-gray-800"
                      >
                          Reset Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        role={userRole}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
}

ManageStaff.propTypes = {
  userRole: PropTypes.oneOf(['nurse', 'medical_shop']).isRequired,
  title: PropTypes.string.isRequired,
};