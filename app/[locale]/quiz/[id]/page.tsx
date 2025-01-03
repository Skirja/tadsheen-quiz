"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

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

interface UserAnswers {
    [questionId: string]: string | string[];
}

export default function QuizPage() {
    const t = useTranslations("quiz");
    const params = useParams();
    const searchParams = useSearchParams();
    const quizId = params.id as string;
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showStartDialog, setShowStartDialog] = useState(!searchParams.get('name'));
    const [userName, setUserName] = useState(searchParams.get('name') || "");
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const supabase = createClient();

        // Get initial auth state
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                setUserName(session.user.user_metadata.full_name || "");
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                setUserName(session.user.user_metadata.full_name || "");
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const fetchQuiz = async () => {
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
                        is_active,
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
                    .eq('is_active', true)
                    .eq('status', 'published')
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
            } catch {
                toast.error(t("errors.loadError"));
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuiz();
    }, [quizId, t]);

    const handleStartQuiz = () => {
        if (!userName.trim()) {
            toast.error(t("errors.nameRequired"));
            return;
        }
        setShowStartDialog(false);
    };

    const handleAnswerChange = (questionId: string, answer: string | string[]) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmit = async () => {
        if (!quiz || !userName) return;

        try {
            setIsSubmitting(true);
            const supabase = createClient();

            const { data: attemptData, error: attemptError } = await supabase
                .from('quiz_attempts')
                .insert({
                    quiz_id: quiz.id,
                    user_id: user?.id || null,
                    user_full_name: userName,
                    status: 'completed',
                    time_spent_seconds: 0,
                    completed_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (attemptError) throw attemptError;
            if (!attemptData) throw new Error('Failed to create quiz attempt');

            const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
            let earnedPoints = 0;

            const responses = quiz.questions.map(question => {
                const userAnswer = userAnswers[question.id];

                if (question.question_type === 'long_answer') {
                    return {
                        attempt_id: attemptData.id,
                        question_id: question.id,
                        text_response: userAnswer as string,
                        response_time_seconds: 0,
                        points_earned: 0,
                        is_correct: false
                    };
                } else if (question.question_type === 'multiple_choice') {
                    const answers = userAnswer as string[];
                    const correctAnswers = question.answers?.filter(a => a.is_correct).map(a => a.id) || [];
                    const isFullyCorrect = correctAnswers.length === answers.length &&
                        correctAnswers.every(id => answers.includes(id));

                    return answers.map(answerId => ({
                        attempt_id: attemptData.id,
                        question_id: question.id,
                        answer_id: answerId,
                        response_time_seconds: 0,
                        is_correct: correctAnswers.includes(answerId),
                        points_earned: isFullyCorrect ? question.points : 0
                    }));
                } else {
                    const answerId = userAnswer as string;
                    const isCorrect = question.answers?.find(a => a.id === answerId)?.is_correct || false;
                    if (isCorrect) {
                        earnedPoints += question.points;
                    }

                    return {
                        attempt_id: attemptData.id,
                        question_id: question.id,
                        answer_id: answerId,
                        response_time_seconds: 0,
                        is_correct: isCorrect,
                        points_earned: isCorrect ? question.points : 0
                    };
                }
            }).flat();

            const { error: responsesError } = await supabase
                .from('quiz_responses')
                .insert(responses);

            if (responsesError) throw responsesError;

            const score = Math.round((earnedPoints / totalPoints) * 100);

            const { error: updateError } = await supabase
                .from('quiz_attempts')
                .update({
                    score,
                    time_spent_seconds: 0
                })
                .eq('id', attemptData.id);

            if (updateError) throw updateError;

            toast.success(t("submitSuccess"));
            window.location.href = `/${params.locale}/quiz/${quiz.id}/results/${attemptData.id}`;
        } catch {
            toast.error(t("errors.submitError"));
        } finally {
            setIsSubmitting(false);
        }
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

    if (!quiz) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">{t("errors.notFound")}</h1>
                </div>
            </div>
        );
    }

    if (showStartDialog) {
        return (
            <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{quiz.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-muted-foreground">{quiz.description}</p>
                        {!user && (
                            <Input
                                placeholder={t("enterName")}
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                            />
                        )}
                        <Button className="w-full" onClick={handleStartQuiz}>
                            {t("startQuiz")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const hasAnswered = userAnswers[currentQuestion.id] !== undefined;
    const allQuestionsAnswered = quiz.questions.every(q => userAnswers[q.id] !== undefined);

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8">
                {/* Quiz Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">{quiz.title}</h1>
                    <p className="mt-2 text-muted-foreground">{quiz.description}</p>
                </div>

                {/* Quiz Content */}
                <div className="grid gap-8 lg:grid-cols-[240px,1fr]">
                    {/* Question Navigation */}
                    <Card className="h-fit p-4">
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-2">
                            {quiz.questions.map((_, index) => (
                                <Button
                                    key={index}
                                    variant={index === currentQuestionIndex ? "default" : "outline"}
                                    onClick={() => setCurrentQuestionIndex(index)}
                                    className={userAnswers[quiz.questions[index].id] ? "bg-primary/20" : ""}
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
                                <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-lg">
                                    <Image
                                        src={currentQuestion.question_image_url}
                                        alt="Question"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            )}

                            {/* Answer Options */}
                            <div className="space-y-4">
                                {currentQuestion.question_type === 'single_choice' && currentQuestion.answers && (
                                    <RadioGroup
                                        value={userAnswers[currentQuestion.id] as string || ""}
                                        onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                                    >
                                        {currentQuestion.answers.map((answer) => (
                                            <div key={answer.id} className="flex items-start space-x-3">
                                                <RadioGroupItem value={answer.id} id={answer.id} />
                                                <div className="flex-1 space-y-2">
                                                    <label htmlFor={answer.id} className="text-sm">
                                                        {answer.answer_text}
                                                    </label>
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
                                    </RadioGroup>
                                )}

                                {currentQuestion.question_type === 'multiple_choice' && currentQuestion.answers && (
                                    <div className="space-y-2">
                                        {currentQuestion.answers.map((answer) => (
                                            <div key={answer.id} className="flex items-start space-x-3">
                                                <Checkbox
                                                    id={answer.id}
                                                    checked={(userAnswers[currentQuestion.id] as string[] || []).includes(answer.id)}
                                                    onCheckedChange={(checked) => {
                                                        const currentAnswers = (userAnswers[currentQuestion.id] as string[] || []);
                                                        const newAnswers = checked
                                                            ? [...currentAnswers, answer.id]
                                                            : currentAnswers.filter(id => id !== answer.id);
                                                        handleAnswerChange(currentQuestion.id, newAnswers);
                                                    }}
                                                />
                                                <div className="flex-1 space-y-2">
                                                    <label htmlFor={answer.id} className="text-sm">
                                                        {answer.answer_text}
                                                    </label>
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
                                )}

                                {currentQuestion.question_type === 'long_answer' && (
                                    <Textarea
                                        value={userAnswers[currentQuestion.id] as string || ""}
                                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                        placeholder={t("longAnswerPlaceholder")}
                                        className="min-h-[200px]"
                                    />
                                )}
                            </div>
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
                    {currentQuestionIndex === quiz.questions.length - 1 ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={!allQuestionsAnswered || isSubmitting}
                        >
                            {isSubmitting ? t("submitting") : t("submit")}
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                            disabled={!hasAnswered}
                        >
                            {t("nextQuestion")}
                        </Button>
                    )}
                </div>
            </main>
        </div>
    );
} 