import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Home,
  LayoutDashboard,
  BookOpen,
  FileText,
  Bell,
  Users,
  Settings,
  GraduationCap,
  ClipboardList,
  BarChart,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import nysLogo from "@assets/generated_images/NYS_Kenya_official_logo_4530e265.png";

interface AppSidebarProps {
  userRole: "student" | "tutor" | "admin";
  userName: string;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function AppSidebar({ userRole, userName, onNavigate, currentPage }: AppSidebarProps) {
  const studentItems = [
    { title: "Home", page: "homepage", icon: Home },
    { title: "Dashboard", page: "dashboard", icon: LayoutDashboard },
    { title: "My Courses", page: "courses", icon: BookOpen },
    { title: "Assignments", page: "assignments", icon: FileText },
    { title: "Announcements", page: "announcements", icon: Bell },
  ];

  const tutorItems = [
    { title: "Home", page: "homepage", icon: Home },
    { title: "Dashboard", page: "dashboard", icon: LayoutDashboard },
    { title: "My Courses", page: "courses", icon: GraduationCap },
    { title: "Assignments", page: "assignments", icon: ClipboardList },
    { title: "Students", page: "students", icon: Users },
    { title: "Analytics", page: "analytics", icon: BarChart },
  ];

  const adminItems = [
    { title: "Home", page: "homepage", icon: Home },
    { title: "Dashboard", page: "dashboard", icon: LayoutDashboard },
    { title: "Users", page: "users", icon: Users },
    { title: "Courses", page: "courses", icon: BookOpen },
    { title: "Analytics", page: "analytics", icon: BarChart },
    { title: "Settings", page: "settings", icon: Settings },
  ];

  const items = userRole === "student" ? studentItems : userRole === "tutor" ? tutorItems : adminItems;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img src={nysLogo} alt="NYS Kenya" className="h-14 w-14 flex-shrink-0" />
          <div>
            <h2 className="font-bold text-lg text-primary">NYS Campus</h2>
            <p className="text-xs text-muted-foreground">Virtual Learning</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    data-testid={`link-sidebar-${item.title.toLowerCase().replace(" ", "-")}`}
                    isActive={currentPage === item.page}
                    onClick={() => onNavigate(item.page)}
                    className="hover-elevate active-elevate-2"
                  >
                    <button>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userName.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
