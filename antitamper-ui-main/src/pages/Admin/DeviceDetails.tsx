import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Download, Filter, X } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EditDeviceForm from "@/components/forms/editform";
import DeactivateDeviceForm from "@/components/forms/deactivateform";
import apiClient, { setAuthToken } from "@/apiclient";

interface User {
  id: string;
  name: string;
  email: string;
  scale_model: string;
  role: string;
  level?: string;
}

interface Device {
  id?: string;
  device_id: string;
  serial_number: string;
  scale_model?: string;
  device_sim_card_no?: string;
  factory: string;
  status: boolean | string;
  company_id?: string;
  subscription_status?: string; // <-- Add this line
  subscription_expiry?: string;
}

interface HistoryItem {
  geoLocation: string;
  date: string;
  clerkId: string;
  factory: string;
  status: string;
  id?: string;
}

const Modal = ({
  children,
}: {
  title: string;
  children?: React.ReactNode;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
      {children}
    </div>
  </div>
);

interface SubscriptionStatus {
  label: string;
  color: string;
}

interface DeviceWithSubscription {
  subscription_status?: string;
  subscription_expiry?: string;
}

function getSubscriptionStatus(device: DeviceWithSubscription): SubscriptionStatus {
  if (device.subscription_status === "inactive" || !device.subscription_expiry) {
    return { label: "Inactive", color: "bg-gray-100 text-gray-700" };
  }
  const expiry = new Date(device.subscription_expiry);
  const now = new Date();
  const diffDays = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) {
    return { label: "Expired", color: "bg-red-100 text-red-700" };
  }
  if (diffDays <= 30) {
    return { label: "Expiring Soon", color: "bg-orange-100 text-orange-700" };
  }
  return { label: "Active", color: "bg-green-100 text-green-700" };
}

