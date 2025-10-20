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
}

export function AppSidebar({ userRole, userName }: AppSidebarProps) {
  const studentItems = [
    { title: "Dashboard", url: "#", icon: LayoutDashboard },
    { title: "My Courses", url: "#", icon: BookOpen },
    { title: "Assignments", url: "#", icon: FileText },
    { title: "Announcements", url: "#", icon: Bell },
  ];

  const tutorItems = [
    { title: "Dashboard", url: "#", icon: LayoutDashboard },
    { title: "My Courses", url: "#", icon: GraduationCap },
    { title: "Assignments", url: "#", icon: ClipboardList },
    { title: "Students", url: "#", icon: Users },
    { title: "Analytics", url: "#", icon: BarChart },
  ];

  const adminItems = [
    { title: "Dashboard", url: "#", icon: LayoutDashboard },
    { title: "Users", url: "#", icon: Users },
    { title: "Courses", url: "#", icon: BookOpen },
    { title: "Analytics", url: "#", icon: BarChart },
    { title: "Settings", url: "#", icon: Settings },
  ];

  const items = userRole === "student" ? studentItems : userRole === "tutor" ? tutorItems : adminItems;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img src={nysLogo} alt="NYS Kenya" className="h-10 w-10" />
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
                  <SidebarMenuButton asChild data-testid={`link-sidebar-${item.title.toLowerCase().replace(" ", "-")}`}>
                    <a href={item.url} className="hover-elevate active-elevate-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
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
