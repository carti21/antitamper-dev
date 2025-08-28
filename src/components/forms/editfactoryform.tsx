import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import FormHeader from './formheader';
import apiClient, { setAuthToken } from '@/apiclient';

interface EditFactoryFormProps {
  onClose: () => void;
  onUpdate?: () => void;
}

const EditFactoryForm = ({ onClose, onUpdate }: EditFactoryFormProps) => {
  const { id } = useParams<{ id: string }>();
  const [factoryData, setFactoryData] = useState({
    name: '',
    location: '',
    region: '',
    contactMobile: '',
    email: '',
    contactName: ''
  });
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch factory data and available regions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No authentication token found');
        
        setAuthToken(token);
        
        // Fetch factory details
        const factoryResponse = await apiClient.get(`/factories/${id}`);
        setFactoryData(factoryResponse.data);
        
        // Fetch available regions
        const regionsResponse = await apiClient.get('/regions/');
        if (regionsResponse.data.success && Array.isArray(regionsResponse.data.results)) {
          setRegions(regionsResponse.data.results);
        }
      } catch (error) {
        console.error('Error fetching factory data:', error);
        setError('Failed to load factory data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFactoryData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');
      
      setAuthToken(token);
      
      const updatedFactory = {
        id,
        ...factoryData
      };
      
      await apiClient.patch('/factories/update/', updatedFactory);
      setSuccess(true);
      
      // Notify parent component to refresh data
      if (onUpdate) {
        onUpdate();
      }
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
        // Optionally refresh the page or redirect
        // window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating factory:', error);
      setError('Failed to update factory. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormHeader title="Edit Factory" onClose={onClose} />
      
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {success && <div className="text-green-500 mb-4">Factory updated successfully!</div>}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Factory Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={factoryData.name}
            onChange={handleInputChange}
            className="border rounded p-2 w-full"
            required
          />
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={factoryData.location}
            onChange={handleInputChange}
            className="border rounded p-2 w-full"
            required
          />
        </div>
        
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700">
            Region
          </label>
          <select
            id="region"
            name="region"
            value={factoryData.region}
            onChange={handleInputChange}
            className="border rounded p-2 w-full"
            required
          >
            <option value="">Select a region</option>
            {regions.map((region, index) => (
              <option key={index} value={region}>{region}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
            Contact Name
          </label>
          <input
            type="text"
            id="contactName"
            name="contactName"
            value={factoryData.contactName}
            onChange={handleInputChange}
            className="border rounded p-2 w-full"
          />
        </div>
        
        <div>
          <label htmlFor="contactMobile" className="block text-sm font-medium text-gray-700">
            Contact Mobile
          </label>
          <input
            type="text"
            id="contactMobile"
            name="contactMobile"
            value={factoryData.contactMobile}
            onChange={handleInputChange}
            className="border rounded p-2 w-full"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={factoryData.email}
            onChange={handleInputChange}
            className="border rounded p-2 w-full"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 mt-6">
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

export default EditFactoryForm;