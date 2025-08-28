import React, { useState, useEffect } from "react";
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
import { Search, Download, InfoIcon } from "lucide-react";
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

export default function NationalFactoriesPage() {
  interface Factory {
    id: string;
    name: string;
    location: string;
    region: string;
    createdAt?: string;
    updatedAt?: string;
  }

  const [factories, setFactories] = useState<Factory[]>([]);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRegion, setSearchRegion] = useState("");

  const fetchFactories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);

      const response = await apiClient.get("/factories/");
      if (
        response.data.success &&
        response.data.results?.docs &&
        Array.isArray(response.data.results.docs)
      ) {
        setFactories(response.data.results.docs);
      } else {
        console.error("Unexpected API response:", response.data);
        setError("Failed to fetch factories. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching factories:", error);
      setError("Failed to fetch factories. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactories();
  }, []);

  // Extract unique regions from factories data
  const extractRegionsFromFactories = React.useCallback(
    (factories: Factory[]) => {
      const uniqueRegions = [
        ...new Set(factories.filter((f) => f.region).map((f) => f.region)),
      ];
      return uniqueRegions;
    },
    []
  );

  // Extract regions from factories when they're loaded
  useEffect(() => {
    if (factories.length > 0 && regions.length === 0) {
      const extractedRegions = extractRegionsFromFactories(factories);
      setRegions(extractedRegions);
    }
  }, [extractRegionsFromFactories, factories, regions]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const exportToCSV = () => {
    if (!filteredFactories.length) return;

    const headers = [
      "Factory ID",
      "Factory Name",
      "Location",
      "Region",
      "Created At",
      "Last Updated",
    ];

    const csvData = filteredFactories.map((row) => [
      row.id,
      row.name,
      row.location,
      row.region || "Not Assigned",
      row.createdAt ? new Date(row.createdAt).toLocaleString() : "N/A",
      row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "N/A",
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
      `factories_export_${new Date().toISOString()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const filteredFactories = factories.filter((factory) => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = factory.name.toLowerCase().includes(searchLower);
    const locationMatch = factory.location.toLowerCase().includes(searchLower);
    const regionMatch = !searchRegion || factory.region === searchRegion;
    return (nameMatch || locationMatch) && regionMatch;
  });

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          Factories <br />
          <span className="font-normal">All factories</span>
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
          <div className="flex items-center space-x-2">
            <div className="relative rounded-md shadow-xs w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="border rounded p-2 pl-10 w-full text-black bg-white"
                placeholder="Search by name, location, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="border rounded p-2 text-black bg-white"
              value={searchRegion}
              onChange={(e) => setSearchRegion(e.target.value)}
            >
              <option value="">All Regions</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
          <Button className="bg-[#4588B2] text-white" onClick={exportToCSV}>
            <Download className="mr-2 h-5 w-5" />
            Export
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredFactories.slice(
          (currentPage - 1) * entriesPerPage,
          currentPage * entriesPerPage
        )}
        getRowKey={getRowKey}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredFactories.length / entriesPerPage)}
        onPageChange={handlePageChange}
      />

      {isFilterModalOpen && (
        <Modal title="" onClose={() => setFilterModalOpen(false)}>
          <form>
            <FormHeader
              title="Filter"
              onClose={() => setFilterModalOpen(false)}
            />
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setFilterModalOpen(false)}
                className="bg-gray-500 text-white"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-[#4588B2] text-white">
                Apply
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
