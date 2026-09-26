import React from 'react';
import { Navigate } from 'react-router-dom';

// Patient dashboard has been removed in favor of donor management and portal.
const PatientDashboard = () => {
  return <Navigate to="/donor" replace />;
};

export default PatientDashboard;
