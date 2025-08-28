import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  Search,
  Eye,
  Download,
  Trash2,
  Filter,
  X,
  InfoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import type { Column } from "@/components/data-table";
import { Pagination } from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import apiClient, { setAuthToken } from "@/apiclient";
import axios from "axios";
import RegisterDeviceForm from "@/components/forms/registerdeviceform";
import { Box, Typography } from "@mui/material";

interface Factory {
  id: string;
  name: string;
  location: string;
  region?: string;
}
interface Device {
  id: string;
  device_id: string;
  scale_model: string;
  serial_number: string;
  mobile_number: string;
  device_sim_card_no?: string;
  phone_number?: string;
  factory: string;
  status: boolean | string;
  company_id?: string;
  battery_voltage?: number;
  gps_lat?: number;
  gps_lon?: number;
  gsm_lat?: number;
  gsm_lon?: number;
  gsm_accuracy?: number;
  interrupt_type?: string;
  enclosure?: number;
  calib_switch?: number;
  sd_card_available?: boolean;
  current_gps_timeout_ms?: number;
  current_sleep_time_min?: number;
  peripherals_turned_off?: boolean;
  rtc_datetime?: string;
  gps_datetime?: string | null;
  gsm_datetime?: string;
  interrupt_occured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  gsm_map_url?: string;
  factory_name?: string;
  factory_location: string;
  subscription_expiry?: string; 
  subscription_start?: string;
  subscription_status?: "active" | "expiring_soon" | "expired" | string;
}
const Modal = ({
  children,
  title,
  onClose,
}: {
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}) => (
  <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-blue-500"
          >
            <X size={20} />
          </button>
        </div>
      )}
      {children}
    </div>
  </div>
);

