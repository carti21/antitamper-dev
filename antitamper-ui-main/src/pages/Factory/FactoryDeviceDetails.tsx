import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { CloudUpload, Plus, Search, Eye } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import DeactivateDeviceForm from "@/components/forms/deactivateform";
import apiClient, { setAuthToken } from "@/apiclient";

interface Device {
  id?: string;
  device_id: string;
  serial_number: string;
 scale_model: string;
  factory: string;
  status: boolean | string;
}

interface HistoryItem {
  geoLocation: string;
  date: string;
  clerkId: string;
  factory: string;
  status: string;
}

const Modal = ({
  children,
  title,
}: {
  title: string;
  children?: React.ReactNode;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </div>
  </div>
);

export default function FactoryDeviceDetails() {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<Device | null>(null);
  const [isDeactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const historyData: HistoryItem[] = [
    {
      geoLocation: "Lat, Long",
      date: "2025-01-10, 14:32:56",
      clerkId: "1021",
      factory: "Factory A",
      status: "Active",
    },
  ];

  const columns = [
    { header: "Geo Location", accessor: "geoLocation" as keyof HistoryItem },
    { header: "Date", accessor: "date" as keyof HistoryItem },
    { header: "Clerk ID", accessor: "clerkId" as keyof HistoryItem },
    { header: "Factory", accessor: "factory" as keyof HistoryItem },
    { header: "Status", accessor: "status" as keyof HistoryItem },
    {
      header: "Action",
      accessor: "action" as keyof HistoryItem,
      render: () => (
        <Button className="flex items-center space-x-1 bg-[#4588B2] text-white">
          <Eye size={16} />
          <span>Details</span>
        </Button>
      ),
    },
  ];

  useEffect(() => {
    const fetchDeviceDetails = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No authentication token found");
        }
        setAuthToken(token); // Set the token in the API client

        const response = await apiClient.get(`/devices/details/?id=${id}`);

        if (
          response.data &&
          response.data.results &&
          response.data.results.device
        ) {
          const deviceData = response.data.results.device;
          setDevice({
            device_id: deviceData.device_id,
            serial_number: deviceData.serial_number,
           scale_model:
              deviceData.scale_model ||
              deviceData.scale_model ||
              "0700000000",
            factory: deviceData.factory_name,
            status: deviceData.status === "active",
          });
          setError(null); // Clear any previous errors
        } else {
          console.error("Invalid device data structure:", response.data);
          setError("Invalid device data received from the server.");
        }
      } catch (error) {
        console.error("Error fetching device details:", error);

        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            setError("Unauthorized: Please login again.");
            navigate("/login");
          } else if (error.response?.status === 404) {
            setError("Device not found. Please check the device ID.");
            navigate("/devices");
          } else {
            setError("Failed to fetch device details. Please try again later.");
          }
        } else {
          setError("An unexpected error occurred. Please try again later.");
        }
      }
    };

    fetchDeviceDetails();
  }, [id, navigate]);

  const handleDeactivateDevice = async (reason: string) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      setAuthToken(token);

      await apiClient.delete(`/devices/${id}`);

      console.log("Device deactivated successfully. Reason:", reason);
      setDeactivateModalOpen(false);
    } catch (error) {
      console.error("Error deactivating device:", error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!device) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">
          Device <strong>{device.device_id}</strong>
          <p className="mt-4 text-sm">View Device details</p>
        </h1>
      </div>

      {/* Device Details */}
      <section className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p>
              Company ID: <strong>{device.device_id}</strong>
            </p>
            <p>Serial number: {device.serial_number}</p>
            <p>Mobile number: {device.scale_model || "0700000000"}</p>
            <p>Geo location: Lat, Long</p>
            <p>
              Device status:{" "}
              <span
                className={
                  device.status
                    ? "text-green-500 font-semibold"
                    : "text-red-500 font-semibold"
                }
              >
                {device.status ? "Active" : "Inactive"}
              </span>
            </p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-4">History</h2>
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline">Entries 10</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>10</DropdownMenuItem>
                <DropdownMenuItem>20</DropdownMenuItem>
                <DropdownMenuItem>50</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center border rounded p-2 bg-white text-black">
              <input
                type="date"
                className="border-none focus:outline-hidden bg-white text-black px-2"
                placeholder="Start date"
              />
              <span className="mx-2">to</span>
              <input
                type="date"
                className="border-none focus:outline-hidden bg-white text-black px-2"
                placeholder="End date"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative rounded-md shadow-xs w-96">
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
        <DataTable<HistoryItem>
          columns={columns}
          data={historyData.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
          )}
          getRowKey={(row) => row.date + row.clerkId}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(historyData.length / itemsPerPage)}
          onPageChange={handlePageChange}
        />
      </section>

      {isFilterModalOpen && (
        <Modal title="Filter" onClose={() => setFilterModalOpen(false)}>
          <p>Filter options will go here.</p>
        </Modal>
      )}

      {isExportModalOpen && (
        <Modal title="Export" onClose={() => setExportModalOpen(false)}>
          <p>Export options will go here.</p>
        </Modal>
      )}

      {isDeactivateModalOpen && (
        <Modal
          title="Deactivate Device"
          onClose={() => setDeactivateModalOpen(false)}
        >
          <DeactivateDeviceForm
            onClose={() => setDeactivateModalOpen(false)}
            onDeactivate={handleDeactivateDevice}
            deviceStatus={device?.status === true}
          />
        </Modal>
      )}
    </div>
  );
}
