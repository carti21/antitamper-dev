import { Route, Routes } from "react-router";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import FactoryLayout from "@/layouts/FactoryLayout";
import Dashboard from "@/components/dashboard/Dashboard";
import {
    FactoryDataPage, FactoryDashboardPage, FactoryDataAlert, FactoryDeviceDetails,
    FactoryDevices, FactoryUsers, FactoryUsersDetails
} from "@/pages/Factory";

const FactoryRoutes = () => {
  return (
    <ProtectedRoute requiredLevel="FACTORY" requiredRoles={["Admin", "Manager"]}>
      <FactoryLayout>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="home" element={<FactoryDashboardPage />} />
          <Route path="data" element={<FactoryDataPage />} />
          <Route path="dataalert" element={<FactoryDataAlert />} />
          <Route path="devices" element={<FactoryDevices />} />
          <Route path="devices/:id" element={<FactoryDeviceDetails />} />
          <Route path="users" element={<FactoryUsers />} />
          <Route path="users/:id" element={<FactoryUsersDetails />} />
        </Routes>
      </FactoryLayout>
    </ProtectedRoute>
  );
};

export default FactoryRoutes;
