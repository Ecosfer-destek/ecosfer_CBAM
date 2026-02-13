"use client";

import { useSession } from "next-auth/react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Building2,
  Factory,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Users,
  Settings,
  LayoutDashboard,
  Flame,
  Package,
  Globe,
  ShieldCheck,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMenuItemsForRole } from "@/lib/auth/roles";
import { UserRole } from "@prisma/client";

interface MenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
  visible: boolean;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

function getMenuGroups(role: UserRole): MenuGroup[] {
  const perms = getMenuItemsForRole(role);

  return [
    {
      label: "Genel",
      items: [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, visible: true },
      ],
    },
    {
      label: "CBAM Yönetimi",
      items: [
        { title: "Şirketler", href: "/dashboard/companies", icon: Building2, visible: perms.showCompanies },
        { title: "Tesisler", href: "/dashboard/installations", icon: Factory, visible: perms.showInstallations },
        { title: "Tesis Verileri", href: "/dashboard/installation-data", icon: FileSpreadsheet, visible: perms.showInstallationData },
        { title: "Emisyonlar", href: "/dashboard/emissions", icon: Flame, visible: perms.showEmissions },
        { title: "Üretim Süreçleri", href: "/dashboard/production-processes", icon: Package, visible: perms.showProductionProcesses },
      ],
    },
    {
      label: "Raporlama",
      items: [
        { title: "CBAM Raporları", href: "/dashboard/reports", icon: FileText, visible: perms.showReports },
        { title: "Yıllık Beyannameler", href: "/dashboard/declarations", icon: Globe, visible: perms.showDeclarations },
        { title: "Doğrulama", href: "/dashboard/verification", icon: ShieldCheck, visible: perms.showVerification },
      ],
    },
    {
      label: "Tedarikçi & AI",
      items: [
        { title: "Tedarikçiler", href: "/dashboard/suppliers", icon: Users, visible: perms.showSuppliers },
        { title: "Tedarikçi Anketi", href: "/dashboard/supplier-survey", icon: ClipboardList, visible: perms.showSupplierPortal },
        { title: "AI Analiz", href: "/dashboard/ai-analysis", icon: BarChart3, visible: perms.showAiAnalysis },
      ],
    },
    {
      label: "Yönetim",
      items: [
        { title: "Ayarlar", href: "/dashboard/settings", icon: Settings, visible: perms.showSettings },
      ],
    },
  ];
}

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = ((session?.user as any)?.role as UserRole) || ("OPERATOR" as UserRole);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantName = (session?.user as any)?.tenantName || "";

  const menuGroups = getMenuGroups(userRole);

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            E
          </div>
          <div>
            <p className="text-sm font-semibold">Ecosfer SKDM</p>
            <p className="text-xs text-muted-foreground">
              {tenantName || "v2.0"}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.visible);
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          pathname === item.href ||
                          (item.href !== "/dashboard" && pathname.startsWith(item.href))
                        }
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          Ecosfer SKDM Platform v2.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
