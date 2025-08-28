import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Loader2 } from "@/components/ui/loader";
import apiClient, { setAuthToken } from "@/apiclient";
import { ArrowLeft } from "lucide-react";

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
  can_receive_email_alerts: boolean;
  can_receive_sms_alerts: boolean;
}

export default function FactoryUserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found");

        setAuthToken(token);
        setLoading(true);

        // Get current user data from localStorage/sessionStorage
        const currentUserData = JSON.parse(
          localStorage.getItem("userData") ||
            sessionStorage.getItem("userData") ||
            "{}"
        );

        let userDetails = null;

        // Different approach based on user level
        if (currentUserData.level === "FACTORY" && currentUserData.factoryId) {
          // For factory users, use a different endpoint to avoid 403 errors
          try {
            const response = await apiClient.get("/users/", {
              params: {
                factory: currentUserData.factoryName,
              },
            });

            if (
              response.data?.results?.docs &&
              response.data.results.docs.length > 0
            ) {
              // Find the specific user by ID
              const foundUser = response.data.results.docs.find(
                (user: { id: string }) => user.id === id
              );
              if (foundUser) {
                userDetails = foundUser;
              } else {
                throw new Error("User not found in your factory");
              }
            } else {
              throw new Error("No users found in your factory");
            }
          } catch (fetchError) {
            console.error("Error fetching users in factory:", fetchError);
            throw new Error("You don't have permission to view this user");
          }
        } else {
          // For admin and other users, fetch the specific user directly
          try {
            const response = await apiClient.get("/users/details/", {
              params: {
                id: id,
              },
            });

            if (
              response.data?.results?.docs &&
              response.data.results.docs.length > 0
            ) {
              userDetails = response.data.results.docs[0];
            } else if (response.data?.results) {
              userDetails = response.data.results;
            } else if (response.data?.user) {
              userDetails = response.data.user;
            } else if (response.data) {
              userDetails = response.data;
            } else {
              throw new Error("User not found");
            }
          } catch (fetchError) {
            console.error("Error fetching user details:", fetchError);
            throw new Error("Failed to fetch user details");
          }
        }

        if (!userDetails) {
          throw new Error("User details not found");
        }

        // Handle role display
        const displayRole =
          userDetails.role === "sys-admin" ? "ADMIN" : userDetails.role;

        // Handle level based on role and numeric level
        let userLevel = userDetails.level;

        // If user is sys-admin or has ADMIN role, level should be ADMIN
        if (userDetails.role === "sys-admin" || displayRole === "ADMIN") {
          userLevel = "ADMIN";
        } else if (typeof userLevel === "number") {
          switch (userLevel) {
            case 1:
              userLevel = "ADMIN";
              break;
            case 2:
              userLevel = "NATIONAL";
              break;
            case 3:
              userLevel = "REGIONAL";
              break;
            case 4:
              userLevel = "FACTORY";
              break;
            default:
              userLevel = "Unknown";
          }
        }

        const userData = {
          id: userDetails.id || id,
          name: userDetails.name || "Unknown User",
          email: userDetails.email || "No email provided",
          designation: userDetails.designation || "No designation provided",
          phone_number: userDetails.phone_number || "",
          email_confirmed: userDetails.email_confirmed || false,
          role: displayRole || "No role assigned",
          level: userLevel || "No level assigned",
          status: userDetails.status || "unknown",
          factory: userDetails.factory || null,
          address: userDetails.address || "",
          can_receive_email_alerts:
            userDetails.can_receive_email_alerts ?? false,
          can_receive_sms_alerts: userDetails.can_receive_sms_alerts ?? false,
        };

        console.log("User data found:", userData);
        setUserData(userData);
      } catch (error) {
        console.error("Error fetching user details:", error);
        setError("Failed to fetch user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

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
        onClick={() => navigate(`/factory/users`)}
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Back
      </Button>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          User <strong>{userData?.name || id}</strong>
          <p className="mt-4 font-normal">View User details</p>
        </h1>
      </div>

      <section className="bg-white shadow-sm rounded-lg p-6 mb-6">
        {userData ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                User ID: <strong>{userData.id}</strong>
              </p>
              <p>Name: {userData.name}</p>
              <p>Email: {userData.email}</p>
              <p>Designation: {userData.designation}</p>

              <p>Role: {userData.role}</p>
              <p>
                User status:{" "}
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
              </p>
            </div>
            <div>
              <p>Phone: {userData.phone_number || "N/A"}</p>
              <p>Level: {userData.level}</p>
              <p>Factory: {userData.factory?.name || "N/A"}</p>
              <p>Location: {userData.factory?.location || "N/A"}</p>
              <p>Email Confirmed: {userData.email_confirmed ? "Yes" : "No"}</p>
              <p>
                Email Alerts:{" "}
                {userData.can_receive_email_alerts ? "Enabled" : "Disabled"}
              </p>
              <p>
                SMS Alerts:{" "}
                {userData.can_receive_sms_alerts ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
        ) : (
          <p>No user data available</p>
        )}
      </section>
    </div>
  );
}
