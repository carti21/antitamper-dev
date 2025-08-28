import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FormHeaderProps {
  title: string;
  onClose: () => void;
}

const FormHeader: React.FC<FormHeaderProps> = ({ title, onClose }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <Button className="bg-transparent text-gray-500 p-2 hover:bg-transparent focus:bg-transparent active:bg-transparent" onClick={onClose}>
        <X className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default FormHeader;