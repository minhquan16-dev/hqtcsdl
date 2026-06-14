import { Link, useLocation } from "react-router";
import { ActivityIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SidebarSettingsPopover } from "./SidebarSettingsPopover";

function isNavItemActive(pathname, itemPath) {
  if (itemPath === "/") return pathname === "/";
  return pathname.startsWith(itemPath);
}

export function AppSidebar() {
  const { pathname } = useLocation();

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-sidebar-border/70 bg-sidebar"
    >
      <SidebarHeader className="border-b border-sidebar-border/70 bg-sidebar-accent/55 p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-3">
        <div className="group/header-toggle flex items-center gap-2 group-data-[collapsible=icon]:relative group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center">
          <Link
            to="/"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:inset-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:opacity-100 group-hover/header-toggle:group-data-[collapsible=icon]:opacity-0"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground">
              <ActivityIcon />
            </span>
            <span className="truncate group-data-[collapsible=icon]:hidden">
              ITMP
            </span>
          </Link>
          <SidebarTrigger className="shrink-0 text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:inset-0 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:opacity-0 group-hover/header-toggle:group-data-[collapsible=icon]:opacity-100" />
        </div>
      </SidebarHeader>

      <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />

      <SidebarContent className="px-2 py-3 group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="px-2 group-data-[collapsible=icon]:px-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(pathname, item.path);

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "rounded-xl px-2.5 text-sidebar-foreground hover:bg-sidebar-accent/90 hover:text-sidebar-accent-foreground data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground",
                        "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
                      )}
                    >
                      <Link to={item.path}>
                        <Icon />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 bg-black/10 p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <SidebarSettingsPopover />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
