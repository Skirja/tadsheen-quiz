"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "./image-upload";
import { Grip, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";

interface Question {
    id?: string;
    quiz_id?: string;
    question_text: string;
    question_type: 'single_choice' | 'multiple_choice' | 'long_answer';
    question_image_url?: string;
    order_number: number;
    points: number;
    answers?: Answer[];
    reference_answer?: string;
}

interface Answer {
    id?: string;
    question_id?: string;
    answer_text: string;
    answer_image_url?: string;
    is_correct: boolean;
    order_number: number;
}

interface QuestionListProps {
    questions: Question[];
    onUpdate: (index: number, question: Question) => void;
    onDelete: (index: number) => void;
}

export function QuestionList({ questions, onUpdate, onDelete }: QuestionListProps) {
    const t = useTranslations("dashboard.createQuiz.form");
    const [isUploading, setIsUploading] = useState(false);

    const uploadImageToStorage = async (file: File, path: string) => {
        try {
            setIsUploading(true);
            const supabase = createClient();

            // Create unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${path}/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('quiz-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('quiz-images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    const handleQuestionImageUpload = async (file: File, index: number) => {
        try {
            const url = await uploadImageToStorage(file, 'questions');
            onUpdate(index, { ...questions[index], question_image_url: url });
        } catch (error) {
            console.error("Error uploading question image:", error);
            throw error;
        }
    };

    const handleOptionImageUpload = async (file: File, questionIndex: number, optionIndex: number) => {
        try {
            const url = await uploadImageToStorage(file, 'answers');
            const newQuestion = { ...questions[questionIndex] };
            if (newQuestion.answers) {
                newQuestion.answers[optionIndex].answer_image_url = url;
                onUpdate(questionIndex, newQuestion);
            }
        } catch (error) {
            console.error("Error uploading option image:", error);
            throw error;
        }
    };

    const addOption = (index: number) => {
        const newQuestion = { ...questions[index] };
        if (!newQuestion.answers) {
            newQuestion.answers = [];
        }
        newQuestion.answers.push({
            answer_text: "",
            answer_image_url: "",
            is_correct: false,
            order_number: newQuestion.answers.length + 1
        });
        onUpdate(index, newQuestion);
    };

    const updateOption = (questionIndex: number, optionIndex: number, option: Answer) => {
        const newQuestion = { ...questions[questionIndex] };
        if (newQuestion.answers) {
            newQuestion.answers[optionIndex] = option;
            onUpdate(questionIndex, newQuestion);
        }
    };

    const deleteOption = (questionIndex: number, optionIndex: number) => {
        const newQuestion = { ...questions[questionIndex] };
        if (newQuestion.answers) {
            newQuestion.answers = newQuestion.answers.filter((_, i) => i !== optionIndex);
            // Update order numbers
            newQuestion.answers = newQuestion.answers.map((answer, i) => ({
                ...answer,
                order_number: i + 1
            }));
            onUpdate(questionIndex, newQuestion);
        }
    };

    return (
        <div className="space-y-4">
            {questions.map((question, index) => (
                <Draggable key={index} draggableId={`question-${index}`} index={index}>
                    {(provided) => (
                        <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="p-6"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div {...provided.dragHandleProps} className="mt-2">
                                    <Grip className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {question.question_type === "single_choice"
                                                ? t("singleChoice")
                                                : question.question_type === "multiple_choice"
                                                    ? t("multipleChoice")
                                                    : t("longAnswer")}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            {t("questionText")}
                                        </label>
                                        <Textarea
                                            value={question.question_text}
                                            onChange={(e) =>
                                                onUpdate(index, { ...question, question_text: e.target.value })
                                            }
                                            placeholder={t("questionPlaceholder")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            {t("questionImage")}
                                        </label>
                                        <ImageUpload
                                            value={question.question_image_url}
                                            onChange={(url) =>
                                                onUpdate(index, { ...question, question_image_url: url })
                                            }
                                            onUpload={(file) => handleQuestionImageUpload(file, index)}
                                        />
                                    </div>

                                    {question.question_type === "long_answer" ? (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {t("referenceAnswer")}
                                            </label>
                                            <Textarea
                                                value={question.reference_answer || ""}
                                                onChange={(e) =>
                                                    onUpdate(index, {
                                                        ...question,
                                                        reference_answer: e.target.value,
                                                    })
                                                }
                                                placeholder={t("referenceAnswerPlaceholder")}
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                {t("referenceAnswerDescription")}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium">
                                                    {t("options")}
                                                </label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => addOption(index)}
                                                    disabled={isUploading}
                                                >
                                                    {t("addOption")}
                                                </Button>
                                            </div>

                                            <div className="space-y-2">
                                                {question.answers?.map((option: Answer, optionIndex: number) => (
                                                    <div
                                                        key={optionIndex}
                                                        className="flex items-start gap-4"
                                                    >
                                                        <div className="flex-1 space-y-2">
                                                            <Input
                                                                value={option.answer_text}
                                                                onChange={(e) =>
                                                                    updateOption(index, optionIndex, {
                                                                        ...option,
                                                                        answer_text: e.target.value,
                                                                    })
                                                                }
                                                                placeholder={t("optionPlaceholder")}
                                                            />
                                                            <ImageUpload
                                                                value={option.answer_image_url}
                                                                onChange={(url) =>
                                                                    updateOption(index, optionIndex, {
                                                                        ...option,
                                                                        answer_image_url: url,
                                                                    })
                                                                }
                                                                onUpload={(file) =>
                                                                    handleOptionImageUpload(
                                                                        file,
                                                                        index,
                                                                        optionIndex
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type={
                                                                    question.question_type === "single_choice"
                                                                        ? "radio"
                                                                        : "checkbox"
                                                                }
                                                                name={`question-${index}-correct`}
                                                                checked={option.is_correct}
                                                                onChange={(e) =>
                                                                    updateOption(index, optionIndex, {
                                                                        ...option,
                                                                        is_correct: e.target.checked,
                                                                    })
                                                                }
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    deleteOption(index, optionIndex)
                                                                }
                                                                disabled={isUploading}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}
                </Draggable>
            ))}
        </div>
    );
} 