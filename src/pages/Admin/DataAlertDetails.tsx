import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Map, Thermometer, Server } from "lucide-react";
import apiClient, { setAuthToken } from "@/apiclient";
import { formatDateTime } from "@/utils/formatters";

interface Coordinates {
  coordinates: [number, number];
}

interface AlertData {
  id: string;
  device_id: string;
  factory_name?: string;
  factory_location?: string;
  location?: string;
  region?: string;
  state?: string;
  interrupt_type?: string;
  enclosure?: string;
  calib_switch?: string;
  sd_card_available?: boolean;
  battery_status?: string;
  battery_voltage?: number;
  alert_timestamp?: string;
  gps_timestamp?: string;
  gsm_timestamp?: string;
  rtc_timestamp?: string;
  createdAt?: string;
  company_id?: string;
  gps_location?: Coordinates;
  gsm_location?: Coordinates;
  gps_map_url?: string;
  gsm_map_url?: string;
  status?: string;
  resolved?: boolean;
  alert_severity?: string;
}

export default function DataAlertDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertData, setAlertData] = useState<AlertData | null>(null);

  useEffect(() => {
    const fetchAlertDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found");

        setAuthToken(token);
        const response = await apiClient.post(`/data/alerts/`, { id });
        setAlertData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching alert details:", error);
        setError("Failed to load alert details. Please try again.");
        setLoading(false);
      }
    };

    if (id) {
      fetchAlertDetails();
    }
  }, [id]);

  const handleResolveAlert = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      setAuthToken(token);
      await apiClient.patch(`/data/alerts/resolve/`, { id, resolved: true });

      // Refresh the data
      const response = await apiClient.post(`/data/alerts/details/`, { id });
      setAlertData(response.data);
    } catch (error) {
      console.error("Error resolving alert:", error);
      setError("Failed to resolve alert. Please try again.");
    }
  };

  const handleBackClick = () => {
    navigate("/admin/data-alerts");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4588B2]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={handleBackClick} className="bg-[#4588B2] text-white">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Alerts
        </Button>
      </div>
    );
  }

  if (!alertData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="mb-4">Alert not found</p>
        <Button onClick={handleBackClick} className="bg-[#4588B2] text-white">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Alerts
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <Button
          onClick={handleBackClick}
          variant="outline"
          className="border-[#4588B2] text-[#4588B2]"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Alerts
        </Button>
        {!alertData.resolved && (
          <Button
            onClick={handleResolveAlert}
            className="bg-green-600 text-white"
          >
            Mark as Resolved
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Alert Details</h1>
            <div className="flex items-center">
              <span
                className={`px-2 py-1 rounded text-sm ${
                  alertData.resolved
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {alertData.resolved ? "Resolved" : "Pending"}
              </span>
              {alertData.alert_severity && (
                <span
                  className={`ml-2 px-2 py-1 rounded text-sm ${
                    alertData.alert_severity === "high"
                      ? "bg-red-100 text-red-800"
                      : alertData.alert_severity === "medium"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {alertData.alert_severity?.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Alert ID</p>
            <p className="font-mono">{alertData.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Server className="mr-2 h-5 w-5 text-[#4588B2]" />
              Device Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Company ID</p>
                <p className="font-semibold">{alertData.company_id || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Factory</p>
                <p className="font-semibold">
                  {alertData.factory_name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-semibold">
                  {alertData.factory_location || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Device ID</p>
                <p className="font-semibold">{alertData.device_id || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Region</p>
                <p className="font-semibold">{alertData.region || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">State</p>
                <p
                  className={`font-semibold ${
                    alertData.state === "on" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {alertData.state?.toUpperCase() || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Thermometer className="mr-2 h-5 w-5 text-[#4588B2]" />
              Device Status
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Interrupt Type</p>
                <p className="font-semibold">
                  {alertData.interrupt_type || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Enclosure</p>
                <p className="font-semibold capitalize">
                  {alertData.enclosure || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Calibration Switch</p>
                <p className="font-semibold capitalize">
                  {alertData.calib_switch || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">SD Card</p>
                <p className="font-semibold">
                  {alertData.sd_card_available ? "Available" : "Not Available"}
                  {alertData.sd_card_available !== undefined && (
                    <span className="text-gray-500">
                      {" "}
                      ({alertData.sd_card_available ? "Saved" : "Not Saved"})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Battery Voltage</p>
                <p
                  className={`font-semibold ${
                    alertData.battery_voltage !== undefined &&
                    alertData.battery_voltage < 3.45
                      ? "text-red-600"
                      : ""
                  }`}
                >
                  {alertData.battery_voltage !== undefined
                    ? `${alertData.battery_voltage?.toFixed(2)} V`
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-[#4588B2]" />
              Timestamps
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Alert Timestamp</p>
                <p className="font-semibold">
                  {alertData.alert_timestamp
                    ? formatDateTime(alertData.alert_timestamp)
                    : alertData.createdAt
                    ? formatDateTime(alertData.createdAt)
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">GPS Timestamp</p>
                <p className="font-semibold">
                  {alertData.gps_timestamp
                    ? formatDateTime(alertData.gps_timestamp)
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">GSM Timestamp</p>
                <p className="font-semibold">
                  {alertData.gsm_timestamp
                    ? formatDateTime(alertData.gsm_timestamp)
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">RTC Timestamp</p>
                <p className="font-semibold">
                  {alertData.rtc_timestamp
                    ? formatDateTime(alertData.rtc_timestamp)
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-semibold">
                  {alertData.createdAt
                    ? formatDateTime(alertData.createdAt)
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Map className="mr-2 h-5 w-5 text-[#4588B2]" />
              Location Data
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">GPS Coordinates</p>
                <p className="font-semibold">
                  {alertData.gps_location?.coordinates
                    ? `${alertData.gps_location.coordinates[1].toFixed(
                        6
                      )}, ${alertData.gps_location.coordinates[0].toFixed(6)}`
                    : "N/A"}
                  {alertData.gps_map_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white border-[#4588B2] ml-2"
                      onClick={() =>
                        window.open(alertData.gps_map_url, "_blank")
                      }
                    >
                      Map
                    </Button>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">GSM Coordinates</p>
                <p className="font-semibold">
                  {alertData.gsm_location?.coordinates
                    ? `${alertData.gsm_location.coordinates[1].toFixed(
                        6
                      )}, ${alertData.gsm_location.coordinates[0].toFixed(6)}`
                    : "N/A"}
                  {alertData.gsm_map_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white border-[#4588B2] ml-2"
                      onClick={() =>
                        window.open(alertData.gsm_map_url, "_blank")
                      }
                    >
                      Map
                    </Button>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
