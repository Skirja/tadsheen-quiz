"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Question {
    id: string;
    question_text: string;
    question_type: 'single_choice' | 'multiple_choice' | 'long_answer';
    question_image_url?: string;
    order_number: number;
    points: number;
    answers?: {
        id: string;
        answer_text: string;
        answer_image_url?: string;
        is_correct: boolean;
        order_number: number;
    }[];
}

interface Quiz {
    id: string;
    title: string;
    description: string;
    thumbnail_url?: string;
    questions: Question[];
}

interface QuizAttempt {
    id: string;
    quiz_id: string;
    user_name: string;
    answers: {
        [questionId: string]: string | string[];
    };
    created_at: string;
}

export default function QuizResultsPage() {
    const t = useTranslations("quizResults");
    const params = useParams();
    const router = useRouter();
    const quizId = params.id as string;
    const attemptId = params.attemptId as string;

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const supabase = createClient();

                // Fetch quiz data
                const { data: quizData, error: quizError } = await supabase
                    .from('quizzes')
                    .select(`
                        id,
                        title,
                        description,
                        thumbnail_url,
                        questions (
                            id,
                            question_text,
                            question_type,
                            question_image_url,
                            order_number,
                            points,
                            answers (
                                id,
                                answer_text,
                                answer_image_url,
                                is_correct,
                                order_number
                            )
                        )
                    `)
                    .eq('id', quizId)
                    .single();

                if (quizError) throw quizError;
                if (!quizData) throw new Error('Quiz not found');

                // Sort questions by order_number
                quizData.questions.sort((a, b) => a.order_number - b.order_number);
                // Sort answers by order_number
                quizData.questions.forEach(question => {
                    if (question.answers) {
                        question.answers.sort((a, b) => a.order_number - b.order_number);
                    }
                });

                setQuiz(quizData);

                // Fetch attempt data
                const { data: attemptData, error: attemptError } = await supabase
                    .from('quiz_attempts')
                    .select('*')
                    .eq('id', attemptId)
                    .single();

                if (attemptError) throw attemptError;
                if (!attemptData) throw new Error('Attempt not found');

                // Fetch responses data
                const { data: responsesData, error: responsesError } = await supabase
                    .from('quiz_responses')
                    .select('*')
                    .eq('attempt_id', attemptId);

                if (responsesError) throw responsesError;

                // Transform responses into answers object
                const answers: { [questionId: string]: string | string[] } = {};
                responsesData.forEach(response => {
                    if (response.text_response) {
                        answers[response.question_id] = response.text_response;
                    } else if (answers[response.question_id]) {
                        // If already has answer, it's multiple choice
                        if (Array.isArray(answers[response.question_id])) {
                            (answers[response.question_id] as string[]).push(response.answer_id);
                        } else {
                            answers[response.question_id] = [answers[response.question_id] as string, response.answer_id];
                        }
                    } else {
                        // Single choice or first answer of multiple choice
                        answers[response.question_id] = response.answer_id;
                    }
                });

                setAttempt({
                    ...attemptData,
                    answers,
                    user_name: attemptData.user_full_name
                });
            } catch (error) {
                console.error('Error fetching results:', error);
                toast.error(t("errors.loadError"));
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [quizId, attemptId, t]);

    const calculateScore = () => {
        if (!quiz || !attempt) return 0;

        let totalPoints = 0;
        let earnedPoints = 0;

        quiz.questions.forEach(question => {
            const userAnswer = attempt.answers[question.id];
            if (!userAnswer) return;

            totalPoints += question.points;

            if (question.question_type === 'long_answer') {
                // Long answer questions need manual grading
                return;
            }

            if (question.answers) {
                if (question.question_type === 'single_choice') {
                    const correctAnswer = question.answers.find(a => a.is_correct);
                    if (correctAnswer && userAnswer === correctAnswer.id) {
                        earnedPoints += question.points;
                    }
                } else if (question.question_type === 'multiple_choice') {
                    const correctAnswers = question.answers.filter(a => a.is_correct).map(a => a.id);
                    const userAnswers = userAnswer as string[];
                    if (
                        correctAnswers.length === userAnswers.length &&
                        correctAnswers.every(id => userAnswers.includes(id))
                    ) {
                        earnedPoints += question.points;
                    }
                }
            }
        });

        return Math.round((earnedPoints / totalPoints) * 100);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">{t("loading")}</h1>
                </div>
            </div>
        );
    }

    if (!quiz || !attempt) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">{t("errors.notFound")}</h1>
                </div>
            </div>
        );
    }

    const score = calculateScore();

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8">
                {/* Results Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">{quiz.title}</h1>
                    <p className="mt-2 text-muted-foreground">{quiz.description}</p>
                </div>

                {/* Score Card */}
                <Card className="mb-8 p-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold">{t("score")}</h2>
                        <div className="mt-4 text-4xl font-bold text-primary">
                            {score}%
                        </div>
                        <p className="mt-2 text-muted-foreground">
                            {t("completedBy", { name: attempt.user_name })}
                        </p>
                    </div>
                </Card>

                {/* Questions Review */}
                <div className="space-y-8">
                    {quiz.questions.map((question, index) => {
                        const userAnswer = attempt.answers[question.id];
                        let isCorrect = false;

                        if (question.question_type === 'single_choice' && question.answers) {
                            const correctAnswer = question.answers.find(a => a.is_correct);
                            isCorrect = correctAnswer?.id === userAnswer;
                        } else if (question.question_type === 'multiple_choice' && question.answers) {
                            const correctAnswers = question.answers.filter(a => a.is_correct).map(a => a.id);
                            const userAnswers = userAnswer as string[];
                            isCorrect = correctAnswers.length === userAnswers?.length &&
                                correctAnswers.every(id => userAnswers.includes(id));
                        }

                        return (
                            <Card key={question.id} className="p-6">
                                <div className="space-y-4">
                                    {/* Question */}
                                    <div>
                                        <h3 className="text-xl font-semibold">
                                            {t("question")} {index + 1}
                                            {question.question_type !== 'long_answer' && (
                                                <span className={`ml-2 text-sm ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                                    {isCorrect ? t("correct") : t("incorrect")}
                                                </span>
                                            )}
                                        </h3>
                                        <p className="mt-2">{question.question_text}</p>
                                    </div>

                                    {/* Question Image */}
                                    {question.question_image_url && (
                                        <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-lg">
                                            <Image
                                                src={question.question_image_url}
                                                alt="Question"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    )}

                                    {/* Answer Review */}
                                    <div className="rounded-lg border p-4">
                                        <h4 className="mb-2 font-medium">{t("yourAnswer")}:</h4>
                                        {question.question_type === 'single_choice' && question.answers && (
                                            <div>
                                                {question.answers.map(answer => (
                                                    <div
                                                        key={answer.id}
                                                        className={`mb-2 rounded-lg p-2 ${answer.id === userAnswer
                                                            ? answer.is_correct
                                                                ? 'bg-green-100 dark:bg-green-900'
                                                                : 'bg-red-100 dark:bg-red-900'
                                                            : answer.is_correct
                                                                ? 'bg-green-50 dark:bg-green-950'
                                                                : ''
                                                            }`}
                                                    >
                                                        <p>{answer.answer_text}</p>
                                                        {answer.answer_image_url && (
                                                            <div className="relative mt-2 aspect-video w-full max-w-sm overflow-hidden rounded-lg">
                                                                <Image
                                                                    src={answer.answer_image_url}
                                                                    alt="Answer"
                                                                    fill
                                                                    className="object-contain"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {question.question_type === 'multiple_choice' && question.answers && (
                                            <div>
                                                {question.answers.map(answer => (
                                                    <div
                                                        key={answer.id}
                                                        className={`mb-2 rounded-lg p-2 ${(userAnswer as string[])?.includes(answer.id)
                                                            ? answer.is_correct
                                                                ? 'bg-green-100 dark:bg-green-900'
                                                                : 'bg-red-100 dark:bg-red-900'
                                                            : answer.is_correct
                                                                ? 'bg-green-50 dark:bg-green-950'
                                                                : ''
                                                            }`}
                                                    >
                                                        <p>{answer.answer_text}</p>
                                                        {answer.answer_image_url && (
                                                            <div className="relative mt-2 aspect-video w-full max-w-sm overflow-hidden rounded-lg">
                                                                <Image
                                                                    src={answer.answer_image_url}
                                                                    alt="Answer"
                                                                    fill
                                                                    className="object-contain"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {question.question_type === 'long_answer' && (
                                            <div className="space-y-4">
                                                <p className="whitespace-pre-wrap">{userAnswer as string}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/${params.locale}`)}
                    >
                        {t("backToHome")}
                    </Button>
                    <Button
                        onClick={() => router.push(`/${params.locale}/quiz/${quizId}`)}
                    >
                        {t("retakeQuiz")}
                    </Button>
                </div>
            </main>
        </div>
    );
} 