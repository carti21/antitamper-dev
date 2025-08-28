import React, { useState } from "react";
import apiClient from "@/apiclient";
import { AxiosError } from "axios";
import Logo from "@/layouts/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

const OTPVerificationPage: React.FC = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { login, userData } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const email = userData?.email || sessionStorage.getItem("unverifiedEmail");
    const tempToken = sessionStorage.getItem("tempAuthToken");

    const formattedOtp = otp?.toUpperCase();
    const isValidOtp = /^[A-Z0-9]+$/.test(formattedOtp);

    if (!isValidOtp) {
      setError(
        "Confirmation code must contain only uppercase letters and numbers."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.post("/users/verify/", {
        email_or_phone_number: email,
        confirmation_code: formattedOtp,
      });

      if (response.data.success) {
        setSuccess(true);
        setError(null);
        const profileResponse = await apiClient.get("/users/me/", {
          headers: {
            Authorization: `Bearer ${tempToken}`,
          },
        });

        const results = profileResponse.data.results;
        // Map numeric levels to string levels
        const numericToStringLevel: Record<string, string> = {
          "1": "ADMIN",
          "2": "NATIONAL",
          "3": "REGIONAL",
          "4": "FACTORY",
        };

   
        // Map backend level strings to frontend level strings
        const levelStringMap: Record<string, string> = {
          factory: "FACTORY",
          region: "REGIONAL",
          national: "NATIONAL",
          global: "ADMIN",
        };

        let userLevel = "";

        if (!userLevel && results.level) {
          if (
            typeof results.level === "string" &&
            isNaN(Number(results.level))
          ) {
            userLevel =
              levelStringMap[results.level.toLowerCase()] ||
              results.level?.toUpperCase();
          } else {
            userLevel = numericToStringLevel[results.level] || "UNAUTHORIZED";
          }
        }

        if (!userLevel) {
          userLevel = "UNAUTHORIZED";
        }

        // Edge fix: manager marked regional but has factory
        if (
          userLevel === "REGIONAL" &&
          results.factory?.id &&
          !results.region
        ) {
          userLevel = "FACTORY";
        }

        console.log("Resolved userLevel after OTP:", userLevel);

        const userData = {
          id: results.id || "",
          name: results.name || "User",
          email: results.email,
          phoneNumber: results.phone_number || "",
          role: results.role || "user",
          level: userLevel,
          factoryId: results.factory?.id || "",
          factoryName: results.factory?.name || "",
          factoryLocation: results.factory?.location || "",
          region: results.region || "",
          regionId: results.region || "",
          factoryRegion: results.factory?.region || results.region || "",
          permissions: results.permissions || {},
          emailConfirmed: results.email_confirmed || false,
          status: results.status || "active",
          can_receive_email_alerts: results.can_receive_email_alerts || false,
          can_receive_sms_alerts: results.can_receive_sms_alerts || false,
        };

        // Save and authenticate
        sessionStorage.setItem("authToken", tempToken || "");
        sessionStorage.setItem("userData", JSON.stringify(userData));

        login(tempToken || "", userData);
        console.log("User profile results from /users/me/:", results);

        console.log("Role:", results.role);
        console.log("Factory ID:", results.factory?.id);
        console.log("Region:", results.region);

        // Redirect to appropriate homepage
        let redirectPath = "/";
        switch (userData.level) {
          case "global":
            redirectPath = "/admin";
            break;
          case "national":
            redirectPath = "/national";
            break;
          case "region":
            redirectPath = "/regional";
            break;
          case "factory":
            redirectPath = "/factory";
            break;
          default:
            redirectPath = "/unauthorized";
            break;
        }

        navigate(redirectPath);
      } else {
        setError(response.data.message || "Failed to verify OTP.");
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setError(
        axiosError.response?.data?.message ||
          "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const ResendCode = async () => {
    try {
      const email =
        userData?.email || sessionStorage.getItem("unverifiedEmail");

      const response = await apiClient.post("/users/request-verification/", {
        email_or_phone_number: email,
      });

      if (response.data.success) {
        toast.success("A new otp has been resent to your email");
      } else {
        setError(response.data.message || "Failed to verify OTP.");
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setError(
        axiosError.response?.data?.message ||
          "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#4588B2]">
      <div className="bg-white p-10 w-1/2 mx-auto rounded-lg shadow-md flex flex-col gap-6 max-lg:w-11/12">
        <Logo />
        <p className="text-2xl font-bold text-gray-800 mb-2 text-center">
          OTP code
        </p>
        <p className="text-lg text-gray-800 mb-2 text-center">
          Enter OTP code sent to your email address
        </p>

        {success ? (
          <div className="text-center text-green-600">
            OTP verified successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <label className="block text-sm font-medium text-gray-700">
                OTP
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700"
                onClick={ResendCode}
              >
                Did not receive code? Resend code
              </button>
              <Button
                type="submit"
                className="bg-[#4588B2] text-white py-2 px-4 rounded-md hover:bg-[#4588B2] focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Continue"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OTPVerificationPage;
