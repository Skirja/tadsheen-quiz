import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

export function generateStaticParams() {
    return [{ locale: "en" }, { locale: "ar" }];
}

export default async function LocaleLayout({
    children,
    params: { locale },
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    let messages;
    try {
        messages = (await import(`../../messages/${locale}.json`)).default;
    } catch {
        notFound();
    }

    return (
        <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
            <body>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <Toaster position="top-center" expand={true} richColors />
                        {children}
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
} 