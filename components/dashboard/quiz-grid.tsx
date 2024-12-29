"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, BarChart2, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { enUS, arEG } from "date-fns/locale";

interface Quiz {
    id: number;
    title: string;
    thumbnail: string;
    totalParticipants: number;
    isActive: boolean;
    createdAt: string;
}

interface QuizGridProps {
    quizzes: Quiz[];
}

export function QuizGrid({ quizzes }: QuizGridProps) {
    const t = useTranslations("dashboard.quizCard");
    const params = useParams();
    const locale = params.locale as string;

    const getLocale = () => (locale === "ar" ? arEG : enUS);

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quizzes.map((quiz) => (
                <Card key={quiz.id} className="overflow-hidden transition-shadow duration-200 hover:shadow-lg">
                    <CardHeader className="p-0">
                        <div className="relative aspect-video w-full">
                            <Image
                                src={quiz.thumbnail}
                                alt={quiz.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute right-2 top-2">
                                <Badge variant={quiz.isActive ? "default" : "secondary"}>
                                    {quiz.isActive ? t("active") : t("inactive")}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <h3 className="line-clamp-2 text-lg font-semibold">{quiz.title}</h3>
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {t("participants", { count: quiz.totalParticipants })}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t("created", {
                                timeAgo: formatDistanceToNow(new Date(quiz.createdAt), {
                                    addSuffix: true,
                                    locale: getLocale(),
                                }),
                            })}
                        </p>
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 gap-2 p-4 pt-0">
                        <Button asChild variant="outline" className="w-full">
                            <Link href={`/${locale}/quiz-builder/edit/${quiz.id}`}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                {t("edit")}
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href={`/${locale}/quiz-builder/statistics/${quiz.id}`}>
                                <BarChart2 className="mr-2 h-4 w-4" />
                                {t("stats")}
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
} 