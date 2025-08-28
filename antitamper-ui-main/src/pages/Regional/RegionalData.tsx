import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { Download, InfoIcon, FilterX, Loader } from "lucide-react";
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

export default function DataPage() {
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
    company_id: string;
    scale_model: string;
    enclosure: string;
    calib_switch: string;
    sd_card_available: boolean;
    current_gps_timeout_ms: number;
    current_sleep_time_min: number;
    peripherals_turned_off: boolean;
    battery_voltage: number;
    rtc_datetimetime: number;
    gps_lat: string;
    gps_lon: string;
    gsm_lat: string;
    gsm_lon: string;
    gps_datetimetime: string;
    gsm_datetimetime: string;
    createdAt: string;
    updatedAt: string;
    gsm_map_url: string;
    gps_map_url: string;
    name: string;
    created_at: string;
  }

  const [data, setData] = useState<DataEntry[]>([]);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [factoryLoading, setFactoryLoading] = useState(false);
  const [factoryError, setFactoryError] = useState("");
  const [exporting, setExporting] = useState(false);

  interface FactoryInfo {
    id: string;
    name: string;
    location: string;
    region: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }
  console.log(factoryLoading);
  const [factoryNames, setFactoryNames] = useState<FactoryInfo[]>([]);

  // Search and filter states
  interface SearchFilters {
    company_id?: string;
    state?: string;
    enclosure?: string;
    calib_switch?: string;
    sd_card_available?: "true" | "false";
    saved_to_sd?: "true" | "false";
    min_battery?: number;
    start_datetime?: string;
    end_datetime?: string;
    factory_name?: string;
    factory_location?: string;
    region?: string | null;
    search_term?: string;
  }

  // Define API parameters interface
  interface ApiParams {
    company_id?: string;
    interrupt_type?: string;
    scale_model?: string;
    state?: string;
    enclosure?: string;
    calib_switch?: string;
    sd_card_available?: "true" | "false";
    saved_to_sd?: "true" | "false";
    min_battery?: number;
    start_datetime?: string;
    end_datetime?: string;
    factory_name?: string;
    factory_location?: string;
    region?: string | null;
    search?: string;
    limit?: number;
    page?: number; // API expects 'search' parameter for general search
  }

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  const fetchAllDataForExport = async (): Promise<DataEntry[]> => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No token");

      setAuthToken(token);

      let allResults: DataEntry[] = [];
      let currentPage = 1;
      const pageSize = 100;
      let totalPages = 1;
      let hasMoreData = true;

      while (hasMoreData && currentPage <= totalPages) {
        console.log(`Fetching page ${currentPage} of ${totalPages}`);

        const apiParams: ApiParams = {
          ...searchFilters,
          search: searchFilters.search_term,
          limit: pageSize,
          page: currentPage,
        };

        const response = await apiClient.get("/data/", { params: apiParams });
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

  // Updated export function with better error handling
  const exportToCSV = async () => {
    try {
      // Show loading state
      setExporting(true);

      console.log("Starting export...");

      const allData = await fetchAllDataForExport();

      if (!allData.length) {
        alert("No data to export");
        return;
      }

      console.log(`Exporting ${allData.length} entries to CSV`);

      const headers = [
        "Scale ID",
        "Scale Model",
        "State",
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
        "Peripherals",
      ];

      const formatDateForCSV = (dateStr: string | undefined): string => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        return isNaN(date.getTime())
          ? "Invalid Date"
          : new Date(date.getTime() - date.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 19)
              .replace("T", " ");
      };

      const formatLocation = (location?: { coordinates: number[] }): string => {
        if (location?.coordinates?.length === 2) {
          const [lon, lat] = location.coordinates;
          return `${lat?.toFixed(6) || "N/A"}, ${lon?.toFixed(6) || "N/A"}`;
        }
        return "N/A";
      };

      const safeValue = (val: unknown, fallback = "N/A"): string => {
        if (
          val === undefined ||
          val === null ||
          (typeof val === "string" && val.trim() === "")
        )
          return fallback;

        return String(val);
      };

      const csvData = allData.map((row) => [
        safeValue(row.company_id),
        safeValue(row?.scale_model),
        safeValue(row.state?.toUpperCase()),
        safeValue(row.enclosure),
        safeValue(row.calib_switch),
        `${row.sd_card_available ? "Available" : "Not Available"} (${
          row.sd_card_available ? "Saved" : "Not Saved"
        })`,
        row.battery_voltage !== undefined
          ? `${row.battery_voltage.toFixed(2)} V`
          : "N/A",
        formatDateForCSV(row.gps_timestamp),
        formatDateForCSV(row.gsm_timestamp),
        formatDateForCSV(row.rtc_timestamp),
        formatLocation(row.gps_location),
        formatLocation(row.gsm_location),
        safeValue(row.factory_name),
        safeValue(row.factory_location),
        safeValue(row.region, "No Region"),
        `GPS Timeout: ${safeValue(
          row.current_gps_timeout_ms
        )}ms, Sleep: ${safeValue(row.current_sleep_time_min)}min`,
        row.peripherals_turned_off === true
          ? "Off"
          : row.peripherals_turned_off === false
          ? "On"
          : "N/A",
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map((row) =>
          row.map((cell) => `"${String(cell || "")}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `device_data_export_${new Date().toISOString().split("T")[0]}_${
          allData.length
        }_entries.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the URL object

      console.log(`Export successful: ${allData.length} entries exported`);
      alert(`Export successful! Downloaded ${allData.length} entries.`);
    } catch (error) {
      console.error("Export failed:", error);
      alert(
        "Export failed. Please try again or check the console for details."
      );
    } finally {
      setExporting(false);
    }
  };

  const [companyIdInput, setCompanyIdInput] = useState("");
  const debouncedInput = useMemo(() => {
  return {
    ...searchFilters,
    company_id: companyIdInput.toUpperCase().trim(),
  };
}, [searchFilters, companyIdInput]);

const [debouncedFilters] = useDebounce(debouncedInput, 1000);


  useEffect(() => {
    const fetchData = async (params: SearchFilters = {}) => {
      try {
        setError("");
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No authentication token found");
        }
        setAuthToken(token);

        // Create API params object
        const apiParams: ApiParams = {};

        if (params.state) apiParams.state = params.state;
        if (params.enclosure) apiParams.enclosure = params.enclosure;
        if (params.calib_switch) apiParams.calib_switch = params.calib_switch;
        if (params.saved_to_sd !== undefined)
          apiParams.saved_to_sd = params.saved_to_sd;
        if (params.sd_card_available !== undefined)
          apiParams.sd_card_available = params.sd_card_available;
        if (params.factory_name) apiParams.factory_name = params.factory_name;
        if (params.factory_location)
          apiParams.factory_location = params.factory_location;
        if (params.region) apiParams.region = params.region;

        // Handle battery filter
        if (
          typeof params.min_battery === "number" &&
          !isNaN(params.min_battery)
        ) {
          apiParams.min_battery = params.min_battery;
        }

        // Handle date filtering
        if (params.start_datetime || params.end_datetime) {
          if (params.start_datetime) {
            apiParams.start_datetime = String(params.start_datetime);
          }
          if (params.end_datetime) {
            apiParams.end_datetime = String(params.end_datetime);
          }

          // If only start_datetime is provided, set end_datetime to today
          if (params.start_datetime && !params.end_datetime) {
            apiParams.end_datetime = new Date().toISOString().split("T")[0];
          }
          // If only end_datetime is provided, set start_datetime to 30 days before
          if (!params.start_datetime && params.end_datetime) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            apiParams.start_datetime = thirtyDaysAgo
              .toISOString()
              .split("T")[0];
          }
        }

        if (params.company_id && params.company_id.trim() !== "") {
          // Only set the company_id for exact matching
          apiParams.company_id = params.company_id.trim();
          console.log("Company ID filter applied:", apiParams.company_id);
        }

        if (params.search_term && params.search_term.trim() !== "") {
          apiParams.search = params.search_term.trim();
          console.log("General search term applied:", apiParams.search);
        }

        console.log("Final API params:", apiParams);

        const response = await apiClient.get("/data/", {
          params: apiParams,
        });

        if (!response.data || typeof response.data !== "object") {
          setError("Invalid data format received");
          setLoading(false);
          return;
        }

        const dataArray = response.data.results?.docs;
        if (!dataArray || !Array.isArray(dataArray)) {
          setError("Invalid data format received");
          setLoading(false);
          return;
        }

        // If we have a battery voltage filter, ensure the data is properly filtered
        let filteredData = dataArray;
        if (
          typeof params.min_battery === "number" &&
          !isNaN(params.min_battery)
        ) {
          const minVoltage = params.min_battery;
          filteredData = dataArray.filter(
            (item) =>
              typeof item.battery_voltage === "number" &&
              !isNaN(item.battery_voltage) &&
              item.battery_voltage >= minVoltage
          );
        }

        setData(filteredData);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch data");
        setLoading(false);
      }
    };

    if (
      Object.keys(debouncedFilters).length > 0 ||
      debouncedFilters.company_id === ""
    ) {
      fetchData(debouncedFilters);
    }
  }, [debouncedFilters]);

  const handleClearFilters = () => {
    setSearchFilters({});
    setCompanyIdInput("");
  };

  const renderEmptyState = () => {
    const hasFilters = Object.values(searchFilters).some(
      (val) => val !== undefined && val !== ""
    );

    return (
      <Box className="flex flex-col items-center justify-center text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-md p-6">
        <InfoIcon fontSize="large" className="mb-2 text-blue-400" />
        <Typography variant="h6" className="mb-1">
          {hasFilters ? "No Matching Data Found" : "No Data Available"}
        </Typography>
        <Typography variant="body2" className="mb-4">
          {hasFilters
            ? "Try adjusting your filters or search criteria"
            : "There is no data to show right now."}
        </Typography>

        {hasFilters && (
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleClearFilters}
          >
            <FilterX size={16} />
            Clear All Filters
          </Button>
        )}
      </Box>
    );
  };

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
      header: "Scale ID",
      accessor: "company_id",
      render: (row: DataEntry) => (
        <span>{row?.company_id ? row.company_id : "N/A"}</span>
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
      header: "Enclosure",
      accessor: "enclosure",
      render: (row: DataEntry) => (
        <span className="capitalize">{row?.enclosure || "N/A"}</span>
      ),
    },
    {
      header: "Calib Switch",
      accessor: "calib_switch",
      render: (row: DataEntry) => (
        <span className="capitalize">{row?.calib_switch || "N/A"}</span>
      ),
    },
    {
      header: "SD Card",
      accessor: "sd_card_available",
      render: (row: DataEntry) => (
        <div className="flex flex-col">
          <span>
            {row?.sd_card_available !== undefined
              ? row.sd_card_available
                ? "Available"
                : "Not Available"
              : "N/A"}
          </span>
          <span className="text-sm text-gray-500">
            {row?.sd_card_available !== undefined
              ? row.sd_card_available
                ? "Saved"
                : "Not Saved"
              : "N/A"}
          </span>
        </div>
      ),
    },
    {
      header: "Battery Voltage",
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
      header: "Timestamps",
      accessor: "gsm_timestamp",
      render: (row: DataEntry) => (
        <div className="flex flex-col gap-1 text-sm">
          <div>
            <span className="font-semibold">GSM:</span>{" "}
            {formatDateTime(row.gsm_timestamp)}
          </div>
          <div>
            <span className="font-semibold">GPS:</span>{" "}
            {formatDateTime(row.gps_timestamp)}
          </div>
          <div>
            <span className="font-semibold">RTC:</span>{" "}
            {formatDateTime(row.rtc_timestamp)}
          </div>
        </div>
      ),
    },
    {
      header: "GPS Location",
      accessor: "gps_location",
      render: (row: DataEntry) => (
        <div className="flex flex-col gap-1">
          <div className="text-sm">
            <span className="font-semibold">Lat:</span>{" "}
            {row.gps_location?.coordinates[1] || "N/A"}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Lon:</span>{" "}
            {row.gps_location?.coordinates[0] || "N/A"}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-white border-[#4588B2] mt-1"
            onClick={() => window.open(row.gps_map_url, "_blank")}
          >
            View Map
          </Button>
        </div>
      ),
    },
    {
      header: "GSM Location",
      accessor: "gsm_location",
      render: (row: DataEntry) => (
        <div className="flex flex-col gap-1">
          <div className="text-sm">
            <span className="font-semibold">Lat:</span>{" "}
            {row.gsm_location?.coordinates[1] || "N/A"}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Lon:</span>{" "}
            {row.gsm_location?.coordinates[0] || "N/A"}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-white border-[#4588B2] mt-1"
            onClick={() => window.open(row.gsm_map_url, "_blank")}
          >
            View Map
          </Button>
        </div>
      ),
    },
    {
      header: "Factory Info",
      accessor: "factory_name",
      render: (row: DataEntry) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{row.factory_name || "N/A"}</span>
          <span className="text-sm text-gray-500">
            {row.factory_location || "N/A"}
          </span>
          <span className="text-sm text-gray-500">
            {row.region || "No Region"}
          </span>
        </div>
      ),
    },
  ];

  const getRowKey = (row: DataEntry) => row.id;

  useEffect(() => {
    const fetchFactoryNames = async () => {
      try {
        setFactoryLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found");

        setAuthToken(token);

        const response = await apiClient.get("/factories/");
        if (
          response.data.success &&
          response.data.results?.docs &&
          Array.isArray(response.data.results.docs)
        ) {
          setFactoryNames(response.data.results.docs);
        } else {
          console.error("Unexpected API response:", response.data);
          setError("Failed to fetch factories. Please try again later.");
        }
      } catch (error) {
        console.error("Error fetching factories:", error);
        setFactoryError("Failed to fetch factories. Please try again later.");
      } finally {
        setFactoryLoading(false);
      }
    };

    fetchFactoryNames();
  }, []);

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
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={handleClearFilters}
        >
          <FilterX size={16} />
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <div className="space-y-6">
      <div className="">
        <div className="">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold">
                Data <br />
                <span className="font-normal">all data entries</span>
              </h1>
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
                <div className="flex items-center space-x-2">
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
                </div>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="flex flex-col  gap-4 bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between w-3/4 max-lg:flex-col max-lg:w-11/12">
                <div className="flex items-center gap-2 max-lg:mb-2">
                  <input
                    type="text"
                    placeholder="Scale ID"
                    className="border rounded p-2 text-black flex-1"
                    value={companyIdInput}
                    onChange={(e) => setCompanyIdInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      setCompanyIdInput(e.currentTarget.value)
                    }
                  />
                </div>
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
                <select
                  className="border rounded p-2 text-black"
                  value={searchFilters.enclosure || ""}
                  onChange={(e) =>
                    setSearchFilters((prev) => ({
                      ...prev,
                      enclosure: e.target.value,
                    }))
                  }
                >
                  <option value="">All Enclosure States</option>
                  <option value="opened">Opened</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="max-md:w-full grid grid-cols-3 items-center max-md:block  w-full">
                <select
                  className="border rounded p-2 text-black w-2/3 max-lg:w-full"
                  value={searchFilters.factory_name || ""}
                  onChange={(e) =>
                    setSearchFilters((prev) => ({
                      ...prev,
                      factory_name: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">All Factories</option>
                  {factoryError ? (
                    <option disabled>{factoryError}</option>
                  ) : (
                    factoryNames.map((factory) => (
                      <option key={factory.id} value={factory.name}>
                        {factory.name}
                      </option>
                    ))
                  )}
                </select>

                <select
                  className="border rounded p-2 text-black w-2/3 max-lg:w-full max-lg:my-2"
                  value={searchFilters.sd_card_available?.toString() || ""}
                  onChange={(e) =>
                    setSearchFilters((prev) => ({
                      ...prev,
                      sd_card_available:
                        e.target.value === ""
                          ? undefined
                          : (e.target.value as "true" | "false"),
                    }))
                  }
                >
                  <option value="">All SD Card Status</option>
                  <option value="true">Available</option>
                  <option value="false">Not Available</option>
                </select>
                <select
                  className="border rounded p-2 text-black w-2/3 max-lg:w-full max-lg:mt-2"
                  value={searchFilters.saved_to_sd?.toString() || ""}
                  onChange={(e) =>
                    setSearchFilters((prev) => ({
                      ...prev,
                      saved_to_sd:
                        e.target.value === ""
                          ? undefined
                          : (e.target.value as "true" | "false"),
                    }))
                  }
                >
                  <option value="">All Save Status</option>
                  <option value="true">Saved to SD</option>
                  <option value="false">Not Saved</option>
                </select>
              </div>

              <div className="flex items-end space-x-4 max-lg:flex-col max-lg:items-baseline">
                <div className="flex flex-col">
                  {" "}
                  <label className="text-sm text-black mb-1">
                    Filter by Date Logged
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600">From</label>
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
                                prev.end_datetime &&
                                prev.end_datetime < startDate
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
                      <label className="text-xs text-gray-600">To</label>
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
                                prev.start_datetime &&
                                prev.start_datetime > endDate
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

                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  disabled={
                    !Object.values(searchFilters).some(
                      (val) => val !== undefined && val !== ""
                    )
                  }
                  className="max-sm:my-2"
                >
                  <FilterX className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <Box className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4588B2]"></div>
          <Typography variant="body1" className="mt-4 text-gray-600">
            Loading data...
          </Typography>
        </Box>
      ) : error ? (
        <Box className="flex flex-col items-center justify-center text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-md p-6">
          <InfoIcon fontSize="large" className="mb-2 text-red-400" />
          <Typography variant="h6" className="mb-1 text-red-500">
            Error Loading Data
          </Typography>
          <Typography variant="body2" className="mb-4">
            {error}
          </Typography>
          <Button
            className="bg-[#4588B2] text-white"
            onClick={handleClearFilters}
          >
            Retry
          </Button>
        </Box>
      ) : data.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data.slice(
              (currentPage - 1) * entriesPerPage,
              currentPage * entriesPerPage
            )}
            getRowKey={getRowKey}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(data.length / entriesPerPage)}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
