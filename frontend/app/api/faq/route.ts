import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { messages } = await req.json();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
            max_tokens: 150,
            temperature: 0.7,
        }),
    });

    const data = await response.json();
    console.log("Key present:", !!process.env.OPENAI_API_KEY);
    console.log("Key prefix:", process.env.OPENAI_API_KEY?.slice(0, 7));
    return NextResponse.json(data);
}