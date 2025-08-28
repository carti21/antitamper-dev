import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import apiClient, { setAuthToken } from "@/apiclient";
import Logo from "@/layouts/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";

const LoginPage: React.FC = () => {
  const [emailOrPhoneNumber, setEmailOrPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, userData, login } = useAuth();

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated && userData?.emailConfirmed) {
      let redirectPath = "/";
      switch (userData?.level) {
        case "ADMIN":
          redirectPath = "/admin";
          break;
        case "NATIONAL":
          redirectPath = "/national";
          break;
        case "REGIONAL":
          redirectPath = "/regional";
          break;
        case "FACTORY":
          redirectPath = "/factory";
          break;
        default:
          redirectPath = "/unauthorized";
          break;
      }
      navigate(redirectPath);
    } else if (isAuthenticated && !userData?.emailConfirmed) {
      navigate("/verify");
    }
  }, [isAuthenticated, userData, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post("/users/login/", {
        email_or_phone_number: emailOrPhoneNumber,
        password: password,
      });
      if (!response.data || !response.data.token) {
        throw new Error("No token received from the server");
      }

      const { token, results } = response.data;

      if (!results.email_confirmed) {
        try {
          await apiClient.post("/users/request-verification/", {
            email_or_phone_number: emailOrPhoneNumber,
          });
        } catch (verificationError) {
          console.error(
            "Failed to send verification email:",
            verificationError
          );
        }

        sessionStorage.setItem("tempAuthToken", token);
        sessionStorage.setItem(
          "unverifiedEmail",
          results.email || emailOrPhoneNumber
        );

        navigate("/verify", {
          state: { email: results.email || emailOrPhoneNumber },
        });

        return;
      }

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

      // Determine user level
      let userLevel = "";

      // If still no level, try to determine from level field
      if (!userLevel && results.level) {
        if (typeof results.level === "string" && isNaN(Number(results.level))) {
          userLevel =
            levelStringMap[results.level.toLowerCase()] ||
            results.level?.toUpperCase();
        } else {
          // If level is numeric or numeric string like '3', map to string level
          userLevel = numericToStringLevel[results.level] || "UNAUTHORIZED";
        }
      }

      // If still no level, set to UNAUTHORIZED
      if (!userLevel) {
        userLevel = "UNAUTHORIZED";
      }

      // SPECIAL CASE: If user has factory assignment but was marked as regional, correct it
      if (userLevel === "REGIONAL" && results.factory?.id && !results.region) {
        userLevel = "FACTORY";
      }

      // Store the original login response for reference
      localStorage.setItem("loginResponse", JSON.stringify(response.data));

      const userData = {
        id: results.id || "",
        name: results.name || "User",
        email: results.email || emailOrPhoneNumber,
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

      if (rememberMe) {
        localStorage.setItem("authToken", token);
        localStorage.setItem("userData", JSON.stringify(userData));
      } else {
        sessionStorage.setItem("authToken", token);
        sessionStorage.setItem("userData", JSON.stringify(userData));
      }

      setAuthToken(token);
      login(token, userData);

      let redirectPath = "/";
      switch (userLevel) {
        case "ADMIN":
          redirectPath = "/admin";
          break;
        case "NATIONAL":
          redirectPath = "/national";
          break;
        case "REGIONAL":
          redirectPath = "/regional";
          break;
        case "FACTORY":
          redirectPath = "/factory";
          break;
        default:
          redirectPath = "/unauthorized";
          console.warn(
            "Redirecting to unauthorized - no valid level determined"
          );
          break;
      }
      navigate(redirectPath, { replace: true });
    } catch (error) {
      let errorMessage = "An unexpected error occurred";
      if (axios.isAxiosError(error)) {
        // Handle specific error cases
        if (error.response?.status === 400) {
          if (error.response.data?.message === "Invalid password") {
            errorMessage = "Incorrect password. Please try again.";
          } else {
            errorMessage =
              error.response.data?.message || "Invalid login credentials";
          }
        } else if (error.response?.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
        } else if (error.response?.status === 404) {
          errorMessage =
            "User not found. Please check your email or phone number.";
        } else {
          errorMessage = error.response?.data?.message || error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-steel-blue">
      <div className="bg-white p-10 w-1/2 mx-auto rounded-lg shadow-md flex flex-col gap-6 max-lg:w-11/12">
        <Logo />
        <p className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Welcome back
        </p>
        <p className="text-lg text-gray-800 mb-2 text-center">
          Login to Continue
        </p>
        <div className="flex flex-col items-center min-h-[20px]">
          {error && (
            <div className="text-red-500 text-center mb-4">{error}</div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col grow space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email or Phone Number
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={emailOrPhoneNumber}
              onChange={(e) => setEmailOrPhoneNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="ml-2">Remember me</span>
            </label>
            <a
              href="/reset-request"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Password?
            </a>
          </div>
          <button
            type="submit"
            className="w-full bg-[#4588B2] text-white py-2 rounded-md hover:bg-[#4588B2] focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
