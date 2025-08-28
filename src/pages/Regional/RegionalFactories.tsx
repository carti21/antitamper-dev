import React, { useState, useEffect, useCallback } from "react";
import { Search, CloudUpload, Filter, X, InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import apiClient, { setAuthToken } from "@/apiclient";
import { Box, Typography } from "@mui/material";

interface Factory {
  id: string;
  name: string;
  location: string;
  region: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

interface FilterCriteria {
  name?: string;
  location?: string;
  region?: string;
  status?: "active" | "inactive";
  startDate?: string;
  endDate?: string;
}

const Modal = ({
  children,
  onClose,
}: {
  children?: React.ReactNode;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        <X className="h-5 w-5" />
      </button>
      {children}
    </div>
  </div>
);

export default function RegionalFactoriesPage() {
  // State management
  const [factories, setFactories] = useState<Factory[]>([]);
  const [filteredFactories, setFilteredFactories] = useState<Factory[]>([]);
  const [userRegion, setUserRegion] = useState<string>("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter related state
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({});
  const [tempFilterCriteria, setTempFilterCriteria] = useState<FilterCriteria>(
    {}
  );

  // Unique values for filter options
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([]);
  const [uniqueRegions, setUniqueRegions] = useState<string[]>([]);

  // Fetch current user's region
  useEffect(() => {
    const userData = JSON.parse(
      localStorage.getItem("userData") ||
        sessionStorage.getItem("userData") ||
        "{}"
    );
    if (userData?.regionId) {
      setUserRegion(userData.regionId);
    }
  }, []);

  // Fetch factories data
  const fetchFactories = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);
      setLoading(true);

      const response = await apiClient.get("/factories/", {
        params: { region: userRegion },
      });

      if (response.data?.results?.docs) {
        const factoriesData = response.data.results.docs as Factory[];
        setFactories(factoriesData);
        setFilteredFactories(factoriesData);

        // Extract unique values for filters
        const locations = Array.from(
          new Set(factoriesData.map((f) => f.location))
        );
        const regions = Array.from(new Set(factoriesData.map((f) => f.region)));

        setUniqueLocations(locations);
        setUniqueRegions(regions);
      }
    } catch (error) {
      console.error("Error fetching factories:", error);
      setError("Failed to fetch factories data");
    } finally {
      setLoading(false);
    }
  }, [userRegion]);

  useEffect(() => {
    if (userRegion) {
      fetchFactories();
    }
  }, [userRegion, fetchFactories]);

  // Apply filters whenever criteria change
  useEffect(() => {
    const applyFilters = () => {
      let result = [...factories];

      // Apply search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        result = result.filter(
          (factory) =>
            factory.name.toLowerCase().includes(searchLower) ||
            factory.location.toLowerCase().includes(searchLower) ||
            factory.region.toLowerCase().includes(searchLower)
        );
      }

      // Apply other filters
      if (filterCriteria.name) {
        result = result.filter((f) => f.name === filterCriteria.name);
      }
      if (filterCriteria.location) {
        result = result.filter((f) => f.location === filterCriteria.location);
      }
      if (filterCriteria.region) {
        result = result.filter((f) => f.region === filterCriteria.region);
      }
      if (filterCriteria.status) {
        result = result.filter((f) => f.status === filterCriteria.status);
      }
      if (filterCriteria.startDate) {
        const start = new Date(filterCriteria.startDate);
        result = result.filter((f) => {
          const factoryDate = f.createdAt ? new Date(f.createdAt) : null;
          return factoryDate && factoryDate >= start;
        });
      }
      if (filterCriteria.endDate) {
        const end = new Date(filterCriteria.endDate);
        end.setHours(23, 59, 59, 999); // Include entire end day
        result = result.filter((f) => {
          const factoryDate = f.createdAt ? new Date(f.createdAt) : null;
          return factoryDate && factoryDate <= end;
        });
      }

      setFilteredFactories(result);
      setCurrentPage(1); // Reset to first page when filters change
    };

    applyFilters();
  }, [factories, searchTerm, filterCriteria]);

  // CSV Export
  const exportToCSV = useCallback(() => {
    if (!filteredFactories.length) return;

    const headers = ["Name", "Location", "Region", "Status", "Created At"];
    const csvRows = filteredFactories.map((f) => [
      f.name,
      f.location,
      f.region,
      f.status,
      f.createdAt || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `factories_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredFactories]);

  // Filter modal handlers
  const handleApplyFilters = () => {
    setFilterCriteria(tempFilterCriteria);
    setFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    setFilterCriteria({});
    setTempFilterCriteria({});
    setFilterModalOpen(false);
  };

  // Pagination
  const paginatedData = filteredFactories.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const columns = [
    { header: "Name", accessor: "name" as keyof Factory },
    { header: "Location", accessor: "location" as keyof Factory },
    {
      header: "Region",
      accessor: "region" as keyof Factory,
      render: (row: Factory) => (
        <span className="capitalize">{row.region || "Not Assigned"}</span>
      ),
    },
  ];

  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  const getRowKey = (row: Factory) => row.id;

  if (loading) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4588B2]"></div>
        <Typography variant="body1" className="mt-4 text-gray-600">
          Loading factories...
        </Typography>
      </Box>
    );
  }

  if (!loading && (!factories || factories.length === 0)) {
    return (
      <Box className="flex flex-col items-center justify-center text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-md p-6">
        <InfoIcon fontSize="large" className="mb-2 text-blue-400" />
        <Typography variant="h6" className="mb-1">
          No factories Available
        </Typography>
        <Typography variant="body2">
          There are is no factories to show right now.
        </Typography>
      </Box>
    );
  }
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {userRegion ? `${userRegion} Factories` : "Regional Factories"}
          </h1>
          <p className="text-gray-600">
            View and manage factories in your region
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {entriesPerPage} per page
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {[10, 25, 50, 100].map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => setEntriesPerPage(size)}
                >
                  {size} entries
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search factories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setFilterModalOpen(true)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {Object.values(filterCriteria).filter(Boolean).length > 0 && (
              <span className="ml-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                {Object.values(filterCriteria).filter(Boolean).length}
              </span>
            )}
          </Button>

          <Button onClick={exportToCSV} className="gap-2">
            <CloudUpload className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="border rounded-lg overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredFactories.slice(
            (currentPage - 1) * entriesPerPage,
            currentPage * entriesPerPage
          )}
          getRowKey={getRowKey}
        />
      </div>

      {/* Pagination */}
      {filteredFactories.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {paginatedData.length} of {filteredFactories.length}{" "}
            factories
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredFactories.length / entriesPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <Modal onClose={() => setFilterModalOpen(false)}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Filter Factories</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <select
                  className="w-full p-2 border rounded"
                  value={tempFilterCriteria.name || ""}
                  onChange={(e) =>
                    setTempFilterCriteria({
                      ...tempFilterCriteria,
                      name: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">All Names</option>
                  {Array.from(new Set(factories.map((f) => f.name))).map(
                    (name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Location
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={tempFilterCriteria.location || ""}
                  onChange={(e) =>
                    setTempFilterCriteria({
                      ...tempFilterCriteria,
                      location: e.target.value || undefined,
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

              <div>
                <label className="block text-sm font-medium mb-1">Region</label>
                <select
                  className="w-full p-2 border rounded"
                  value={tempFilterCriteria.region || ""}
                  onChange={(e) =>
                    setTempFilterCriteria({
                      ...tempFilterCriteria,
                      region: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">All Regions</option>
                  {uniqueRegions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full p-2 border rounded"
                  value={tempFilterCriteria.status || ""}
                  onChange={(e) =>
                    setTempFilterCriteria({
                      ...tempFilterCriteria,
                      status: e.target.value as
                        | "active"
                        | "inactive"
                        | undefined,
                    })
                  }
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">From</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded"
                    value={tempFilterCriteria.startDate || ""}
                    onChange={(e) =>
                      setTempFilterCriteria({
                        ...tempFilterCriteria,
                        startDate: e.target.value || undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded"
                    value={tempFilterCriteria.endDate || ""}
                    onChange={(e) =>
                      setTempFilterCriteria({
                        ...tempFilterCriteria,
                        endDate: e.target.value || undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClearFilters}>
                Clear All
              </Button>
              <Button
                onClick={handleApplyFilters}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
