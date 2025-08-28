import React from "react";
import { Outlet } from "react-router";

const FactoryDashboard: React.FC = () => {
  return (
    <div>
      <Outlet /> 
    </div>
  );
};

export default FactoryDashboard;
