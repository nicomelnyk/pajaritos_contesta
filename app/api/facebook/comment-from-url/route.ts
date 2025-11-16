import { auth } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";

// Extract post ID from Facebook URL
function extractPostIdFromUrl(url: string): string | null {
  try {
    // Remove query parameters and fragments
    const cleanUrl = url.split("?")[0].split("#")[0];
    
    // Pattern 1: https://www.facebook.com/groups/{groupId}/posts/{postId}/
    const groupsMatch = cleanUrl.match(/\/groups\/\d+\/posts\/(\d+)/);
    if (groupsMatch) {
      return groupsMatch[1];
    }
    
    // Pattern 2: https://www.facebook.com/{postId} or https://m.facebook.com/{postId}
    const directMatch = cleanUrl.match(/facebook\.com\/(\d+)(?:\/|$)/);
    if (directMatch) {
      return directMatch[1];
    }
    
    // Pattern 3: https://www.facebook.com/permalink.php?story_fbid={postId}&id={userId}
    const permalinkMatch = new URL(url).searchParams.get("story_fbid");
    if (permalinkMatch) {
      return permalinkMatch;
    }
    
    // Pattern 4: If URL already contains just the post ID
    const numericMatch = cleanUrl.match(/(\d{10,})/);
    if (numericMatch) {
      return numericMatch[1];
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting post ID:", error);
    return null;
  }
}

// Post a comment on a post using URL
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
    const { postUrl, message } = body;

    if (!postUrl || !message) {
      return NextResponse.json(
        { error: "Post URL and message are required" },
        { status: 400 }
      );
    }

    // Extract post ID from URL
    const postId = extractPostIdFromUrl(postUrl);
    
    if (!postId) {
      return NextResponse.json(
        { error: "Invalid Facebook post URL. Please provide a valid Facebook post URL." },
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
        { error: data.error.message || data.error.error_user_msg || "Failed to post comment" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data, postId });
  } catch (error) {
    console.error("Error posting comment:", error);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}

