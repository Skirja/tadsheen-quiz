import { getRequestConfig, unstable_setRequestLocale } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
    unstable_setRequestLocale(locale);
    return {
        messages: (await import(`../messages/${locale}.json`)).default,
        timeZone: 'Asia/Jakarta'
    };
}); 