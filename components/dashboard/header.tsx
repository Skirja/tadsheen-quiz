"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { Home, LogOut } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function DashboardHeader() {
    const t = useTranslations("dashboard.header");
    const params = useParams();
    const locale = params.locale as string;
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
            toast.success(t("logoutSuccess"));
            router.push(`/${locale}`);
        } catch {
            toast.error(t("logoutError"));
        }
    };

    return (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link
                    href={`/${locale}`}
                    className="flex items-center gap-2 text-lg font-semibold"
                >
                    <Home className="h-5 w-5" />
                    {t("landingPage")}
                </Link>

                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <LanguageToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="text-muted-foreground hover:text-primary"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="sr-only">{t("logout")}</span>
                    </Button>
                </div>
            </div>
        </header>
    );
} 