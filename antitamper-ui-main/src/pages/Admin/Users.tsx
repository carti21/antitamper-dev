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
import axios from "axios";
import {
  Search,
  CloudUpload,
  Eye,
  EyeOff,
  Trash2,
  Filter,
  InfoIcon,
} from "lucide-react";

import apiClient, { setAuthToken } from "@/apiclient";
import BulkUploadForm from "@/components/ui/bulk-upload-form";
import { toast } from "react-toastify";
import { Box, Typography } from "@mui/material";

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

export default function UsersPage() {
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
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
    factory:
      | {
          name: string;
          location: string;
        }
      | string
      | null;
  }

  const navigate = useNavigate();
  const [entries, setEntries] = useState(10);
  const [isBulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [isRegisterUserModalOpen, setRegisterUserModalOpen] = useState(false);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
  });
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [allUsers, setAllUsers] = useState<UserEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userLevel, setUserLevel] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [designation, setDesignation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedFactory, setSelectedFactory] = useState("");
  const [canReceiveEmailAlerts, setCanReceiveEmailAlerts] = useState(true);
  const [canReceiveSmsAlerts, setCanReceiveSmsAlerts] = useState(false);
  const [factories, setFactories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [tempFilters, setTempFilters] = useState<FilterOptions>({});

  // Available filter options
  const [uniqueFactories, setUniqueFactories] = useState<string[]>([]);
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([]);

  const handleDeleteUser = async (e: React.MouseEvent, id: string) => {
    try {
      e.preventDefault();
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);
      await apiClient.delete("/users/remove/", { data: { id } });

      // Refresh the users list
      await fetchUsers();

      setUserToDelete(null);
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete user");
    }
  };
  console.log(error);

  const exportToCSV = () => {
    if (!users.length) return;

    const headers = [
      "Name",
      "Email",
      "Designation",
      "Phone Number",
      "Role",
      "Level",
      "Status",
      "Factory",
      "Location",
    ];

    const csvData = users.map((user) => [
      user.name,
      user.email,
      user.designation,
      user.phone_number,
      user.role,
      user.level,
      user.status,
      typeof user.factory === "object" ? user?.factory?.name : "N/A",
      typeof user.factory === "object" ? user?.factory?.location : "N/A",
    ]);

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
    (searchTerm: string, filters: FilterOptions, userList: UserEntry[]) => {
      if (!userList) return [];

      let filteredList = userList;

      // Apply search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredList = filteredList.filter(
          (user: UserEntry) =>
            user.name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            (typeof user.factory === "object" &&
              user.factory?.name?.toLowerCase().includes(searchLower)) ||
            (user.factory &&
              typeof user.factory === "object" &&
              user.factory.name?.toLowerCase().includes(searchLower))
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
        filteredList = filteredList.filter((user) => {
          return (
            user.factory &&
            typeof user.factory === "object" &&
            user.factory.name === filters.factory
          );
        });
      }

      return filteredList;
    },
    []
  );

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);
      setLoading(true);

      const { data } = await apiClient.get("/users/", {
        params: {
          page: currentPage,
          limit: entries,
        },
      });

      if (data?.results?.docs) {
        const userList = data.results.docs;

        // Replace factory string IDs with factory objects
        const enrichedUsers: UserEntry[] = userList.map((user: UserEntry) => {
          if (typeof user.factory === "string") {
            const factory = factories.find((f) => f.id === user.factory);
            return {
              ...user,
              factory: factory || null,
            };
          }
          return user;
        });

        const statuses = Array.from(
          new Set(enrichedUsers.map((u) => u.status))
        );
        const uniqueFactoryNames = Array.from(
          new Set(
            enrichedUsers
              .filter((u) => typeof u.factory === "object" && u.factory?.name)
              .map((u) =>
                typeof u.factory === "object" ? u.factory?.name : undefined
              )
              .filter((name): name is string => typeof name === "string")
          )
        );

        setUniqueStatuses(statuses);
        setUniqueFactories(uniqueFactoryNames);
        setAllUsers(enrichedUsers);
        setUsers(enrichedUsers);
        setShowRegistrationSuccess(true);
        setTimeout(() => setShowRegistrationSuccess(false), 3000);
      } else {
        throw new Error("Invalid response structure: results.docs not found");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [currentPage, entries, factories]);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found");

        setAuthToken(token);

        const { data } = await apiClient.get("/regions/");
        if (data?.results && Array.isArray(data.results)) {
          setRegions(data.results);
        } else {
          throw new Error("Invalid region data format");
        }
      } catch (error) {
        console.error("Error fetching regions:", error);
      }
    };

    fetchRegions();
  }, []);

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

  useEffect(() => {
    const fetchFactories = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found");

        setAuthToken(token);

        const response = await apiClient.get("/factories/");

        if (response.data?.results?.docs) {
          setFactories(response.data.results.docs);
          console.log("Loaded factories:", response.data.results.docs);
        } else {
          console.error("Invalid factory data structure:", response.data);
          throw new Error("Invalid response structure: results.docs not found");
        }
      } catch (error) {
        console.error("Error fetching factories:", error);
        setError("Failed to load factories. Please try again.");
      }
    };
    fetchFactories();
  }, []);

  const validateForm = () => {
    if (
      !userName ||
      !userEmail ||
      !designation ||
      !phoneNumber ||
      !password ||
      !confirmPassword
    ) {
      setError("All fields are required");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (userRole === "") {
      setError("Please select the user's role");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      setError("Please enter a valid email address");
      return false;
    }

    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError("Phone number must be at least 10 digits");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    if (userLevel === "region" && !selectedRegion) {
      setError("Please select a region.");
      return false;
    }

    if (userLevel === "factory" && !selectedFactory) {
      setError("Please select a factory.");
      return false;
    }

    return true;
  };

  const validatePassword = (password: string) => {
    let score = 0;
    const feedback = [];

    if (password.length >= 8) score++;
    else feedback.push("Password must be at least 8 characters");

    if (/[A-Z]/.test(password)) score++;
    else feedback.push("Include at least one uppercase letter");

    if (/[a-z]/.test(password)) score++;
    else feedback.push("Include at least one lowercase letter");

    if (/[0-9]/.test(password)) score++;
    else feedback.push("Include at least one number");

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push("Include at least one special character");

    return {
      score,
      feedback: feedback.join(", "),
    };
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(validatePassword(newPassword));
  };

  const handleRegisterUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalLevel = userRole === "sys-admin" ? "global" : userLevel;

    if (!validateForm()) {
      return;
    }

    setRegistering(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);

      const newUser = {
        name: userName,
        email: userEmail,
        designation: designation,
        phone_number: phoneNumber,
        role: userRole,
        level: finalLevel,
        password: password,
        confirm_password: confirmPassword,
        factory: userLevel === "factory" ? selectedFactory : undefined,
        region: userLevel === "region" ? selectedRegion : undefined,
        can_receive_email_alerts: canReceiveEmailAlerts,
        can_receive_sms_alerts: canReceiveSmsAlerts,
      };

      const { data } = await apiClient.post("/users/", newUser);

      setUsers((prevUsers) => [...prevUsers, data]);
      setShowRegistrationSuccess(true);
      setUserName("");
      setUserEmail("");
      setDesignation("");
      setPhoneNumber("");
      setPassword("");
      setConfirmPassword("");
      setUserRole("");
      setUserLevel("");
      setSelectedFactory("");
      setCanReceiveEmailAlerts(true);
      setCanReceiveSmsAlerts(false);
      setError(null);
      setPasswordStrength({ score: 0, feedback: "" });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const apiError =
          error.response?.data?.errors?.[0]?.region ||
          error.response?.data?.error ||
          error.response?.data?.error ||
          "Failed to register user. Please try again.";
        setError(apiError);
        toast.warning(apiError);
        console.error("API Error response:", error.response?.data);
      } else {
        console.error("Unexpected error:", error);

        let errorMessage = "An unexpected error occurred.";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === "string") {
          errorMessage = error;
        } else if (typeof error === "object" && error !== null) {
          errorMessage = JSON.stringify(error); // fallback
        }

        setError(errorMessage);
        toast.info(errorMessage);
      }
    } finally {
      setRegistering(false);
      setRegisterUserModalOpen(false);
    }
  };

  // const handleDeleteUser = async () => {
  //   try {
  //     const token = localStorage.getItem("authToken");
  //     if (!token) throw new Error("No authentication token found");
  //     setAuthToken(token);

  //     await apiClient.delete(`/users/${userToDelete}`);
  //     setDeleteModalOpen(false);
  //     setUserToDelete(null);
  //     fetchUsers(); // Refresh the users list
  //   } catch (error) {
  //     console.error("Error deleting user:", error);
  //     alert("Failed to delete user. Please try again later.");
  //   }
  // };

  const getFactoryName = (factoryId: string) => {
    const factory = factories.find((f) => f.id === factoryId);
    return factory ? factory.name : "Not Assigned";
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
        // For sys-admin users, always show GLOBAL
        if (row.role === "sys-admin") {
          return <span>GLOBAL</span>;
        }

        // For other users, map level
        const levelMap: { [key: string]: string } = {
          global: "GLOBAL",
          national: "NATIONAL",
          region: "REGIONAL",
          factory: "FACTORY",
        };
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
        // Check if factory is an object (with name) or just an ID string
        if (typeof row.factory === "object" && row.factory !== null) {
          return <span>{row.factory.name || "Not Assigned"}</span>;
        } else if (typeof row.factory === "string") {
          return <span>{getFactoryName(row.factory)}</span>;
        }
        return <span>Not Assigned</span>;
      },
    },
    {
      header: "Action",
      accessor: "id" as keyof UserEntry,
      render: (row: UserEntry) => (
        <div className="flex gap-2">
          <Button
            className="bg-[#4588B2] text-white hover:bg-[#4588B2]"
            onClick={() => navigate(`/admin/users/${row.id}`)}
          >
            <Eye className="mr-2 h-5 w-5" />
            View
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setUserToDelete(row.id);
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

  if (showRegistrationSuccess) {
    console.log("Users loaded successfully!");
  }

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Users Management</h1>
          <p className="text-gray-600 mt-1">
            View and manage all users in the system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Existing buttons for filter, export, etc. */}
          <Button
            className="bg-[#4588B2] text-white"
            onClick={() => setRegisterUserModalOpen(true)}
          >
            Register New User
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-2">
        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Role Filter */}
          <select
            className="border rounded p-2 text-black bg-white"
            value={filters.role || ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, role: e.target.value || undefined }))
            }
          >
            <option value="">All Roles</option>
            <option value="sys-admin">sys-admin</option>
            <option value="user">user</option>
          </select>

          {/* Level Filter */}
          <select
            className="border rounded p-2 text-black bg-white"
            value={filters.level || ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, level: e.target.value || undefined }))
            }
          >
            <option value="">All Levels</option>
            <option value="national">national</option>
            <option value="region">region</option>
            <option value="factory">factory</option>
            <option value="global">admin</option>
          </select>
          {/* Factory Filter */}
          <select
            className="border rounded p-2 text-black bg-white"
            value={filters.factory || ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                factory: e.target.value || undefined,
              }))
            }
          >
            <option value="">All Factories</option>
            {uniqueFactories.map((factory) => (
              <option key={factory} value={factory}>
                {factory}
              </option>
            ))}
          </select>
          {/* Clear Filters Button */}
          <Button
            variant="outline"
            className="border border-gray-300 text-black bg-white px-3"
            onClick={() => setFilters({})}
            disabled={Object.keys(filters).length === 0}
          >
            Clear Filters
          </Button>
        </div>
        {/* Entries Dropdown (unchanged) */}
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
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="border rounded p-2 pl-10 w-full text-black bg-white"
              placeholder="Search by name, email, factory, or region..."
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

      <div className="">
        <DataTable columns={columns} data={users} getRowKey={(row) => row.id} />
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

      {isBulkUploadModalOpen && (
        <Modal title="" onClose={() => setBulkUploadModalOpen(false)}>
          <BulkUploadForm
            onSubmit={(e) => {
              e.preventDefault();
              console.log("Bulk Upload");
            }}
            onClose={() => setBulkUploadModalOpen(false)}
            title="Bulk Upload Users"
            acceptFileTypes=".csv, .xlsx"
          />
        </Modal>
      )}

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
                className="w-full p-2 border border-gray-300 rounded-md"
                value={tempFilters.level || ""}
                onChange={(e) =>
                  setTempFilters({
                    ...tempFilters,
                    level: e.target.value || undefined,
                  })
                }
              >
                <option value="">All Levels</option>
                <option value="national">national</option>
                <option value="region">region</option>
                <option value="factory">factory</option>
                <option value="admin">admin</option>
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

      {isDeleteModalOpen && userToDelete && (
        <Modal title="" onClose={() => setDeleteModalOpen(false)}>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Delete User</h2>
            <p>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  setUserToDelete(null);
                  setDeleteModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  if (userToDelete) {
                    handleDeleteUser(e, userToDelete);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isRegisterUserModalOpen && (
        <Modal title="" onClose={() => setRegisterUserModalOpen(false)}>
          <form
            onSubmit={handleRegisterUserSubmit}
            className="space-y-4 max-h-[100vh] overflow-y-auto w-full max-w-md p-4"
          >
            <FormHeader
              title="Register User"
              onClose={() => setRegisterUserModalOpen(false)}
            />

            <div className="space-y-2">
              <input
                type="text"
                className="border rounded p-2 w-full"
                placeholder="Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />

              <input
                type="email"
                className="border rounded p-2 w-full"
                placeholder="Email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                required
              />
              <input
                type="text"
                className="border rounded p-2 w-full"
                placeholder="Designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
              />
              <input
                type="tel"
                className="border rounded p-2 w-full"
                placeholder="Phone Number (at least 10 digits)"
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/\D/g, ""))
                }
                required
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="border rounded p-2 w-full pr-10"
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {password && (
                <div className="mt-1 text-sm">
                  <div
                    className={`font-semibold ${
                      passwordStrength.score < 3
                        ? "text-red-500"
                        : passwordStrength.score < 4
                        ? "text-yellow-500"
                        : "text-green-500"
                    }`}
                  >
                    Password strength:{" "}
                    {passwordStrength.score < 3
                      ? "Weak"
                      : passwordStrength.score < 4
                      ? "Medium"
                      : "Strong"}
                  </div>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li
                      className={
                        password.length >= 8 ? "text-green-600" : "text-red-500"
                      }
                    >
                      At least 8 characters
                    </li>
                    <li
                      className={
                        /[A-Z]/.test(password)
                          ? "text-green-600"
                          : "text-red-500"
                      }
                    >
                      At least one uppercase letter
                    </li>
                    <li
                      className={
                        /[a-z]/.test(password)
                          ? "text-green-600"
                          : "text-red-500"
                      }
                    >
                      At least one lowercase letter
                    </li>
                    <li
                      className={
                        /[0-9]/.test(password)
                          ? "text-green-600"
                          : "text-red-500"
                      }
                    >
                      At least one number
                    </li>
                    <li
                      className={
                        /[^A-Za-z0-9]/.test(password)
                          ? "text-green-600"
                          : "text-red-500"
                      }
                    >
                      At least one special character
                    </li>
                  </ul>
                </div>
              )}

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="border rounded p-2 w-full pr-10"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {password && confirmPassword && password !== confirmPassword && (
                <div className="text-sm text-red-500">
                  Passwords do not match
                </div>
              )}

              <select
                className="border rounded p-2 w-full"
                value={userRole}
                onChange={(e) => {
                  const role = e.target.value;
                  setUserRole(role);

                  // Automatically set level to 'global' when role is 'sys-admin'
                  if (role === "sys-admin") {
                    setUserLevel("global");
                  } else if (userLevel === "global") {
                    // Reset to default if user previously selected global
                    setUserLevel("");
                  }
                }}
                required
              >
                <option value="">Select Role</option>
                <option value="sys-admin">System Admin</option>
                <option value="user">User</option>
              </select>

              <select
                className="border rounded p-2 w-full"
                value={userRole === "sys-admin" ? "global" : userLevel}
                onChange={(e) => setUserLevel(e.target.value)}
                required
                disabled={userRole === "sys-admin"} // Prevent change if sys-admin
              >
                {userRole !== "user" && <option value="global">ADMIN</option>}
                <option value="national">NATIONAL</option>
                <option value="region">REGIONAL</option>
                <option value="factory">FACTORY</option>
              </select>

              {userLevel === "region" && (
                <div>
                  <select
                    className="border rounded p-2 w-full"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    required
                  >
                    <option value="">Select Region</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                  {regions.length === 0 && (
                    <div className="text-sm text-red-500 mt-1">
                      No regions available. Please try refreshing the page.
                    </div>
                  )}
                </div>
              )}

              {userLevel === "factory" && (
                <div>
                  <select
                    className="border rounded p-2 w-full"
                    value={selectedFactory}
                    onChange={(e) => setSelectedFactory(e.target.value)}
                    required
                  >
                    <option value="">Select Factory</option>
                    {factories && factories.length > 0 ? (
                      factories.map((factory) => (
                        <option key={factory.id} value={factory.id}>
                          {factory.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        Loading factories...
                      </option>
                    )}
                  </select>
                  {factories.length === 0 && (
                    <div className="text-sm text-red-500 mt-1">
                      No factories available. Please try refreshing the page.
                    </div>
                  )}
                </div>
              )}

              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Alerts
                </label>
                <select
                  className="border rounded p-2 w-full"
                  value={canReceiveEmailAlerts.toString()}
                  onChange={(e) =>
                    setCanReceiveEmailAlerts(e.target.value === "true")
                  }
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>

              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMS Alerts
                </label>
                <select
                  className="border rounded p-2 w-full"
                  value={canReceiveSmsAlerts.toString()}
                  onChange={(e) =>
                    setCanReceiveSmsAlerts(e.target.value === "true")
                  }
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setRegisterUserModalOpen(false);
                  setError(null);
                  setUserName("");
                  setUserEmail("");
                  setPhoneNumber("");
                  setPassword("");
                  setConfirmPassword("");
                  setUserRole("");
                  setUserLevel("");
                  setSelectedFactory("");
                  setCanReceiveEmailAlerts(true);
                  setCanReceiveSmsAlerts(false);
                  setError(null);
                  setPasswordStrength({ score: 0, feedback: "" });
                }}
                className="bg-gray-500 text-white"
                type="button"
                disabled={registering}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#4588B2] text-white"
                disabled={registering}
              >
                {registering ? "Registering..." : "Register"}
              </Button>
            </div>
          </form>
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
  );
}
