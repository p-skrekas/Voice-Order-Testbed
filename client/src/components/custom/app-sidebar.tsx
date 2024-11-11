import { CassetteTape , Home, AudioWaveform , FlaskConical , Settings } from "lucide-react"

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
    url: "/test-catalog",
    icon: AudioWaveform ,
  },
  {
    title: "Recorded Voices",
    url: "/recorded-voices",
    icon: CassetteTape ,
  },
  {
    title: "Transcription Benchmarking",
    url: "/transcription-benchmarking",
    icon: FlaskConical,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
]

interface AppSidebarProps {
  onLogout: () => void;
}

export function AppSidebar({ onLogout }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
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
      <Button onClick={onLogout}>Logout</Button>
    </Sidebar>
  )
}
