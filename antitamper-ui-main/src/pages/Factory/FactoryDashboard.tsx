import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory } from "lucide-react";
import {
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { useNavigate } from "react-router";
import { AxiosError } from "axios";
import apiClient, { setAuthToken } from "@/apiclient";
import { handleApiError } from "@/utils/errorHandler";
import { Spinner } from "@/components/ui/spinner";

interface UserData {
  role: string;
  level: string;
  factory?: string;
}

interface Device {
  device_id: string;
  serial_number: string;
  phone_number: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  factory: string;
  factory_location: string;
  factory_name: string;
  id: string;
}

interface Factory {
  id: string;
  name: string;
  status: "active" | "deactivated";
  createdAt?: string;
  updatedAt?: string;
}

export default function FactoryDashboardPage() {
  const navigate = useNavigate();
  const [deviceData, setDeviceData] = useState({ active: 0, inactive: 0 });
  const [factoryData, setFactoryData] = useState({ total: 0, deactivated: 0 });
  const [userFactory, setUserFactory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache data for 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Cache utility functions
  const getCachedData = useCallback(
    (key: string) => {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            return data;
          }
          sessionStorage.removeItem(key); // Clear expired cache
        } catch (e) {
          console.error("Error parsing cached data:", e);
          sessionStorage.removeItem(key); // Remove invalid cache
        }
      }
      return null;
    },
    [CACHE_DURATION]
  );

  const setCachedData = useCallback(
    (
      key: string,
      data: {
        deviceData: { active: number; inactive: number };
        factoryData: { total: number; deactivated: number };
      }
    ) => {
      try {
        sessionStorage.setItem(
          key,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        console.error("Error caching data:", e);
      }
    },
    []
  );

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/login");
          return;
        }

        // Check if token is valid (not expired)
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const expirationTime = payload.exp * 1000;
          if (Date.now() >= expirationTime) {
            // Token expired
            localStorage.removeItem("authToken");
            navigate("/login?expired=true");
            return;
          }
        } catch {
          // Invalid token format
          localStorage.removeItem("authToken");
          navigate("/login?invalid=true");
          return;
        }

        setAuthToken(token);

        try {
          // Get user data from localStorage/sessionStorage
          const storedUserData =
            localStorage.getItem("userData") ||
            sessionStorage.getItem("userData");

          if (!storedUserData) {
            navigate("/login");
            return;
          }

          const userData = JSON.parse(storedUserData);
          setUserData(userData);

          // Check if user has appropriate level for Factory view
          if (userData.level !== "FACTORY" && userData.level !== "ADMIN") {
            navigate("/unauthorized");
            return;
          }

          // For ADMIN level users, they might not have a factory assigned
          if (userData.level === "ADMIN") {
            // Admin users without factory can see dashboard but with a message
            setError(
              "Admin view: No specific factory assigned. Some data may be limited."
            );
            // You could set a default factory for admins here if needed
          } else if (!userData.factoryId) {
            // For factory users, factory is required
            setError(
              "Your account doesn't have a factory assigned. Please contact an administrator."
            );
          } else {
            // Use factory data from stored user data
            const factoryData = {
              id: userData.factoryId,
              name: userData.factoryName || userData.factoryId,
              location: userData.factoryLocation || "Unknown",
            };
            setUserFactory(factoryData);
          }
        } catch (userError) {
          if (
            userError instanceof AxiosError &&
            userError.response?.status === 401
          ) {
            navigate("/login");
            return;
          }
          setError("Failed to load user data. Some features may be limited.");
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          handleApiError(error, setError);
          if (error instanceof AxiosError && error.response?.status === 401) {
            navigate("/login");
          }
        } else {
          setError("An unexpected error occurred");
        }
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (
        !userFactory &&
        !(userData?.role === "sys-admin" || userData?.level === "1")
      )
        return;
      setLoading(true);

      // Don't clear error if it's an admin view message
      if (!error?.includes("Admin view:")) {
        setError(null);
      }

      // Check cache first
      const factoryId = userFactory?.id || "admin-view";
      const cacheKey = `factoryDashboard_${factoryId}`;
      const cachedData = getCachedData(cacheKey);

      if (cachedData) {
        setDeviceData(cachedData.deviceData);
        setFactoryData(cachedData.factoryData);
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/login");
          return;
        }

        // Check if token is valid (not expired)
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const expirationTime = payload.exp * 1000;
          if (Date.now() >= expirationTime) {
            // Token expired
            localStorage.removeItem("authToken");
            navigate("/login?expired=true");
            return;
          }
        } catch {
          // Invalid token format
          localStorage.removeItem("authToken");
          navigate("/login?invalid=true");
          return;
        }

        setAuthToken(token);

        // For admin users who don't have a specific factory assigned
        const factoryParam =
          userFactory ||
          (userData?.role === "sys-admin" || userData?.level === "1"
            ? undefined
            : null);

        // If we have no factory and user is not admin, show error but don't fetch
        if (factoryParam === null) {
          setLoading(false);
          return;
        }

        // Fetch all data in parallel with optimized queries
        try {
          // Add pagination and limit to reduce data size
          const params = {
            ...(factoryParam ? { factory: factoryParam } : {}),
            limit: 50, // Limit the number of results
            page: 1, // Only get the first page
            fields: "status", // Only request the fields we need
          };

          // Use Promise.all to fetch data in parallel
          const [deviceRes, factoryRes] = await Promise.all([
            apiClient.get("/devices/", { params }),
            apiClient.get("/factories/", { params }),
          ]);

          // Process device data more efficiently
          if (deviceRes.data?.results?.docs) {
            // Use reduce for a single pass through the array instead of multiple filters
            const deviceCounts = deviceRes.data.results.docs.reduce(
              (
                counts: { active: number; inactive: number },
                device: Device
              ) => {
                if (device.status === "active") counts.active++;
                else if (device.status === "inactive") counts.inactive++;
                return counts;
              },
              { active: 0, inactive: 0 }
            );

            setDeviceData(deviceCounts);
          }

          // Process factory data
          if (factoryRes.data?.results?.docs) {
            const factories = factoryRes.data.results.docs;
            const factoryCounts = {
              total: factories.length,
              deactivated: factories.filter(
                (factory: Factory) => factory.status === "deactivated"
              ).length,
            };

            setFactoryData(factoryCounts);

            // Ensure deviceCounts is defined before caching
            // ✅ This is from the reduce operation
            const deviceCounts = deviceRes.data.results.docs.reduce(
              (
                counts: { active: number; inactive: number },
                device: Device
              ) => {
                if (device.status === "active") counts.active++;
                else if (device.status === "inactive") counts.inactive++;
                return counts;
              },
              { active: 0, inactive: 0 }
            );

            setDeviceData(deviceCounts);
            const factoryId = userFactory?.id || "admin-view";

            setCachedData(`factoryDashboard_${factoryId}`, {
              deviceData: deviceCounts,
              factoryData: factoryCounts,
            });

            // Cache the results
            setCachedData(`factoryDashboard_${factoryId}`, {
              deviceData: deviceCounts,
              factoryData: factoryCounts,
            });
          }
        } catch (apiError) {
          console.error("API Error:", apiError);
          if (
            apiError instanceof AxiosError &&
            apiError.response?.status === 401
          ) {
            navigate("/login");
            return;
          }
          setError("Failed to fetch dashboard data. Please try again.");
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          handleApiError(error as Error | AxiosError, setError);
          if (error instanceof AxiosError) {
            if (error.response?.status === 401) {
              navigate("/login");
              return;
            }
          }
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    navigate,
    userFactory,
    userData,
    error,
    getCachedData,
    setCachedData,
    deviceData.active,
    deviceData.inactive,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="h-38">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-sm font-thin">Devices</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div className="mb-4">
              <div className="text-xl font-semibold text-center">
                {deviceData.active}
              </div>
              <div className="text-md font-normal">Active</div>
            </div>
            <div className="mb-4">
              <div className="text-xl font-semibold text-center">
                {deviceData.inactive}
              </div>
              <div className="text-md font-normal">Inactive</div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-38">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-sm font-thin">Factories</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div className="mb-4">
              <div className="text-xl font-semibold text-center">
                {factoryData.total}
              </div>
              <div className="text-md font-normal">Total </div>
            </div>
            <div className="mb-4">
              <div className="text-xl font-semibold text-center">
                {factoryData.deactivated}
              </div>
              <div className="text-md font-normal">Deactivated </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-md">Devices</CardTitle>
            <h6 className="text-sm">Overview of all devices</h6>
          </CardHeader>
          <CardContent>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: "Devices",
                      active: deviceData.active,
                      inactive: deviceData.inactive,
                    },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    label={{
                      value: "Number of Devices",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="inactive"
                    fill="#d3d3d3"
                    name="Inactive"
                  />
                  <Bar
                    dataKey="active"
                    fill="#4caf50"
                    name="Active"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
