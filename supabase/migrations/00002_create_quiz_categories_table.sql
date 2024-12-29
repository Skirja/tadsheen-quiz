-- Create quiz categories table
CREATE TABLE IF NOT EXISTS public.quiz_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    description_ar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE TRIGGER update_quiz_categories_updated_at
    BEFORE UPDATE ON quiz_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE quiz_categories ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can view categories
CREATE POLICY "Categories are viewable by everyone" ON quiz_categories
    FOR SELECT
    USING (true);

-- Only service role can manage categories
CREATE POLICY "Service role can manage categories" ON quiz_categories
    FOR ALL
    USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX quiz_categories_slug_idx ON quiz_categories(slug);

-- Insert default categories with Arabic translations
INSERT INTO quiz_categories (name, name_ar, slug, description, description_ar) VALUES
    (
        'General Knowledge',
        'المعرفة العامة',
        'general-knowledge',
        'General knowledge questions across various topics',
        'أسئلة المعرفة العامة في مختلف المواضيع'
    ),
    (
        'Islamic Studies',
        'الدراسات الإسلامية',
        'islamic-studies',
        'Questions related to Islamic knowledge and practices',
        'أسئلة تتعلق بالمعرفة والممارسات الإسلامية'
    ),
    (
        'Arabic Language',
        'اللغة العربية',
        'arabic-language',
        'Questions about Arabic vocabulary, grammar, and usage',
        'أسئلة حول المفردات العربية والقواعد والاستخدام'
    ),
    (
        'Quran',
        'القرآن الكريم',
        'quran',
        'Questions about Quranic verses, meanings, and interpretations',
        'أسئلة حول الآيات القرآنية ومعانيها وتفسيراتها'
    ),
    (
        'Islamic History',
        'التاريخ الإسلامي',
        'islamic-history',
        'Questions about Islamic history, events, and personalities',
        'أسئلة حول التاريخ الإسلامي والأحداث والشخصيات'
    ),
    (
        'Hadith Studies',
        'علوم الحديث',
        'hadith-studies',
        'Questions about Hadith, their narrations, and authenticity',
        'أسئلة حول الحديث النبوي وروايته وصحته'
    ),
    (
        'Islamic Jurisprudence',
        'الفقه الإسلامي',
        'islamic-jurisprudence',
        'Questions about Islamic law and jurisprudence',
        'أسئلة حول الشريعة والفقه الإسلامي'
    ),
    (
        'Arabic Literature',
        'الأدب العربي',
        'arabic-literature',
        'Questions about Arabic poetry, prose, and literary works',
        'أسئلة حول الشعر العربي والنثر والأعمال الأدبية'
    ),
    (
        'Islamic Ethics',
        'الأخلاق الإسلامية',
        'islamic-ethics',
        'Questions about Islamic morals and ethical principles',
        'أسئلة حول الأخلاق والمبادئ الإسلامية'
    ),
    (
        'Arabic Grammar',
        'النحو العربي',
        'arabic-grammar',
        'Questions specifically focused on Arabic grammar rules',
        'أسئلة تركز على قواعد النحو العربي'
    ),
    (
        'Islamic Finance',
        'المالية الإسلامية',
        'islamic-finance',
        'Questions about Islamic finance and economic principles',
        'أسئلة حول المالية والمبادئ الاقتصادية الإسلامية'
    ),
    (
        'Contemporary Islamic Issues',
        'القضايا الإسلامية المعاصرة',
        'contemporary-islamic-issues',
        'Questions about modern Islamic topics and current affairs',
        'أسئلة حول المواضيع الإسلامية الحديثة والقضايا المعاصرة'
    )
ON CONFLICT (slug) DO NOTHING; 