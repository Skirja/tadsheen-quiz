"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations("auth");
    const params = useParams();
    const locale = params.locale as string;

    useEffect(() => {
        // Get the code or error from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const error_description = searchParams.get('error_description');

        if (error) {
            toast.error(error_description || t("signUp.errors.default"));
            router.replace(`/${locale}/sign-in`);
            return;
        }

        // If we have a code, we're coming back from a successful OAuth sign in
        if (code) {
            router.replace(`/${locale}/quiz-builder`);
            return;
        }

        // If we have neither, something went wrong
        router.replace(`/${locale}/sign-in`);
    }, [searchParams, router, t, locale]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold">{t("signUp.loading")}</h1>
                <p className="mt-2 text-muted-foreground">{t("signUp.verifyingEmail")}</p>
            </div>
        </div>
    );
} 