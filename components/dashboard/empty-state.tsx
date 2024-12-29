"use client";

import { FileQuestion } from "lucide-react";

interface EmptyStateProps {
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileQuestion className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
} 