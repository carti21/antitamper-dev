import React, { useState } from "react";
import { Header } from "@/layouts/header";
import { Sidebar } from "@/components/regional/sidebar";
import { cn } from "@/lib/utils";

interface RegionalLayoutProps {
  children: React.ReactNode;
}

export default function RegionalLayout({ children }: RegionalLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <div className={cn(
                'flex-1 flex flex-col overflow-hidden transition-all duration-300',
                {
                    'lg:ml-64': !isSidebarOpen,
                    'lg:ml-16': isSidebarOpen
                }
            )}>
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    <div className="container mx-auto px-4 py-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
