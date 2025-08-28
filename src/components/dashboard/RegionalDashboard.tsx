import React from "react";
import { Outlet } from "react-router";

const RegionalDashboard: React.FC = () => {
  return (
    <div>
      <Outlet /> 
    </div>
  );
};

export default RegionalDashboard;
