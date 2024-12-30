"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SearchBar } from "@/components/search-bar";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { createClient } from "@/utils/supabase/client";
import { useParams } from "next/navigation";
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
    user_score?: number;
}

interface DatabaseQuiz {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string | null;
    is_active: boolean;
    created_at: string;
    category_id: string;
    total_attempts: number;
    questions: Question[];
    _count: {
        quiz_attempts: number;
    };
}

interface DatabaseQuizAttempt {
    quiz_id: string;
    score: number;
    quiz: DatabaseQuiz;
}

interface DatabaseQuizCategory {
    id: string;
    name: string;
    quizzes: DatabaseQuiz[];
}

interface Category {
    id: string;
    name: string;
    quizzes: Quiz[];
}

export default function LandingPage() {
    const t = useTranslations("landing");
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
    const [popularCategories, setPopularCategories] = useState<Category[]>([]);
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

                // Fetch user's recent quiz attempts if logged in
                let userRecentQuizzes: Quiz[] = [];
                if (user) {
                    const { data } = await supabase
                        .from('quiz_attempts')
                        .select(`
                            quiz_id,
                            score,
                            quiz:quizzes (
                                id,
                                title,
                                description,
                                thumbnail_url,
                                is_active,
                                created_at,
                                questions!inner (id),
                                total_attempts
                            )
                        `)
                        .eq('user_id', user.id)
                        .eq('status', 'completed')
                        .order('created_at', { ascending: false })
                        .limit(3);

                    if (data) {
                        const attempts = data as unknown as DatabaseQuizAttempt[];
                        userRecentQuizzes = attempts.map(attempt => ({
                            ...attempt.quiz,
                            questions: attempt.quiz.questions || [],
                            _count: {
                                quiz_attempts: attempt.quiz.total_attempts || 0
                            },
                            user_score: attempt.score
                        }));
                    }
                }

                setRecentQuizzes(userRecentQuizzes);

                // First, fetch all active and published quizzes
                const { data: activeQuizzes } = await supabase
                    .from('quizzes')
                    .select(`
                        id,
                        title,
                        description,
                        thumbnail_url,
                        is_active,
                        created_at,
                        category_id,
                        total_attempts,
                        questions!inner (id)
                    `)
                    .eq('is_active', true)
                    .eq('status', 'published')
                    .order('total_attempts', { ascending: false });

                if (activeQuizzes) {
                    // Then, fetch all categories
                    const { data: categories } = await supabase
                        .from('quiz_categories')
                        .select('id, name')
                        .order('name');

                    if (categories) {
                        // Group quizzes by category
                        const quizzesByCategory = categories.map(category => {
                            const categoryQuizzes = (activeQuizzes as any[])
                                .filter(quiz => quiz.category_id === category.id)
                                .map(quiz => ({
                                    id: quiz.id,
                                    title: quiz.title,
                                    description: quiz.description,
                                    thumbnail_url: quiz.thumbnail_url,
                                    is_active: quiz.is_active,
                                    created_at: quiz.created_at,
                                    category_id: quiz.category_id,
                                    questions: quiz.questions,
                                    _count: {
                                        quiz_attempts: quiz.total_attempts
                                    }
                                } as DatabaseQuiz))
                                .slice(0, 4); // Get top 4 quizzes per category

                            return {
                                id: category.id,
                                name: category.name,
                                quizzes: categoryQuizzes
                            };
                        });

                        // Only keep categories that have quizzes
                        const categoriesWithQuizzes = quizzesByCategory
                            .filter(category => category.quizzes.length > 0)
                            .slice(0, 4); // Get top 4 categories

                        setPopularCategories(categoriesWithQuizzes);
                    }
                }
            } catch (error) {
                console.error('Error fetching quizzes:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizzes();
    }, [user]); // Re-fetch when user changes

    const handleSearch = (query: string) => {
        // Implement search functionality
        console.log("Searching for:", query);
    };

    const handleStartQuiz = (quizId: string, name?: string) => {
        if (!user && !name) return;
        router.push(`/${locale}/quiz/${quizId}?name=${encodeURIComponent(name || user?.user_metadata?.full_name || '')}`);
    };

    const handleCreateQuiz = () => {
        if (!user) {
            router.push(`/${locale}/sign-in`);
        } else {
            router.push(`/${locale}/quiz-builder/`);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex-1 ltr:mr-4 rtl:ml-4">
                        <SearchBar onSearch={handleSearch} />
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                        <Button variant="default" onClick={handleCreateQuiz}>
                            {t("buttons.createQuiz")}
                        </Button>
                        <ModeToggle />
                        <LanguageToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Recent Quizzes Section - Only show if user has taken quizzes */}
                {recentQuizzes.length > 0 && (
                    <section className="mb-12">
                        <h2 className="mb-6 text-2xl font-bold">
                            {t("sections.recentQuizzes.title")}
                        </h2>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {recentQuizzes.map((quiz) => (
                                <QuizCard
                                    key={quiz.id}
                                    title={quiz.title}
                                    thumbnail={quiz.thumbnail_url || '/images/placeholder.jpg'}
                                    questionsCount={quiz.questions.length}
                                    attemptsCount={quiz._count.quiz_attempts}
                                    onStart={(name) => handleStartQuiz(quiz.id, name)}
                                    isLoggedIn={!!user}
                                    userScore={quiz.user_score}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Popular Categories Sections */}
                {!isLoading && popularCategories.map((category) => (
                    <section key={category.id} className="mb-12">
                        <h2 className="mb-6 text-2xl font-bold">
                            {category.name}
                        </h2>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {category.quizzes.map((quiz) => (
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
                        </div>
                    </section>
                ))}
            </main>
        </div>
    );
} 