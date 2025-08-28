import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Download, Filter, InfoIcon, X } from "lucide-react";
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
import apiClient, { setAuthToken } from "@/apiclient";
import { Box, Typography } from "@mui/material";

interface Device {
  id?: string;
  device_id: string;
  serial_number: string;
  device_sim_card_no?: string;
  scale_model?: string;
  factory: string;
  status: boolean | string;
  company_id?: string;
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

export default function NationalDeviceDetails() {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<Device | null>(null);

  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
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

          // Find user with matching phone number
          const matchingUser = users.find(
            (user: User) =>
              user.scale_model &&
              (user.scale_model === deviceData.scale_model ||
                user.scale_model === deviceData.scale_model)
          );

          // Get the most appropriate phone number
          const phoneNumber =
            deviceData.scale_model ||
            deviceData.scale_model ||
            matchingUser?.scale_model ||
            "Not Assigned";

          setDevice({
            device_id: deviceData.device_id,
            serial_number: deviceData.serial_number,
            scale_model: phoneNumber,
            device_sim_card_no: deviceData.device_sim_card_no || "N/A",
            factory: deviceData.factory_name,
            status: deviceData.status === "active",
            company_id: deviceData.company_id || "N/A",
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
   return <Box className="flex flex-col items-center justify-center text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-md p-6">
      <InfoIcon fontSize="large" className="mb-2 text-blue-400" />
      <Typography variant="h6" className="mb-1">
        No Data Available
      </Typography>
      <Typography variant="body2">
        There's nothing to show here right now.
      </Typography>
    </Box>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button
            className="mb-4 bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center"
            onClick={() => navigate("/national/devices")}
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
          <h1 className="text-2xl font-semibold">
            Device <strong>{device.company_id}</strong>
            <p className="mt-4 font-normal">View Device details</p>
          </h1>
        </div>
      </div>

      {/* Device Details */}
      <section className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p>
              Company ID: <strong>{device.device_id}</strong>
            </p>
            <p>
              Company ID: <strong>{device.company_id}</strong>
            </p>
            <p>Serial number: {device.serial_number}</p>
            <p>Scale Model: {device.scale_model}</p>
            <p>MSISDN number: {device.device_sim_card_no}</p>
            <p>Geo location: Lat, Long</p>
            <p>
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
            </p>
          </div>
          <div>
            <p>
              Assigned factory: <strong>{device.factory}</strong>
            </p>
            
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-4">History</h2>
        <div className="flex items-center justify-between mb-4">
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
    </div>
  );
}
