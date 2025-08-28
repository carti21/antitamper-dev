import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Eye, InfoIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import apiClient, { setAuthToken } from "@/apiclient";
import { Box, Typography } from "@mui/material";


interface Column<T> {
  header: string;
  accessor: keyof T;
  key?: string; // Add optional key property
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  onDelete?: (row: T) => void;
}

function DataTable<T>({ columns, data, getRowKey, onDelete }: DataTableProps<T>) {
  return (
    <div className="bg-white shadow-sm overflow-hidden sm:rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key || String(column.accessor)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </TableHead>
            ))}
            {onDelete && (
              <TableHead
                key="actions"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={getRowKey(row)}>
              {columns.map((column) => (
                <TableCell
                  key={String(column.accessor)}
                  className="px-6 py-4 whitespace-normal break-words"
                >
                  {column.render ? column.render(row) : String(row[column.accessor])}
                </TableCell>
              ))}
              {onDelete && (
                <TableCell className="px-6 py-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(row)}
                  >
                    Delete
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function FactoryUsersPage() {
  const [userFactory, setUserFactory] = useState<{ id: string; name: string; location: string } | null>(null);
  interface UserEntry {
    id: string;
    name: string;
    email: string;
    designation:string;
    phone_number: string;
    email_confirmed: boolean;
    role: string;
    level: string;
    status: string;
    location:string;
    factory: {
      name: string;
      location: string;
    } | null;
  }

  const navigate = useNavigate();
  const [entries, setEntries] = useState(10);


  ;
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<UserEntry[]>([]);
  const [allUsers, setAllUsers] = useState<UserEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const exportToCSV = () => {
    if (!users.length) return;

    const headers = [
      'Name',
      'Email',
      'Designation',
      'Phone Number',
      'Role',
      'Level',
      'Status',
      'Factory',
      'Location'
    ];

    const csvData = users.map(user => [
      user.name,
      user.email,
      user.designation,
      user.phone_number,
      user.role,
      user.level,
      user.status,
      user.factory?.name || 'N/A',
      user.factory?.location || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filterUsers = useCallback((searchTerm: string, userList: UserEntry[]) => {
    if (!searchTerm) {
      return userList;
    }
    const searchLower = searchTerm.toLowerCase();
    return userList.filter((user: UserEntry) => (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.factory?.name?.toLowerCase().includes(searchLower) ||
      user.factory?.location?.toLowerCase().includes(searchLower)
    ));
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No auth token found");
        }
        setAuthToken(token);

        // Get user data from localStorage/sessionStorage
        const userData = JSON.parse(localStorage.getItem("userData") || sessionStorage.getItem("userData") || '{}');
        
        if (userData && userData.factoryId) {
          // Create a factory object with the user's assigned factory
          const factoryData = {
            id: userData.factoryId,
            name: userData.factoryName || "KAPSARA TEA FACTORY",
            location: userData.factoryLocation || "VIHIGA"
          };
          
          setUserFactory(factoryData);
        } else if (userData && userData.level === 'ADMIN') {
          // For admin users, we might need to handle differently
          // You might want to set a different state or handle this case differently
        } else {
          setError("No factory found in your account");
        }
      } catch  {
        setError("Error processing user data");
      }
    };

    fetchCurrentUser();
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!userFactory) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);
      setLoading(true);

      const { data } = await apiClient.get("/users/", {
        params: {
          page: currentPage,
          limit: entries,
          factory: userFactory.name // Use factory name instead of ID
        }
      });

      if (data?.results?.docs) {
        // Process user data to ensure factory information is available
        const userList = data.results.docs.map((user: UserEntry) => {
          // If user doesn't have factory info, add the current factory
          if (!user.factory || !user.factory.name) {
            return {
              ...user,
              factory: {
                name: userFactory.name ,
                location: userFactory.location ,
                id: userFactory.id
              }
            };
          }
          return user;
        });
        
        setAllUsers(userList);
        const filteredList = filterUsers(searchTerm, userList);
        setUsers(filteredList);
      } else {
        throw new Error("Invalid response structure: results.docs not found");
      }
    } catch {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [currentPage, entries, filterUsers, searchTerm, userFactory]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const filteredList = filterUsers(searchTerm, allUsers);
      setUsers(filteredList);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, allUsers, filterUsers]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, entries, fetchUsers]);

  useEffect(() => {
    const fetchFactories = async () => {
      if (!userFactory) return;

      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found");

        setAuthToken(token);

        const response = await apiClient.get("/factories/", {
          params: {
            id: userFactory
          }
        });

        if (response.data?.results?.docs) {
          console.log("Loaded factories:", response.data.results.docs);
        } else {
          console.error("Invalid factory data structure:", response.data);
          throw new Error("Invalid response structure: results.docs not found");
        }
      } catch  {
        setError("Failed to load factories. Please try again.");
      }
    };
    fetchFactories();
  }, [userFactory]);


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const columns = [
    { header: "Name", accessor: "name" as keyof UserEntry },
    { header: "Email", accessor: "email" as keyof UserEntry },
    { header: "Phone Number", accessor: "phone_number" as keyof UserEntry },
     {
    header: "Designation",
    accessor: "designation" as keyof UserEntry,
    render: (row: UserEntry) => <span>{row.designation || "N/A"}</span>,
  },
    { header: "Email Confirmed", accessor: "email_confirmed" as keyof UserEntry },
    { header: "Role", accessor: "role" as keyof UserEntry },
    { header: "Level", accessor: "level" as keyof UserEntry },
    { header: "Status", accessor: "status" as keyof UserEntry },
    { 
      header: "Factory Name", 
      accessor: "factory_name" as keyof UserEntry,
      key: "factory_name",
      render: (row: UserEntry) => (
        <span>{row.factory?.name || userFactory?.name || 'N/A'}</span>
      ) 
    },
    { 
      header: "Factory Location", 
      accessor: "factory_location" as keyof UserEntry,
      key: "factory_location",
      render: (row: UserEntry) => (
        <span>{row.factory?.location || 'VIHIGA'}</span>
      ) 
    },
    {
      header: "Actions",
      accessor: "id" as keyof UserEntry,
      render: (row: UserEntry) => (
        <div className="flex gap-2">
          <Button
            className="bg-[#4588B2] text-white hover:bg-[#4588B2]"
            onClick={() => navigate(`/factory/users/${row.id}`)}
          >
            <Eye className="mr-2 h-5 w-5" />
            View
          </Button>
        </div>
      ),
    },
  ];


  if (error) {
    return <div className="text-red-500">{error}</div>;
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          Users <br />
          <span className="font-normal">all users</span>
        </h1>
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
              placeholder="Search by Email"
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
            className="bg-[#4588B2] text-white"
            onClick={exportToCSV}
          >
            <Plus className="mr-2 h-5 w-5" />
            Export to CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto mt-4">
        <DataTable<UserEntry>
          columns={columns}
          data={users.slice(
            (currentPage - 1) * entries,
            currentPage * entries
          )}
          getRowKey={(row) => row.id}
        />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(users.length / entries)}
        onPageChange={handlePageChange}
      />
    </div>
  );
}