import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Search, Eye, Download, Filter, X, InfoIcon } from "lucide-react";
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
import { Box, Typography } from "@mui/material";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface Device {
  id: string;
  device_id: string;
  serial_number: string;
  scale_model: string;
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

export default function NationalDevicesPage() {
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);

  // Keep two separate state variables
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [loading, setLoading] = useState(false);
  const isEmptyState = filteredDevices.length === 0;
  const [filterCriteria, setFilterCriteria] = useState({
    factoryName: "",
    deviceStatus: "",
    startDate: "",
    endDate: "",
    location: "",
  });

  const filterDevices = useCallback(
    (
      searchTerm: string,
      devicesList: Device[],
      filters: typeof filterCriteria
    ) => {
      let filtered = [...devicesList];

      // Normalize search term
      const searchLower = searchTerm.trim().toLowerCase();

      // Apply search filter if term exists
      if (searchLower) {
        filtered = filtered.filter((device) => {
          // Search across multiple fields
          const searchFields = [
            device.device_id,
            device.serial_number,
            device.scale_model,
            device.scale_model,
            device.factory_name,
            device.factory_location,
            device.company_id,
            device.interrupt_type,
            device.status.toString(),
          ].map((f) => f?.toString().toLowerCase() || "");

          return searchFields.some((field) => field.includes(searchLower));
        });
      }

      // Rest of your existing filter logic...
      if (filters.factoryName) {
        filtered = filtered.filter(
          (device) => device.factory_name === filters.factoryName
        );
      }

      if (filters.deviceStatus) {
        filtered = filtered.filter((device) => {
          const isActive =
            typeof device.status === "string"
              ? device.status === "active"
              : device.status;

          return filters.deviceStatus === "active" ? isActive : !isActive;
        });
      }

      if (filters.location) {
        filtered = filtered.filter(
          (device) => device.factory_location === filters.location
        );
      }

      // Date filtering
      if (filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate).setHours(0, 0, 0, 0);
        const endDate = new Date(filters.endDate).setHours(23, 59, 59, 999);

        filtered = filtered.filter((device) => {
          const createdDate = device.createdAt
            ? new Date(device.createdAt).getTime()
            : 0;

          return createdDate >= startDate && createdDate <= endDate;
        });
      } else if (filters.startDate) {
        const startDate = new Date(filters.startDate).setHours(0, 0, 0, 0);

        filtered = filtered.filter((device) => {
          const createdDate = device.createdAt
            ? new Date(device.createdAt).getTime()
            : 0;

          return createdDate >= startDate;
        });
      } else if (filters.endDate) {
        const endDate = new Date(filters.endDate).setHours(23, 59, 59, 999);

        filtered = filtered.filter((device) => {
          const createdDate = device.createdAt
            ? new Date(device.createdAt).getTime()
            : 0;

          return createdDate <= endDate;
        });
      }

      return filtered;
    },
    []
  );

  const isFilteredState =
    searchTerm || Object.values(filterCriteria).some((val) => val !== "");

  // Apply filters when search term or filter criteria change
  useEffect(() => {
    if (
      debouncedSearchTerm ||
      Object.values(filterCriteria).some((val) => val !== "")
    ) {
      setIsSearching(true);
      const timeoutId = setTimeout(() => {
        // Filter based on the original dataset (allDevices)
        const filteredList = filterDevices(
          debouncedSearchTerm,
          allDevices,
          filterCriteria
        );
        setFilteredDevices(filteredList);
        setTotalPages(Math.ceil(filteredList.length / entriesPerPage));
        setCurrentPage(1); // Reset to first page on new search
        setIsSearching(false);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      // When no filters, show all devices
      setFilteredDevices(allDevices);
      setTotalPages(Math.ceil(allDevices.length / entriesPerPage));
    }
  }, [
    debouncedSearchTerm,
    allDevices,
    filterDevices,
    entriesPerPage,
    filterCriteria,
  ]);

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
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found");

        setAuthToken(token);

        const response = await apiClient.get("/factories/");

        const factoriesData =
          response.data.docs || response.data.results?.docs || response.data;

        if (Array.isArray(factoriesData)) {
          console.log("Factories data:", factoriesData);
        } else {
          console.error("Unexpected factories data format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching factories:", error);
      }
    };

    fetchFactories();
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);
      setLoading(true);

      // Fetch devices and users in parallel
      const [devicesResponse] = await Promise.all([apiClient.get("/devices/")]);

      if (
        devicesResponse.data?.results?.docs &&
        Array.isArray(devicesResponse.data.results.docs)
      ) {
        const devicesList = devicesResponse.data.results.docs as Device[];

        // Map devices with user phone numbers
        const devicesWithPhones = devicesList.map((device: Device) => {
          // Get the most appropriate phone number
          const phoneNumber = device.scale_model || device.scale_model;
          return {
            ...device,
            scale_model: phoneNumber,
          };
        });

        // Extract unique factory names and locations for filters
        const factoryNames = Array.from(
          new Set(
            devicesWithPhones
              .filter((device: Device) => device.factory_name)
              .map((device: Device) => device.factory_name || "")
          )
        );

        const locations = Array.from(
          new Set(
            devicesWithPhones
              .filter((device: Device) => device.factory_location)
              .map((device: Device) => device.factory_location || "")
          )
        );

        setUniqueFactoryNames(factoryNames as string[]);
        setUniqueLocations(locations as string[]);

        // Store complete dataset
        setAllDevices(devicesWithPhones);
        // Initialize filtered dataset with all devices
        setFilteredDevices(devicesWithPhones);
        setTotalPages(Math.ceil(devicesWithPhones.length / entriesPerPage));
      } else {
        console.error(
          "API response does not contain an array of devices:",
          devicesResponse.data
        );
        // Set empty state if no devices found
        setAllDevices([]);
        setFilteredDevices([]);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data);
        // You can set an error state here if needed
        setError(error.response?.data?.message || "Failed to fetch devices");
      } else {
        console.error("Error fetching devices:", error);
        setError("An unexpected error occurred");
      }
      // Set empty state on error
      setAllDevices([]);
      setFilteredDevices([]);
    } finally {
      setLoading(false);
    }
  }, [entriesPerPage]);

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

  const exportToCSV = () => {
    // Create CSV content based on the current filtered devices
    const headers = [
      "Device ID",
      "Company ID",
      "State",
      "Factory name",
      "Location",
      "Region",
      "Serial Number",
      "Mobile Number",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredDevices.map((device) =>
        [
          device.device_id || "N/A",
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
          "N/A", // Region placeholder
          device.serial_number || "N/A",
          device.scale_model || "Not Assigned",
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

  const handleViewDevice = (id: string) => {
    navigate(`/national/devices/${id}`);
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

  const clearSearchAndFilters = () => {
    setSearchTerm("");
    setFilterCriteria({
      factoryName: "",
      deviceStatus: "",
      startDate: "",
      endDate: "",
      location: "",
    });
    // Restore the original dataset
    setFilteredDevices(allDevices);
    setTotalPages(Math.ceil(allDevices.length / entriesPerPage));
    setCurrentPage(1);
  };

  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const columns: Column<Device>[] = [
    { header: "Scale ID", accessor: "company_id" },    {
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
        </div>
      ),
    },
  ];

  // Then in your component's return statement, you can handle the error state:
  return (
    <>
      {error ? (
        <Box className="flex flex-col items-center justify-center text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-md p-6">
          <InfoIcon fontSize="large" className="mb-2 text-blue-400" />
          <Typography variant="h6" className="mb-1">
            Error Loading Data
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </Box>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold">
              Devices <br />
              <span className="font-normal">all devices</span>
            </h1>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
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
              <div className="relative rounded-md shadow-xs w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="text"
                  className="border rounded p-2 pl-10 w-full text-black bg-white"
                  placeholder="Search by ID, serial, phone, factory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-10 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {(isSearching || loading) && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  </div>
                )}
              </div>
              <Button
                className="border border-[#4588B2] text-[#4588B2] bg-transparent"
                onClick={() => setFilterModalOpen(true)}
              >
                <Filter className="mr-2 h-5 w-5" />
                {Object.values(filterCriteria).some((val) => val !== "")
                  ? "Filters Applied"
                  : "Filter"}
              </Button>
              <Button className="bg-[#4588B2] text-white" onClick={exportToCSV}>
                <Download className="mr-2 h-5 w-5" />
                Export to CSV
              </Button>
            </div>
          </div>

          {isEmptyState ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                {isFilteredState
                  ? "No devices match your search"
                  : "No devices found"}
              </h3>
              <p className="text-gray-500 mt-1">
                {isFilteredState
                  ? "Try adjusting your search or filter criteria"
                  : "There are currently no devices in the system"}
              </p>
              {isFilteredState && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={clearSearchAndFilters}
                >
                  Clear search and filters
                </Button>
              )}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={paginatedDevices}
              getRowKey={(row) => row.id}
            />
          )}

          <div className="flex justify-between items-center mt-4">
            <div>
              Showing {paginatedDevices.length} of {filteredDevices.length}{" "}
              entries
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>

          {isFilterModalOpen && (
            <Modal
              title="Filter Devices"
              onClose={() => setFilterModalOpen(false)}
            >
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
        </div>
      )}
    </>
  );
}
