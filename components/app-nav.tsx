"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Car, LayoutDashboard, Package, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSwipeable } from "react-swipeable";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/inventory", icon: Package, label: "Inventory" },
    { href: "/reports", icon: FileText, label: "Tax Reports" },
];

export function AppNav({ children, companyName = "Bitgard" }: { children: React.ReactNode, companyName?: string }) {
    const pathname = usePathname();
    const router = useRouter();

    const handlers = useSwipeable({
        onSwipedLeft: () => {
            const currentIndex = navItems.findIndex(item => item.href === pathname);
            if (currentIndex !== -1 && currentIndex < navItems.length - 1) {
                router.push(navItems[currentIndex + 1].href);
            }
        },
        onSwipedRight: () => {
            const currentIndex = navItems.findIndex(item => item.href === pathname);
            if (currentIndex !== -1 && currentIndex > 0) {
                router.push(navItems[currentIndex - 1].href);
            }
        },
        trackMouse: true
    });

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 flex-col border-r bg-card print:hidden">
                <div className="p-6 border-b">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="p-2 bg-primary rounded-lg">
                            <Car className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">{companyName}</h1>
                            <p className="text-xs text-muted-foreground">Authorized Dealer</p>
                        </div>
                    </Link>
                </div>
                <nav className="flex-1 p-4 flex flex-col gap-4">
                    <ul className="space-y-2 flex-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Settings at Bottom */}
                    <Link
                        href="/settings"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mt-auto",
                            pathname === '/settings'
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <Settings className="h-5 w-5" />
                        Settings
                    </Link>
                </nav>
                <div className="p-4 border-t">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                        <Image src="/logo.png" alt="Bitgard" width={20} height={20} className="object-contain" />
                        <span>Verified by Bitgard</span>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="flex flex-col flex-1" {...handlers}>
                <header className="md:hidden flex items-center justify-between p-4 border-b bg-card print:hidden sticky top-0 z-50">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary rounded-lg">
                            <Car className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold">{companyName}</span>
                    </Link>
                    <nav className="flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary border border-primary/20"
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="sr-only">{item.label}</span>
                                </Link>
                            );
                        })}

                        {/* Divider */}
                        <div className="h-6 w-px bg-border/60 mx-1" />

                        <Link
                            href="/settings"
                            className={cn(
                                "p-2 rounded-lg transition-colors",
                                pathname === '/settings'
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                        >
                            <Settings className="h-5 w-5" />
                            <span className="sr-only">Settings</span>
                        </Link>

                        <ThemeToggle />
                    </nav>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
