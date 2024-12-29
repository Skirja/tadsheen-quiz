"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";

const languages = [
    { code: "en", name: "English" },
    { code: "ar", name: "العربية" },
];

export function LanguageToggle() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLanguageChange = (languageCode: string) => {
        const currentPath = pathname.split("/").slice(2).join("/");
        router.push(`/${languageCode}/${currentPath}`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Languages className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Change language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((language) => (
                    <DropdownMenuItem
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                    >
                        {language.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 