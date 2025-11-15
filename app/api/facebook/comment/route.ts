import { auth } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";

// Post a comment on a post
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { postId, message } = body;

    if (!postId || !message) {
      return NextResponse.json(
        { error: "Post ID and message are required" },
        { status: 400 }
      );
    }

    const apiVersion = process.env.FACEBOOK_API_VERSION || "v18.0";
    const url = `https://graph.facebook.com/${apiVersion}/${postId}/comments`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        access_token: session.accessToken,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error posting comment:", error);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}

