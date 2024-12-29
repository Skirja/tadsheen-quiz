"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

interface SearchBarProps {
    onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
    const t = useTranslations("landing.search");

    return (
        <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="search"
                placeholder={t("placeholder")}
                className="pl-10"
                onChange={(e) => onSearch(e.target.value)}
            />
        </div>
    );
} 