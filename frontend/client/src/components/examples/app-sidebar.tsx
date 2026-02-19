import { AppSidebar } from "../app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Provide required props for the example */}
        <AppSidebar userRole="student" userName="John Doe" onNavigate={() => {}} currentPage="homepage" />
      </div>
    </SidebarProvider>
  );
}
