"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { QuizCard } from "@/components/quiz-builder/quiz-card";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface Quiz {
    id: string;
    title: string;
    description: string;
    thumbnail_url?: string;
    is_active: boolean;
    created_at: string;
    _count?: {
        quiz_attempts: number;
    };
}

export default function QuizBuilderPage() {
    const t = useTranslations("dashboard");
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const supabase = createClient();

                // Get user session
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push(`/${locale}/sign-in`);
                    return;
                }

                // Fetch quizzes with attempt count
                const { data, error } = await supabase
                    .from('quizzes')
                    .select('*')
                    .eq('creator_id', session.user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Transform the data to match the expected format
                const transformedData = data?.map(quiz => ({
                    ...quiz,
                    _count: {
                        quiz_attempts: quiz.total_attempts || 0
                    }
                }));

                setQuizzes(transformedData || []);
            } catch (error) {
                console.error('Error fetching quizzes:', error);
                toast.error(t("error.fetchQuizzes"));
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizzes();
    }, [locale, router, t]);

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{t("title")}</h1>
                        <p className="text-muted-foreground">{t("subtitle")}</p>
                    </div>
                    <Button
                        onClick={() => router.push(`/${locale}/quiz-builder/create`)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("createQuiz.title")}
                    </Button>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="h-[300px] animate-pulse rounded-lg bg-muted"
                            />
                        ))}
                    </div>
                ) : quizzes.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {quizzes.map((quiz) => (
                            <QuizCard
                                key={quiz.id}
                                id={quiz.id}
                                title={quiz.title}
                                description={quiz.description}
                                thumbnail_url={quiz.thumbnail_url}
                                is_active={quiz.is_active}
                                participant_count={quiz._count?.quiz_attempts || 0}
                                created_at={quiz.created_at}
                                locale={locale}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold">
                                {t("emptyState.title")}
                            </h2>
                            <p className="mt-1 text-muted-foreground">
                                {t("emptyState.description")}
                            </p>
                            <Button
                                className="mt-4"
                                onClick={() =>
                                    router.push(`/${locale}/quiz-builder/create`)
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                {t("createQuiz.title")}
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
} 