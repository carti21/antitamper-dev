import { useEffect, useState, useMemo } from "react";
import { Search, Download, InfoIcon, Loader } from "lucide-react";
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
import { Box, Typography } from "@mui/material";
import { useDebounce } from "use-debounce";

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
    scale_model: string;
    company_id: string;
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
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

  // Define interfaces for type safety
  interface SearchFilters {
    company_id?: string;
    interrupt_types?: string;
    alert_severity?: "low" | "medium" | "high";
    resolved?: boolean;
    start_datetime?: string;
    end_datetime?: string;
    search_term?: string;
    state?: string;
  }

  interface ApiParams extends Omit<SearchFilters, "search_term"> {
    page: number;
    limit: number;
    search_term?: string; // maps from search_term
  }

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [companyIdInput, setCompanyIdInput] = useState("");
  const [inputValue, setInputValue] = useState("");

  // Combine companyIdInput into filters, memoized
  const memoizedFilters = useMemo(() => {
    return {
      ...searchFilters,
      company_id: companyIdInput.toUpperCase().trim(),
    };
  }, [searchFilters, companyIdInput]);

  // Debounce filters
  const [debouncedFilters] = useDebounce(memoizedFilters, 1000);

  // Effect to fetch data based on debounced filters
  useEffect(() => {
    const fetchData = async (
      page: number = currentPage,
      limit: number = entriesPerPage
    ) => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found");
        setAuthToken(token);

        const apiParams: ApiParams = {
          page,
          limit,
        };

        if (debouncedFilters.interrupt_types)
          apiParams.interrupt_types = debouncedFilters.interrupt_types;
        if (debouncedFilters.state) apiParams.state = debouncedFilters.state;
        if (debouncedFilters.alert_severity)
          apiParams.alert_severity = debouncedFilters.alert_severity;
        if (debouncedFilters.resolved !== undefined)
          apiParams.resolved = debouncedFilters.resolved;

        const { search_term, company_id } = debouncedFilters;
        if (company_id) {
          const deviceId = company_id.trim();
          apiParams.company_id = deviceId;
        } 
        if (search_term && search_term.trim() !== "") {
          apiParams.search_term = search_term.trim();
        }

        if (debouncedFilters.start_datetime || debouncedFilters.end_datetime) {
          if (debouncedFilters.start_datetime) {
            apiParams.start_datetime = String(debouncedFilters.start_datetime);
          }
          if (debouncedFilters.end_datetime) {
            apiParams.end_datetime = String(debouncedFilters.end_datetime);
          }

          if (
            debouncedFilters.start_datetime &&
            !debouncedFilters.end_datetime
          ) {
            apiParams.end_datetime = new Date().toISOString().split("T")[0];
          } else if (
            !debouncedFilters.start_datetime &&
            debouncedFilters.end_datetime
          ) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            apiParams.start_datetime = thirtyDaysAgo
              .toISOString()
              .split("T")[0];
          }
        }

        const response = await apiClient.get("/data/alerts/", {
          params: apiParams,
        });

        if (!response.data || typeof response.data !== "object") {
          throw new Error("Invalid response format");
        }

        const { docs: dataArray, totalPages: totalPagesFromApi } =
          response.data.results;

        if (!Array.isArray(dataArray)) {
          throw new Error("Invalid data format received");
        }

        setData(dataArray);
        setTotalPages(totalPagesFromApi || 1);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedFilters, currentPage, entriesPerPage]);

  const handleSearch = () => {
    setSearchFilters((prev) => ({
      ...prev,
      search_term: inputValue.trim(),
    }));
  };

  const fetchAllDataForExport = async (): Promise<DataEntry[]> => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No token");

      setAuthToken(token);

      let allResults: DataEntry[] = [];
      let currentPage = 1;
      const pageSize = 100; // match your backend limit
      let totalPages = 1;
      let hasMoreData = true;

      while (hasMoreData && currentPage <= totalPages) {
        const apiParams: ApiParams = {
          ...searchFilters,
          search_term: searchFilters.search_term,
          limit: pageSize,
          page: currentPage,
        };

        const response = await apiClient.get("/data/alerts/", {
          params: apiParams,
        });
        const responseData = response.data.results;

        // Handle different possible response structures
        const docs = responseData?.docs || responseData?.data || [];
        const apiTotalPages =
          responseData?.totalPages || responseData?.total_pages || 1;
        const totalCount =
          responseData?.totalCount || responseData?.total_count || 0;

        if (!Array.isArray(docs)) {
          console.error("Invalid docs format on page", currentPage);
          break;
        }

        // If no docs returned, we've reached the end
        if (docs.length === 0) {
          console.log("No more data available");
          hasMoreData = false;
          break;
        }

        allResults = allResults.concat(docs);
        console.log(
          `Added ${docs.length} entries. Total so far: ${allResults.length}`
        );

        // Update total pages from API response (only on first request)
        if (currentPage === 1) {
          totalPages = apiTotalPages;
          console.log(`Total pages to fetch: ${totalPages}`);
          console.log(`Expected total records: ${totalCount}`);
        }

        // Check if we've reached the end
        if (docs.length < pageSize || currentPage >= totalPages) {
          hasMoreData = false;
          console.log("Reached end of data");
        }

        currentPage++;

        // Add a small delay to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(
        `Export complete. Total entries fetched: ${allResults.length}`
      );
      return allResults;
    } catch (err) {
      console.error("Export fetch failed", err);
      throw err; // Re-throw to handle in exportToCSV
    }
  };

  // Export functionality
  const exportToCSV = async () => {
    try {
      setExporting(true);
      const allData = await fetchAllDataForExport();
      if (!allData.length) return;

      const headers = [
        "Scale ID",
        "Scale Model",
        "State",
        "Interrupt Type",
        "Enclosure",
        "Calib Switch",
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

      const csvData = allData.map((row) => [
        row.company_id,
        row.state?.toUpperCase(),
        row?.scale_model,
        row.interrupt_types,
        row.enclosure,
        row.calib_switch,
        `${row.sd_card_available === true ? "Available" : "Not Available"} (${
          row.sd_card_available === true ? "Saved" : "Not Saved"
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
        formatDateTime(row.rtc_timestamp),
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
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when changing pages
  };

  type Column<T> = {
    header: string;
    accessor: keyof T;
    render?: (row: T) => JSX.Element;
  };

  const columns: Column<DataEntry>[] = [
    {
      header: "Alert Info",
      accessor: "interrupt_types",
      render: (row: DataEntry) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold capitalize">
            {row.interrupt_types || "N/A"}
          </span>

          <span className="text-sm text-gray-500">
            {formatDateTime(row.alert_timestamp || row.rtc_timestamp)}
          </span>
        </div>
      ),
    },
    {
      header: "Scale / Factory ID",
      accessor: "company_id",
      render: (row: DataEntry) => (
        <div className="flex flex-col gap-1">
          <span>{row?.company_id ? row.company_id : "N/A"}</span>
          <span className="text-sm text-gray-500">
            {row.factory_name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      header: "Scale model",
      accessor: "scale_model",
      render: (row: DataEntry) => (
        <div className="flex flex-col gap-1">
          <h6>{row?.scale_model ? row.scale_model : "N/A"}</h6>
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
      header: "Scale Status",
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
            {formatDateTime(row.alert_timestamp || row.rtc_timestamp)}
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
  const handleRefresh = () => {
    setSearchFilters({});
    setCompanyIdInput("");
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

  if (!loading && (!data || data.length === 0)) {
    return (
      <Box className="flex flex-col items-center justify-center text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-md p-6">
        <InfoIcon fontSize="large" className="mb-2 text-blue-400" />
        <Typography variant="h6" className="mb-1">
          No Data Available
        </Typography>
        <Typography variant="body2">
          There are is no data to show right now.
        </Typography>
        <div className="flex gap-4">
          <Button onClick={handleRefresh} className="bg-[#4588B2] text-white">
            Clear Filters & Refresh
          </Button>
        </div>
      </Box>
    );
  }

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
            disabled={exporting || data.length === 0}
          >
            {exporting ? (
              <>
                <Loader className="mr-2 h-5 w-5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Export CSV
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* <Button className="border border-gray-300 text-black bg-white">
                {entriesPerPage} per page
              </Button> */}
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
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Scale ID"
              className="border rounded p-2 text-black "
              value={companyIdInput}
              onChange={(e) => setCompanyIdInput(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Alert Type</label>
            <select
              className="border rounded p-2 text-black w-40"
              value={searchFilters.interrupt_types || ""}
              onChange={(e) =>
                setSearchFilters((prev) => ({
                  ...prev,
                  interrupt_types: e.target.value,
                }))
              }
            >
              <option value="">All Types</option>
              <option value="state">State</option>
              <option value="status">Status</option>
              <option value="enclosure">Enclosure</option>
              <option value="calibration switch">Calibration Switch</option>
              <option value="battery_voltage">battery voltage</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">State</label>
            <select
              className="border rounded p-2 text-black"
              value={searchFilters.state || ""}
              onChange={(e) =>
                setSearchFilters((prev) => ({
                  ...prev,
                  state: e.target.value,
                }))
              }
            >
              <option value="">All States</option>
              <option value="on">ON</option>
              <option value="off">OFF</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Filter by Date</label>
            <div className="flex items-center">
              <div className="flex flex-col">
                {/* <label className="text-xs text-gray-500">From</label> */}
                <input
                  type="date"
                  className="border rounded p-2 text-black w-40"
                  value={searchFilters.start_datetime || ""}
                  onChange={(e) => {
                    const startDate = e.target.value;
                    // Only update if a valid date is selected
                    if (startDate) {
                      setSearchFilters((prev) => ({
                        ...prev,
                        start_datetime: startDate,
                        // If end date is before start date, update it
                        end_datetime:
                          prev.end_datetime && prev.end_datetime < startDate
                            ? startDate
                            : prev.end_datetime,
                      }));
                    } else {
                      // Clear start date if input is empty
                      setSearchFilters((prev) => ({
                        ...prev,
                        start_datetime: undefined,
                      }));
                    }
                  }}
                  max={
                    searchFilters.end_datetime ||
                    new Date().toISOString().split("T")[0]
                  }
                />
              </div>
              <div className="flex flex-col">
                {/* <label className="text-xs text-gray-500">To</label> */}
                <input
                  type="date"
                  className="border rounded p-2 text-black w-40"
                  value={searchFilters.end_datetime || ""}
                  onChange={(e) => {
                    const endDate = e.target.value;
                    // Only update if a valid date is selected
                    if (endDate) {
                      setSearchFilters((prev) => ({
                        ...prev,
                        end_datetime: endDate,
                        // If start date is after end date, update it
                        start_datetime:
                          prev.start_datetime && prev.start_datetime > endDate
                            ? endDate
                            : prev.start_datetime,
                      }));
                    } else {
                      // Clear end date if input is empty
                      setSearchFilters((prev) => ({
                        ...prev,
                        end_datetime: undefined,
                      }));
                    }
                  }}
                  min={searchFilters.start_datetime}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center  justify-between max-lg:flex-col max-lg:items-start">
            <div className="flex items-center  justify-between">
              {" "}
              <input
                type="text"
                className="border rounded p-2 pl-10 w-64 text-black"
                placeholder="Search by any term"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Button
                onClick={handleSearch}
                className="bg-[#4588B2] text-white ml-2"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col justify-end h-full ml-2 max-lg:mt-2">
              <Button
                className="bg-[#4588B2] text-white mt-0"
                onClick={() => setSearchFilters({})}
              >
                Clear Filters
              </Button>
            </div>{" "}
          </div>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <DataTable columns={columns} data={data} getRowKey={getRowKey} />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
