import { auth } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";

// Get posts from a group
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
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    const apiVersion = process.env.FACEBOOK_API_VERSION || "v18.0";
    const url = `https://graph.facebook.com/${apiVersion}/${groupId}/feed?access_token=${session.accessToken}&limit=10`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

