import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { CloudUpload, Plus, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import EditFactoryForm from "@/components/forms/editfactoryform";
import DeactivateFactoryForm from "@/components/forms/deactivatefactoryform";
import apiClient, { setAuthToken } from "@/apiclient";

const Modal = ({ children }: { title: string; children?: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
      {children}
    </div>
  </div>
);

export default function FactoryDetails() {
  const { id } = useParams<{ id: string }>();
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isDeactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [factoryDetails, setFactoryDetails] = useState({
    name: "",
    location: "",
    status: "",
    contactMobile: "",
    email: "",
    contactName: "",
  });
  interface HistoryData {
    id: string;
    geoLocation: string;
    date: string;
    clerkId: string;
    factory: string;
    status: string;
    action: string;
  }

  const [historyData, setHistoryData] = useState<HistoryData[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchFactoryDetails = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found");
  
        setAuthToken(token);
  
        const [factoryResponse, historyResponse] = await Promise.all([
          apiClient.get(`/factories/${id}`),
          apiClient.get(`/factories/${id}/history`),
        ]);
  
        setFactoryDetails(factoryResponse.data);
        setHistoryData(historyResponse.data);
      } catch (error) {
        console.error("Error fetching factory details:", error);
        setError("Failed to fetch factory details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchFactoryDetails();
  }, [id]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const columns: { header: string; accessor: keyof HistoryData; render?: (row: HistoryData) => JSX.Element }[] = [
    { header: "Geo Location", accessor: "geoLocation" },
    { header: "Date", accessor: "date" },
    { header: "Clerk ID", accessor: "clerkId" },
    { header: "Factory", accessor: "factory" },
    { header: "Status", accessor: "status" },
    {
      header: "Action",
      accessor: "action",
      render: () => (
        <Button className="flex items-center space-x-1 bg-[#4588B2] text-white">
          <Eye size={16} />
          <span>Details</span>
        </Button>
      ),
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          Factory <strong>{id}</strong>
          <p className="mt-4 font-normal">View Factory details</p>
        </h1>
        <div className="flex space-x-2">
          <Button
            className="border border-red-500 text-red-500 bg-transparent"
            onClick={() => setDeactivateModalOpen(true)}
          >
            Deactivate
          </Button>
          <Button
            className="bg-[#4588B2] text-white"
            onClick={() => setEditModalOpen(true)}
          >
            Edit Factory
          </Button>
        </div>
      </div>

      <section className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p>
              Factory ID: <strong>{id}</strong>
            </p>
            <p>Name: {factoryDetails.name}</p>
            <p>Location: {factoryDetails.location}</p>
            <p>
              Factory status:{" "}
              <span className="text-green-500 font-semibold">{factoryDetails.status}</span>
            </p>
          </div>
          <div>
            <p>Contact mobile: {factoryDetails.contactMobile}</p>
            <p>Email address: {factoryDetails.email}</p>
            <p>Contact name: {factoryDetails.contactName}</p>
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
        <DataTable
          columns={columns}
          data={historyData.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
          )}
          getRowKey={(row) => row.id}
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
        <Modal title="Deactivate Factory" onClose={() => setDeactivateModalOpen(false)}>
          <DeactivateFactoryForm onClose={() => setDeactivateModalOpen(false)} />
        </Modal>
      )}

      {isEditModalOpen && (
        <Modal title="Edit Factory" onClose={() => setEditModalOpen(false)}>
          <EditFactoryForm onClose={() => setEditModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
}