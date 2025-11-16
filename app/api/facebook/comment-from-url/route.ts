import { auth } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";

// Extract post ID from Facebook URL
function extractPostIdFromUrl(url: string): string | null {
  try {
    // Remove query parameters and fragments
    const cleanUrl = url.split("?")[0].split("#")[0];
    const urlObj = new URL(url);
    
    // Pattern 1: https://www.facebook.com/groups/{groupId}/posts/{postId}/
    const groupsMatch = cleanUrl.match(/\/groups\/\d+\/posts\/(\d+)/);
    if (groupsMatch) {
      return groupsMatch[1];
    }
    
    // Pattern 2: https://www.facebook.com/share/p/{postId}/ (share URLs)
    const shareMatch = cleanUrl.match(/\/share\/p\/([^\/]+)/);
    if (shareMatch) {
      // Share URLs use encoded IDs, we need to fetch the actual post ID
      // For now, return the encoded ID and let the API handle it
      return shareMatch[1];
    }
    
    // Pattern 3: https://www.facebook.com/{postId} or https://m.facebook.com/{postId}
    const directMatch = cleanUrl.match(/facebook\.com\/(\d+)(?:\/|$)/);
    if (directMatch) {
      return directMatch[1];
    }
    
    // Pattern 4: https://www.facebook.com/permalink.php?story_fbid={postId}&id={userId}
    const permalinkMatch = urlObj.searchParams.get("story_fbid");
    if (permalinkMatch) {
      return permalinkMatch;
    }
    
    // Pattern 5: Check if URL contains a post ID in query params
    const fbid = urlObj.searchParams.get("fbid") || urlObj.searchParams.get("id");
    if (fbid && /^\d+$/.test(fbid)) {
      return fbid;
    }
    
    // Pattern 6: If URL already contains just the post ID (numeric)
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
    let postId = extractPostIdFromUrl(postUrl);
    
    if (!postId) {
      return NextResponse.json(
        { error: "Invalid Facebook post URL. Please provide a valid Facebook post URL. Supported formats: facebook.com/groups/.../posts/..., facebook.com/share/p/..., or direct post URLs." },
        { status: 400 }
      );
    }

    const apiVersion = process.env.FACEBOOK_API_VERSION || "v18.0";
    
    // Check if this is a share URL (non-numeric ID)
    const isShareUrl = !/^\d+$/.test(postId);
    
    if (isShareUrl) {
      // Share URLs cannot be used directly with Graph API
      // Try to use oEmbed API to get the actual post URL, then extract ID from that
      try {
        const oembedUrl = `https://graph.facebook.com/${apiVersion}/oembed_post?url=${encodeURIComponent(postUrl)}&access_token=${session.accessToken}`;
        const oembedResponse = await fetch(oembedUrl);
        const oembedData = await oembedResponse.json();
        
        if (oembedData.html) {
          // Try to extract post ID from the oEmbed HTML or URL
          // Unfortunately, oEmbed doesn't give us the post ID directly
          // So we need to tell the user to use a direct URL
          return NextResponse.json(
            { 
              error: "Share URLs are not supported. Please use the direct post URL instead. To get it: 1) Open the post on Facebook, 2) Click the timestamp or '...' menu, 3) Copy the direct URL (usually contains '/posts/' or a numeric ID).",
              hint: "Share URLs (facebook.com/share/p/...) cannot be used with the API. Use direct post URLs like: facebook.com/groups/.../posts/... or facebook.com/{postId}"
            },
            { status: 400 }
          );
        }
      } catch (e) {
        // oEmbed failed, return helpful error
        return NextResponse.json(
          { 
            error: "Share URLs are not supported. Please use the direct post URL. To get it: Open the post on Facebook, click the timestamp, and copy that URL.",
            hint: "Use direct URLs like: facebook.com/groups/.../posts/... or facebook.com/{numericId}"
          },
          { status: 400 }
        );
      }
    }
    
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