export default function DevicesPage() {
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  // const [isBulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [isRegisterDeviceModalOpen, setRegisterDeviceModalOpen] =
    useState(false);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter state
  const [filterCriteria, setFilterCriteria] = useState({
    factoryName: "",
    deviceStatus: "",
    startDate: "",
    endDate: "",
    location: "",
  });

  // For filter modal
  const [tempFilterCriteria, setTempFilterCriteria] = useState({
    factoryName: "",
    deviceStatus: "",
    startDate: "",
    endDate: "",
    location: "",
  });

  // Available filter options
  const [uniqueFactoryNames, setUniqueFactoryNames] = useState<string[]>([]);
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([]);

  useEffect(() => {
    const fetchFactories = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found");

        setAuthToken(token);

        const response = await apiClient.get("/factories/");

        const factoriesData =
          response.data.docs || response.data.results?.docs || response.data;

        if (Array.isArray(factoriesData)) {
          setFactories(factoriesData);
        } else {
          console.error("Unexpected factories data format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching factories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFactories();
  }, []);

  const filterDevices = useCallback(
    (
      searchTerm: string,
      devicesList: Device[],
      filters: typeof filterCriteria
    ) => {
      let filtered = [...devicesList];

      // Apply search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (device) =>
            device.company_id?.toLowerCase().includes(searchLower) ||
            device.factory_name?.toLowerCase().includes(searchLower) ||
            device.factory_location?.toLowerCase().includes(searchLower) ||
            device.serial_number?.toLowerCase().includes(searchLower) ||
            device.mobile_number?.toLowerCase().includes(searchLower) ||
            device.device_sim_card_no?.toLowerCase().includes(searchLower)
        );
      }

      // Apply factory name filter
      if (filters.factoryName) {
        filtered = filtered.filter(
          (device) => device.factory_name === filters.factoryName
        );
      }

      // Apply location filter
      if (filters.location) {
        filtered = filtered.filter(
          (device) => device.factory_location === filters.location
        );
      }

      // Apply status filter
      if (filters.deviceStatus) {
        filtered = filtered.filter((device) => {
          // Handle both string and boolean status values
          if (filters.deviceStatus === "active") {
            return typeof device.status === "string"
              ? device.status.toLowerCase() === "active"
              : device.status === true;
          }
          if (filters.deviceStatus === "inactive") {
            return typeof device.status === "string"
              ? device.status.toLowerCase() === "inactive"
              : device.status === false;
          }
          return true; // If status is empty or "all", don't filter
        });
      }

      // Apply date filters if provided
      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        filtered = filtered.filter((device) => {
          const deviceDate = new Date(device.createdAt || "").getTime();
          return !isNaN(deviceDate) && deviceDate >= start;
        });
      }

      if (filters.endDate) {
        const end = new Date(filters.endDate).getTime() + 24 * 60 * 60 * 1000; // Include the entire end day
        filtered = filtered.filter((device) => {
          const deviceDate = new Date(device.createdAt || "").getTime();
          return !isNaN(deviceDate) && deviceDate <= end;
        });
      }

      return filtered;
    },
    []
  );

  const fetchDevices = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);
      setLoading(true);

      // Fetch devices and users in parallel
      const [devicesResponse] = await Promise.all([
        apiClient.get("/devices/"),
        // Removed users API call since it's not needed without phone matching
      ]);

      if (
        devicesResponse.data?.results?.docs &&
        Array.isArray(devicesResponse.data.results.docs)
      ) {
        const devicesList = devicesResponse.data.results.docs as Device[];

        // Map devices — no more phone number logic
        const cleanedDevices = devicesList.map((device: Device) => ({
          ...device,
          device_sim_card_no: device.device_sim_card_no || "030000 119 4773",
        }));

        // Extract unique factory names and locations for filters
        const factoryNames = Array.from(
          new Set(
            cleanedDevices
              .filter((device: Device) => device.factory_name)
              .map((device: Device) => device.factory_name || "")
          )
        );

        const locations = Array.from(
          new Set(
            cleanedDevices
              .filter((device: Device) => device.factory_location)
              .map((device: Device) => device.factory_location || "")
          )
        );

        setUniqueFactoryNames(factoryNames as string[]);
        setUniqueLocations(locations as string[]);
        setAllDevices(cleanedDevices);
        setDevices(cleanedDevices);
        setTotalPages(Math.ceil(cleanedDevices.length / entriesPerPage));
      } else {
        console.error(
          "API response does not contain an array of devices:",
          devicesResponse.data
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data);
      } else {
        console.error("Error fetching devices:", error);
      }
      alert("Failed to fetch devices. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [entriesPerPage]);

  // Apply filters whenever search term or filter criteria change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (allDevices.length > 0) {
        const filteredList = filterDevices(
          searchTerm,
          allDevices,
          filterCriteria
        );
        setDevices(filteredList);
        setTotalPages(Math.ceil(filteredList.length / entriesPerPage));
        // Reset to page 1 when filters change
        setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, allDevices, filterDevices, entriesPerPage, filterCriteria]);

  // Initialize temp filter criteria when opening the modal
  useEffect(() => {
    if (isFilterModalOpen) {
      setTempFilterCriteria({
        ...filterCriteria,
      });
    }
  }, [isFilterModalOpen, filterCriteria]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleRegisterDeviceSubmit = async (deviceData: {
    deviceId: string;
    factoryId: string;
    serialNumber: string;
    scale_model: string;
    msisdnNumber: string;
    status: string;
    companyId: string;
  }) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);

      if (!deviceData.factoryId) {
        alert("Please select a factory.");
        return;
      }

      const selectedFactoryData = factories.find(
        (f) => f.id === deviceData.factoryId
      );
      if (!selectedFactoryData) {
        alert("Selected factory not found.");
        return;
      }

      const payload = {
        serial_number: deviceData.serialNumber,
        device_sim_card_no: deviceData.msisdnNumber,
        scale_model: deviceData.scale_model,
        status: deviceData.status,
        company_id: deviceData.companyId,
        device_id: deviceData.deviceId,
        factory: deviceData.factoryId,
        factory_name: selectedFactoryData.name,
        factory_location: selectedFactoryData.location,
      };

      const response = await apiClient.post("/devices/", payload);

      if (response.status === 201) {
        setRegisterDeviceModalOpen(false);
        const fetchResponse = await apiClient.get("/devices/");
        setDevices(fetchResponse.data.results.docs);
      } else {
        console.error("Unexpected response:", response);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data);
        alert(
          `Error: ${
            error.response?.data.message || "Failed to register device."
          }`
        );
      } else {
        console.error("Error registering device:", error);
        alert("Failed to register device. Please try again.");
      }
    }
  };

  const exportToCSV = () => {
    // Create CSV content based on the memory for factory data export
    const headers = [
      "Scale ID",
      "Company ID",
      "State",
      "Factory name",
      "Location",
      "Region",
      "Serial Number",
      "Mobile Number",
      "MSISDN Number",
    ];

    const csvContent = [
      headers.join(","),
      ...devices.map((device) =>
        [
          device.company_id || "N/A",
          typeof device.status === "string"
            ? device.status === "active"
              ? "Active"
              : "Inactive"
            : device.status
            ? "Active"
            : "Inactive",
          device.factory_name || "N/A",
          device.factory_location || "N/A",
          (() => {
            const factory = factories.find(f => f.id === device.factory);
            return factory ? factory.region : "";
          })(),
          device.serial_number || "N/A",
          device.phone_number || "Not Assigned",
          device.device_sim_card_no || "030000 119 4773",
        ].join(",")
      ),
    ].join("\n");

    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `devices_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteDevice = async (e: React.MouseEvent, id: string) => {
    try {
      e.preventDefault();
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);
      await apiClient.delete("/devices/remove/", { data: { id } });

      // Refresh the devices list
      const response = await apiClient.get("/devices/");
      if (
        response.data?.results?.docs &&
        Array.isArray(response.data.results.docs)
      ) {
        setDevices(response.data.results.docs);
        setTotalPages(
          Math.ceil(response.data.results.docs.length / entriesPerPage)
        );
      }

      setDeviceToDelete(null);
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting device:", error);
      alert("Failed to delete device. Please try again.");
    }
  };

  const handleViewDevice = (id: string) => {
    navigate(`/admin/devices/${id}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const applyFilters = () => {
    setFilterCriteria(tempFilterCriteria);
    setFilterModalOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      factoryName: "",
      deviceStatus: "",
      startDate: "",
      endDate: "",
      location: "",
    };
    setTempFilterCriteria(emptyFilters);
    setFilterCriteria(emptyFilters);
    setFilterModalOpen(false);
  };

  const paginatedDevices = devices.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  if (loading) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4588B2]"></div>
        <Typography variant="body1" className="mt-4 text-gray-600">
          Loading devices...
        </Typography>
      </Box>
    );
  }

  if (!loading && (!devices || devices.length === 0)) {
    return (
      <Box className="flex flex-col items-center justify-center text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-md p-6">
        <InfoIcon fontSize="large" className="mb-2 text-blue-400" />
        <Typography variant="h6" className="mb-1">
          No Data Available
        </Typography>
        <Typography variant="body2">
          There are no devices to show right now.
        </Typography>
      </Box>
    );
  }

  const columns: Column<Device>[] = [
    { header: "Scale ID", accessor: "company_id" },
    {
      header: "Scale model",
      accessor: "scale_model",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <h6>{row?.scale_model ? row.scale_model : "N/A"}</h6>
        </div>
      ),
    },
    { header: "Factory Name", accessor: "factory_name" },
    { header: "Factory Location", accessor: "factory_location" },
    { header: "Serial Number", accessor: "serial_number" },

    { header: "Device Simcard Number", accessor: "device_sim_card_no" },
    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const isActive =
          typeof row.status === "string" ? row.status === "active" : row.status;
        return (
          <span className={isActive ? "text-green-600" : "text-red-600"}>
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      header: "Action",
      accessor: "id",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            className="bg-[#4588B2] text-white"
            onClick={() => handleViewDevice(row.id)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setDeviceToDelete(row.id);
              setDeleteModalOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center m-6">
        <h1 className="text-xl font-semibold">
          Devices <br />
          <span className="font-normal">All devices</span>
        </h1>
        <div className="flex space-x-2">
          {/* <Button
            className="border border-blue-500 h-12 text-blue-500 bg-transparent"
            onClick={() => setBulkUploadModalOpen(true)}
          >
            <CloudUpload className="mr-2 h-5 w-5" />
            Bulk Upload
          </Button> */}
          <Button
            className="bg-[#4588B2] h-12 text-white"
            onClick={() => setRegisterDeviceModalOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Register Device
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center h-24">
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="border border-gray-300 text-black bg-white">
                {entriesPerPage} entries
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border border-gray-300">
              {[10, 25, 50, 100].map((value) => (
                <DropdownMenuItem
                  key={value}
                  onSelect={() => setEntriesPerPage(value)}
                  className="text-black"
                >
                  {value} entries
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative h-12 border rounded-md shadow-xs w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="border rounded p-2 h-full pl-10 w-full text-black bg-white"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {loading && (
              <div className="absolute inset-y-0 right-12 flex items-center pr-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              </div>
            )}
          </div>
          <Button
            className="border border-[#4588B2] h-12 text-[#4588B2] bg-transparent"
            onClick={() => setFilterModalOpen(true)}
          >
            <Filter className="mr-2 h-5 w-5" />
            {Object.values(filterCriteria).some((val) => val !== "")
              ? "Filters Applied"
              : "Filter"}
          </Button>
          <Button
            className="bg-[#4588B2] h-12 text-white"
            onClick={exportToCSV}
          >
            <Download className="mr-2 h-5 w-5" />
            Export to CSV
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginatedDevices}
        getRowKey={(row) => row.id}
      />

      <div className=" mt-4">
        <div>
          Showing {paginatedDevices.length} of {devices.length} entries
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* {isBulkUploadModalOpen && (
        <Modal title="" onClose={() => setBulkUploadModalOpen(false)}>
          <BulkUploadForm
            onSubmit={handleBulkUploadSubmit}
            onClose={() => setBulkUploadModalOpen(false)}
            title="Bulk Upload Devices"
            acceptFileTypes=".csv, .xlsx"
          />
        </Modal>
      )} */}

      {isRegisterDeviceModalOpen && (
        <Modal title="" onClose={() => setRegisterDeviceModalOpen(false)}>
          <RegisterDeviceForm
            onSubmit={handleRegisterDeviceSubmit}
            onClose={() => setRegisterDeviceModalOpen(false)}
            factories={factories}
          />
        </Modal>
      )}

      {isFilterModalOpen && (
        <Modal title="Filter Devices" onClose={() => setFilterModalOpen(false)}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Factory Name
              </label>
              <select
                className="w-full p-2 border rounded bg-white text-black"
                value={tempFilterCriteria.factoryName}
                onChange={(e) =>
                  setTempFilterCriteria({
                    ...tempFilterCriteria,
                    factoryName: e.target.value,
                  })
                }
              >
                <option value="">All Factories</option>
                {uniqueFactoryNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <select
                className="w-full p-2 border rounded bg-white text-black"
                value={tempFilterCriteria.location}
                onChange={(e) =>
                  setTempFilterCriteria({
                    ...tempFilterCriteria,
                    location: e.target.value,
                  })
                }
              >
                <option value="">All Locations</option>
                {uniqueLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Device Status
              </label>
              <select
                className="w-full p-2 border rounded bg-white text-black"
                value={tempFilterCriteria.deviceStatus}
                onChange={(e) =>
                  setTempFilterCriteria({
                    ...tempFilterCriteria,
                    deviceStatus: e.target.value,
                  })
                }
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Date Range (Registration Date)
              </label>
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <label className="block text-xs text-gray-500">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded bg-white text-black"
                    value={tempFilterCriteria.startDate}
                    onChange={(e) =>
                      setTempFilterCriteria({
                        ...tempFilterCriteria,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs text-gray-500">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded bg-white text-black"
                    value={tempFilterCriteria.endDate}
                    onChange={(e) =>
                      setTempFilterCriteria({
                        ...tempFilterCriteria,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <Button
                type="button"
                onClick={clearFilters}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Clear Filters
              </Button>
              <Button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="bg-gray-500 text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={applyFilters}
                className="bg-[#4588B2] text-white"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isDeleteModalOpen && deviceToDelete && (
        <Modal title="Delete Device" onClose={() => setDeleteModalOpen(false)}>
          <div>
            <p>
              Are you sure you want to delete this device? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDeviceToDelete(null);
                  setDeleteModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  if (deviceToDelete) {
                    handleDeleteDevice(e, deviceToDelete);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
