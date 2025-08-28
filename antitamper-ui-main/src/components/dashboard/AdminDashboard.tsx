import React from "react";
import { Outlet } from "react-router";

const AdminDashboard: React.FC = () => {
  return (
    <div>
      <Outlet /> 
    </div>
  );
};

export default AdminDashboard;
