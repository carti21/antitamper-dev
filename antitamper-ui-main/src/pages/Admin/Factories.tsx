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
import {
  Search,
  CloudUpload,
  Plus,
  Pencil,
  Trash2,
  Download,
  InfoIcon,
} from "lucide-react";
import BulkUploadForm from "@/components/ui/bulk-upload-form";
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

export default function FactoriesPage() {
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
  const [isBulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [isRegisterUserModalOpen, setRegisterFactoryModalOpen] =
    useState(false);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedFactory, setSelectedFactory] = useState<Factory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [factoryName, setFactoryName] = useState("");
  const [factoryLocation, setFactoryLocation] = useState("");
  const [factoryRegion, setFactoryRegion] = useState("");
  const [error, setError] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRegion, setSearchRegion] = useState("");

  // Function to fetch factories data - can be called after updates
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

  // Fetch factories on component mount
  useEffect(() => {
    fetchFactories();
  }, []);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found");

        setAuthToken(token);

        const response = await apiClient.get("/regions/");
        if (response.data.success && Array.isArray(response.data.results)) {
          setRegions(response.data.results);
        } else {
          console.error("Unexpected API response:", response.data);
          setError("Failed to fetch regions. Please try again later.");
        }
      } catch (error) {
        console.error("Error fetching regions:", error);
        setError("Failed to fetch regions. Please check your connection.");
      }
    };

    fetchRegions();
  }, []);

  const handleRegisterUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newFactory = {
      name: factoryName,
      location: factoryLocation,
      region: factoryRegion,
    };

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);

      await apiClient.post("/factories/", newFactory);

      // Refresh factories data after adding a new factory
      await fetchFactories();
      setRegisterFactoryModalOpen(false);

      // Clear form fields
      setFactoryName("");
      setFactoryLocation("");
      setFactoryRegion("");
    } catch (error) {
      console.error("Error registering factory:", error);
      setError("Failed to register factory.");
    }
  };

  const handleUpdateFactory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFactory) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);

      const updatedFactory = {
        id: selectedFactory.id, // Include the ID in the request body
        name: selectedFactory.name,
        location: selectedFactory.location,
        region: selectedFactory.region,
      };

      // Update the endpoint to match the API structure
      await apiClient.patch(`/factories/update/`, updatedFactory);

      // Refresh factories data after update
      await fetchFactories();

      setUpdateModalOpen(false);
      setSelectedFactory(null);
    } catch (error) {
      console.error("Error updating factory:", error);
      setError("Failed to update factory.");
    }
  };

  const handleDeleteFactory = async (factoryId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);

      await apiClient.delete("/factories/remove/", { data: { id: factoryId } });

      // Refresh factories data after deletion
      await fetchFactories();
    } catch (error) {
      console.error("Error deleting factory:", error);
      setError("Failed to delete factory.");
    }
  };

  const openUpdateModal = (factory: Factory) => {
    setSelectedFactory(factory);
    setUpdateModalOpen(true);
  };

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
    {
      header: "Actions",
      accessor: "id" as keyof Factory,
      render: (row: Factory) => (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => openUpdateModal(row)}
            className="flex items-center gap-1 px-3 py-1 bg-[#4588B2] hover:bg-blue-600 text-white rounded-md"
            title="Update Factory"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            onClick={() => handleDeleteFactory(row.id)}
            className="flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md"
            title="Delete Factory"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
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
          No Factories Available
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
        <div className="flex space-x-2">
          <Button
            className="border border-[#4588B2] text-[#4588B2] bg-transparent"
            onClick={() => setBulkUploadModalOpen(true)}
          >
            <CloudUpload className="mr-2 h-5 w-5" />
            Bulk Upload
          </Button>
          <Button
            className="bg-[#4588B2] text-white"
            onClick={() => setRegisterFactoryModalOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Register Factory
          </Button>
        </div>
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
      {isBulkUploadModalOpen && (
        <Modal title="" onClose={() => setBulkUploadModalOpen(false)}>
          <BulkUploadForm
            onSubmit={(e) => {
              e.preventDefault();
              console.log("Bulk Upload");
            }}
            onClose={() => setBulkUploadModalOpen(false)}
            title="Bulk Upload Factories"
            acceptFileTypes=".csv, .xlsx"
          />
        </Modal>
      )}

      {isRegisterUserModalOpen && (
        <Modal title="" onClose={() => setRegisterFactoryModalOpen(false)}>
          <form onSubmit={handleRegisterUserSubmit}>
            <FormHeader
              title="Register Factory"
              onClose={() => setRegisterFactoryModalOpen(false)}
            />
            <input
              type="text"
              className="border rounded p-2 w-full"
              placeholder="Name"
              value={factoryName}
              onChange={(e) => setFactoryName(e.target.value)}
            />
            <input
              type="text"
              className="border rounded p-2 w-full"
              placeholder="Location"
              value={factoryLocation}
              onChange={(e) => setFactoryLocation(e.target.value)}
            />
            <select
              className="border rounded p-2 w-full"
              value={factoryRegion}
              onChange={(e) => setFactoryRegion(e.target.value)}
            >
              <option value="">Select Region</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setRegisterFactoryModalOpen(false)}
                className="bg-gray-500 text-white"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-[#4588B2] text-white">
                Register
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {isUpdateModalOpen && selectedFactory && (
        <Modal title="" onClose={() => setUpdateModalOpen(false)}>
          <form onSubmit={handleUpdateFactory} className="space-y-4">
            <FormHeader
              title="Update Factory"
              onClose={() => setUpdateModalOpen(false)}
            />

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                className="border rounded p-2 w-full"
                placeholder="Factory Name"
                value={selectedFactory.name}
                onChange={(e) =>
                  setSelectedFactory({
                    ...selectedFactory,
                    name: e.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                className="border rounded p-2 w-full"
                placeholder="Factory Location"
                value={selectedFactory.location}
                onChange={(e) =>
                  setSelectedFactory({
                    ...selectedFactory,
                    location: e.target.value,
                  })
                }
                required
              />

              <select
                className="border rounded p-2 w-full"
                value={selectedFactory.region}
                onChange={(e) =>
                  setSelectedFactory({
                    ...selectedFactory,
                    region: e.target.value,
                  })
                }
                required
              >
                <option value="">Select Region</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                type="button"
                onClick={() => setUpdateModalOpen(false)}
                className="bg-gray-500 text-white"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-[#4588B2] text-white">
                Update Factory
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
