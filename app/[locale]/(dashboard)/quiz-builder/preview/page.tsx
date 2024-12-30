"use client";

import { useEffect, useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface Question {
    question_text: string;
    question_type: 'single_choice' | 'multiple_choice' | 'long_answer';
    question_image_url?: string;
    order_number: number;
    points: number;
    answers?: Array<{
        answer_text: string;
        answer_image_url?: string;
        is_correct: boolean;
        order_number: number;
    }>;
    reference_answer?: string;
}

interface QuizPreview {
    title: string;
    description: string;
    category_id: string;
    thumbnail_url?: string;
    is_active: boolean;
    questions: Question[];
}

function PreviewQuizContent() {
    const t = useTranslations("dashboard.createQuiz");
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const locale = params.locale as string;
    const previewId = searchParams.get('id');
    const sourceQuizId = searchParams.get('source_quiz_id');
    const [quizData, setQuizData] = useState<QuizPreview | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    useEffect(() => {
        const fetchPreviewData = async () => {
            try {
                if (!previewId) {
                    throw new Error('Preview ID is required');
                }

                const response = await fetch(`/api/quiz/preview?id=${previewId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch preview data');
                }

                const data = await response.json();
                setQuizData(data);
            } catch (error) {
                console.error('Error fetching preview data:', error);
                toast.error(t("previewError"));
                router.push(`/${locale}/quiz-builder/create`);
            }
        };

        fetchPreviewData();
    }, [previewId, locale, router, t]);

    const handleBackToEdit = () => {
        if (sourceQuizId) {
            router.push(`/${locale}/quiz-builder/edit/${sourceQuizId}?preview=${previewId}`);
        } else {
            router.push(`/${locale}/quiz-builder/create?preview=${previewId}`);
        }
    };

    if (!quizData) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">{t("loading")}</h1>
                </div>
            </div>
        );
    }

    const currentQuestion = quizData.questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={handleBackToEdit}
                        className="mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t("backToEdit")}
                    </Button>
                    <div className="flex items-start gap-8">
                        {/* Quiz Info */}
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold">{quizData.title}</h1>
                            <p className="mt-2 text-muted-foreground">
                                {quizData.description}
                            </p>
                        </div>
                        {/* Thumbnail */}
                        {quizData.thumbnail_url && (
                            <div className="relative aspect-video w-64 overflow-hidden rounded-lg">
                                <Image
                                    src={quizData.thumbnail_url}
                                    alt={quizData.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Quiz Content */}
                <div className="grid gap-8 lg:grid-cols-[240px,1fr]">
                    {/* Question Navigation */}
                    <Card className="h-fit p-4">
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-2">
                            {quizData.questions.map((_, index) => (
                                <Button
                                    key={index}
                                    variant={index === currentQuestionIndex ? "default" : "outline"}
                                    onClick={() => setCurrentQuestionIndex(index)}
                                >
                                    {index + 1}
                                </Button>
                            ))}
                        </div>
                    </Card>

                    {/* Question Content */}
                    <Card className="p-6">
                        <div className="space-y-6">
                            {/* Question Text */}
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {t("question")} {currentQuestionIndex + 1}
                                </h2>
                                <p className="mt-2">{currentQuestion.question_text}</p>
                            </div>

                            {/* Question Image */}
                            {currentQuestion.question_image_url && (
                                <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                                    <Image
                                        src={currentQuestion.question_image_url}
                                        alt="Question"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            )}

                            {/* Answers */}
                            {currentQuestion.question_type !== 'long_answer' ? (
                                <div className="space-y-4">
                                    {currentQuestion.answers?.map((answer, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-start gap-4 rounded-lg border p-4 ${answer.is_correct ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''
                                                }`}
                                        >
                                            <input
                                                type={currentQuestion.question_type === 'single_choice' ? 'radio' : 'checkbox'}
                                                name={`question-${currentQuestionIndex}`}
                                                disabled
                                                checked={answer.is_correct}
                                            />
                                            <div className="flex-1 space-y-2">
                                                <p>{answer.answer_text}</p>
                                                {answer.answer_image_url && (
                                                    <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg">
                                                        <Image
                                                            src={answer.answer_image_url}
                                                            alt="Answer"
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="rounded-lg border p-4">
                                        <textarea
                                            className="w-full resize-none rounded-lg border p-2"
                                            rows={4}
                                            placeholder={t("longAnswerPlaceholder")}
                                            disabled
                                        />
                                    </div>
                                    {currentQuestion.reference_answer && (
                                        <div className="rounded-lg border border-green-500 bg-green-50 p-4 dark:bg-green-950">
                                            <h3 className="mb-2 font-medium text-green-700 dark:text-green-300">
                                                {t("form.referenceAnswer")}
                                            </h3>
                                            <p className="text-green-800 dark:text-green-200">
                                                {currentQuestion.reference_answer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Navigation Buttons */}
                <div className="mt-8 flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                    >
                        {t("previousQuestion")}
                    </Button>
                    <Button
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(quizData.questions.length - 1, prev + 1))}
                        disabled={currentQuestionIndex === quizData.questions.length - 1}
                    >
                        {t("nextQuestion")}
                    </Button>
                </div>

                {/* Preview Notice */}
                <div className="mt-8 rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
                    {t("previewNotice")}
                </div>
            </main>
        </div>
    );
}

export default function PreviewQuizPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background">
                <DashboardHeader />
                <main className="container mx-auto px-4 py-8">
                    <div className="flex min-h-[400px] items-center justify-center">
                        <p className="text-lg text-muted-foreground">Loading...</p>
                    </div>
                </main>
            </div>
        }>
            <PreviewQuizContent />
        </Suspense>
    );
} 