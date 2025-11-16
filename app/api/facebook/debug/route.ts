import { auth } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";

// Debug endpoint to check token permissions and test post access
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const postUrl = searchParams.get("postUrl");

    const apiVersion = process.env.FACEBOOK_API_VERSION || "v18.0";
    const accessToken = session.accessToken;

    const results: any = {
      tokenInfo: {},
      permissions: {},
      postAccess: {},
      errors: [],
    };

    // 1. Check token info and permissions
    try {
      const debugTokenUrl = `https://graph.facebook.com/${apiVersion}/debug_token?input_token=${accessToken}&access_token=${accessToken}`;
      const debugResponse = await fetch(debugTokenUrl);
      const debugData = await debugResponse.json();
      results.tokenInfo = debugData.data || debugData;
    } catch (e: any) {
      results.errors.push(`Token debug error: ${e.message}`);
    }

    // 2. Check what permissions the token has
    try {
      const meUrl = `https://graph.facebook.com/${apiVersion}/me/permissions?access_token=${accessToken}`;
      const meResponse = await fetch(meUrl);
      const meData = await meResponse.json();
      results.permissions = meData;
    } catch (e: any) {
      results.errors.push(`Permissions check error: ${e.message}`);
    }

    // 3. If postId or postUrl provided, test access
    if (postId || postUrl) {
      let testPostId = postId;
      
      if (postUrl && !postId) {
        // Extract post ID from URL
        try {
          const cleanUrl = postUrl.split("?")[0].split("#")[0];
          const groupsMatch = cleanUrl.match(/\/groups\/\d+\/posts\/(\d+)/);
          if (groupsMatch) {
            testPostId = groupsMatch[1];
          } else {
            const directMatch = cleanUrl.match(/facebook\.com\/(\d+)(?:\/|$)/);
            if (directMatch) {
              testPostId = directMatch[1];
            }
          }
        } catch (e) {
          results.errors.push(`URL parsing error: ${e}`);
        }
      }

      if (testPostId) {
        // Try to read the post
        try {
          const readUrl = `https://graph.facebook.com/${apiVersion}/${testPostId}?access_token=${accessToken}&fields=id,message,from,created_time`;
          const readResponse = await fetch(readUrl);
          const readData = await readResponse.json();
          
          if (readData.error) {
            results.postAccess.read = {
              success: false,
              error: readData.error,
              errorCode: readData.error.code,
              errorMessage: readData.error.message,
            };
          } else {
            results.postAccess.read = {
              success: true,
              data: readData,
            };
          }
        } catch (e: any) {
          results.postAccess.read = {
            success: false,
            error: e.message,
          };
        }

        // Try to get comments (to see if we can access comments endpoint)
        try {
          const commentsUrl = `https://graph.facebook.com/${apiVersion}/${testPostId}/comments?access_token=${accessToken}&limit=1`;
          const commentsResponse = await fetch(commentsUrl);
          const commentsData = await commentsResponse.json();
          
          if (commentsData.error) {
            results.postAccess.comments = {
              success: false,
              error: commentsData.error,
              errorCode: commentsData.error.code,
              errorMessage: commentsData.error.message,
            };
          } else {
            results.postAccess.comments = {
              success: true,
              canRead: true,
            };
          }
        } catch (e: any) {
          results.postAccess.comments = {
            success: false,
            error: e.message,
          };
        }
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: error.message || "Debug failed" },
      { status: 500 }
    );
  }
}

