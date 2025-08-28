import { useEffect, useState, useCallback } from "react";
import { Search, Download } from "lucide-react";
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
import { formatDateTime } from "@/utils/formatters";

export default function DataAlertPage() {
  interface DataEntry {
    id: string;
    gps_location: {
      type: string;
      coordinates: number[];
    };
    gsm_location: {
      type: string;
      coordinates: number[];
    };
    gps_timestamp: string;
    gsm_timestamp: string;
    rtc_timestamp: string;
    factory: string;
    factory_name: string;
    factory_location: string;
    region: string | null;
    state: string;
    device_id: string;
    company_id:string;
    interrupt_type: string;
    interrupt_types: string;
    enclosure: string;
    calib_switch: string;
    sd_card_available: boolean;
    current_gps_timeout_ms: number;
    current_sleep_time_min: number;
    peripherals_turned_off: boolean;
    battery_voltage: number;
    rtc_datetime: number;
    gps_lat: string;
    gps_lon: string;
    gsm_lat: string;
    gsm_lon: string;
    gps_datetime: string;
    gsm_datetime: string;
    createdAt: string;
    updatedAt: string;
    gsm_map_url: string;
    gps_map_url: string;
    alert_severity: "low" | "medium" | "high";
    alert_timestamp: string;
    resolved: boolean;
  }

  const [data, setData] = useState<DataEntry[]>([]);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Define interfaces for type safety
  interface SearchFilters {
    device_id?: string;
    company_id?:string,
    interrupt_type?: string;
    alert_severity?: "low" | "medium" | "high";
    resolved?: boolean;
    start_date?: string;
    end_date?: string;
    search_term?: string;
  }

  interface ApiParams extends Omit<SearchFilters, "search_term"> {
    page: number;
    limit: number;
    search?: string; // maps from search_term
  }

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);

      // Prepare API parameters
      const apiParams: ApiParams = {
        page: currentPage,
        limit: entriesPerPage,
      };

      // Add search filters if they have values
      if (searchFilters.device_id)
        apiParams.device_id = searchFilters.device_id;
      if (searchFilters.interrupt_type)
        apiParams.interrupt_type = searchFilters.interrupt_type;
      if (searchFilters.alert_severity)
        apiParams.alert_severity = searchFilters.alert_severity;
      if (searchFilters.resolved !== undefined)
        apiParams.resolved = searchFilters.resolved;

      // Handle search term if provided - extract it from searchFilters to avoid TypeScript errors
      const { search_term } = searchFilters;
      if (search_term && search_term.trim() !== "") {
        apiParams.search = search_term.trim();
        console.log("Search term applied:", apiParams.search);
      }

      // Handle date filtering
      if (searchFilters.start_date || searchFilters.end_date) {
        // Ensure dates are properly formatted as strings
        if (searchFilters.start_date) {
          // Make sure start_date is a string in YYYY-MM-DD format
          apiParams.start_date = String(searchFilters.start_date);
        }

        if (searchFilters.end_date) {
          // Make sure end_date is a string in YYYY-MM-DD format
          apiParams.end_date = String(searchFilters.end_date);
        }

        // If only start_date is provided, set end_date to today
        if (searchFilters.start_date && !searchFilters.end_date) {
          apiParams.end_date = new Date().toISOString().split("T")[0];
        }
        // If only end_date is provided, set start_date to 30 days before
        else if (!searchFilters.start_date && searchFilters.end_date) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          apiParams.start_date = thirtyDaysAgo.toISOString().split("T")[0];
        }
      }

      const response = await apiClient.get("/data/alerts/", {
        params: apiParams,
      });

      if (!response.data || typeof response.data !== "object") {
        throw new Error("Invalid response format");
      }

      // Handle both array and paginated response formats
      const dataArray = Array.isArray(response.data)
        ? response.data
        : response.data.docs || response.data.results?.docs;

      if (!Array.isArray(dataArray)) {
        throw new Error("Invalid data format received");
      }

      setData(dataArray);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    entriesPerPage,
    searchFilters,
    setData,
    setError,
    setLoading,
  ]);

  // Export functionality
  const exportToCSV = () => {
    if (!data.length) return;

    const headers = [
      "company_id",
      "State",
      "Interrupt Type",
      "Enclosure",
      "Calib Switch",
      "Device ID",
      "SD Card",
      "Battery Voltage",
      "GPS Timestamp",
      "GSM Timestamp",
      "RTC Timestamp",
      "GPS Location",
      "GSM Location",
      "Factory",
      "Location",
      "Region",
      "Severity",
      "Status",
      "Created At",
    ];

    const csvData = data.map((row) => [
      row.device_id,
      row.state?.toUpperCase(),
      row.interrupt_type,
      row.enclosure,
      row.calib_switch,
      row.company_id,
      `${row.sd_card_available ? "Available" : "Not Available"} (${
        row.sd_card_available ? "Saved" : "Not Saved"
      })`,
      `${row.battery_voltage}V`,
      formatDateTime(row.gps_timestamp),
      formatDateTime(row.gsm_timestamp),
      formatDateTime(row.rtc_timestamp),
      row.gps_location?.coordinates.length
        ? `${row.gps_location.coordinates[1]}, ${row.gps_location.coordinates[0]}`
        : "N/A",
      row.gsm_location?.coordinates.length
        ? `${row.gsm_location.coordinates[1]}, ${row.gsm_location.coordinates[0]}`
        : "N/A",
      row.factory_name || "N/A",
      row.factory_location || "N/A",
      row.region || "N/A",
      row.alert_severity?.toUpperCase() || "N/A",
      row.resolved ? "Resolved" : "Pending",
      formatDateTime(row.createdAt),
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
      `alerts_export_${new Date().toISOString()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add a separate effect to trigger data fetching when search filters change
  useEffect(() => {
    console.log("Search filters changed:", searchFilters);
    fetchData();
  }, [searchFilters, fetchData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  type Column<T> = {
    header: string;
    accessor: keyof T;
    render?: (row: T) => JSX.Element;
  };

  const columns: Column<DataEntry>[] = [
    {
      header: "Alert Info",
      accessor: "interrupt_type",
      render: (row: DataEntry) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold capitalize">
            {row.interrupt_type || "N/A"}
          </span>
          <span className={`text-sm ${getSeverityColor(row.alert_severity)}`}>
            {row.alert_severity?.toUpperCase() || "N/A"}
          </span>
          <span className="text-sm text-gray-500">
            {formatDateTime(row.alert_timestamp || row.createdAt)}
          </span>
        </div>
      ),
    },
    {
      header: "Company ID",
      accessor: "company_id",
      render: (row: DataEntry) => (
        <div className="flex flex-col gap-1">
          <span>{row?.company_id ? row.company_id.slice(-6) : "N/A"}</span>
          <span className="text-sm text-gray-500">
            {row.factory_name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      header: "State",
      accessor: "state",
      render: (row: DataEntry) => (
        <span
          className={row.state === "on" ? "text-green-600" : "text-red-600"}
        >
          {row.state?.toUpperCase()}
        </span>
      ),
    },
    {
      header: "Device Status",
      accessor: "enclosure",
      render: (row: DataEntry) => (
        <div className="flex flex-col gap-1 text-sm">
          <div>
            <span className="font-semibold">Enclosure:</span>{" "}
            <span className="capitalize">{row.enclosure || "N/A"}</span>
          </div>
          <div>
            <span className="font-semibold">Calib:</span>{" "}
            <span className="capitalize">{row.calib_switch || "N/A"}</span>
          </div>
          <div>
            <span className="font-semibold">SD Card:</span>{" "}
            {row?.sd_card_available ? "Available" : "Not Available"}
            {row?.sd_card_available !== undefined && (
              <span className="text-gray-500">
                {" "}
                ({row.sd_card_available ? "Saved" : "Not Saved"})
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Device ID",
      accessor: "device_id",
      render: (row: DataEntry) => (
        <div className="flex flex-col gap-1">
          <span>{row?.device_id ? row.device_id.slice(-6) : "N/A"}</span>
          <span className="text-sm text-gray-500">
            {row.factory_name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      header: "Battery",
      accessor: "battery_voltage",
      render: (row: DataEntry) => {
        if (row?.battery_voltage === undefined) return <span>N/A</span>;

        const isLowBattery = row.battery_voltage < 3.45;
        return (
          <span
            className={`${isLowBattery ? "text-red-600 animate-pulse" : ""}`}
          >
            {row.battery_voltage?.toFixed(2)} V
          </span>
        );
      },
    },
    {
      header: "Location",
      accessor: "gps_location",
      render: (row: DataEntry) => (
        <div className="flex flex-col gap-1">
          <div className="text-sm">
            <span className="font-semibold">GPS:</span>{" "}
            {row.gps_location?.coordinates[1]?.toFixed(6) || "N/A"},
            {row.gps_location?.coordinates[0]?.toFixed(6) || "N/A"}
            {row.gps_map_url && (
              <Button
                variant="outline"
                size="sm"
                className="text-white border-[#4588B2] ml-2"
                onClick={() => window.open(row.gps_map_url, "_blank")}
              >
                Map
              </Button>
            )}
          </div>
          <div className="text-sm">
            <span className="font-semibold">GSM:</span>{" "}
            {row.gsm_location?.coordinates[1]?.toFixed(6) || "N/A"},
            {row.gsm_location?.coordinates[0]?.toFixed(6) || "N/A"}
            {row.gsm_map_url && (
              <Button
                variant="outline"
                size="sm"
                className="text-white border-[#4588B2] ml-2"
                onClick={() => window.open(row.gsm_map_url, "_blank")}
              >
                Map
              </Button>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Timestamps",
      accessor: "createdAt",
      render: (row: DataEntry) => (
        <div className="flex flex-col gap-1 text-sm">
          <div>
            <span className="font-semibold">Alert:</span>{" "}
            {formatDateTime(row.alert_timestamp || row.createdAt)}
          </div>
          <div>
            <span className="font-semibold">GPS:</span>{" "}
            {formatDateTime(row.gps_timestamp)}
          </div>
          <div>
            <span className="font-semibold">GSM:</span>{" "}
            {formatDateTime(row.gsm_timestamp)}
          </div>
          <div>
            <span className="font-semibold">RTC:</span>{" "}
            {formatDateTime(row.rtc_timestamp)}
          </div>
        </div>
      ),
    },
  ];

  const getRowKey = (row: DataEntry) => row.id;

  const getSeverityColor = (severity?: "low" | "medium" | "high") => {
    switch (severity) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-orange-600";
      case "low":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          Data Alerts <br />
          <span className="font-normal">all alert entries</span>
        </h1>
        <div className="flex items-center space-x-4">
          <Button
            onClick={exportToCSV}
            className="bg-[#4588B2] text-white"
            disabled={data.length === 0}
          >
            <Download className="mr-2 h-5 w-5" />
            Export CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="border border-gray-300 text-black bg-white">
                {entriesPerPage} per page
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border border-gray-300">
              {[10, 25, 50, 100].map((value) => (
                <DropdownMenuItem
                  key={value}
                  onSelect={() => setEntriesPerPage(value)}
                  className="text-black"
                >
                  {value} per page
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Device ID</label>
            <input
              type="text"
              placeholder="Enter Device ID"
              className="border rounded p-2 text-black w-40"
              value={searchFilters.device_id || ""}
              onChange={(e) =>
                setSearchFilters((prev) => ({
                  ...prev,
                  device_id: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Alert Type</label>
            <select
              className="border rounded p-2 text-black w-40"
              value={searchFilters.interrupt_type || ""}
              onChange={(e) =>
                setSearchFilters((prev) => ({
                  ...prev,
                  interrupt_type: e.target.value,
                }))
              }
            >
              <option value="">All Types</option>
              <option value="status">Status</option>
              <option value="alert">Alert</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Filter by Date</label>
            <div className="flex items-center space-x-2">
              <div className="flex flex-col">
                {/* <label className="text-xs text-gray-500">From</label> */}
                <input
                  type="date"
                  className="border rounded p-2 text-black w-40"
                  value={searchFilters.start_date || ""}
                  onChange={(e) => {
                    const startDate = e.target.value;
                    // Only update if a valid date is selected
                    if (startDate) {
                      setSearchFilters((prev) => ({
                        ...prev,
                        start_date: startDate,
                        // If end date is before start date, update it
                        end_date:
                          prev.end_date && prev.end_date < startDate
                            ? startDate
                            : prev.end_date,
                      }));
                    } else {
                      // Clear start date if input is empty
                      setSearchFilters((prev) => ({
                        ...prev,
                        start_date: undefined,
                      }));
                    }
                  }}
                  max={
                    searchFilters.end_date ||
                    new Date().toISOString().split("T")[0]
                  }
                />
              </div>
              <div className="flex flex-col">
                {/* <label className="text-xs text-gray-500">To</label> */}
                <input
                  type="date"
                  className="border rounded p-2 text-black w-40"
                  value={searchFilters.end_date || ""}
                  onChange={(e) => {
                    const endDate = e.target.value;
                    // Only update if a valid date is selected
                    if (endDate) {
                      setSearchFilters((prev) => ({
                        ...prev,
                        end_date: endDate,
                        // If start date is after end date, update it
                        start_date:
                          prev.start_date && prev.start_date > endDate
                            ? endDate
                            : prev.start_date,
                      }));
                    } else {
                      // Clear end date if input is empty
                      setSearchFilters((prev) => ({
                        ...prev,
                        end_date: undefined,
                      }));
                    }
                  }}
                  min={searchFilters.start_date}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          </div>
          {/* <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Alert Severity</label>
            <select
              className="border rounded p-2 text-black w-40"
              value={searchFilters.alert_severity || ''}
              onChange={(e) => setSearchFilters(prev => ({
                ...prev,
                alert_severity: e.target.value as 'low' | 'medium' | 'high' | undefined
              }))}
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div> */}

          {/* <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Status</label>
            <select
              className="border rounded p-2 text-black w-40"
              value={searchFilters.resolved?.toString() || ''}
              onChange={(e) => setSearchFilters(prev => ({
                ...prev,
                resolved: e.target.value === '' ? undefined : e.target.value === 'true'
              }))}
            >
              <option value="">All Statuses</option>
              <option value="true">Resolved</option>
              <option value="false">Pending</option>
            </select>
          </div> */}

          <div className="flex flex-col">
            {/* <label className="text-sm text-gray-600 mb-1">Search</label> */}
            <div className="relative rounded-md shadow-xs mt-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="border rounded p-2 pl-10 w-64 text-black"
                placeholder="Search by any term"
                value={searchFilters.search_term || ""}
                onChange={(e) =>
                  setSearchFilters((prev) => ({
                    ...prev,
                    search_term: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col justify-end h-full mt-6">
            <Button
              className="bg-[#4588B2] text-white mt-0"
              onClick={() => setSearchFilters({})}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <DataTable
          columns={columns}
          data={data.slice(
            (currentPage - 1) * entriesPerPage,
            currentPage * entriesPerPage
          )}
          getRowKey={getRowKey}
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(data.length / entriesPerPage)}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
