import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const PREVIEW_TABLE = 'quiz_previews';

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch (error) {
                            console.error('Error setting cookie:', error);
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: "", ...options });
                        } catch (error) {
                            console.error('Error removing cookie:', error);
                        }
                    },
                },
            }
        );

        const data = await request.json();

        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Store preview data
        const { data: preview, error } = await supabase
            .from(PREVIEW_TABLE)
            .upsert({
                user_id: session.user.id,
                quiz_data: data,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ previewId: preview.id });
    } catch (error) {
        console.error('Error storing preview:', error);
        return NextResponse.json(
            { error: "Failed to store preview data" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch (error) {
                            console.error('Error setting cookie:', error);
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: "", ...options });
                        } catch (error) {
                            console.error('Error removing cookie:', error);
                        }
                    },
                },
            }
        );

        const { searchParams } = new URL(request.url);
        const previewId = searchParams.get('id');

        if (!previewId) {
            return NextResponse.json(
                { error: "Preview ID is required" },
                { status: 400 }
            );
        }

        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Get preview data
        const { data: preview, error } = await supabase
            .from(PREVIEW_TABLE)
            .select('quiz_data')
            .eq('id', previewId)
            .eq('user_id', session.user.id)
            .single();

        if (error) throw error;
        if (!preview) {
            return NextResponse.json(
                { error: "Preview not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(preview.quiz_data);
    } catch (error) {
        console.error('Error retrieving preview:', error);
        return NextResponse.json(
            { error: "Failed to retrieve preview data" },
            { status: 500 }
        );
    }
} 