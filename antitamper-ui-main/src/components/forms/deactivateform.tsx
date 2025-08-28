import React, { useState } from "react";
import FormHeader from "./formheader";

interface DeactivateDeviceFormProps {
  onClose: () => void;
  onDeactivate: (reason: string) => void;
  deviceStatus: boolean; 
}


const DeactivateDeviceForm = ({
  onClose,
  onDeactivate,
  deviceStatus,
}: DeactivateDeviceFormProps) => {
  const [reason, setReason] = useState("");

  const isDeactivating = deviceStatus; // If device is active, we are deactivating

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isDeactivating && !reason.trim()) {
      alert("Please provide a deactivation reason");
      return;
    }

    onDeactivate(reason.trim());
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormHeader
        title={isDeactivating ? "Deactivate Device" : "Activate Device"}
        onClose={onClose}
      />

      {isDeactivating ? (
        <>
          <p>Are you sure you want to deactivate this device?</p>
          <p className="text-sm text-gray-600">
            When a device is deactivated, no data will be recorded.
          </p>
        </>
      ) : (
        <>
          <p>This device is currently inactive. Do you want to activate it?</p>
        </>
      )}

      {isDeactivating && (
        <div className="space-y-2">
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-gray-700"
          >
            Deactivation Reason (required)
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
            required
          />
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          className="bg-gray-500 text-white py-2 px-4 rounded"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`py-2 px-4 rounded text-white ${
            isDeactivating
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
          disabled={isDeactivating && !reason.trim()}
        >
          {isDeactivating ? "Deactivate" : "Activate"}
        </button>
      </div>
    </form>
  );
};

export default DeactivateDeviceForm;