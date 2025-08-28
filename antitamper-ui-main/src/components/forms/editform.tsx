import React, { useState, useEffect } from "react";
import FormHeader from "./formheader";
import apiClient, { setAuthToken } from "@/apiclient";

interface Factory {
  id: string;
  name: string;
  location: string;
}

interface Device {
  id?: string;
  device_id: string;
  serial_number: string;
  scale_model: string;
  device_sim_card_no?: string;
  factory: string;
  status: boolean | string;
  company_id?: string;
}

interface EditDeviceFormProps {
  device: Device;
  onClose: () => void;
  onSubmit: (data: Partial<Device>) => void;
}

const EditDeviceForm = ({ device, onClose, onSubmit }: EditDeviceFormProps) => {
  const [formData, setFormData] = useState<Partial<Device>>({
    id: device.id,
    device_id: device.device_id,
    serial_number: device.serial_number,
    scale_model: device.scale_model,
    device_sim_card_no: device.device_sim_card_no || "",
    factory: device.factory,
    company_id: device.company_id || "",
    status:
      typeof device.status === "boolean"
        ? device.status
          ? "active"
          : "inactive"
        : device.status,
  });
  const [factories, setFactories] = useState<Factory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFactories = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found");

        setAuthToken(token);

        const response = await apiClient.get("/factories/");

        const factoriesData =
          response.data.docs || response.data.results?.docs || response.data;

        if (Array.isArray(factoriesData)) {
          setFactories(factoriesData);

          // Find the factory ID that matches the device's factory name
          if (device.factory) {
            // Try to find the factory by name
            const matchingFactory = factoriesData.find(
              (f) =>
                f.name.toLowerCase() === device.factory.toLowerCase() ||
                f.id === device.factory
            );

            if (matchingFactory) {
              setFormData((prev) => ({
                ...prev,
                factory: matchingFactory.id,
              }));
            } else {
              console.log("No matching factory found for:", device.factory);
            }
          }

          setError(null);
        } else {
          setError("Failed to load factories");
        }
      } catch (error) {
        setError("Failed to load factories");
        console.error("Error fetching factories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFactories();
  }, [device.factory]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.serial_number || !formData.scale_model || !formData.factory) {
      alert("Please fill in all required fields");
      return;
    }

    const submitData = {
      ...formData,
      id: device.id,
      device_id: device.device_id,
      company_id: device.company_id,
      scale_model: formData.scale_model,
      device_sim_card_no: formData.device_sim_card_no,
      status: formData.status,
    };

    onSubmit(submitData);

    onClose();
  };

  if (loading) {
    return <div className="p-4">Loading factories...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        {error}
        <button
          onClick={() => window.location.reload()}
          className="ml-2 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormHeader title="Edit Device" onClose={onClose} />
      <p>Edit details of this weighing scale</p>

      <div className="space-y-1">
        <label
          htmlFor="device_id"
          className="block text-sm font-medium text-gray-700"
        >
          Device ID
        </label>
        <input
          type="text"
          className="border rounded p-2 w-full"
          placeholder="Device ID"
          value={formData.device_id}
          id="device_id"
          name="device_id"
          disabled
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="company_id"
          className="block text-sm font-medium text-gray-700"
        >
          Company ID:
        </label>
        <input
          type="text"
          className="border rounded p-2 w-full"
          placeholder="Company ID"
          value={formData.company_id}
          id="company_id"
          name="company_id"
          disabled
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="serial_number"
          className="block text-sm font-medium text-gray-700"
        >
          Serial number:
        </label>
        <input
          type="text"
          className="border rounded p-2 w-full"
          placeholder="Serial Number"
          value={formData.serial_number}
          onChange={handleChange}
          id="serial_number"
          name="serial_number"
          required
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="scale_model"
          className="block text-sm font-medium text-gray-700"
        >
          Scale Model:
        </label>
        <input
          type="text"
          className="border rounded p-2 w-full"
          placeholder="Scale Model"
          value={formData.scale_model}
          onChange={handleChange}
          id="scale_model"
          name="scale_model"
          required
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="device_sim_card_no"
          className="block text-sm font-medium text-gray-700"
        >
          MSISDN number:
        </label>
        <input
          type="text"
          className="border rounded p-2 w-full"
          placeholder="Enter MSISDN number"
          value={formData.device_sim_card_no || ""}
          onChange={handleChange}
          id="device_sim_card_no"
          name="device_sim_card_no"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="factory"
          className="block text-sm font-medium text-gray-700"
        >
          Factory:
        </label>
        <select
          id="factory"
          name="factory"
          value={formData.factory}
          onChange={handleChange}
          className="border rounded p-2 w-full"
          required
        >
          <option value="">Select Factory</option>
          {factories && factories.length > 0 ? (
            factories.map((factory) => (
              <option key={factory.id} value={factory.id}>
                {factory.name} - {factory.location}
              </option>
            ))
          ) : (
            <option value="" disabled>
              No factories available
            </option>
          )}
        </select>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700"
        >
          Status:
        </label>
        <select
          id="status"
          name="status"
          value={
            typeof formData.status === "string"
              ? formData.status
              : formData.status
              ? "active"
              : "inactive"
          }
          onChange={handleChange}
          className="border rounded p-2 w-full"
          required
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          className="bg-gray-500 text-white py-2 px-4 rounded"
          onClick={onClose}
        >
          Discard changes
        </button>
        <button
          type="submit"
          className="bg-[#4588B2] text-white py-2 px-4 rounded"
        >
          Save changes
        </button>
      </div>
    </form>
  );
};

export default EditDeviceForm;
