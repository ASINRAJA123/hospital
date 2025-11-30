import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, currentRole, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner
  }

  if (!user || !currentRole) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentRole)) {
    // Optional: A dedicated "Access Denied" page would be better
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};