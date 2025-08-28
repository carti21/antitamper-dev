import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import UnauthorizedPage from "@/pages/unauthorized";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminLayout from "@/layouts/AdminLayout";
import NationalLayout from "@/layouts/NationalLayout";
import RegionalLayout from "@/layouts/RegionalLayout";
import FactoryLayout from "@/layouts/FactoryLayout";
import Dashboard from "@/components/dashboard/Dashboard";

import {
  ActivityLogsPage,
  DataPage,
  DashboardPage,
  DataAlert,
  DeviceDetails,
  Factories,
  FactoriesDetails,
  Devices,
  Users,
  UsersDetails,
} from "@/pages/Admin";

import {
  NationalActivityLogsPage,
  NationalDataPage,
  NationalDashboardPage,
  NationalDataAlert,
  NationalDeviceDetails,
  NationalFactories,
  NationalFactoriesDetails,
  NationalDevices,
  NationalUsers,
  NationalUsersDetails,
} from "@/pages/National";

import {
  RegionalDataPage,
  RegionalDashboardPage,
  RegionalDataAlert,
  RegionalDeviceDetails,
  RegionalFactories,
  RegionalFactoriesDetails,
  RegionalDevices,
  RegionalUsers,
  RegionalUsersDetails,
} from "@/pages/Regional";

import {
  FactoryDataPage,
  FactoryDashboardPage,
  FactoryDataAlert,
  FactoryDeviceDetails,
  FactoryDevices,
  FactoryUsers,
  FactoryUsersDetails,
} from "@/pages/Factory";
import {
  LoginPage,
  ResetPasswordPage,
  PasswordResetRequestPage,
  OTPVerificationPage,
} from "@/pages/Auth/auth";
import Versions from "@/pages/Versions";

