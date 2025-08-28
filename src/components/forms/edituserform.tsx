import React, { useState } from "react";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormHeader from "@/components/forms/formheader";

import apiClient, { setAuthToken } from "@/apiclient";

interface UserData {
  id: string;
  name: string;
  email: string;
  designation: string;
  phone_number: string;
  email_confirmed: boolean;
  role: string;
  level: string;
  status: string;
  factory: {
    name: string;
    location: string;
  } | null;
  address?: string;
  can_receive_email_alerts?: boolean;
  can_receive_sms_alerts?: boolean;
}

interface EditUserFormProps {
  userData: UserData;
  userId: string;
  onClose: () => void;
  onUpdated?: () => void;
}

const EditUserForm: React.FC<EditUserFormProps> = ({
  userData,
  userId,
  onClose,
  onUpdated,
}) => {
  const [formData, setFormData] = useState({
    name: userData.name || "",
    email: userData.email || "",
    designation: userData.designation || "",
    phone: userData.phone_number || "",
    role: userData.role || "",
    level: userData.level || "",
    status: userData.status || "",
    address: userData.address || "",
    emailAlerts: userData.can_receive_email_alerts ? "enabled" : "disabled",
    smsAlerts: userData.can_receive_sms_alerts ? "enabled" : "disabled",
  });

  console.log(userData, "User Data");
  console.log(formData, "Form Data");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      if (name === "role" && value === "ADMIN") {
        return { ...prev, role: value, level: "global" }; // force global
      }
      if (name === "role" && value !== "ADMIN" && prev.level === "global") {
        return { ...prev, role: value, level: "" }; // reset if not allowed
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");
      setAuthToken(token);
      // Prepare payload (map keys as needed)
      const payload = {
        id: userId,
        name: formData.name,
        email: formData.email,
        designation: formData.designation,
        phone_number: formData.phone,
        role: mapRoleToSystem(formData.role),
        level: formData.level,
        status: formData.status,
        address: formData.address,
        can_receive_email_alerts: formData.emailAlerts === "enabled",
        can_receive_sms_alerts: formData.smsAlerts === "enabled",
      };
      await apiClient.patch("/users/update/", payload);
      if (onUpdated) onUpdated();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err instanceof AxiosError && err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError(err.message || "Failed to update user");
        }
      } else {
        setError("Failed to update user");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Map display role back to system role for submission
  const mapRoleToSystem = (displayRole: string): string => {
    const roleMap: Record<string, string> = {
      ADMIN: "sys-admin",
      User: "user",
    };
    return roleMap[displayRole] || displayRole;
  };

  // Level options based on the system's level numbers from MEMORIES
  const levelOptions = [
    { value: "global", label: "Admin (Level 1)" },
    { value: "national", label: "National (Level 2)" },
    { value: "region", label: "Regional (Level 3)" },
    { value: "factory", label: "Factory (Level 4)" },
  ];

  // Status options
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
  ];

  return (
    <div className="h-full ">
      {" "}
      <form onSubmit={handleSubmit} className="h-4/5">
        <FormHeader title="Edit User" onClose={onClose} />
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4  rounded">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <Label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="focus:ring-0 focus:ring-offset-0 focus:border-gray-300 bg-white"
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="focus:ring-0 focus:ring-offset-0 focus:border-gray-300 bg-white"
          />
        </div>
        <div className="space-y-1">
          <Label
            htmlFor="designation"
            className="block text-sm font-medium text-gray-700"
          >
            Designation
          </Label>
          <Input
            id="designation"
            name="designation"
            type="designation"
            value={formData.designation}
            onChange={handleChange}
            required
            className="focus:ring-0 focus:ring-offset-0 focus:border-gray-300 bg-white"
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone
          </Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="focus:ring-0 focus:ring-offset-0 focus:border-gray-300 bg-white"
          />
        </div>
        <div className="space-y-1">
          <Label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700"
          >
            Role
          </Label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleSelectChange("role", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {["ADMIN", "User"].map((role) => (
                <SelectItem
                  key={role}
                  value={role}
                  className="hover:bg-gray-100 focus:bg-gray-100"
                >
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="level">
            Access Level
            {formData.level === "FACTORY" && userData.factory
              ? ` - ${userData.factory.name}`
              : ""}
          </Label>
          <Select
            value={formData.level}
            onValueChange={(value) => handleSelectChange("level", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {levelOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="hover:bg-gray-100 focus:bg-gray-100"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            Status
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleSelectChange("status", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {statusOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="hover:bg-gray-100 focus:bg-gray-100"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700"
          >
            Address
          </Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="focus:ring-0 focus:ring-offset-0 focus:border-gray-300 bg-white"
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="emailAlerts"
            className="block text-sm font-medium text-gray-700"
          >
            Email Alerts
          </Label>
          <Select
            value={formData.emailAlerts}
            onValueChange={(value) => handleSelectChange("emailAlerts", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select email alerts status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem
                value="enabled"
                className="hover:bg-gray-100 focus:bg-gray-100"
              >
                Enabled
              </SelectItem>
              <SelectItem
                value="disabled"
                className="hover:bg-gray-100 focus:bg-gray-100"
              >
                Disabled
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="smsAlerts"
            className="block text-sm font-medium text-gray-700"
          >
            SMS Alerts
          </Label>
          <Select
            value={formData.smsAlerts}
            onValueChange={(value) => handleSelectChange("smsAlerts", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select SMS alerts status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem
                value="enabled"
                className="hover:bg-gray-100 focus:bg-gray-100"
              >
                Enabled
              </SelectItem>
              <SelectItem
                value="disabled"
                className="hover:bg-gray-100 focus:bg-gray-100"
              >
                Disabled
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            className="bg-white text-black"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
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
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditUserForm;
