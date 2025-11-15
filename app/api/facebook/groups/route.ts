import { auth } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";

// Get user's groups
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const apiVersion = process.env.FACEBOOK_API_VERSION || "v18.0";
    const url = `https://graph.facebook.com/${apiVersion}/me/groups?access_token=${session.accessToken}`;

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
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

