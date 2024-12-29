"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SearchBar } from "@/components/search-bar";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";

// Mock data - replace with actual data from your backend
const recentQuizzes = [
    {
        id: 1,
        title: "Basic Mathematics",
        thumbnail: "/images/math.jpg",
        questionsCount: 10,
        attemptsCount: 150,
        userScore: 85,
    },
    {
        id: 2,
        title: "Advanced Physics",
        thumbnail: "/images/physics.jpg",
        questionsCount: 15,
        attemptsCount: 120,
        userScore: 92,
    },
    {
        id: 3,
        title: "Chemistry Basics",
        thumbnail: "/images/chemistry.jpg",
        questionsCount: 12,
        attemptsCount: 200,
        userScore: 78,
    },
];

const popularCategories = [
    {
        id: 1,
        name: "Mathematics",
        quizzes: [
            {
                id: 1,
                title: "Algebra Fundamentals",
                thumbnail: "/images/algebra.jpg",
                questionsCount: 8,
                attemptsCount: 300,
            },
            {
                id: 2,
                title: "Geometry Basics",
                thumbnail: "/images/geometry.jpg",
                questionsCount: 12,
                attemptsCount: 250,
            },
            {
                id: 3,
                title: "Calculus Introduction",
                thumbnail: "/images/calculus.jpg",
                questionsCount: 15,
                attemptsCount: 180,
            },
            {
                id: 4,
                title: "Statistics 101",
                thumbnail: "/images/statistics.jpg",
                questionsCount: 10,
                attemptsCount: 220,
            },
        ],
    },
    // Add more categories here (max 4)
];

const isLoggedIn = false; // Replace with actual auth state

export default function LandingPage() {
    const t = useTranslations("landing");
    const router = useRouter();

    const handleSearch = (query: string) => {
        // Implement search functionality
        console.log("Searching for:", query);
    };

    const handleStartQuiz = (quizId: number, name?: string) => {
        if (!isLoggedIn && !name) return;
        // Implement quiz start functionality
        console.log("Starting quiz:", quizId, "with name:", name);
    };

    const handleCreateQuiz = () => {
        if (!isLoggedIn) {
            router.push("/en/sign-in"); // Change based on current locale
        } else {
            router.push("/en/quiz-builder"); // Change based on current locale
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
                {/* Recent Quizzes Section */}
                <section className="mb-12">
                    <h2 className="mb-6 text-2xl font-bold">
                        {t("sections.recentQuizzes.title")}
                    </h2>
                    {recentQuizzes.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {recentQuizzes.map((quiz) => (
                                <QuizCard
                                    key={quiz.id}
                                    title={quiz.title}
                                    thumbnail={quiz.thumbnail}
                                    questionsCount={quiz.questionsCount}
                                    attemptsCount={quiz.attemptsCount}
                                    userScore={quiz.userScore}
                                    onStart={(name) => handleStartQuiz(quiz.id, name)}
                                    isLoggedIn={isLoggedIn}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">
                            {t("sections.recentQuizzes.noQuizzes")}
                        </p>
                    )}
                </section>

                {/* Popular Categories Sections */}
                {popularCategories.map((category) => (
                    <section key={category.id} className="mb-12">
                        <h2 className="mb-6 text-2xl font-bold">
                            {category.name}
                        </h2>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {category.quizzes.map((quiz) => (
                                <QuizCard
                                    key={quiz.id}
                                    title={quiz.title}
                                    thumbnail={quiz.thumbnail}
                                    questionsCount={quiz.questionsCount}
                                    attemptsCount={quiz.attemptsCount}
                                    onStart={(name) => handleStartQuiz(quiz.id, name)}
                                    isLoggedIn={isLoggedIn}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </main>
        </div>
    );
} 