const AppRoutes = () => {
  const { isAuthenticated, userData } = useAuth();

  if (!isAuthenticated || !userData) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/reset-request" element={<PasswordResetRequestPage />} />
        <Route path="/verify" element={<OTPVerificationPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Map numeric levels to string levels if needed
  const numericToStringLevel: Record<string, string> = {
    "1": "ADMIN",
    "2": "NATIONAL",
    "3": "REGIONAL",
    "4": "FACTORY",
  };

  // Map role names to levels
  const roleToLevel: Record<string, string> = {
    "sys-admin": "ADMIN",
    "ICT Manager": "ADMIN",
    Manager: "NATIONAL",
    FUM: "REGIONAL",
    FSC: "FACTORY",
  };

  // Map backend level strings to frontend level strings
  const levelStringMap: Record<string, string> = {
    factory: "FACTORY",
    region: "REGIONAL",
    national: "NATIONAL",
    global: "ADMIN",
  };

  // First check if userData.level is already a valid level
  let userLevel = userData.level;

  // If not a valid level or empty, try to determine from role
  if (!["ADMIN", "NATIONAL", "REGIONAL", "FACTORY"].includes(userLevel)) {
    userLevel = roleToLevel[userData.role] || "";

    // If still not determined, try to map from level string
    if (!userLevel && userData.level) {
      if (typeof userData.level === "string" && isNaN(Number(userData.level))) {
        // If it's a string like 'region', map to the correct level
        userLevel =
          levelStringMap[userData.level.toLowerCase()] ||
          userData.level?.toUpperCase();
      } else {
        // If it's numeric or numeric string like '3', map to string level
        userLevel = numericToStringLevel[userData.level] || "UNAUTHORIZED";
      }
    }
  }

  // Final fallback
  if (!userLevel) {
    userLevel = "UNAUTHORIZED";
  }
  let defaultRoute = "/";

  switch (userLevel) {
    case "ADMIN":
      defaultRoute = "/admin/home";
      break;
    case "NATIONAL":
      defaultRoute = "/national/home";
      break;
    case "REGIONAL":
      defaultRoute = "/regional/home";
      break;
    case "FACTORY":
      defaultRoute = "/factory/home";
      break;
    default:
      return (
        <Routes>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<Navigate to="/unauthorized" replace />} />
        </Routes>
      );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to={defaultRoute} replace />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      {/* Role-based routes */}
      <Route
        path="/admin/*"
        element={
          userData.level === "ADMIN" ? (
            <ProtectedRoute
              requiredLevel="ADMIN"
              requiredRoles={["Admin", "Manager"]}
            >
              <AdminLayout>
                <Routes>
                  <Route index element={<Navigate to="home" replace />} />
                  <Route path="home" element={<DashboardPage />} />
                  <Route path="activity-logs" element={<ActivityLogsPage />} />
                  <Route path="data" element={<DataPage />} />
                  <Route path="data-alerts" element={<DataAlert />} />
                  <Route path="factories" element={<Factories />} />
                  <Route path="factories/:id" element={<FactoriesDetails />} />
                  <Route path="devices" element={<Devices />} />
                  <Route path="devices/:id" element={<DeviceDetails />} />
                  <Route path="users" element={<Users />} />
                  <Route path="users/:id" element={<UsersDetails />} />
                
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          ) : (
            <Navigate to="/unauthorized" replace />
          )
        }
      />

      <Route
        path="/national/*"
        element={
          userData.level === "NATIONAL" ? (
            <ProtectedRoute
              requiredLevel="NATIONAL"
              requiredRoles={["Admin", "Manager"]}
            >
              <NationalLayout>
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="home" element={<NationalDashboardPage />} />
                  <Route
                    path="activity-logs"
                    element={<NationalActivityLogsPage />}
                  />
                  <Route path="data" element={<NationalDataPage />} />
                  <Route path="dataalert" element={<NationalDataAlert />} />
                  <Route path="factories" element={<NationalFactories />} />
                  <Route
                    path="factories/:id"
                    element={<NationalFactoriesDetails />}
                  />
                  <Route path="devices" element={<NationalDevices />} />
                  <Route
                    path="devices/:id"
                    element={<NationalDeviceDetails />}
                  />
                  <Route path="users" element={<NationalUsers />} />
                  <Route path="users/:id" element={<NationalUsersDetails />} />
                
                </Routes>
              </NationalLayout>
            </ProtectedRoute>
          ) : (
            <Navigate to="/unauthorized" replace />
          )
        }
      />

      <Route
        path="/regional/*"
        element={
          userData.level === "REGIONAL" ? (
            <ProtectedRoute
              requiredLevel="REGIONAL"
              requiredRoles={["Admin", "Manager"]}
            >
              <RegionalLayout>
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="home" element={<RegionalDashboardPage />} />
                  <Route path="data" element={<RegionalDataPage />} />
                  <Route path="dataalert" element={<RegionalDataAlert />} />
                  <Route path="factories" element={<RegionalFactories />} />
                  <Route
                    path="factories/:id"
                    element={<RegionalFactoriesDetails />}
                  />
                  <Route path="devices" element={<RegionalDevices />} />
                  <Route
                    path="devices/:id"
                    element={<RegionalDeviceDetails />}
                  />
                  <Route path="users" element={<RegionalUsers />} />
                  <Route path="users/:id" element={<RegionalUsersDetails />} />
                
                </Routes>
              </RegionalLayout>
            </ProtectedRoute>
          ) : (
            <Navigate to="/unauthorized" replace />
          )
        }
      />

      <Route
        path="/factory/*"
        element={
          userData.level === "FACTORY" ? (
            <ProtectedRoute
              requiredLevel="FACTORY"
              requiredRoles={["Admin", "Manager"]}
            >
              <FactoryLayout>
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="home" element={<FactoryDashboardPage />} />
                  <Route path="data" element={<FactoryDataPage />} />
                  <Route path="dataalert" element={<FactoryDataAlert />} />
                  <Route path="devices" element={<FactoryDevices />} />
                  <Route
                    path="devices/:id"
                    element={<FactoryDeviceDetails />}
                  />
                  <Route path="users" element={<FactoryUsers />} />
                  <Route path="users/:id" element={<FactoryUsersDetails />} />
                
                </Routes>
              </FactoryLayout>
            </ProtectedRoute>
          ) : (
            <Navigate to="/unauthorized" replace />
          )
        }
      />

      {/* Default route for authenticated users */}
        <Route path="versions" element={<Versions />} />
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
};

export default AppRoutes;
