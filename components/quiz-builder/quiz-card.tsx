"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, BarChart2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface QuizCardProps {
    id: string;
    title: string;
    description: string;
    thumbnail_url?: string;
    is_active: boolean;
    participant_count: number;
    created_at: string;
    locale: string;
}

export function QuizCard({
    id,
    title,
    description,
    thumbnail_url,
    is_active,
    participant_count,
    created_at,
    locale
}: QuizCardProps) {
    const t = useTranslations("dashboard.quizCard");
    const router = useRouter();

    const timeAgo = (date: string) => {
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (diffInSeconds < 60) return t("created", { timeAgo: `${diffInSeconds}s` });
        if (diffInSeconds < 3600) return t("created", { timeAgo: `${Math.floor(diffInSeconds / 60)}m` });
        if (diffInSeconds < 86400) return t("created", { timeAgo: `${Math.floor(diffInSeconds / 3600)}h` });
        return t("created", { timeAgo: `${Math.floor(diffInSeconds / 86400)}d` });
    };

    return (
        <Card className="overflow-hidden">
            {thumbnail_url && (
                <div className="relative aspect-video w-full">
                    <Image
                        src={thumbnail_url}
                        alt={title}
                        fill
                        className="object-cover"
                    />
                </div>
            )}
            <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                    <Badge variant={is_active ? "default" : "secondary"}>
                        {is_active ? t("active") : t("inactive")}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                        {timeAgo(created_at)}
                    </span>
                </div>
                <h3 className="mb-1 line-clamp-1 text-lg font-semibold">{title}</h3>
                <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                    {description}
                </p>
                <div className="mb-4 text-sm text-muted-foreground">
                    {t("participants", { count: participant_count })}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/${locale}/quiz-builder/edit/${id}`)}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        {t("edit")}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/${locale}/quiz-builder/stats/${id}`)}
                    >
                        <BarChart2 className="mr-2 h-4 w-4" />
                        {t("stats")}
                    </Button>
                </div>
            </div>
        </Card>
    );
} 