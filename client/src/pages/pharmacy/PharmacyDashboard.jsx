import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Package, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import apiClient from '../../services/api';
import { toast } from '../../components/common/Toaster';

const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-7 w-7 text-${color}-600`} />
        </div>
      </div>
    </div>
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string.isRequired,
};

export default function PharmacyDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/api/prescriptions/stats');
        setStats(response.data);
      } catch (error) {
        toast.error("Failed to load dashboard statistics.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of today's pharmacy activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label="New Prescriptions" value={stats?.new_prescriptions ?? 0} icon={Package} color="purple" />
        <StatCard label="In Progress" value={stats?.in_progress ?? 0} icon={Clock} color="orange" />
        <StatCard label="Completed Today" value={stats?.completed_today ?? 0} icon={CheckCircle} color="green" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-y-4">
            <div>
                <h2 className="text-lg font-semibold text-gray-900">Pending Queue</h2>
                <p className="text-gray-600 mt-1">
                    There are <span className="font-bold text-red-600">{stats?.total_pending ?? 0}</span> prescriptions waiting for action.
                </p>
            </div>
            <Link to="/pharmacy/queue" className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                <span>View Full Queue</span>
                <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
      </div>
    </div>
  );
}