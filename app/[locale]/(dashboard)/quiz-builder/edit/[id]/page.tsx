"use client";

import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard/header";
import { QuizForm } from "@/components/quiz-builder/quiz-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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

export default function EditQuizPage() {
    const t = useTranslations("dashboard.editQuiz");
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const locale = params.locale as string;
    const quizId = params.id as string;
    const previewId = searchParams.get('preview');
    const [initialData, setInitialData] = useState<FormData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const supabase = createClient();

                // Get user session
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push(`/${locale}/sign-in`);
                    return;
                }

                // If we have a preview ID, load from preview first
                if (previewId) {
                    const { data: preview, error: previewError } = await supabase
                        .from('quiz_previews')
                        .select('*')
                        .eq('id', previewId)
                        .eq('user_id', session.user.id)
                        .single();

                    if (!previewError && preview) {
                        setInitialData(preview.quiz_data as FormData);
                        setIsLoading(false);
                        return;
                    }
                }

                // If no preview or preview load failed, load from quiz data
                const { data: quiz, error: quizError } = await supabase
                    .from('quizzes')
                    .select('*')
                    .eq('id', quizId)
                    .eq('creator_id', session.user.id)
                    .single();

                if (quizError) throw quizError;

                // Fetch questions
                const { data: questions, error: questionsError } = await supabase
                    .from('questions')
                    .select('*, answers(*)')
                    .eq('quiz_id', quizId)
                    .order('order_number', { ascending: true });

                if (questionsError) throw questionsError;

                // Transform data to match form structure
                const formData: FormData = {
                    title: quiz.title,
                    description: quiz.description,
                    category_id: quiz.category_id,
                    thumbnail_url: quiz.thumbnail_url,
                    is_active: quiz.is_active,
                    questions: questions.map(q => {
                        const formQuestion: {
                            question_text: string;
                            question_type: 'single_choice' | 'multiple_choice' | 'long_answer';
                            question_image_url?: string;
                            order_number: number;
                            points: number;
                            reference_answer?: string;
                            answers?: {
                                answer_text: string;
                                answer_image_url?: string;
                                is_correct: boolean;
                                order_number: number;
                            }[];
                        } = {
                            question_text: q.question_text,
                            question_type: q.question_type,
                            question_image_url: q.question_image_url,
                            order_number: q.order_number,
                            points: q.points,
                        };

                        if (q.question_type === 'long_answer') {
                            const referenceAnswer = q.answers?.find((a: {
                                answer_text: string;
                                is_correct: boolean;
                            }) => a.is_correct);
                            if (referenceAnswer) {
                                formQuestion.reference_answer = referenceAnswer.answer_text;
                            }
                        } else {
                            formQuestion.answers = q.answers?.map((a: {
                                answer_text: string;
                                answer_image_url?: string;
                                is_correct: boolean;
                                order_number: number;
                            }) => ({
                                answer_text: a.answer_text,
                                answer_image_url: a.answer_image_url,
                                is_correct: a.is_correct,
                                order_number: a.order_number,
                            }));
                        }

                        return formQuestion;
                    }),
                };

                setInitialData(formData);
            } catch (error) {
                console.error('Error loading quiz data:', error);
                toast.error(t("loadError"));
                router.push(`/${locale}/quiz-builder`);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [quizId, previewId, locale, router, t]);

    const handleDelete = async () => {
        try {
            const supabase = createClient();

            // Get user session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push(`/${locale}/sign-in`);
                return;
            }

            // Delete quiz (cascade will handle questions and answers)
            const { error: deleteError } = await supabase
                .from('quizzes')
                .delete()
                .eq('id', quizId)
                .eq('creator_id', session.user.id);

            if (deleteError) throw deleteError;

            toast.success(t("quizDeleted"));
            router.push(`/${locale}/quiz-builder`);
        } catch (error) {
            console.error('Error deleting quiz:', error);
            toast.error(t("deleteError"));
        }
    };

    const handleSaveAsDraft = async (data: FormData) => {
        try {
            const supabase = createClient();

            // Get user session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push(`/${locale}/sign-in`);
                return;
            }

            // Update quiz as draft (always inactive)
            const { error: updateError } = await supabase
                .from('quizzes')
                .update({
                    title: data.title,
                    description: data.description,
                    category_id: data.category_id,
                    thumbnail_url: data.thumbnail_url,
                    is_active: false, // Force inactive for drafts
                    status: 'draft',
                    updated_at: new Date().toISOString()
                })
                .eq('id', quizId)
                .eq('creator_id', session.user.id);

            if (updateError) throw updateError;

            // Delete existing questions (cascade will handle answers)
            const { error: deleteError } = await supabase
                .from('questions')
                .delete()
                .eq('quiz_id', quizId);

            if (deleteError) throw deleteError;

            // Insert new questions
            const { data: insertedQuestions, error: questionsError } = await supabase
                .from('questions')
                .insert(data.questions.map(q => ({
                    quiz_id: quizId, // Use existing quiz ID
                    question_text: q.question_text,
                    question_type: q.question_type,
                    question_image_url: q.question_image_url,
                    order_number: q.order_number,
                    points: q.points,
                })))
                .select();

            if (questionsError) throw questionsError;

            // Insert new answers
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

            // Redirect to preview page with source quiz ID and preview ID
            if (preview) {
                router.push(`/${locale}/quiz-builder/preview?id=${preview.id}&source_quiz_id=${quizId}`);
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

            // Update quiz as published
            const { error: updateError } = await supabase
                .from('quizzes')
                .update({
                    title: data.title,
                    description: data.description,
                    category_id: data.category_id,
                    thumbnail_url: data.thumbnail_url,
                    is_active: data.is_active,
                    status: 'published',
                    updated_at: new Date().toISOString()
                })
                .eq('id', quizId)
                .eq('creator_id', session.user.id);

            if (updateError) throw updateError;

            // Delete existing questions (cascade will handle answers)
            const { error: deleteError } = await supabase
                .from('questions')
                .delete()
                .eq('quiz_id', quizId);

            if (deleteError) throw deleteError;

            // Insert new questions
            const { data: insertedQuestions, error: questionsError } = await supabase
                .from('questions')
                .insert(data.questions.map(q => ({
                    quiz_id: quizId, // Use existing quiz ID
                    question_text: q.question_text,
                    question_type: q.question_type,
                    question_image_url: q.question_image_url,
                    order_number: q.order_number,
                    points: q.points,
                })))
                .select();

            if (questionsError) throw questionsError;

            // Insert new answers
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
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{t("title")}</h1>
                        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                    >
                        {t("deleteQuiz")}
                    </Button>
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