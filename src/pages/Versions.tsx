import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { useNavigate } from "react-router";

interface VersionInfo {
  module: string;
  version: string;
  lastUpdated: string;
}

const versionData: VersionInfo[] = [
  { module: "Software", version: "BWS-S.1.0.0", lastUpdated: "2025-06-01" },
  { module: "LP Firmware", version: "LP-F.1.0.0", lastUpdated: "2025-06-01" },
  { module: "HTR Firmware", version: "HTR-F.1.0.0", lastUpdated: "2025-06-01" },
  // Future modules can be added here
];

const columns = [
  { header: "Module", accessor: "module" as keyof VersionInfo },
  { header: "Version", accessor: "version" as keyof VersionInfo },
  { header: "Last Updated", accessor: "lastUpdated" as keyof VersionInfo },
];

const getRowKey = (row: VersionInfo) => row.module;

const Versions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 px-6 py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Version Information</h1>
          <p className="text-sm text-gray-800">All current module versions</p>
        </div>
        <Button
          variant="ghost"
          className="flex items-center space-x-2 border border-gray-300 text-black bg-white hover:bg-gray-100"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={versionData}
        getRowKey={getRowKey}
      />
    </div>
  );
};

export default Versions;
