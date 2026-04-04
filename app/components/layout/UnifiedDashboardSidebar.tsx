"use client";

import CollapsibleSidebar, {
  SidebarItem,
} from "@/app/components/layout/CollapsibleSidebar";
import { useSession } from "@/lib/auth-client";
import { isAdminRole, isUserBanned } from "@/lib/session-utils";
import AddBoxIcon from "@mui/icons-material/AddBox";
import ListAltIcon from "@mui/icons-material/ListAlt";
import HomeIcon from "@mui/icons-material/Home";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InboxIcon from "@mui/icons-material/Inbox";
import CommentIcon from "@mui/icons-material/Comment";
import CampaignIcon from "@mui/icons-material/Campaign";
import CategoryIcon from "@mui/icons-material/Category";
import PersonIcon from "@mui/icons-material/Person";
import PeopleIcon from "@mui/icons-material/People";

export default function UnifiedDashboardSidebar() {
  const { data: session } = useSession();
  const isAdmin = isAdminRole(session);
  const banned = isUserBanned(session);

  // Menu items based on role
  const menuItems: SidebarItem[] = [
    // Regular user items (hidden if admin)
    ...(!isAdmin
      ? [
          ...(banned
            ? []
            : [
                {
                  text: "ฝากลงมังงะ",
                  href: "/dashboard/submit",
                  icon: <AddBoxIcon />,
                },
              ]),
          {
            text: "รายการของฉัน",
            href: "/dashboard/submissions",
            icon: <ListAltIcon />,
          },
        ]
      : []),

    // Admin-only items
    ...(isAdmin
      ? [
          {
            text: "ภาพรวม",
            href: "/dashboard/admin",
            icon: <DashboardIcon />,
          },
          {
            text: "จัดการมังงะ",
            href: "/dashboard/admin/manga",
            icon: <CategoryIcon />,
          },
          {
            text: "การฝากลง",
            href: "/dashboard/admin/submissions",
            icon: <InboxIcon />,
          },
          {
            text: "คอมเมนต์",
            href: "/dashboard/admin/comments",
            icon: <CommentIcon />,
          },
          {
            text: "โฆษณา",
            href: "/dashboard/admin/advertisements",
            icon: <CampaignIcon />,
          },
          {
            text: "หมวดหมู่",
            href: "/dashboard/admin/metadata",
            icon: <CategoryIcon />,
          },
          {
            text: "ผู้แต่ง",
            href: "/dashboard/admin/authors",
            icon: <PersonIcon />,
          },
          {
            text: "ผู้ใช้",
            href: "/dashboard/admin/users",
            icon: <PeopleIcon />,
          },
        ]
      : []),
  ];

  const bottomItems: SidebarItem[] = [
    { text: "กลับหน้าหลัก", href: "/", icon: <HomeIcon /> },
  ];

  const title = isAdmin ? "MAGGA Admin" : "MAGGA Workspace";

  return (
    <CollapsibleSidebar
      title={title}
      items={menuItems}
      bottomItems={bottomItems}
      storageKey="unified-dashboard-sidebar-collapsed"
      session={session ?? null}
      banned={banned}
    />
  );
}
