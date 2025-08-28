import FormHeader from './formheader';

interface DeactivateFactoryFormProps {
  onClose: () => void;
}

const DeactivateFactoryForm: React.FC<DeactivateFactoryFormProps> = ({ onClose }) => {
  return (
    <form>
      <FormHeader title="Deactivate Factory" onClose={onClose} />
      <p>Are you sure you want to deactivate this factory?</p>
      
      <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
        Reason for deactivation
      </label>
      <textarea
        id="reason"
        name="reason"
        rows={4}
        className="border rounded p-2 w-full"
        placeholder="Enter reason for deactivating the factory..."
      />

      <div className="flex justify-end space-x-2 mt-4">
        <button type="button" className="bg-gray-500 text-white py-2 px-4 rounded" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="bg-red-500 text-white py-2 px-4 rounded">
          Deactivate
        </button>
      </div>
    </form>
  );
};

export default DeactivateFactoryForm;
