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
        // Extract group ID from URL if available
        let groupId: string | null = null;
        if (postUrl) {
          try {
            const cleanUrl = postUrl.split("?")[0].split("#")[0];
            const groupsMatch = cleanUrl.match(/\/groups\/(\d+)\/posts\//);
            if (groupsMatch) {
              groupId = groupsMatch[1];
            }
          } catch (e) {
            // Ignore
          }
        }

        // Try different post ID formats
        const postIdFormats: string[] = [testPostId];
        if (groupId) {
          // Group posts might need format: {groupId}_{postId}
          postIdFormats.push(`${groupId}_${testPostId}`);
        }

        results.postAccess.attempts = [];

        for (const postIdFormat of postIdFormats) {
          const attempt: any = { format: postIdFormat };
          
          // Try to read the post
          try {
            const readUrl = `https://graph.facebook.com/${apiVersion}/${postIdFormat}?access_token=${accessToken}&fields=id,message,from,created_time`;
            const readResponse = await fetch(readUrl);
            const readData = await readResponse.json();
            
            if (readData.error) {
              attempt.read = {
                success: false,
                error: readData.error,
                errorCode: readData.error.code,
                errorMessage: readData.error.message,
              };
            } else {
              attempt.read = {
                success: true,
                data: readData,
              };
              // If this format works, use it as the successful one
              results.postAccess.read = attempt.read;
              results.postAccess.workingFormat = postIdFormat;
            }
          } catch (e: any) {
            attempt.read = {
              success: false,
              error: e.message,
            };
          }

          // Try to get comments
          try {
            const commentsUrl = `https://graph.facebook.com/${apiVersion}/${postIdFormat}/comments?access_token=${accessToken}&limit=1`;
            const commentsResponse = await fetch(commentsUrl);
            const commentsData = await commentsResponse.json();
            
            if (commentsData.error) {
              attempt.comments = {
                success: false,
                error: commentsData.error,
                errorCode: commentsData.error.code,
                errorMessage: commentsData.error.message,
              };
            } else {
              attempt.comments = {
                success: true,
                canRead: true,
              };
            }
          } catch (e: any) {
            attempt.comments = {
              success: false,
              error: e.message,
            };
          }

          results.postAccess.attempts.push(attempt);
        }

        // If no format worked, use the first attempt's error
        if (!results.postAccess.read) {
          results.postAccess.read = results.postAccess.attempts[0]?.read || {
            success: false,
            error: "All formats failed",
          };
        }

        // Try to access the group itself (if we have group ID)
        if (groupId) {
          try {
            const groupUrl = `https://graph.facebook.com/${apiVersion}/${groupId}?access_token=${accessToken}&fields=id,name,privacy`;
            const groupResponse = await fetch(groupUrl);
            const groupData = await groupResponse.json();
            
            if (groupData.error) {
              results.groupAccess = {
                success: false,
                error: groupData.error,
                errorCode: groupData.error.code,
                errorMessage: groupData.error.message,
              };
            } else {
              results.groupAccess = {
                success: true,
                data: groupData,
              };
            }
          } catch (e: any) {
            results.groupAccess = {
              success: false,
              error: e.message,
            };
          }
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

