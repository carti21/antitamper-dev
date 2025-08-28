import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { AxiosError } from "axios";
import { handleApiError } from "@/utils/errorHandler";
import { Button } from "@/components/ui/button";
import EditUserForm from "@/components/forms/edituserform";
import { Loader2 } from "@/components/ui/loader";
import DeactivateUserForm from "@/components/forms/deactivateuserform";
import apiClient, { setAuthToken } from "@/apiclient";
import { ArrowLeft } from "lucide-react";

const Modal = ({
  children,
}: {
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

interface RawUserData {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  designation: string,
  email_confirmed: boolean;
  role: string;
  level: number | string;
  status?: string;
  factory?: {
    name: string;
    location: string;
  } | null;
  address?: string;
  can_receive_email_alerts?: boolean;
  can_receive_sms_alerts?: boolean;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  designation: string,
  email_confirmed: boolean;
  role: string;
  level: string;
  status: string;
  factory: {
    name: string;
    location: string;
  } | null;
  address?: string;
  can_receive_email_alerts: boolean;
  can_receive_sms_alerts: boolean;
}

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDeactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Utility function to map role to display format
  const mapRoleToString = useCallback((role: string): string => {
    const roleMap: Record<string, string> = {
      "sys-admin": "ADMIN",
      "ICT Manager": "ICT Manager",
      Manager: "Manager",
      FUM: "FUM",
      FSC: "FSC",
    };
    return roleMap[role] || role;
  }, []);

  // Utility function to map numeric level to string
  const mapLevelToString = useCallback(
    (level: number | string, role: string): string => {
      if (role === "sys-admin" || role === "ADMIN") return "ADMIN";
      if (typeof level === "string") return level;

      const levelMap: Record<number, string> = {
        1: "ADMIN",
        2: "NATIONAL",
        3: "REGIONAL",
        4: "FACTORY",
      };
      return levelMap[level as number] || "Unknown";
    },
    []
  );

  // Transform raw user data to UserData interface
  const transformUserData = useCallback(
    (rawData: RawUserData): UserData => {
      const displayRole = mapRoleToString(rawData.role);

      return {
        id: rawData.id,
        name: rawData.name,
        email: rawData.email,
        designation:rawData.designation,
        phone_number: rawData.phone_number,
        email_confirmed: rawData.email_confirmed,
        role: displayRole,
        level: mapLevelToString(rawData.level, rawData.role),
        status: rawData.status || "unknown",
        factory: rawData.factory || null,
        address: rawData.address || "",
        can_receive_email_alerts: rawData.can_receive_email_alerts ?? true,
        can_receive_sms_alerts: rawData.can_receive_sms_alerts ?? false,
      };
    },
    [mapLevelToString, mapRoleToString]
  );

  const fetchUserData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");
      setAuthToken(token);

      const response = await apiClient.get("/users/details/", {
        params: { id },
      });

      // Get the user data from the response, handling different response structures
      const rawUserData =
        response.data?.results?.docs?.[0] ||
        response.data?.results ||
        response.data?.user ||
        response.data;

      if (!rawUserData) throw new Error("User not found");

      setUserData(transformUserData(rawUserData));
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        navigate("/login");
        return;
      }
      handleApiError(error as Error | AxiosError, setError);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, transformUserData]);

  useEffect(() => {
    fetchUserData();
  }, [id, fetchUserData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#4588B2]" />
        <span className="ml-2">Loading user details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button
        className="mb-4 bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center"
        onClick={() => navigate(`/admin/users`)}
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Back
      </Button>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          User <strong>{userData?.name || id}</strong>
          <p className="mt-4 font-normal">View User details</p>
        </h1>
        <div className="flex space-x-2">
          {/* <Button
            className="border border-red-500 text-red-500 bg-transparent"
            onClick={() => setDeactivateModalOpen(true)}
            disabled={!userData}
          >
            Deactivate
          </Button> */}
          <Button
            className="bg-[#4588B2] text-white"
            onClick={() => setEditModalOpen(true)}
            disabled={!userData}
          >
            Edit User
          </Button>
        </div>
      </div>

      <section className="bg-white shadow-sm rounded-lg p-6 mb-6">
        {userData ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <ul className="space-y-2">
              <li>
                User ID: <strong>{userData.id}</strong>
              </li>
              <li>Name: {userData.name}</li>
              <li>Email: {userData.email}</li>
              <li>Designation:{userData.designation}</li>
              <li>Role: {userData.role}</li>
              <li className="flex items-center gap-1">
                User status:
                <span
                  className={`font-semibold ${
                    userData.status === "active"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {userData.status
                    ? userData.status.charAt(0)?.toUpperCase() +
                      userData.status.slice(1)
                    : "Unknown"}
                </span>
              </li>
            </ul>
            <ul className="space-y-2">
              <li>Phone: {userData.phone_number || "N/A"}</li>
              <li>Level: {userData.level}</li>
              <li>Factory: {userData.factory?.name || "N/A"}</li>
              <li>Location: {userData.factory?.location || "N/A"}</li>
              <li>
                Email Confirmed: {userData.email_confirmed ? "Yes" : "No"}
              </li>
              <li>
                Email Alerts:
                {userData.can_receive_email_alerts ? "Enabled" : "Disabled"}
              </li>
              <li>
                SMS Alerts:
                {userData.can_receive_sms_alerts ? "Enabled" : "Disabled"}
              </li>
            </ul>
          </div>
        ) : (
          <p>No user data available</p>
        )}
      </section>

      {isDeactivateModalOpen && userData && (
        <Modal onClose={() => setDeactivateModalOpen(false)}>
          <DeactivateUserForm
            userId={userData.id}
            onClose={() => setDeactivateModalOpen(false)}
            onDeactivated={fetchUserData}
          />
        </Modal>
      )}

      {isEditModalOpen && userData && (
        <Modal onClose={() => setEditModalOpen(false)}>
          <EditUserForm
            userData={userData}
            userId={userData.id}
            onClose={() => setEditModalOpen(false)}
            onUpdated={fetchUserData}
          />
        </Modal>
      )}
    </div>
  );
}
