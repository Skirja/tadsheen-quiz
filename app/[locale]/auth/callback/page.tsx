"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations("auth");
    const params = useParams();
    const locale = params.locale as string;
    const isProcessing = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            // Prevent double execution
            if (isProcessing.current) return;
            isProcessing.current = true;

            try {
                const code = searchParams.get('code');
                const error = searchParams.get('error');
                const error_description = searchParams.get('error_description');
                const provider = searchParams.get('provider');

                console.log('Callback params:', { code, error, error_description, provider });

                if (error) {
                    console.error('Auth error:', error, error_description);
                    toast.error(error_description || t("signIn.errors.default"));
                    router.replace(`/${locale}/sign-in`);
                    return;
                }

                if (code) {
                    const supabase = createClient();

                    // Check session after OAuth
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                    console.log('Session check:', {
                        hasSession: !!session,
                        sessionError: sessionError?.message
                    });

                    if (session) {
                        // Show success toast for Google login
                        toast.success(t("signIn.success"));
                        router.replace(`/${locale}/quiz-builder`);
                    } else {
                        console.error('No session after OAuth');
                        toast.error(t("signIn.errors.default"));
                        router.replace(`/${locale}/sign-in`);
                    }
                    return;
                }

                // If we have neither code nor error
                console.log('No code or error found');
                router.replace(`/${locale}/sign-in`);
            } catch (err) {
                console.error('Callback error:', err);
                toast.error(t("signIn.errors.default"));
                router.replace(`/${locale}/sign-in`);
            }
        };

        handleCallback();

        // Cleanup function to reset the flag when component unmounts
        return () => {
            isProcessing.current = false;
        };
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