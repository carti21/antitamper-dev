import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import FormHeader from "@/components/forms/formheader";
import { Search, CloudUpload, Eye, Filter, InfoIcon } from "lucide-react";

import apiClient, { setAuthToken } from "@/apiclient";
import { toast } from "react-toastify";
import { Box, Typography } from "@mui/material";
import axios from "axios";

const Modal = ({
  children,
}: {
  title: string;
  children?: React.ReactNode;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
      <div className="flex justify-between items-center mb-4"></div>
      {children}
    </div>
  </div>
);

export default function FacvtoryUsersPage() {
  interface FilterOptions {
    role?: string;
    level?: string;
    status?: string;
    factory?: string;
  }

  interface UserEntry {
    id: string;
    name: string;
    email: string;
    designation: string;
    phone_number: string;
    email_confirmed: boolean;
    role: string;
    level: string;
    status: string;
    factory: Factory | string | null;
  }

  interface Factory {
    id: string;
    name: string;
    location: string;
    region: string;
    status: string;
  }

  const navigate = useNavigate();
  const [entries, setEntries] = useState(10);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [allUsers, setAllUsers] = useState<UserEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [tempFilters, setTempFilters] = useState<FilterOptions>({});

  // Available filter options
  const [uniqueFactories, setUniqueFactories] = useState<string[]>([]);
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([]);

  const exportToCSV = () => {
    if (!users.length) return;

    const headers = [
      "Name",
      "Email",
      "designation",
      "Phone Number",
      "Role",
      "Level",
      "Status",
      "Factory",
      "Location",
    ];

    const csvData = users.map((user) => {
      const factoryName =
        typeof user.factory === "object" ? user.factory?.name : "Not assigned";
      const factoryLocation =
        typeof user.factory === "object"
          ? user.factory?.location
          : "Not assigned";

      return [
        user.name,
        user.email,
        user.designation,
        user.phone_number,
        user.role,
        user.level,
        user.status,
        factoryName,
        factoryLocation,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell || ""}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `users_export_${new Date().toISOString()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filterUsers = useCallback(
    (
      searchTerm: string,
      filters: FilterOptions,
      userList: UserEntry[]
    ): UserEntry[] => {
      if (!userList) return [];

      let filteredList = userList;

      // Apply search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredList = filteredList.filter(
          (user) =>
            user.name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            (typeof user.factory === "object" &&
              user.factory?.name?.toLowerCase().includes(searchLower)) ||
            (typeof user.factory === "object" &&
              user.factory?.location?.toLowerCase().includes(searchLower))
        );
      }

      // Apply role filter
      if (filters.role) {
        filteredList = filteredList.filter(
          (user) => user.role === filters.role
        );
      }

      // Apply level filter
      if (filters.level) {
        filteredList = filteredList.filter(
          (user) => user.level === filters.level
        );
      }

      // Apply status filter
      if (filters.status) {
        filteredList = filteredList.filter(
          (user) => user.status === filters.status
        );
      }

      // Apply factory filter
      if (filters.factory) {
        filteredList = filteredList.filter(
          (user) =>
            typeof user.factory === "object" &&
            user.factory?.name === filters.factory
        );
      }

      return filteredList;
    },
    []
  );

  const [factories, setFactories] = useState<Factory[]>([]);

  // Update your fetchUsers function to include factory data
  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);
      setLoading(true);

      // Fetch users and factories in parallel
      const [usersResponse, factoriesResponse] = await Promise.all([
        apiClient.get("/users/", {
          params: {
            page: currentPage,
            limit: entries,
          },
        }),
        apiClient.get("/factories/"),
      ]);

      if (
        usersResponse.data?.results?.docs &&
        factoriesResponse.data?.results?.docs
      ) {
        const userList = usersResponse.data.results.docs;
        const factoryList = factoriesResponse.data.results.docs;

        // Create a map of factory IDs to factory objects for quick lookup
        const factoryMap = new Map(
          factoryList.map((factory: Factory) => [factory.id, factory])
        );

        // Enhance user data with factory information
        // Enhance user data with factory information
        const enhancedUsers = userList.map((user: UserEntry) => {
          // If factory is already an object (shouldn't happen with fresh API data)
          if (typeof user.factory === "object") {
            return user;
          }

          // If factory is a string ID, look it up
          const factory = user.factory ? factoryMap.get(user.factory) : null;

          return {
            ...user,
            factory: factory || null,
          };
        });

        const statuses = Array.from(
          new Set(enhancedUsers.map((user: UserEntry) => user.status))
        );
        const factories = Array.from(
          new Set(
            enhancedUsers
              .filter(
                (user: UserEntry) =>
                  typeof user.factory === "object" && user.factory?.name
              )
              .map((user: UserEntry) =>
                typeof user.factory === "object" ? user.factory?.name : ""
              )
          )
        );

        setUniqueStatuses(statuses as string[]);
        setUniqueFactories(factories as string[]);

        setAllUsers(enhancedUsers);
        setUsers(enhancedUsers);
        setFactories(factoryList);
      } else {
        throw new Error("Invalid response structure");
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
    } finally {
      setLoading(false);
    }
  }, [currentPage, entries]);

  // Apply search and filters whenever searchTerm, filters, or allUsers change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (allUsers.length > 0) {
        const filteredList = filterUsers(searchTerm, filters, allUsers);
        setUsers(filteredList);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, allUsers, filterUsers]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, entries, fetchUsers]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4588B2]"></div>
        <Typography variant="body1" className="mt-4 text-gray-600">
          Loading users...
        </Typography>
      </Box>
    );
  }

  if (!loading && (!users || users.length === 0)) {
    return (
      <Box className="flex flex-col items-center justify-center text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-md p-6">
        <InfoIcon fontSize="large" className="mb-2 text-blue-400" />
        <Typography variant="h6" className="mb-1">
          No users Available
        </Typography>
        <Typography variant="body2">
          There are is no users to show right now.
        </Typography>
      </Box>
    );
  }

  const columns = [
    { header: "Name", accessor: "name" as keyof UserEntry },
    { header: "Email", accessor: "email" as keyof UserEntry },
    {
      header: "Designation",
      accessor: "designation" as keyof UserEntry,
      render: (row: UserEntry) => <span>{row.designation || "N/A"}</span>,
    },
    { header: "Phone Number", accessor: "phone_number" as keyof UserEntry },
    {
      header: "Role",
      accessor: "role" as keyof UserEntry,
      render: (row: UserEntry) => <span>{row.role || "Not Assigned"}</span>,
    },
    {
      header: "Level",
      accessor: "level" as keyof UserEntry,
      render: (row: UserEntry) => {
        // Map numeric levels to string levels according to the system
        const levelMap: { [key: string]: string } = {
          global: "ADMIN",
          national: "NATIONAL",
          region: "REGIONAL",
          factory: "FACTORY",
        };

        // For sys-admin users, always show ADMIN
        if (row.role === "sys-admin") {
          return <span>ADMIN</span>;
        }

        // For other users, map numeric level to string level
        return <span>{levelMap[row.level] || "Not Assigned"}</span>;
      },
    },
    {
      header: "Status",
      accessor: "status" as keyof UserEntry,
      render: (row: UserEntry) => (
        <span
          className={
            row.status === "active" ? "text-green-600" : "text-red-600"
          }
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Factory",
      accessor: "factory" as keyof UserEntry,
      render: (row: UserEntry) => {
        // For sys-admin users, factory is not applicable
        if (row.role === "sys-admin") {
          return <span>Not Applicable</span>;
        }

        // Check if factory is an object (enhanced data) or just an ID
        const factoryName =
          typeof row.factory === "object"
            ? row.factory?.name
            : row.factory
            ? factories.find((f) => f.id === row.factory)?.name
            : null;

        return <span>{factoryName || "Not Assigned"}</span>;
      },
    },
    {
      header: "Action",
      accessor: "id" as keyof UserEntry,
      render: (row: UserEntry) => (
        <div className="flex gap-2">
          <Button
            className="bg-[#4588B2] text-white hover:bg-[#4588B2]"
            onClick={async () => {
              try {
                // Get token from storage
                const token = localStorage.getItem("authToken");
                if (!token) {
                  throw new Error("No authentication token found");
                }

                setAuthToken(token);
                const response = await apiClient.get(`/users/details/`, {
                  params: { id: row.id },
                });
                console.log(response.data);
                if (response.data.success === false) {
                  throw new Error("You don't have permission");
                }

                // Success — navigate
                navigate(`/national/users/${row.id}`);
              } catch (error: unknown) {
                console.log(error);
                const message = "You don't have permission to view this user";

                toast.error(message);
              }
            }}
          >
            <Eye className="mr-2 h-5 w-5" />
            View
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">
            {searchTerm || Object.keys(filters).length > 0
              ? "No users match your search"
              : "No users found"}
          </h3>
          <p className="text-gray-500">
            {searchTerm || Object.keys(filters).length > 0
              ? "Try adjusting your search or filter criteria"
              : "There are currently no users in the system"}
          </p>
          {(searchTerm || Object.keys(filters).length > 0) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setFilters({});
                fetchUsers();
              }}
            >
              Clear search and filters
            </Button>
          )}
        </div>
      </div>
    );
  }

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
            <div>
              <h1 className="text-2xl font-bold">Users Management</h1>
              <p className="text-gray-600 mt-1">
                View all National users in the system
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="border border-gray-300 text-black bg-white">
                    {entries} entries
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border border-gray-300">
                  {[10, 25, 50, 100].map((value) => (
                    <DropdownMenuItem
                      key={value}
                      onSelect={() => setEntries(value)}
                      className="text-black"
                    >
                      {value} entries
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="text"
                  className="border rounded p-2 pl-10 w-full text-black bg-white"
                  placeholder="Search by email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                />
                {searchTerm && (
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <Button
                      className="h-8 px-2 bg-gray-200 text-black"
                      onClick={() => {
                        setSearchTerm("");
                        fetchUsers();
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                )}
                {loading && (
                  <div className="absolute inset-y-0 right-12 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  </div>
                )}
              </div>
              <Button
                className={`border ${
                  Object.keys(filters).length > 0
                    ? "border-green-600 text-green-600"
                    : "border-[#4588B2] text-[#4588B2]"
                } bg-transparent`}
                onClick={() => {
                  setTempFilters({ ...filters });
                  setFilterModalOpen(true);
                }}
              >
                <Filter className="mr-2 h-5 w-5" />
                {Object.keys(filters).length > 0 ? "Filters Applied" : "Filter"}
              </Button>
              <Button className="bg-[#4588B2] text-white" onClick={exportToCSV}>
                <CloudUpload className="mr-2 h-5 w-5" />
                Export to CSV
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={users}
              getRowKey={(row) => row.id}
            />
          </div>

          <div className="flex justify-between items-center mt-4">
            <div>
              Showing {users.length} of {allUsers.length} entries
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(allUsers.length / entries)}
              onPageChange={handlePageChange}
            />
          </div>

          {isFilterModalOpen && (
            <Modal title="" onClose={() => setFilterModalOpen(false)}>
              <div className="p-6 w-[500px] max-w-full">
                <FormHeader
                  title="Filter Users"
                  onClose={() => setFilterModalOpen(false)}
                />
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      className="border rounded p-2 text-black bg-white"
                      value={filters.role || ""}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          role: e.target.value || undefined,
                        }))
                      }
                    >
                      <option value="">All Roles</option>
                      <option value="sys-admin">sys-admin</option>
                      <option value="user">user</option>
                    </select>
                  </div>

                  <select
                    className="border rounded p-2 text-black bg-white"
                    value={filters.level || ""}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        level: e.target.value || undefined,
                      }))
                    }
                  >
                    <option value="">All Levels</option>
                    <option value="national">national</option>
                    <option value="region">region</option>
                    <option value="factory">factory</option>
                    <option value="global">admin</option>
                  </select>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={tempFilters.status || ""}
                      onChange={(e) =>
                        setTempFilters({
                          ...tempFilters,
                          status: e.target.value || undefined,
                        })
                      }
                    >
                      <option value="">All Statuses</option>
                      {uniqueStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Factory
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={tempFilters.factory || ""}
                      onChange={(e) =>
                        setTempFilters({
                          ...tempFilters,
                          factory: e.target.value || undefined,
                        })
                      }
                    >
                      <option value="">All Factories</option>
                      {uniqueFactories.map((factory) => (
                        <option key={factory} value={factory}>
                          {factory}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTempFilters({});
                      setFilters({});
                      setFilterModalOpen(false);
                    }}
                  >
                    Clear Filters
                  </Button>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setFilterModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-[#4588B2] text-white"
                      onClick={() => {
                        setFilters(tempFilters);
                        setFilterModalOpen(false);
                      }}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>
            </Modal>
          )}

          {isExportModalOpen && (
            <Modal title="" onClose={() => setExportModalOpen(false)}>
              <form onSubmit={() => console.log("Export")}>
                <FormHeader
                  title="Export"
                  onClose={() => setExportModalOpen(false)}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => setExportModalOpen(false)}
                    className="bg-gray-500 text-white"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#4588B2] text-white">
                    Export
                  </Button>
                </div>
              </form>
            </Modal>
          )}
        </div>
      )}
    </>
  );
}
