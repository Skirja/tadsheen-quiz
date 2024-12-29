"use client";

import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { QuizGrid } from "@/components/dashboard/quiz-grid";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

// Mock data - replace with actual data from your backend
const mockQuizzes = [
    {
        id: 1,
        title: "Basic Mathematics",
        thumbnail: "/images/math.jpg",
        totalParticipants: 150,
        isActive: true,
        createdAt: "2024-01-01",
    },
    {
        id: 2,
        title: "Advanced Physics",
        thumbnail: "/images/physics.jpg",
        totalParticipants: 75,
        isActive: true,
        createdAt: "2024-01-02",
    },
    // Add more mock quizzes as needed
];

export default function QuizBuilderDashboard() {
    const t = useTranslations("dashboard");
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;

    const handleCreateQuiz = () => {
        router.push(`/${locale}/quiz-builder/create`);
    };

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{t("title")}</h1>
                        <p className="mt-1 text-muted-foreground">
                            {t("subtitle")}
                        </p>
                    </div>
                    <Button onClick={handleCreateQuiz} size="lg">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("createQuiz")}
                    </Button>
                </div>

                {mockQuizzes.length > 0 ? (
                    <QuizGrid quizzes={mockQuizzes} />
                ) : (
                    <EmptyState
                        title={t("emptyState.title")}
                        description={t("emptyState.description")}
                        action={
                            <Button onClick={handleCreateQuiz} size="lg">
                                <Plus className="mr-2 h-4 w-4" />
                                {t("createQuiz")}
                            </Button>
                        }
                    />
                )}
            </main>
        </div>
    );
} 