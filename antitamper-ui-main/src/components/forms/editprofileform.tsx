import { useState } from "react";
import FormHeader from "./formheader";

const EditProfileForm = ({ onClose }: { onClose: () => void }) => {
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Kimani");
  const [email, setEmail] = useState("john@example.com");
  const [mobileNumber, setMobileNumber] = useState("2547121212");
  const [factory, setFactory] = useState("Factory A");
  const [title, setTitle] = useState("Manager");
  const [userRole, setUserRole] = useState("General admin");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormHeader title="Edit Profile" onClose={onClose} />
      <p className="text-sm text-gray-600">Edit your profile details</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            className="border rounded p-2 w-full"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            className="border rounded p-2 w-full"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="border rounded p-2 w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">
            Mobile number
          </label>
          <input
            type="text"
            id="mobileNumber"
            name="mobileNumber"
            className="border rounded p-2 w-full"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="factory" className="block text-sm font-medium text-gray-700">
            Factory
          </label>
          <input
            type="text"
            id="factory"
            name="factory"
            className="border rounded p-2 w-full"
            value={factory}
            onChange={(e) => setFactory(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="border rounded p-2 w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      </div>

      {/* User Role */}
      <div>
        <label htmlFor="userRole" className="block text-sm font-medium text-gray-700">
          User role
        </label>
        <input
          type="text"
          id="userRole"
          name="userRole"
          className="border rounded p-2 w-full"
          value={userRole}
          onChange={(e) => setUserRole(e.target.value)}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-2 mt-4">
        <button
          type="button"
          className="bg-gray-500 text-white py-2 px-4 rounded"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-[#4588B2] text-white py-2 px-4 rounded"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default EditProfileForm;