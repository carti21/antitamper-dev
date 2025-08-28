import React from "react";
import { Outlet } from "react-router";

const NationalDashboard: React.FC = () => {
  return (
    <div>
      <Outlet /> 
    </div>
  );
};

export default NationalDashboard;
