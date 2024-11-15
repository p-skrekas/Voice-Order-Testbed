import { CassetteTape, Home, AudioWaveform, Cog, MessageCircle, LogOut } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar"

import { Button } from "../ui/button";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Synthetic Voice Dataset",
    url: "/synthetic-voice-orders",
    icon: AudioWaveform,
  },
  {
    title: "Recorded Voices",
    url: "/recorded-voices",
    icon: CassetteTape,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageCircle,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Cog,
  },
  // {
  //   title: "Transcription Benchmarking",
  //   url: "/transcription-benchmarking",
  //   icon: FlaskConical,
  // },
  // {
  //   title: "Settings",
  //   url: "#",
  //   icon: Settings,
  // },
]

interface AppSidebarProps {
  onLogout: () => void;
}

export function AppSidebar({ onLogout }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[1.1rem] font-bold mb-3">
            Mouhalis Voice Order
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="flex p-3">
        <Button variant="destructive" onClick={onLogout} className="w-full">
          <LogOut />
          Logout
        </Button>
      </div>
    </Sidebar>
  )
}