export default function DeviceDetails() {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<Device | null>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [isDeactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredData, setFilteredData] = useState<HistoryItem[]>([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);

  // Fetch device history
  useEffect(() => {
    const fetchDeviceHistory = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No authentication token found");
        }
        setAuthToken(token);

        const response = await apiClient.get(`/devices/details/?id=${id}`);

        if (
          response.data &&
          response.data.results &&
          response.data.results.device
        ) {
          const device = response.data.results.device;
          // Create a history entry from the device data
          const history = [
            {
              id: device.id,
              geoLocation: `${device.gps_lat || 0}, ${device.gps_lon || 0}`,
              date: new Date(
                device.updatedAt || device.createdAt
              ).toLocaleString(),
              clerkId: device.clerk_id || "N/A",
              factory: device.factory_name || "N/A",
              status: device.status || "N/A",
            },
          ];
          setHistoryData(history);
        }
      } catch (error) {
        console.error("Error fetching device history:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    fetchDeviceHistory();
  }, [id, navigate]);

  const columns = [
    { header: "Geo Location", accessor: "geoLocation" as keyof HistoryItem },
    { header: "Date", accessor: "date" as keyof HistoryItem },
    { header: "Clerk ID", accessor: "clerkId" as keyof HistoryItem },
    { header: "Factory", accessor: "factory" as keyof HistoryItem },
    { header: "Status", accessor: "status" as keyof HistoryItem },
  ];

  useEffect(() => {
    const fetchDeviceDetails = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No authentication token found");
        }
        setAuthToken(token); // Set the token in the API client

        const response = await apiClient.get(`/devices/details/?id=${id}`);

        interface User {
          id: string;
          name: string;
          email: string;
          scale_model: string;
          role: string;
        }

        if (response.data && response.data.results) {
          const { device: deviceData, users: usersData } =
            response.data.results;

          // Ensure users is an array
          let users: User[] = [];
          if (usersData && Array.isArray(usersData)) {
            users = usersData as User[];
          }
          setAdminUsers(users);

          setDevice({
            device_id: deviceData.device_id,
            serial_number: deviceData.serial_number,
            device_sim_card_no: deviceData.device_sim_card_no || "N/A",
            scale_model: deviceData.scale_model,
            factory: deviceData.factory_name,
            status: deviceData.status === "active",
            company_id: deviceData.company_id || "N/A",
            subscription_status: deviceData.subscription_status,      // <-- add this
            subscription_expiry: deviceData.subscription_expiry,      // <-- add this
          });
          setError(null); // Clear any previous errors
        } else {
          setError("Invalid device data received from the server.");
        }
      } catch (error) {
        console.error("Error fetching device details:", error);

        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            setError("Unauthorized: Please login again.");
            navigate("/login");
          } else if (error.response?.status === 404) {
            setError("Device not found. Please check the device ID.");
            navigate("/devices");
          } else {
            setError("Failed to fetch device details. Please try again later.");
          }
        } else {
          setError("An unexpected error occurred. Please try again later.");
        }
      }
    };

    fetchDeviceDetails();
  }, [id, navigate]);

  const handleUpdateDevice = async (data: Partial<Device>) => {
    console.log("handleUpdateDevice called with data:", data);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      setAuthToken(token);

      // Convert boolean status to string enum value expected by the backend
      const statusValue =
        typeof data.status === "boolean"
          ? data.status
            ? "active"
            : "inactive"
          : data.status;

      // Log the complete payload for debugging
      const updatePayload = {
        id: id,
        device_id: device?.device_id,
        serial_number: data.serial_number,
        scale_model:
          data.scale_model === "Not Assigned" ? "" : data.scale_model,
        device_sim_card_no: data.device_sim_card_no,
        factory: data.factory,
        company_id: data.company_id,
        status: statusValue, // Send string enum value instead of boolean
      };

      const updateResponse = await apiClient.patch(
        `/devices/update/`,
        updatePayload
      );

      if (updateResponse.status === 200) {
        const response = await apiClient.get(`/devices/details/?id=${id}`);
        if (
          response.data &&
          response.data.results &&
          response.data.results.device
        ) {
          const deviceData = response.data.results.device;

          // Update the device state with fresh data
          setDevice({
            device_id: deviceData.device_id,
            serial_number: deviceData.serial_number,
            scale_model: deviceData.scale_model,
            device_sim_card_no: deviceData.device_sim_card_no || "N/A",
            factory: deviceData.factory_name,
            status: deviceData.status === "active",
          });

          // Close the modal (though the EditDeviceForm now also closes it)
          setEditModalOpen(false);
          setError(null);

          // Show success message
          setSuccessMessage("Device changes saved successfully");

          // Hide success message after 3 seconds
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        } else {
          throw new Error("Invalid response data structure");
        }
      } else {
        throw new Error("Failed to update device");
      }
    } catch (error) {
      console.error("Error updating device:", error);
      if (axios.isAxiosError(error)) {
        console.error("API Error Details:", error.response?.data);
        const errorMessage =
          error.response?.data?.message || "Failed to update device";
        setError(errorMessage);
      } else {
        const errorMsg =
          "An unexpected error occurred while updating the device";
        setError(errorMsg);
      }
    }
  };

  const handleToggleDeviceStatus = async (reason?: string) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      setAuthToken(token);

      const newStatus = device?.status ? "inactive" : "active";

      const updatePayload: {
        id: string;
        status: "active" | "inactive";
        deactivation_reason?: string;
      } = {
        id: String(id), // or id ?? "" if you want a fallback
        status: newStatus,
      };

      if (newStatus === "inactive" && reason) {
        updatePayload.deactivation_reason = reason;
      }

      const updateResponse = await apiClient.patch(
        `/devices/update/`,
        updatePayload
      );

      if (updateResponse.status === 200) {
        const response = await apiClient.get(`/devices/details/?id=${id}`);
        if (
          response.data &&
          response.data.results &&
          response.data.results.device
        ) {
          const deviceData = response.data.results.device;

          // Update the device state
          setDevice({
            device_id: deviceData.device_id,
            serial_number: deviceData.serial_number,
            scale_model: deviceData.scale_model,
            device_sim_card_no: deviceData.device_sim_card_no || "N/A",
            factory: deviceData.factory_name,
            status: deviceData.status === "active",
          });

          setDeactivateModalOpen(false);

          const actionText =
            newStatus === "active" ? "activated" : "deactivated";
          setSuccessMessage(`Device ${actionText} successfully`);

          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        } else {
          throw new Error("Invalid response data structure");
        }
      } else {
        throw new Error("Failed to update device status");
      }
    } catch (error) {
      console.error("Error toggling device status:", error);
      if (axios.isAxiosError(error)) {
        console.error("API Error Details:", error.response?.data);
        const errorMessage =
          error.response?.data?.message || "Failed to update device status";
        setError(errorMessage);
      } else {
        setError(
          "An unexpected error occurred while updating the device status"
        );
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filter data based on search term and date range
  const filterData = () => {
    let filtered = [...historyData];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.clerkId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.factory.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59); // Set to end of day

      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date.replace(", ", "T"));
        return itemDate >= start && itemDate <= end;
      });
    }

    setFilteredData(filtered);
    setIsFiltered(true);
    setFilterModalOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setIsFiltered(false);
    setFilteredData([]);
  };

  // Export data to CSV
  const exportToCSV = () => {
    const dataToExport = isFiltered ? filteredData : historyData;

    // Create CSV header
    const headers = ["Geo Location", "Date", "Clerk ID", "Factory", "Status"];

    // Convert data to CSV format
    const csvData = [
      headers.join(","),
      ...dataToExport.map((item) =>
        [
          `"${item.geoLocation}"`,
          `"${item.date}"`,
          `"${item.clerkId}"`,
          `"${item.factory}"`,
          `"${item.status}"`,
        ].join(",")
      ),
    ].join("\n");

    // Create a blob and download
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `device_${id}_history_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportModalOpen(false);
  };

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!device) {
    return <div>Loading...</div>;
  }

  const status = getSubscriptionStatus(device);

  return (
    <div className="">
      {successMessage && (
        <div
          className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50 shadow-md"
          role="alert"
        >
          <div className="flex items-center">
            <div className="py-1">
              <svg
                className="fill-current h-6 w-6 text-green-500 mr-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm5.293 7.293l-6 6-3.293-3.293a1 1 0 0 0-1.414 1.414l4 4a1 1 0 0 0 1.414 0l7-7a1 1 0 0 0-1.414-1.414z" />
              </svg>
            </div>
            <div>
              <p className="font-bold">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button
            className="mb-4 bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center"
            onClick={() => navigate("/admin/devices")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Devices
          </Button>
          <h1 className="text-xl font-semibold">
            Device <strong className="text-black">{device.device_id}</strong>
            <p className="mt-4 font-medium text-md">View Device details</p>
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button
            className={`border ${
              device?.status
                ? "border-red-500 text-red-500 hover:bg-red-50"
                : "border-green-500 text-green-500 hover:bg-green-50"
            } bg-transparent transition-colors duration-200`}
            onClick={() => setDeactivateModalOpen(true)}
          >
            {device?.status ? "Deactivate Device" : "Activate Device"}
          </Button>

          <Button
            className="bg-[#4588B2] text-white"
            onClick={() => setEditModalOpen(true)}
          >
            Edit Device
          </Button>
        </div>
      </div>

      {/* Device Details */}
      <section className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <ul className="list-none p-0 space-y-1">
            <li className="text-gray-500 my-4">
              Company ID:{" "}
              <strong className="text-black">{device.company_id}</strong>
            </li>
            <li className="text-gray-500 my-4">
              Serial number: {device.serial_number}
            </li>
            <li className="text-gray-500 my-4">
              Scale Model: {device.scale_model}
            </li>{" "}
            <li className="text-gray-500 my-4">
              Device ID:{" "}
              <strong className="text-black">{device.company_id}</strong>
            </li>
            <li className="text-gray-500 my-4">
              MSISDN number: {device.device_sim_card_no}
            </li>
            <li className="text-gray-500 my-4">Geo location: Lat, Long</li>
            <li className="text-gray-500 my-4">
              Device status:{" "}
              <span
                className={
                  device.status
                    ? "text-green-500 font-semibold"
                    : "text-red-500 font-semibold"
                }
              >
                {device.status ? "Active" : "Inactive"}
              </span>
            </li>
          </ul>
          <ul className="list-none p-0 space-y-1">
            <li>
              Assigned factory:{" "}
              <strong className="text-black">{device.factory}</strong>
            </li>
          </ul>
        </div>
        <div className="mb-2">
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${status.color}`}
          >
            Subscription Status: {status.label}
          </span>
          {device.subscription_expiry && (
            <div className="text-xs text-gray-500 mt-1">
              Expiry: {new Date(device.subscription_expiry).toLocaleDateString()}
            </div>
          )}
        </div>
      </section>

      {/* Admin Users Section */}
      <section className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Device Administrators</h2>
        </div>
        {adminUsers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">
              No administrators assigned to this device
            </div>
            <p className="text-sm text-gray-400">
              Device administrators can monitor and manage this device
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adminUsers.map((user) => {
                  // Map numeric levels to string levels according to the system
                  const levelMap: { [key: string]: string } = {
                    "1": "ADMIN",
                    "2": "NATIONAL",
                    "3": "REGIONAL",
                    "4": "FACTORY",
                  };

                  // For sys-admin users, always show ADMIN level
                  const userLevel =
                    user.role === "sys-admin"
                      ? "ADMIN"
                      : (user.level && levelMap[user.level]) || "Not Assigned";

                  return (
                    <tr key={user.id}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {user.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {user.email}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {user.role}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {userLevel}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {user.scale_model || "Not provided"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">History</h2>
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setCurrentPage(1)}>
                  10
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentPage(1)}>
                  20
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentPage(1)}>
                  50
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center space-x-2">
            {isFiltered && (
              <Button
                className="border border-red-500 text-red-500 bg-transparent"
                onClick={resetFilters}
              >
                <X className="mr-2 h-5 w-5" />
                Clear Filters
              </Button>
            )}
            <Button
              className="border border-blue-500 text-blue-500 bg-transparent"
              onClick={() => setFilterModalOpen(true)}
            >
              <Filter className="mr-2 h-5 w-5" />
              Filter
            </Button>
            <Button
              className="bg-[#4588B2] text-white"
              onClick={() => setExportModalOpen(true)}
            >
              <Download className="mr-2 h-5 w-5" />
              Export
            </Button>
          </div>
        </div>
        <DataTable<HistoryItem>
          columns={columns}
          data={(isFiltered ? filteredData : historyData).slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
          )}
          getRowKey={(row) => row.date + row.clerkId}
        />
        <Pagination
          className="mb-10"
          currentPage={currentPage}
          totalPages={Math.ceil(
            (isFiltered ? filteredData : historyData).length / itemsPerPage
          )}
          onPageChange={handlePageChange}
        />
      </section>

      {isFilterModalOpen && (
        <Modal
          title="Filter Device History"
          onClose={() => setFilterModalOpen(false)}
        >
          <div className="p-4 space-y-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by clerk ID, factory, or status"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setFilterModalOpen(false)}
              >
                Cancel
              </Button>
              <Button className="bg-[#4588B2] text-white" onClick={filterData}>
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isExportModalOpen && (
        <Modal
          title="Export Device History"
          onClose={() => setExportModalOpen(false)}
        >
          <div className="p-4 space-y-4">
            <div>
              <p className="text-sm text-gray-700 mb-2">
                Export {isFiltered ? filteredData.length : historyData.length}{" "}
                records to CSV file.
              </p>
              {isFiltered && (
                <p className="text-sm font-medium text-amber-600">
                  Note: Only the currently filtered data will be exported.
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setExportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button className="bg-[#4588B2] text-white" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isDeactivateModalOpen && (
        <Modal
          title={device?.status ? "Deactivate Device" : "Activate Device"}
          onClose={() => setDeactivateModalOpen(false)}
        >
          <DeactivateDeviceForm
            onClose={() => setDeactivateModalOpen(false)}
            onDeactivate={handleToggleDeviceStatus}
            deviceStatus={device?.status === true}
          />
        </Modal>
      )}

      {isEditModalOpen && (
        <Modal title="" onClose={() => setEditModalOpen(false)}>
          <EditDeviceForm
            device={{
              id: id,
              device_id: device.device_id,
              serial_number: device.serial_number,
              scale_model: device.scale_model || "",
              factory: device.factory,
              status: device.status,
              company_id: device.company_id,
            }}
            onClose={() => setEditModalOpen(false)}
            onSubmit={handleUpdateDevice}
          />
        </Modal>
      )}
    </div>
  );
}
