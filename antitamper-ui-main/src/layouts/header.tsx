import { useNavigate } from "react-router";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/apiclient";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const Header: React.FC<React.HTMLAttributes<HTMLElement>> = ({
  className,
  ...props
}) => {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const handleLogout = async () => {
    try {
      await apiClient.post("/users/logout/", {});
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      logout();
      navigate("/login");
    }
  };

  return (
    <header className={cn("bg-white border-b", className)} {...props}>
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">{props.children}</div>
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>

          {isHovered && (
            <div className="absolute right-0  min-w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
              <div className="py-1">
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-900">
                    {userData?.name}
                  </p>
                  <p className="text-sm text-gray-500">{userData?.email}</p>
                </div>
                <div className="border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
