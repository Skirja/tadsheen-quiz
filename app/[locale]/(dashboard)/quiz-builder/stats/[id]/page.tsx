"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface QuizAttempt {
    id: string;
    user_full_name: string;
    score: number;
    created_at: string;
}

interface Quiz {
    id: string;
    title: string;
    total_attempts: number;
}

export default function QuizStatsPage() {
    const t = useTranslations("dashboard.stats");
    const params = useParams();
    const quizId = params.id as string;
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const supabase = createClient();

                // Fetch quiz data
                const { data: quizData, error: quizError } = await supabase
                    .from('quizzes')
                    .select('id, title, total_attempts')
                    .eq('id', quizId)
                    .single();

                if (quizError) throw quizError;
                if (!quizData) throw new Error('Quiz not found');

                setQuiz(quizData);

                // Fetch attempts data
                const { data: attemptsData, error: attemptsError } = await supabase
                    .from('quiz_attempts')
                    .select('id, user_full_name, score, created_at')
                    .eq('quiz_id', quizId)
                    .eq('status', 'completed')
                    .order('created_at', { ascending: false });

                if (attemptsError) throw attemptsError;

                setAttempts(attemptsData || []);
            } catch {
                toast.error(t("errors.loadError"));
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [quizId, t]);

    const handleShare = async () => {
        try {
            const baseUrl = window.location.origin;
            const locale = params.locale as string;
            const quizUrl = `${baseUrl}/${locale}/quiz/${quizId}`;

            await navigator.clipboard.writeText(quizUrl);
            toast.success(t("shareSuccess"));
        } catch {
            toast.error(t("errors.shareError"));
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <p className="text-muted-foreground">{t("loading")}</p>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <p className="text-muted-foreground">{t("errors.notFound")}</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-start justify-center bg-background p-8">
            <div className="w-full max-w-5xl space-y-8">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-4">
                        <h1 className="text-3xl font-bold">{quiz.title}</h1>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleShare}
                            title={t("shareQuiz")}
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="mt-2 text-muted-foreground">
                        {t("totalAttempts", { count: quiz.total_attempts })}
                    </p>
                </div>

                <Card className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("table.participant")}</TableHead>
                                <TableHead>{t("table.score")}</TableHead>
                                <TableHead>{t("table.completedAt")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attempts.map((attempt) => (
                                <TableRow key={attempt.id}>
                                    <TableCell>{attempt.user_full_name}</TableCell>
                                    <TableCell>{attempt.score}%</TableCell>
                                    <TableCell>
                                        {new Date(attempt.created_at).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {attempts.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={3}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        {t("noAttempts")}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
} 