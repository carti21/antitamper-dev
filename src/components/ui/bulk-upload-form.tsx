import React from "react";
import { Button } from "@/components/ui/button";
import FormHeader from "@/components/forms/formheader";

interface BulkUploadFormProps {
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  title?: string;
  acceptFileTypes?: string;
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onSubmit,
  onClose,
  title = "Bulk Upload",
  acceptFileTypes = ".csv, .xlsx"
}) => {
  const [submitting, setSubmitting] = React.useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(e);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormHeader title={title} onClose={onClose} />
      
      <div className="space-y-2">
        <input
          type="file"
          className="border rounded p-2 w-full bg-white"
          accept={acceptFileTypes}
        />
        <p className="text-xs text-gray-500">
          Accepted file types: {acceptFileTypes}
        </p>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          onClick={onClose} 
          className="bg-gray-500 text-white hover:bg-gray-600"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-[#4588B2] text-white hover:bg-[#3a7a9e]"
          disabled={submitting}
        >
          {submitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
              Uploading...
            </span>
          ) : (
            'Upload'
          )}
        </Button>
      </div>
    </form>
  );
};

export default BulkUploadForm;
