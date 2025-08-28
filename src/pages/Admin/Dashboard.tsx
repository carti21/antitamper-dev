import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Tooltip,
  Legend,
  Bar,
} from "recharts";
import axios from "axios";
import apiClient, { setAuthToken } from "@/apiclient";

export default function DashboardPage() {
  const [deviceData, setDeviceData] = useState({ active: 0, inactive: 0 });
  const [factoryData, setFactoryData] = useState({ total: 0, deactivated: 0 });
  const [regionChartData, setRegionChartData] = useState<
    { region: string; active: number; inactive: number }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No auth token found");
        }
        setAuthToken(token);

        const deviceRes = await apiClient.get("/devices/");
        const factoryRes = await apiClient.get("/factories/");

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
          region?: string;
        }

        interface Factory {
          id: string;
          name: string;
          status: "active" | "deactivated";
          createdAt?: string;
          updatedAt?: string;
        }

        if (!deviceRes.data?.results?.docs) {
          throw new Error("Device data is missing or invalid");
        }

        const activeDevices = deviceRes.data.results.docs.filter(
          (device: Device) => device.status === "active"
        ).length;
        const inactiveDevices = deviceRes.data.results.docs.filter(
          (device: Device) => device.status === "inactive"
        ).length;

        setDeviceData({
          active: activeDevices,
          inactive: inactiveDevices,
        });

        // Build a map of factoryId -> region
        const factoryRegionMap: Record<string, string> = {};
        if (factoryRes.data?.results?.docs) {
          factoryRes.data.results.docs.forEach((factory: any) => {
            factoryRegionMap[factory.id] = factory.region;
          });
        }

        const regionCounts: Record<string, { active: number; inactive: number }> = {};
        deviceRes.data.results.docs.forEach((device: Device) => {
          const region = factoryRegionMap[device.factory];
          if (!regionCounts[region]) {
            regionCounts[region] = { active: 0, inactive: 0 };
          }
          if (device.status === "active") {
            regionCounts[region].active += 1;
          } else if (device.status === "inactive") {
            regionCounts[region].inactive += 1;
          }
        });

        const regionDataFormatted = Object.entries(regionCounts).map(
          ([region, counts]) => ({
            region,
            active: counts.active,
            inactive: counts.inactive,
          })
        );

        setRegionChartData(regionDataFormatted);

        if (!factoryRes.data?.results?.docs) {
          throw new Error("Factory data is missing or invalid");
        }

        const totalFactories = factoryRes.data.results.docs.length;
        const deactivatedFactories = factoryRes.data.results.docs.filter(
          (factory: Factory) => factory.status === "deactivated"
        ).length;

        setFactoryData({
          total: totalFactories,
          deactivated: deactivatedFactories,
        });
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(
            "Error fetching data:",
            error.response?.data || error.message
          );
        } else {
          console.error("An unexpected error occurred:", error);
        }
      }
    };

    fetchData();
  }, []);

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

      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-md">Devices per Region</CardTitle>
          <h6 className="text-sm">Active vs Inactive by Region</h6>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={regionChartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis
                  label={{
                    value: "Device Count",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="inactive"
                  stackId="a"
                  fill="#d3d3d3"
                  name="Inactive"
                />
                <Bar
                  dataKey="active"
                  stackId="a"
                  fill="#4caf50"
                  name="Active"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
