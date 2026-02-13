import { UserMenu } from "@/components/auth/user-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import Link from "next/link";
import { Package, ClipboardList, User, LayoutDashboard } from "lucide-react";

const supplierNavItems = [
  { href: "/supplier", label: "Dashboard", icon: LayoutDashboard },
  { href: "/supplier/surveys", label: "Anketlerim", icon: ClipboardList },
  { href: "/supplier/goods", label: "Mallarim", icon: Package },
  { href: "/supplier/profile", label: "Profilim", icon: User },
];

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/supplier" className="font-bold text-lg">
              Ecosfer SKDM - Tedarikci Portali
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {supplierNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto p-6">{children}</main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Ecosfer SKDM Platform v2.0 - Tedarikci Portali
      </footer>
    </div>
  );
}
