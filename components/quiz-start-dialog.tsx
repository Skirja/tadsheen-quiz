"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuizStartDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (name?: string) => void;
    title: string;
    isLoggedIn?: boolean;
}

export function QuizStartDialog({
    isOpen,
    onClose,
    onStart,
    title,
    isLoggedIn = false,
}: QuizStartDialogProps) {
    const t = useTranslations("landing.quizCard");
    const [name, setName] = useState("");

    const handleStart = () => {
        if (!isLoggedIn && !name.trim()) return;
        onStart(name);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {t("startQuiz")}
                    </DialogDescription>
                </DialogHeader>
                {!isLoggedIn && (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t("enterName")}</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button onClick={handleStart} disabled={!isLoggedIn && !name.trim()}>
                        {t("start")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 