"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations("auth");
    const params = useParams();
    const locale = params.locale as string;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    const handleResendVerification = useCallback(async (email: string) => {
        try {
            const supabase = createClient();
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (resendError) throw resendError;
            toast.success(t("signUp.resendSuccess"));
        } catch {
            toast.error(t("signUp.resendError"));
        }
    }, [t]);

    useEffect(() => {
        const handleEmailVerification = async () => {
            const supabase = createClient();

            // Handle error cases first
            if (error) {
                const { data: { user } } = await supabase.auth.getUser();
                const email = user?.email;

                toast.error(t("signUp.errors.verificationFailed"), {
                    action: email ? {
                        label: t("signUp.resendAction"),
                        onClick: () => handleResendVerification(email),
                    } : undefined,
                });
                router.push(`/${locale}/sign-in`);
                return;
            }

            // Handle successful verification
            if (code) {
                try {
                    const { error: verifyError } = await supabase.auth.exchangeCodeForSession(code);

                    if (verifyError) {
                        toast.error(t("signUp.errors.default"));
                        router.push(`/${locale}/sign-in`);
                        return;
                    }

                    // Update email_verified in users table
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { error: updateError } = await supabase
                            .from("users")
                            .update({ email_verified: true })
                            .eq("id", user.id);

                        if (updateError) {
                            console.error("Error updating email verification status:", updateError);
                        }
                    }

                    toast.success(t("signUp.success"));
                    router.push(`/${locale}/sign-in`);
                } catch (err) {
                    console.error("Error during email verification:", err);
                    toast.error(t("signUp.errors.default"));
                    router.push(`/${locale}/sign-in`);
                }
            }
        };

        handleEmailVerification();
    }, [code, error, errorDescription, router, t, locale, handleResendVerification]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold">{t("signUp.loading")}</h1>
                <p className="mt-2 text-muted-foreground">{t("signUp.verifyingEmail")}</p>
            </div>
        </div>
    );
} 