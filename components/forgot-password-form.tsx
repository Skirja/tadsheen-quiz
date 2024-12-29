"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

export function ForgotPasswordForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const t = useTranslations("auth");
    const params = useParams();
    const locale = params.locale as string;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // TODO: Implement password reset logic
        console.log("Password reset requested");
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden">
                <CardContent className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="flex flex-col items-center text-center">
                            <h1 className="text-2xl font-bold">{t("forgotPassword.title")}</h1>
                            <p className="text-balance text-muted-foreground">
                                {t("forgotPassword.subtitle")}
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t("email")}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            {t("forgotPassword.action")}
                        </Button>
                        <Link
                            href={`/${locale}/sign-in`}
                            className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t("forgotPassword.backToSignIn")}
                        </Link>
                    </form>
                </CardContent>
            </Card>
            <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
                {t("termsText")}{" "}
                <Link href={`/${locale}/forgot-password`}>{t("termsLink")}</Link>{" "}
                {t("and")}{" "}
                <Link href={`/${locale}/forgot-password`}>{t("privacyLink")}</Link>.
            </div>
        </div>
    );
} 