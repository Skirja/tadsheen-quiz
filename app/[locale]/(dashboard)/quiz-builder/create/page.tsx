"use client";

import { useEffect, useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { QuizForm } from "@/components/quiz-builder/quiz-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface FormData {
    title: string;
    description: string;
    category_id: string;
    thumbnail_url?: string;
    is_active: boolean;
    questions: {
        question_text: string;
        question_type: 'single_choice' | 'multiple_choice' | 'long_answer';
        question_image_url?: string;
        order_number: number;
        points: number;
        answers?: {
            answer_text: string;
            answer_image_url?: string;
            is_correct: boolean;
            order_number: number;
        }[];
        reference_answer?: string;
    }[];
    previewId?: string;
}

function CreateQuizContent() {
    const t = useTranslations("dashboard.createQuiz");
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const locale = params.locale as string;
    const [previewId, setPreviewId] = useState<string | null>(searchParams.get('preview'));
    const [initialData, setInitialData] = useState<FormData | null>(null);
    const [isLoading, setIsLoading] = useState(!!previewId);

    useEffect(() => {
        const loadPreviewData = async () => {
            if (!previewId) return;

            try {
                const response = await fetch(`/api/quiz/preview?id=${previewId}`);
                if (!response.ok) throw new Error('Failed to load preview data');

                const data = await response.json();
                setInitialData(data);
            } catch (error) {
                console.error('Error loading preview data:', error);
                toast.error(t("loadPreviewError"));
            } finally {
                setIsLoading(false);
            }
        };

        loadPreviewData();
    }, [previewId, t]);

    const handleSaveAsDraft = async (data: FormData) => {
        try {
            const supabase = createClient();

            // Get user session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push(`/${locale}/sign-in`);
                return;
            }

            // Save quiz as draft (always inactive)
            const { data: quiz, error: quizError } = await supabase
                .from('quizzes')
                .insert({
                    title: data.title,
                    description: data.description,
                    category_id: data.category_id,
                    thumbnail_url: data.thumbnail_url,
                    is_active: false, // Force inactive for drafts
                    creator_id: session.user.id,
                    status: 'draft',
                })
                .select()
                .single();

            if (quizError) throw quizError;

            // Insert questions and get their IDs
            const { data: insertedQuestions, error: questionsError } = await supabase
                .from('questions')
                .insert(data.questions.map(q => ({
                    quiz_id: quiz.id,
                    question_text: q.question_text,
                    question_type: q.question_type,
                    question_image_url: q.question_image_url,
                    order_number: q.order_number,
                    points: q.points,
                })))
                .select();

            if (questionsError) throw questionsError;

            // Insert answers for each question
            const answersToInsert = data.questions.reduce((acc: Array<{
                question_id: string;
                answer_text: string;
                answer_image_url?: string;
                is_correct: boolean;
                order_number: number;
            }>, question, index) => {
                if (question.question_type === 'long_answer' && question.reference_answer) {
                    // For long answer questions, insert reference answer as a correct answer
                    return [...acc, {
                        question_id: insertedQuestions[index].id,
                        answer_text: question.reference_answer,
                        is_correct: true,
                        order_number: 0,
                    }];
                } else if (question.answers && insertedQuestions?.[index]) {
                    // For choice questions, insert all answer options
                    const questionAnswers = question.answers.map(answer => ({
                        question_id: insertedQuestions[index].id,
                        answer_text: answer.answer_text,
                        answer_image_url: answer.answer_image_url,
                        is_correct: answer.is_correct,
                        order_number: answer.order_number,
                    }));
                    return [...acc, ...questionAnswers];
                }
                return acc;
            }, []);

            if (answersToInsert.length > 0) {
                const { error: answersError } = await supabase
                    .from('answers')
                    .insert(answersToInsert);

                if (answersError) throw answersError;
            }

            toast.success(t("draftSaved"));
            router.push(`/${locale}/quiz-builder`);
        } catch (error) {
            console.error('Error saving draft:', error);
            toast.error(t("saveDraftError"));
        }
    };

    const handlePreview = async (formData: FormData) => {
        try {
            const supabase = createClient();

            // Get user session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push(`/${locale}/sign-in`);
                return;
            }

            // Save or update quiz preview
            const { data: preview, error: previewError } = await supabase
                .from('quiz_previews')
                .upsert({
                    id: previewId || undefined, // Use existing preview ID if available
                    user_id: session.user.id,
                    quiz_data: {
                        title: formData.title,
                        description: formData.description,
                        category_id: formData.category_id,
                        thumbnail_url: formData.thumbnail_url,
                        is_active: formData.is_active,
                        status: 'draft',
                        questions: formData.questions.map(q => ({
                            question_text: q.question_text,
                            question_type: q.question_type,
                            question_image_url: q.question_image_url,
                            order_number: q.order_number,
                            points: q.points,
                            reference_answer: q.reference_answer,
                            answers: q.answers
                        }))
                    }
                })
                .select()
                .single();

            if (previewError) throw previewError;

            // Store the preview ID for future use
            if (preview) {
                setPreviewId(preview.id);
                router.push(`/${locale}/quiz-builder/preview?id=${preview.id}`);
            }
        } catch (error) {
            console.error('Error saving preview:', error);
            toast.error(t("previewError"));
        }
    };

    const handlePublish = async (data: FormData) => {
        try {
            const supabase = createClient();

            // Get user session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push(`/${locale}/sign-in`);
                return;
            }

            // Save quiz and get its ID
            const { data: quiz, error: quizError } = await supabase
                .from('quizzes')
                .insert({
                    title: data.title,
                    description: data.description,
                    category_id: data.category_id,
                    thumbnail_url: data.thumbnail_url,
                    is_active: data.is_active,
                    creator_id: session.user.id,
                    status: 'published',
                })
                .select()
                .single();

            if (quizError) throw quizError;

            // Insert questions and get their IDs
            const { data: insertedQuestions, error: questionsError } = await supabase
                .from('questions')
                .insert(data.questions.map(q => ({
                    quiz_id: quiz.id,
                    question_text: q.question_text,
                    question_type: q.question_type,
                    question_image_url: q.question_image_url,
                    order_number: q.order_number,
                    points: q.points,
                })))
                .select();

            if (questionsError) throw questionsError;

            // Insert answers for each question
            const answersToInsert = data.questions.reduce((acc: Array<{
                question_id: string;
                answer_text: string;
                answer_image_url?: string;
                is_correct: boolean;
                order_number: number;
            }>, question, index) => {
                if (question.question_type === 'long_answer' && question.reference_answer) {
                    // For long answer questions, insert reference answer as a correct answer
                    return [...acc, {
                        question_id: insertedQuestions[index].id,
                        answer_text: question.reference_answer,
                        is_correct: true,
                        order_number: 0,
                    }];
                } else if (question.answers && insertedQuestions?.[index]) {
                    // For choice questions, insert all answer options
                    const questionAnswers = question.answers.map(answer => ({
                        question_id: insertedQuestions[index].id,
                        answer_text: answer.answer_text,
                        answer_image_url: answer.answer_image_url,
                        is_correct: answer.is_correct,
                        order_number: answer.order_number,
                    }));
                    return [...acc, ...questionAnswers];
                }
                return acc;
            }, []);

            if (answersToInsert.length > 0) {
                const { error: answersError } = await supabase
                    .from('answers')
                    .insert(answersToInsert);

                if (answersError) throw answersError;
            }

            // Delete the preview if it exists
            if (data.previewId) {
                await supabase
                    .from('quiz_previews')
                    .delete()
                    .eq('id', data.previewId);
            }

            toast.success(t("quizPublished"));
            router.push(`/${locale}/quiz-builder`);
        } catch (error) {
            console.error('Error publishing quiz:', error);
            toast.error(t("publishError"));
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <DashboardHeader />
                <main className="container mx-auto px-4 py-8">
                    <div className="flex min-h-[400px] items-center justify-center">
                        <p className="text-lg text-muted-foreground">{t("loading")}</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">{t("title")}</h1>
                    <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
                </div>

                <QuizForm
                    initialData={initialData || undefined}
                    onSaveDraft={handleSaveAsDraft}
                    onPreview={handlePreview}
                    onPublish={handlePublish}
                />
            </main>
        </div>
    );
}

export default function CreateQuizPage() {
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
            <CreateQuizContent />
        </Suspense>
    );
} 