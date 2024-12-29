"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen">
            {/* Theme and Language Toggles */}
            <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                <ModeToggle />
                <LanguageToggle />
            </div>

            {/* Main Content */}
            <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-6 md:p-10">
                <div className="w-full max-w-sm md:max-w-3xl">
                    {children}
                </div>
            </div>
        </div>
    );
} 