"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { QuestionList } from "./question-list";
import { ImageUpload } from "./image-upload";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

// Types based on database schema
type QuestionType = 'single_choice' | 'multiple_choice' | 'long_answer';

interface Question {
    id?: string;
    quiz_id?: string;
    question_text: string;
    question_type: QuestionType;
    question_image_url?: string;
    order_number: number;
    points: number;
    answers?: Answer[];
}

interface Answer {
    id?: string;
    question_id?: string;
    answer_text: string;
    answer_image_url?: string;
    is_correct: boolean;
    order_number: number;
}

// Form Schema
const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    category_id: z.string().min(1, { message: "Category is required" }),
    thumbnail_url: z.string().optional(),
    is_active: z.boolean(),
    questions: z.array(z.object({
        question_text: z.string().min(1, { message: "Question text is required" }),
        question_type: z.enum(["single_choice", "multiple_choice", "long_answer"]),
        question_image_url: z.string().optional(),
        order_number: z.number(),
        points: z.number(),
        answers: z.array(z.object({
            answer_text: z.string().min(1, { message: "Answer text is required" }),
            answer_image_url: z.string().optional(),
            is_correct: z.boolean(),
            order_number: z.number(),
        })).optional(),
        reference_answer: z.string().optional(),
    })),
});

interface FormData {
    title: string;
    description: string;
    category_id: string;
    thumbnail_url?: string;
    is_active: boolean;
    questions: Question[];
    previewId?: string;
}

interface QuizFormProps {
    initialData?: FormData;
    onSaveDraft: (data: FormData) => Promise<void>;
    onPreview: (data: FormData) => void;
    onPublish: (data: FormData) => Promise<void>;
}

export function QuizForm({
    initialData,
    onSaveDraft,
    onPreview,
    onPublish
}: QuizFormProps) {
    const t = useTranslations("dashboard.createQuiz");
    const [questions, setQuestions] = useState<Question[]>(initialData?.questions || []);
    const [categories, setCategories] = useState<{ id: string; name: string; }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            title: "",
            description: "",
            is_active: true,
            questions: [],
        },
    });

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('quiz_categories')
                .select('id, name');

            if (!error && data) {
                setCategories(data);
            }
        };

        fetchCategories();
    }, []);

    // Update form when initialData changes
    useEffect(() => {
        if (initialData) {
            setQuestions(initialData.questions);
            form.reset(initialData);
        }
    }, [initialData, form]);

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(questions);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update order numbers
        const updatedItems = items.map((item, index) => ({
            ...item,
            order_number: index + 1
        }));

        setQuestions(updatedItems);
        form.setValue("questions", updatedItems);
    };

    const handleThumbnailUpload = async (file: File) => {
        try {
            const supabase = createClient();

            // Create unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `thumbnails/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('quiz-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('quiz-images')
                .getPublicUrl(filePath);

            form.setValue("thumbnail_url", publicUrl);
        } catch (error) {
            console.error("Error uploading thumbnail:", error);
            throw error; // Re-throw to be handled by the ImageUpload component
        }
    };

    const addQuestion = (type: QuestionType) => {
        const newQuestion: Question = {
            question_text: "",
            question_type: type,
            question_image_url: "",
            order_number: questions.length + 1,
            points: 1,
            answers: type !== 'long_answer' ? [
                { answer_text: "", answer_image_url: "", is_correct: false, order_number: 1 },
                { answer_text: "", answer_image_url: "", is_correct: false, order_number: 2 },
            ] : undefined,
        };

        setQuestions([...questions, newQuestion]);
        form.setValue("questions", [...questions, newQuestion]);
    };

    const handlePreview = async () => {
        try {
            setIsSubmitting(true);
            const formData = form.getValues();

            // Save preview data to server
            const response = await fetch('/api/quiz/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to store preview data');
            }

            const { previewId } = await response.json();
            onPreview({ ...formData, previewId });
        } catch (error) {
            console.error('Error storing preview:', error);
            toast.error(t("previewError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit(onPublish)}>
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("form.title")}</FormLabel>
                            <FormControl>
                                <Input {...field} maxLength={255} />
                            </FormControl>
                            <FormDescription>
                                {t("form.titleDescription")}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("form.description")}</FormLabel>
                            <FormControl>
                                <Textarea {...field} maxLength={500} />
                            </FormControl>
                            <FormDescription>
                                {t("form.descriptionDescription")}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("form.category")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("form.selectCategory")} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="thumbnail_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("form.thumbnail")}</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={field.value}
                                    onChange={(url) => field.onChange(url)}
                                    onUpload={handleThumbnailUpload}
                                />
                            </FormControl>
                            <FormDescription>
                                {t("form.thumbnailDescription")}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                    {t("form.active")}
                                </FormLabel>
                                <FormDescription>
                                    {t("form.activeDescription")}
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t("form.questions")}</h3>

                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="questions">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-4"
                                >
                                    <QuestionList
                                        questions={questions}
                                        onUpdate={(index, question) => {
                                            const newQuestions = [...questions];
                                            newQuestions[index] = question;
                                            setQuestions(newQuestions);
                                            form.setValue("questions", newQuestions);
                                        }}
                                        onDelete={(index) => {
                                            const newQuestions = questions.filter((_, i) => i !== index);
                                            // Update order numbers
                                            const updatedQuestions = newQuestions.map((q, i) => ({
                                                ...q,
                                                order_number: i + 1
                                            }));
                                            setQuestions(updatedQuestions);
                                            form.setValue("questions", updatedQuestions);
                                        }}
                                    />
                                    {provided.placeholder}

                                    <div className="flex items-center justify-center gap-2 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => addQuestion("single_choice")}
                                        >
                                            {t("form.addSingleChoice")}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => addQuestion("multiple_choice")}
                                        >
                                            {t("form.addMultipleChoice")}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => addQuestion("long_answer")}
                                        >
                                            {t("form.addLongAnswer")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>

                <div className="flex items-center justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onSaveDraft(form.getValues())}
                        disabled={isSubmitting}
                    >
                        {t("saveAsDraft")}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handlePreview()}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? t("loading") : t("preview")}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? t("publishing") : t("publish")}
                    </Button>
                </div>
            </form>
        </Form>
    );
} 