import { Route, Routes } from "react-router";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RegionalLayout from "@/layouts/RegionalLayout";
import Dashboard from "@/components/dashboard/Dashboard";
import {
    RegionalDataPage, RegionalDashboardPage, RegionalDataAlert, RegionalDeviceDetails,
    RegionalFactories, RegionalFactoriesDetails, RegionalDevices, RegionalUsers, RegionalUsersDetails
} from "@/pages/Regional";

const RegionalRoutes = () => {
  return (
    <ProtectedRoute requiredLevel="REGIONAL" requiredRoles={["Admin", "Manager"]}>
      <RegionalLayout>
        <Routes>
        <Route index element={<Dashboard />} />
        <Route path="home" element={<RegionalDashboardPage />} />
        <Route path="data" element={<RegionalDataPage />} />
        <Route path="dataalert" element={<RegionalDataAlert />} />
        <Route path="factories" element={<RegionalFactories />} />
        <Route path="factories/:id" element={<RegionalFactoriesDetails />} />
        <Route path="devices" element={<RegionalDevices />} />
        <Route path="devices/:id" element={<RegionalDeviceDetails />} />
        <Route path="users" element={<RegionalUsers />} />
        <Route path="users/:id" element={<RegionalUsersDetails />} />
        </Routes>
      </RegionalLayout>
    </ProtectedRoute>
  );
};

export default RegionalRoutes;
