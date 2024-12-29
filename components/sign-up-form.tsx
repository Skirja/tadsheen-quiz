"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[A-Z]).{7,}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

interface FormErrors {
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}

export function SignUpForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const t = useTranslations("auth");
    const params = useParams();
    const locale = params.locale as string;
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const validateForm = (
        fullName: string,
        email: string,
        password: string,
        confirmPassword: string
    ): boolean => {
        const newErrors: FormErrors = {};

        if (!fullName.trim()) {
            newErrors.fullName = "Full name is required";
        }

        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!EMAIL_REGEX.test(email)) {
            newErrors.email = "Invalid email format";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (!PASSWORD_REGEX.test(password)) {
            newErrors.password = "Password must be at least 7 characters and contain 1 uppercase letter";
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const fullName = formData.get("fullName") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        // Client-side validation
        if (!validateForm(fullName, email, password, confirmPassword)) {
            setIsLoading(false);
            return;
        }

        try {
            const supabase = createClient();
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        provider: 'email',
                        email_verified: false,
                    },
                    emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
                },
            });

            if (signUpError) {
                if (signUpError.message.includes("already registered")) {
                    toast.error(t("signUp.errors.emailExists"));
                } else {
                    toast.error(t("signUp.errors.default"));
                }
                return;
            }

            toast.success(t("signUp.success"));
            router.push(`/${locale}/sign-in`);
        } catch {
            toast.error(t("signUp.errors.default"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form onSubmit={handleSubmit} className="p-6 md:p-8">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">{t("signUp.title")}</h1>
                                <p className="text-balance text-muted-foreground">
                                    {t("signUp.subtitle")}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">{t("fullName")}</Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    required
                                    disabled={isLoading}
                                    className={errors.fullName ? "border-destructive" : ""}
                                />
                                {errors.fullName && (
                                    <p className="text-sm text-destructive">{errors.fullName}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t("email")}</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    disabled={isLoading}
                                    className={errors.email ? "border-destructive" : ""}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">{t("password")}</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    disabled={isLoading}
                                    className={errors.password ? "border-destructive" : ""}
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    disabled={isLoading}
                                    className={errors.confirmPassword ? "border-destructive" : ""}
                                />
                                {errors.confirmPassword && (
                                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? t("signUp.loading") : t("signUp.action")}
                            </Button>
                            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                                    {t("orContinueWith")}
                                </span>
                            </div>
                            <Button variant="outline" className="w-full" disabled={isLoading}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                                    <path
                                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                        fill="currentColor"
                                    />
                                </svg>
                                {t("continueWithGoogle")}
                            </Button>
                            <div className="text-center text-sm">
                                {t("signUp.haveAccount")}{" "}
                                <Link
                                    href={`/${locale}/sign-in`}
                                    className="underline underline-offset-4 hover:text-primary"
                                >
                                    {t("signUp.signInLink")}
                                </Link>
                            </div>
                        </div>
                    </form>
                    <div className="relative hidden bg-muted md:block">
                        <Image
                            src="/assets/sign-up-placeholder.jpg"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                            width={500}
                            height={500}
                        />
                    </div>
                </CardContent>
            </Card>
            <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
                {t("termsText")}{" "}
                <Link href={`/${locale}/terms`}>{t("termsLink")}</Link>{" "}
                {t("and")}{" "}
                <Link href={`/${locale}/privacy`}>{t("privacyLink")}</Link>.
            </div>
        </div>
    );
}
