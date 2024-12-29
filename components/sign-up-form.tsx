"use client";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"

export function SignUpForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const t = useTranslations("auth")
    const params = useParams()
    const locale = params.locale as string

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8">
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
                                    type="text"
                                    placeholder="John Doe"
                                    required
                                />
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
                            <div className="grid gap-2">
                                <Label htmlFor="password">{t("password")}</Label>
                                <Input id="password" type="password" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                                <Input id="confirmPassword" type="password" required />
                            </div>
                            <Button type="submit" className="w-full">
                                {t("signUp.action")}
                            </Button>
                            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                                    {t("orContinueWith")}
                                </span>
                            </div>
                            <Button variant="outline" className="w-full">
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
                <Link href={`/${locale}/sign-up`}>{t("termsLink")}</Link>{" "}
                {t("and")}{" "}
                <Link href={`/${locale}/sign-up`}>{t("privacyLink")}</Link>.
            </div>
        </div>
    )
}
