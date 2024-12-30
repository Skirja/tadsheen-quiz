"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface Question {
    id: string;
}

interface Quiz {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string | null;
    is_active: boolean;
    created_at: string;
    questions: Question[];
    _count: {
        quiz_attempts: number;
    };
}

interface Category {
    id: string;
    name: string;
}

export default function CategoryPage() {
    const t = useTranslations("landing");
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const categoryId = params.id as string;
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [category, setCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const supabase = createClient();

        // Get initial auth state
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const supabase = createClient();

                // Fetch category details
                const { data: categoryData } = await supabase
                    .from('quiz_categories')
                    .select('id, name')
                    .eq('id', categoryId)
                    .single();

                if (categoryData) {
                    setCategory(categoryData);
                }

                // Fetch all active quizzes in this category
                const { data: quizzesData } = await supabase
                    .from('quizzes')
                    .select(`
                        id,
                        title,
                        description,
                        thumbnail_url,
                        is_active,
                        created_at,
                        questions!inner (id),
                        total_attempts
                    `)
                    .eq('category_id', categoryId)
                    .eq('is_active', true)
                    .eq('status', 'published')
                    .order('created_at', { ascending: false });

                if (quizzesData) {
                    const formattedQuizzes = quizzesData.map(quiz => ({
                        ...quiz,
                        questions: quiz.questions || [],
                        _count: {
                            quiz_attempts: quiz.total_attempts || 0
                        }
                    }));
                    setQuizzes(formattedQuizzes);
                }
            } catch (error) {
                console.error('Error fetching quizzes:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizzes();
    }, [categoryId]);

    const handleStartQuiz = (quizId: string, name?: string) => {
        if (!user && !name) return;
        router.push(`/${locale}/quiz/${quizId}?name=${encodeURIComponent(name || user?.user_metadata?.full_name || '')}`);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-muted-foreground">Category not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/${locale}`)}
                        className="mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t("categoryPage.backToHome")}
                    </Button>
                    <h1 className="text-3xl font-bold">{category.name}</h1>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {quizzes.map((quiz) => (
                        <QuizCard
                            key={quiz.id}
                            title={quiz.title}
                            thumbnail={quiz.thumbnail_url || '/images/placeholder.jpg'}
                            questionsCount={quiz.questions.length}
                            attemptsCount={quiz._count.quiz_attempts}
                            onStart={(name) => handleStartQuiz(quiz.id, name)}
                            isLoggedIn={!!user}
                        />
                    ))}
                    {quizzes.length === 0 && (
                        <div className="col-span-full text-center">
                            <p className="text-lg text-muted-foreground">{t("categoryPage.noQuizzes")}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
} 