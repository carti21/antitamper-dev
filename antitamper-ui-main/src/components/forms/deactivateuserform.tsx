import React from "react";
import { AxiosError } from "axios";
import apiClient, { setAuthToken } from "@/apiclient";

import FormHeader from "./formheader";

interface DeactivateUserFormProps {
  userId: string;
  onClose: () => void;
  onDeactivated?: () => void;
}

const DeactivateUserForm: React.FC<DeactivateUserFormProps> = ({
  userId,
  onClose,
  onDeactivated,
}) => {
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");
      setAuthToken(token);
      await apiClient.patch("/users/deactivate/", {
        id: userId,
        reason,
      });
      if (onDeactivated) onDeactivated();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err instanceof AxiosError && err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError(err.message || "Failed to deactivate user");
        }
      } else {
        setError("Failed to deactivate user");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormHeader title="Deactivate User" onClose={onClose} />
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <p>Are you sure you want to deactivate this user? </p>

      <div className="space-y-1">
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-gray-700"
        >
          Reason for deactivation
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={4}
          className="border rounded p-2 w-full"
          placeholder="Enter reason for deactivating the user..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          className="bg-gray-500 text-white py-2 px-4 rounded"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-[#4588B2] text-white w-full"
          disabled={submitting}
        >
          {submitting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              Deactivating...
            </span>
          ) : (
            "Deactivate User"
          )}
        </button>
      </div>
    </form>
  );
};

export default DeactivateUserForm;
