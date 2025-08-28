import { useState } from "react";
import { useNavigate } from "react-router"; 
import { Button } from "@/components/ui/button";
import EditProfileForm from "@/components/forms/editprofileform"; 

const Modal = ({ children }: { title: string; children?: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
      {children}
    </div>
  </div>
);

export default function Profile() {
  const navigate = useNavigate(); // Hook for navigation
  const [isEditProfileModalOpen, setEditProfileModalOpen] = useState(false);

  // Sample profile data (replace with actual data from your backend or state)
  const profileData = {
    name: "John Kimani",
    mobileNumber: "254712121212",
    email: "john@example.com",
    accountStatus: "Active",
    title: "Manager",
    role: "General Admin",
    factory: "Factory.ID",
  };

  // Handle logout
  const handleLogout = () => {
    // console.log("User logged out");

    localStorage.removeItem("authToken"); 
    sessionStorage.clear(); 

    navigate("/login");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          Profile Details
        </h1>
        <div className="flex space-x-2">
          <Button
            className="border border-red-500 text-red-500 bg-transparent"
            onClick={handleLogout}
          >
            Logout
          </Button>
          <Button
            className="bg-[#4588B2] text-white"
            onClick={() => setEditProfileModalOpen(true)}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Profile Details */}
      <section className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium">User name:</p>
            <p className="text-gray-700">{profileData.name}</p>
          </div>
          <div>
            <p className="font-medium">Mobile number:</p>
            <p className="text-gray-700">{profileData.mobileNumber}</p>
          </div>
          <div>
            <p className="font-medium">Email address:</p>
            <p className="text-gray-700">{profileData.email}</p>
          </div>
          <div>
            <p className="font-medium">Account status:</p>
            <p className="text-green-500 font-semibold">{profileData.accountStatus}</p>
          </div>
          <div>
            <p className="font-medium">Title:</p>
            <p className="text-gray-700">{profileData.title}</p>
          </div>
          <div>
            <p className="font-medium">Role:</p>
            <p className="text-gray-700">{profileData.role}</p>
          </div>
          <div>
            <p className="font-medium">Factory:</p>
            <p className="text-gray-700">{profileData.factory}</p>
          </div>
        </div>
      </section>

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <Modal title="Edit Profile" onClose={() => setEditProfileModalOpen(false)}>
          <EditProfileForm onClose={() => setEditProfileModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
}