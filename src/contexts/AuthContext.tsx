import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import apiClient from "@/apiclient";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  level: string;
  factoryId?: string;
  regionId?: string;
  emailConfirmed?: boolean;
  permissions: Record<string, boolean>;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userData: User | null;
  setUserData: (user: User | null) => void;
  login: (token: string, userData: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => !!localStorage.getItem("authToken")
  );
  const [userData, setUserData] = useState<User | null>(() => {
    const storedUserData = localStorage.getItem("userData");
    return storedUserData ? JSON.parse(storedUserData) : null;
  });

  const fetchUserData = useCallback(async () => {
    try {
      const response = await apiClient.get("/users/me/");
      setUserData(response.data);
      localStorage.setItem("userData", JSON.stringify(response.data));
    } catch (error) {
      console.error("Error fetching user data:", error);
      logout();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !userData) {
      fetchUserData();
    }
    const handleAuthError = () => {
      logout();
    };

    window.addEventListener("auth-error", handleAuthError);
    return () => {
      
      window.removeEventListener("auth-error", handleAuthError);
    };
  }, [isAuthenticated, userData, fetchUserData]);

  const login = (token: string, userData: User) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("userData", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUserData(userData);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setIsAuthenticated(false);
    setUserData(null);
    window.location.href = "/login";
  };

  const hasPermission = (permission: string) => {
    return userData?.permissions?.[permission] ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userData,
        setUserData,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
