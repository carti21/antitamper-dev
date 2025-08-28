import React, { useEffect, useState } from "react";
import { CloudUpload, Plus, Search } from "lucide-react";
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


const Modal = ({ children }: { onClose: () => void; children?: React.ReactNode }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded shadow-lg">
      {children}
    </div>
  </div>
);

export default function NationalActivityLogsPage() {
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  interface ActivityLog {
    _id: string;
    timestamp: string;
    user: string;
    action: string;
    details: string;
  }

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found");
  
        setAuthToken(token);
  
        const { data } = await apiClient.get("/activity-logs/");
  
        if (!data || typeof data !== "object") {
          console.error("API response is not an object:", data);
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
          details: `Email: ${log.email || "Unknown"}, Model: ${log.model || "Unknown"}`,
        }));
  
        setActivityLogs(formattedLogs);
      } catch (error) {
        console.error("Error fetching activity logs:", error);
        setError("Failed to fetch activity logs");
      } finally {
        setLoading(false);
      }
    };
  
    fetchActivityLogs();
  }, []);
  

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const columns = [
    { header: "Timestamp", accessor: "timestamp" as keyof typeof activityLogs[0] },
    { header: "User", accessor: "user" as keyof typeof activityLogs[0] },
    { header: "Action", accessor: "action" as keyof typeof activityLogs[0] },
    { header: "Details", accessor: "details" as keyof typeof activityLogs[0] },
  ];

  const getRowKey = (row: typeof activityLogs[0]) => row._id;

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
            />
            <span className="mx-2">to</span>
            <input
              type="date"
              className="border-none focus:outline-none bg-white text-black px-2"
              placeholder="End date"
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
              placeholder="Search"
            />
          </div>
          <Button
            className="border border-blue-500 text-blue-500 bg-transparent"
            onClick={() => setFilterModalOpen(true)}
          >
            <CloudUpload className="mr-2 h-5 w-5" />
            Filter
          </Button>
          <Button
            className="bg-[#4588B2] text-white"
            onClick={() => setExportModalOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Export
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={activityLogs.slice(
          (currentPage - 1) * entriesPerPage,
          currentPage * entriesPerPage
        )}
        getRowKey={getRowKey}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(activityLogs.length / entriesPerPage)}
        onPageChange={handlePageChange}
      />

      {isFilterModalOpen && (
        <Modal onClose={() => setFilterModalOpen(false)}>
          <form>
            <FormHeader title="Filter" onClose={() => setFilterModalOpen(false)} />
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setFilterModalOpen(false)} className="bg-gray-500 text-white">
                Cancel
              </Button>
              <Button type="submit" className="bg-[#4588B2] text-white">
                Apply
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {isExportModalOpen && (
        <Modal onClose={() => setExportModalOpen(false)}>
          <form onSubmit={() => console.log("Export")}>
            <FormHeader title="Export" onClose={() => setExportModalOpen(false)} />
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setExportModalOpen(false)} className="bg-gray-500 text-white">
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