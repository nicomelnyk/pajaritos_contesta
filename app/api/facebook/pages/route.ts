import { auth } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";

// Get user's Pages and their access tokens
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
    // Get Pages the user manages with their access tokens
    const url = `https://graph.facebook.com/${apiVersion}/me/accounts?access_token=${session.accessToken}&fields=id,name,access_token,category`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || "Failed to fetch pages" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: data.data || [] });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

