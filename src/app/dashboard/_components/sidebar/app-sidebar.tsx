"use client";
import Link from "next/link";

import { Settings, CircleHelp, Search, Database, ClipboardList, File, Command } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { useEffect, useState } from "react";

const data = {
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: CircleHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardList,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: File,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [theme, setTheme] = useState<string | null>("dark");
  const { state, isMobile } = useSidebar();

  useEffect(() => {
    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      const isDark = html.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    });

    observer.observe(html, { attributes: true, attributeFilter: ["class"] });

    // Initial detection
    setTheme(html.classList.contains("dark") ? "dark" : "light");

    return () => observer.disconnect();
  }, []);
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          {state === "collapsed" ? 
            <>

            </>
            : (
              <SidebarMenuItem className="flex items-center justify-center gap-3 pb-3 border-b border-border50">
              <div className="flex flex-col  items-center gap-1">
                {/* <div className="relative rounded-xl bg-primary/10 flex items-center justify-center">
                  {theme === "dark" ? (
                    <img
                      src="/light.png"
                      alt="Keshah Logo"
                      className=" w-20 drop-shadow-sm"
                    />
                  ) : (
                  <img
                    src="/dark.png"
                    alt="Keshah Logo"
                    className=" w-20  drop-shadow-sm"
                  />)
                  }
  
                </div> */}
                <div className="text-left">
                  <h1 className="text-lg font-semibold tracking-tight text-foreground">
                  Facture app
                  </h1>
                </div>
              </div>
            </SidebarMenuItem>
            )}


        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>

    </Sidebar>
  );
}
