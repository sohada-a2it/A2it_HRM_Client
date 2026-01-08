"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/common/sidebar";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  
  // Define pages where sidebar should NOT appear
  const noSidebarPages = [
    "/login", 
    "/register", 
    "/forgot-password",
    "/reset-password",
    "/"
  ];
  
  // Check if current path is a no-sidebar page
  const showSidebar = !noSidebarPages.includes(pathname);

  // If it's a login/register page, show without sidebar
  if (!showSidebar) {
    return (
      <div className="h-screen overflow-y-auto bg-gray-50">
        <div className="min-h-full">{children}</div>
      </div>
    );
  }

  // For authenticated pages, show with sidebar
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Fixed Sidebar */}
      <div className="h-screen flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8 min-h-full">
          {children}
        </div>
      </div>
    </div>
  );
}