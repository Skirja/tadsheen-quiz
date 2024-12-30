"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Image as ImageIcon, Loader2, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onUpload: (file: File) => Promise<void>;
    className?: string;
}

export function ImageUpload({
    value,
    onChange,
    onUpload,
    className,
}: ImageUploadProps) {
    const t = useTranslations("dashboard.createQuiz.form");
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                try {
                    setIsUploading(true);
                    await onUpload(acceptedFiles[0]);
                } catch (error) {
                    console.error("Error uploading image:", error);
                    toast.error(t("imageUploadError"));
                } finally {
                    setIsUploading(false);
                }
            }
        },
        [onUpload, t]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".png", ".jpg", ".jpeg", ".gif"],
        },
        maxFiles: 1,
        disabled: isUploading,
    });

    return (
        <div className={cn("space-y-4", className)}>
            <div
                {...getRootProps()}
                className={cn(
                    "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 transition-colors",
                    isDragActive
                        ? "border-primary/50 bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50",
                    isUploading && "cursor-not-allowed opacity-50"
                )}
            >
                <input {...getInputProps()} />

                {value ? (
                    <div className="relative aspect-video w-full">
                        <Image
                            src={value}
                            alt="Upload"
                            fill
                            className="rounded-lg object-cover"
                        />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange("");
                            }}
                            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm"
                            disabled={isUploading}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
                        {isUploading ? (
                            <>
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <span>{t("uploading")}</span>
                            </>
                        ) : (
                            <>
                                <ImageIcon className="h-8 w-8" />
                                <span>{isDragActive ? t("dropHere") : t("dragAndDrop")}</span>
                                <span>{t("or")}</span>
                                <span className="font-medium text-primary">
                                    {t("browseFiles")}
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 