import { Route, Routes } from "react-router";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminLayout from "@/layouts/AdminLayout";
import Dashboard from "@/components/dashboard/Dashboard";
import { 
    ActivityLogsPage, DataPage, DashboardPage, DataAlert, DeviceDetails, 
    Factories, FactoriesDetails, Devices, Users, UsersDetails 
} from "@/pages/Admin";

const AdminRoutes = () => (
  <ProtectedRoute requiredLevel="ADMIN" requiredRoles={["Admin", "Manager"]}>
    <AdminLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="home" element={<DashboardPage />} />
        <Route path="activity-logs" element={<ActivityLogsPage />} />
        <Route path="data" element={<DataPage />} />
        <Route path="dataalert" element={<DataAlert />} />
        <Route path="factories" element={<Factories />} />
        <Route path="factories/:id" element={<FactoriesDetails />} />
        <Route path="devices" element={<Devices />} />
        <Route path="devices/:id" element={<DeviceDetails />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UsersDetails />} />
      </Routes>
    </AdminLayout>
  </ProtectedRoute>
);

export default AdminRoutes;
