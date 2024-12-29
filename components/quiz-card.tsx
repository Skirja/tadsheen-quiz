"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { QuizStartDialog } from "./quiz-start-dialog";

interface QuizCardProps {
    title: string;
    thumbnail: string;
    questionsCount: number;
    attemptsCount: number;
    onStart: (name?: string) => void;
    isLoggedIn?: boolean;
    userScore?: number;
}

export function QuizCard({
    title,
    thumbnail,
    questionsCount,
    attemptsCount,
    onStart,
    isLoggedIn = false,
    userScore,
}: QuizCardProps) {
    const t = useTranslations("landing.quizCard");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <Card className="overflow-hidden transition-all hover:shadow-lg">
                <CardHeader className="p-0">
                    <div className="relative aspect-video w-full">
                        <Image
                            src={thumbnail}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-2">{title}</h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{t("questions", { count: questionsCount })}</span>
                        <span>{t("attempts", { count: attemptsCount })}</span>
                        {userScore !== undefined && (
                            <span className="font-medium text-primary">
                                Score: {userScore}
                            </span>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                    <Button onClick={() => setIsDialogOpen(true)} className="w-full">
                        {t("startQuiz")}
                    </Button>
                </CardFooter>
            </Card>
            <QuizStartDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onStart={onStart}
                title={title}
                isLoggedIn={isLoggedIn}
            />
        </>
    );
} 