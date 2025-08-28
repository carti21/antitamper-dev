import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import FormHeader from "@/components/forms/formheader";

interface Factory {
  id: string;
  name: string;
  location: string;
}

interface RegisterDeviceFormProps {
  onSubmit: (deviceData: {
    deviceId: string;
    factoryId: string;
    serialNumber: string;
    scale_model: string;
    msisdnNumber: string;
    status: string;
    companyId: string;
    subscription_status: string;
    subscription_start: string;
    subscription_expiry: string;
  }) => void;
  onClose: () => void;
  factories: Factory[];
  initialValues?: {
    deviceId?: string;
    factoryId?: string;
    serialNumber?: string;
    scale_model?: string;
    msisdnNumber?: string;
    status?: string;
    companyId?: string;
    subscription_status?: string;
    subscription_start?: string;
    subscription_expiry?: string;
  };
}

const RegisterDeviceForm: React.FC<RegisterDeviceFormProps> = ({
  onSubmit,
  onClose,
  factories,
  initialValues = {}
}) => {
  const [deviceId, setDeviceId] = useState(initialValues.deviceId || "");
  const [selectedFactory, setSelectedFactory] = useState(initialValues.factoryId || "");
  const [serialNumber, setSerialNumber] = useState(initialValues.serialNumber || "");
  const [scale_model, setScaleModel] = useState(initialValues.scale_model || "");
  const [msisdnNumber, setMsisdnNumber] = useState(initialValues.msisdnNumber || "030000 119 4773");
  const [companyId, setCompanyId] = useState(initialValues.companyId || "");
  const [status, setStatus] = useState(initialValues.status || "inactive");
  const [subscriptionStatus, setSubscriptionStatus] = useState(initialValues.subscription_status || "inactive");
  const [subscriptionStart, setSubscriptionStart] = useState(initialValues.subscription_start || "");
  const [subscriptionExpiry, setSubscriptionExpiry] = useState(initialValues.subscription_expiry || "");

  // Automatically set dates when status is "active"
  useEffect(() => {
    if (subscriptionStatus === "active") {
      const today = new Date();
      const expiry = new Date(today);
      expiry.setDate(today.getDate() + 365);
      setSubscriptionStart(today.toISOString().split("T")[0]);
      setSubscriptionExpiry(expiry.toISOString().split("T")[0]);
    } else {
      setSubscriptionStart("");
      setSubscriptionExpiry("");
    }
  }, [subscriptionStatus]);

  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        deviceId,
        factoryId: selectedFactory,
        serialNumber,
        scale_model,
        msisdnNumber,
        companyId,
        status,
        subscription_status: subscriptionStatus,
        subscription_start: subscriptionStart,
        subscription_expiry: subscriptionExpiry,
      });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormHeader title="Register Device" onClose={onClose} />
      <div className="space-y-4 max-h-[70vh] overflow-y-auto w-full p-4">
        <div className="space-y-1">
          <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700">Scale ID</label>
          <input
            id="deviceId"
            type="text"
            className="border rounded p-2 w-full bg-white"
            placeholder="Scale ID"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="factory" className="block text-sm font-medium text-gray-700">Factory</label>
          <select
            id="factory"
            className="border rounded p-2 w-full bg-white"
            value={selectedFactory}
            onChange={(e) => setSelectedFactory(e.target.value)}
            required
          >
            <option value="">Select Factory</option>
            {factories.map((factory) => (
              <option key={factory.id} value={factory.id}>
                {factory.name} - {factory.location}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="msisdnNumber" className="block text-sm font-medium text-gray-700">MSISDN Number</label>
          <input
            id="msisdnNumber"
            type="text"
            className="border rounded p-2 w-full bg-white"
            placeholder="MSISDN Number (e.g. 254700000000)"
            value={msisdnNumber}
            onChange={(e) => setMsisdnNumber(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="companyId" className="block text-sm font-medium text-gray-700">Company ID</label>
          <input
            id="companyId"
            type="text"
            className="border rounded p-2 w-full bg-white"
            placeholder="Company ID (e.g. BWS-01)"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">Serial Number</label>
          <input
            id="serialNumber"
            type="text"
            className="border rounded p-2 w-full bg-white"
            placeholder="Serial Number"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="scale_model" className="block text-sm font-medium text-gray-700">Scale Model</label>
          <input
            id="scale_model"
            type="text"
            className="border rounded p-2 w-full bg-white"
            placeholder="Scale Model"
            value={scale_model}
            onChange={(e) => setScaleModel(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            className="border rounded p-2 w-full bg-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="unassigned">Unassigned</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="subscriptionStatus" className="block text-sm font-medium text-gray-700">Subscription Status</label>
          <select
            id="subscriptionStatus"
            className="border rounded p-2 w-full bg-white"
            value={subscriptionStatus}
            onChange={(e) => setSubscriptionStatus(e.target.value)}
            required
          >
            <option value="inactive">Inactive</option>
            <option value="active">Active</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="subscriptionStart" className="block text-sm font-medium text-gray-700">Subscription Start Date</label>
          <input
            id="subscriptionStart"
            type="date"
            className="border rounded p-2 w-full bg-white"
            value={subscriptionStart}
            onChange={(e) => setSubscriptionStart(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="subscriptionExpiry" className="block text-sm font-medium text-gray-700">Subscription Expiry Date</label>
          <input
            id="subscriptionExpiry"
            type="date"
            className="border rounded p-2 w-full bg-white"
            value={subscriptionExpiry}
            onChange={(e) => setSubscriptionExpiry(e.target.value)}
            readOnly
            required={status === "active"}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            onClick={onClose}
            className="bg-gray-500 text-white hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#4588B2] text-white hover:bg-[#3a7a9e]"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                Registering...
              </span>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default RegisterDeviceForm;
