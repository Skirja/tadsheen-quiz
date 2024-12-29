"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

// Validation regex
const PASSWORD_REGEX = /^(?=.*[A-Z]).{7,}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

interface FormErrors {
  email?: string;
  password?: string;
}

export function SignInForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("auth");
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [rememberMe, setRememberMe] = useState(false);

  const validateForm = (email: string, password: string): boolean => {
    const newErrors: FormErrors = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Client-side validation
    if (!validateForm(email, password)) {
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          toast.error(t("signIn.errors.invalidCredentials"));
        } else if (signInError.message.includes("Email not confirmed")) {
          toast.error(t("signIn.errors.emailNotConfirmed"));
        } else {
          toast.error(t("signIn.errors.default"));
        }
        return;
      }

      if (session) {
        // Handle remember me
        if (rememberMe) {
          const { error: updateError } = await supabase.from('users').update({
            remember_token: session.access_token,
            remember_token_expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
          }).eq('id', session.user.id);

          if (updateError) {
            console.error('Error setting remember token:', updateError);
          }
        }

        // Update last sign in
        const { error: updateSignInError } = await supabase.from('users').update({
          last_sign_in_at: new Date().toISOString(),
        }).eq('id', session.user.id);

        if (updateSignInError) {
          console.error('Error updating last sign in:', updateSignInError);
        }

        toast.success(t("signIn.success"));
        router.push(`/${locale}/quiz-builder`);
        router.refresh();
      }
    } catch {
      toast.error(t("signIn.errors.default"));
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
                <h1 className="text-2xl font-bold">{t("signIn.title")}</h1>
                <p className="text-balance text-muted-foreground">
                  {t("signIn.subtitle")}
                </p>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Link
                    href={`/${locale}/forgot-password`}
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    {t("signIn.forgotPasswordLink")}
                  </Link>
                </div>
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="rememberMe" className="text-sm font-normal">
                  {t("signIn.rememberMe")}
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("signIn.loading") : t("signIn.action")}
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
                {t("signIn.noAccount")}{" "}
                <Link
                  href={`/${locale}/sign-up`}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {t("signIn.signUpLink")}
                </Link>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <Image
              src="/assets/sign-in-placeholder.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              width={500}
              height={500}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
