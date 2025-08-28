import React, { useEffect, useState, useCallback } from "react";
import { Search, Download, Filter, InfoIcon } from "lucide-react";
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
import apiClient, { setAuthToken } from "@/apiclient";
import { Box, Typography } from "@mui/material";

const Modal = ({
  children,
}: {
  onClose: () => void;
  children?: React.ReactNode;
}) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded shadow-lg">{children}</div>
  </div>
);

export default function ActivityLogsPage() {
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter state
  const [filterCriteria, setFilterCriteria] = useState({
    user: "",
    action: "",
    startDate: "",
    endDate: "",
  });

  // For filter modal
  const [tempFilterCriteria, setTempFilterCriteria] = useState({
    user: "",
    action: "",
    startDate: "",
    endDate: "",
  });

  // Available filter options
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);

  interface ActivityLog {
    _id: string;
    timestamp: string;
    user: string;
    action: string;
    details: string;
  }

  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [allLogs, setAllLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filterLogs = useCallback(
    (
      searchTerm: string,
      logs: ActivityLog[],
      filters: typeof filterCriteria
    ) => {
      let filtered = [...logs];

      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (log) =>
            log.user.toLowerCase().includes(searchLower) ||
            log.action.toLowerCase().includes(searchLower) ||
            log.details.toLowerCase().includes(searchLower) ||
            log.timestamp.toLowerCase().includes(searchLower)
        );
      }

      if (filters.user) {
        filtered = filtered.filter((log) => log.user === filters.user);
      }

      if (filters.action) {
        filtered = filtered.filter((log) => log.action === filters.action);
      }

      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        if (!isNaN(start)) {
          filtered = filtered.filter(
            (log) => new Date(log.timestamp).getTime() >= start
          );
        }
      }

      if (filters.endDate) {
        const end = new Date(filters.endDate).getTime() + 24 * 60 * 60 * 1000;
        if (!isNaN(end)) {
          filtered = filtered.filter(
            (log) => new Date(log.timestamp).getTime() <= end
          );
        }
      }

      return filtered;
    },
    []
  );

  const fetchActivityLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);
      setLoading(true);

      const { data } = await apiClient.get("/activity-logs/");

      if (!data || typeof data !== "object") {
        setError("Invalid data format received");
        return;
      }

      const logsArray = data.results?.docs;

      if (!Array.isArray(logsArray)) {
        console.error("No valid array found in response:", data);
        setError("Invalid data format received");
        return;
      }

      const formattedLogs = logsArray.map((log) => ({
        _id: log.id || log._id || "Unknown",
        timestamp: log.timestamp || "No Timestamp",
        user: log.user || "Unknown User",
        action: log.action || "N/A",
        details: `Email: ${log.email || "Unknown"}, Model: ${
          log.model || "Unknown"
        }`,
      }));

      // Extract unique users and actions for filters
      const users = Array.from(new Set(formattedLogs.map((log) => log.user)));
      const actions = Array.from(
        new Set(formattedLogs.map((log) => log.action))
      );

      setUniqueUsers(users);
      setUniqueActions(actions);
      setAllLogs(formattedLogs);
      setFilteredLogs(formattedLogs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      setError("Failed to fetch activity logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  // Apply filters whenever search term or filter criteria change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (allLogs.length > 0) {
        const filtered = filterLogs(searchTerm, allLogs, filterCriteria);
        setFilteredLogs(filtered);
        // Reset to page 1 when filters change
        setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, allLogs, filterLogs, filterCriteria]);

  // Initialize temp filter criteria when opening the modal
  useEffect(() => {
    if (isFilterModalOpen) {
      setTempFilterCriteria({
        ...filterCriteria,
      });
    }
  }, [isFilterModalOpen, filterCriteria]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const applyFilters = () => {
    setFilterCriteria(tempFilterCriteria);
    setFilterModalOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      user: "",
      action: "",
      startDate: "",
      endDate: "",
    };
    setTempFilterCriteria(emptyFilters);
    setFilterCriteria(emptyFilters);
    setFilterModalOpen(false);
  };

  const exportToCSV = () => {
    // Create CSV content
    const headers = ["Timestamp", "User", "Action", "Details"];

    const csvContent = [
      headers.join(","),
      ...filteredLogs.map((log) =>
        [
          `"${log.timestamp}"`,
          `"${log.user}"`,
          `"${log.action}"`,
          `"${log.details.replace(/"/g, '""')}"`, // Escape quotes in CSV
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
      `activity_logs_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

   if (loading) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4588B2]"></div>
        <Typography variant="body1" className="mt-4 text-gray-600">
          Loading data...
        </Typography>
      </Box>
    );
  }

  if (!loading && (!allLogs || allLogs.length === 0)) {
    return (
      <Box className="flex flex-col items-center justify-center text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-md p-6">
        <InfoIcon fontSize="large" className="mb-2 text-blue-400" />
        <Typography variant="h6" className="mb-1">
          No Data Available
        </Typography>
        <Typography variant="body2">
          There are is no data to show right now.
        </Typography>
      </Box>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const columns = [
    { header: "Timestamp", accessor: "timestamp" as keyof ActivityLog },
    { header: "User", accessor: "user" as keyof ActivityLog },
    { header: "Action", accessor: "action" as keyof ActivityLog },
    { header: "Details", accessor: "details" as keyof ActivityLog },
  ];

  const getRowKey = (row: ActivityLog) => row._id;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          Activity Logs <br />
          <span className="font-normal">all activities</span>
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
          <div className="flex items-center border rounded p-2 bg-white text-black">
            <input
              type="date"
              className="border-none focus:outline-none bg-white text-black px-2"
              placeholder="Start date"
              value={filterCriteria.startDate || ""}
              onChange={(e) => {
                const startDate = e.target.value;
                // Only update if a valid date is selected or empty
                setFilterCriteria((prev) => ({
                  ...prev,
                  startDate: startDate,
                  // If end date is before start date, update it
                  endDate:
                    prev.endDate && startDate && prev.endDate < startDate
                      ? startDate
                      : prev.endDate,
                }));
              }}
            />
            <span className="mx-2">to</span>
            <input
              type="date"
              className="border-none focus:outline-none bg-white text-black px-2"
              placeholder="End date"
              value={filterCriteria.endDate || ""}
              onChange={(e) => {
                const endDate = e.target.value;
                // Only update if a valid date is selected or empty
                setFilterCriteria((prev) => ({
                  ...prev,
                  endDate: endDate,
                  // If start date is after end date, update it
                  startDate:
                    prev.startDate && endDate && prev.startDate > endDate
                      ? endDate
                      : prev.startDate,
                }));
              }}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative rounded-md shadow-sm w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="border rounded p-2 pl-10 w-full text-black bg-white"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {loading && (
              <div className="absolute inset-y-0 right-12 flex items-center">
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

      <DataTable
        columns={columns}
        data={filteredLogs.slice(
          (currentPage - 1) * entriesPerPage,
          currentPage * entriesPerPage
        )}
        getRowKey={getRowKey}
      />

      <div className="flex justify-between items-center mt-4">
        <div>
          Showing{" "}
          {Math.min(
            entriesPerPage,
            filteredLogs.length - (currentPage - 1) * entriesPerPage
          )}{" "}
          of {filteredLogs.length} entries
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredLogs.length / entriesPerPage)}
          onPageChange={handlePageChange}
        />
      </div>

      {isFilterModalOpen && (
        <Modal onClose={() => setFilterModalOpen(false)}>
          <div className="w-[500px]">
            <FormHeader
              title="Filter Activity Logs"
              onClose={() => setFilterModalOpen(false)}
            />
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  User
                </label>
                <select
                  className="w-full p-2 border rounded bg-white text-black"
                  value={tempFilterCriteria.user}
                  onChange={(e) =>
                    setTempFilterCriteria({
                      ...tempFilterCriteria,
                      user: e.target.value,
                    })
                  }
                >
                  <option value="">All Users</option>
                  {uniqueUsers.map((user) => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Action
                </label>
                <select
                  className="w-full p-2 border rounded bg-white text-black"
                  value={tempFilterCriteria.action}
                  onChange={(e) =>
                    setTempFilterCriteria({
                      ...tempFilterCriteria,
                      action: e.target.value,
                    })
                  }
                >
                  <option value="">All Actions</option>
                  {uniqueActions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Date Range
                </label>
                <div className="flex space-x-2">
                  <div className="w-1/2">
                    <label className="block text-xs text-gray-500">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded bg-white text-black"
                      value={tempFilterCriteria.startDate || ""}
                      onChange={(e) => {
                        const startDate = e.target.value;
                        // Only update if a valid date is selected or empty
                        setTempFilterCriteria((prev) => ({
                          ...prev,
                          startDate: startDate,
                          // If end date is before start date, update it
                          endDate:
                            prev.endDate &&
                            startDate &&
                            prev.endDate < startDate
                              ? startDate
                              : prev.endDate,
                        }));
                      }}
                      max={
                        tempFilterCriteria.endDate ||
                        new Date().toISOString().split("T")[0]
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
                      value={tempFilterCriteria.endDate || ""}
                      onChange={(e) => {
                        const endDate = e.target.value;
                        // Only update if a valid date is selected or empty
                        setTempFilterCriteria((prev) => ({
                          ...prev,
                          endDate: endDate,
                          // If start date is after end date, update it
                          startDate:
                            prev.startDate &&
                            endDate &&
                            prev.startDate > endDate
                              ? endDate
                              : prev.startDate,
                        }));
                      }}
                      min={tempFilterCriteria.startDate}
                      max={new Date().toISOString().split("T")[0]}
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
          </div>
        </Modal>
      )}
    </div>
  );
}
