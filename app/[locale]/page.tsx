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

interface DatabaseQuizAttemptResponse {
    quiz_id: string;
    score: number;
    quiz: {
        id: string;
        title: string;
        description: string;
        thumbnail_url: string | null;
        is_active: boolean;
        created_at: string;
        questions: Question[];
        total_attempts: number;
    };
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
    const [searchResults, setSearchResults] = useState<Quiz[]>([]);
    const [isSearching, setIsSearching] = useState(false);
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
        if (!isSearching) {
            setSearchResults([]);
        }
    }, [isSearching]);

    useEffect(() => {
        const fetchQuizzes = async () => {
            if (isSearching) {
                return;
            }

            try {
                const supabase = createClient();

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
                        const attempts = data as unknown[] as DatabaseQuizAttemptResponse[];
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
                            const categoryQuizzes = (activeQuizzes as DatabaseQuiz[])
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
                                }))
                                .slice(0, 4);

                            return {
                                id: category.id,
                                name: category.name,
                                quizzes: categoryQuizzes
                            };
                        });

                        // Only keep categories that have quizzes
                        const categoriesWithQuizzes = quizzesByCategory
                            .filter(category => category.quizzes.length > 0)
                            .slice(0, 4);

                        setPopularCategories(categoriesWithQuizzes);
                    }
                }
            } catch {
                // Handle error silently
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizzes();
    }, [user, isSearching]);

    const handleSearch = async (query: string) => {
        if (!query.trim()) {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const supabase = createClient();
            const searchTerm = query.trim();

            // Search in quizzes table with title match
            const { data: searchData } = await supabase
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
                .eq('is_active', true)
                .eq('status', 'published')
                .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
                .order('total_attempts', { ascending: false });

            if (searchData) {
                const formattedResults = searchData.map(quiz => ({
                    id: quiz.id,
                    title: quiz.title,
                    description: quiz.description,
                    thumbnail_url: quiz.thumbnail_url,
                    is_active: quiz.is_active,
                    created_at: quiz.created_at,
                    questions: quiz.questions || [],
                    _count: {
                        quiz_attempts: quiz.total_attempts || 0
                    }
                }));

                setSearchResults(formattedResults);
            } else {
                setSearchResults([]);
            }
        } catch {
            setSearchResults([]);
        }
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
                {/* Search Results */}
                {isSearching && (
                    <section className="mb-12">
                        <h2 className="mb-6 text-2xl font-bold">
                            {searchResults.length > 0 ? t("sections.searchResults.title") : t("sections.searchResults.noResults")}
                        </h2>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {searchResults.map((quiz) => (
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
                )}

                {/* Recent Quizzes Section - Only show if user has taken quizzes and not searching */}
                {!isSearching && recentQuizzes.length > 0 && (
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

                {/* Popular Categories Sections - Only show if not searching */}
                {!isSearching && !isLoading && popularCategories.map((category) => (
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