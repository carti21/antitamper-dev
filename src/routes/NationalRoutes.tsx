import { Routes, Route } from "react-router";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NationalLayout from "@/layouts/NationalLayout";
import Dashboard from "@/components/dashboard/Dashboard";
import {
    NationalActivityLogsPage, NationalDataPage, NationalDashboardPage, NationalDataAlert,
    NationalDeviceDetails, NationalFactories, NationalFactoriesDetails, NationalDevices,
    NationalUsers, NationalUsersDetails
} from "@/pages/National";

const NationalRoutes = () => {
  return (
    <ProtectedRoute requiredLevel="NATIONAL" requiredRoles={["Admin", "Manager"]}>
      <NationalLayout>
        <Routes>
        <Route index element={<Dashboard />} />
        <Route path="home" element={<NationalDashboardPage />} />
        <Route path="activity-logs" element={<NationalActivityLogsPage />} />
        <Route path="data" element={<NationalDataPage />} />
        <Route path="dataalert" element={<NationalDataAlert />} />
        <Route path="factories" element={<NationalFactories />} />
        <Route path="factories/:id" element={<NationalFactoriesDetails />} />
        <Route path="devices" element={<NationalDevices />} />
        <Route path="devices/:id" element={<NationalDeviceDetails />} />
        <Route path="users" element={<NationalUsers />} />
        <Route path="users/:id" element={<NationalUsersDetails />} />
        </Routes>
      </NationalLayout>
    </ProtectedRoute>
  );
};

export default NationalRoutes;
