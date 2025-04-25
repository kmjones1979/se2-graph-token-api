import { NextRequest, NextResponse } from "next/server";

// Get the API URL from the environment variables or use the correct stage URL
const API_URL = process.env.NEXT_PUBLIC_GRAPH_API_URL || "https://token-api.service.stage.pinax.network";

/**
 * Proxy API Handler for Token API requests
 * @param request The incoming request
 * @returns A proxied response from the Token API
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters from the request
    const searchParams = request.nextUrl.searchParams;

    // Get the path to the API endpoint (required)
    const path = searchParams.get("path");
    if (!path) {
      return NextResponse.json({ error: "Missing 'path' parameter" }, { status: 400 });
    }

    // Build the complete URL
    const url = new URL(path, API_URL);

    // Forward all other query parameters to the API request
    searchParams.forEach((value, key) => {
      if (key !== "path") {
        url.searchParams.append(key, value);
      }
    });

    console.log(`🌐 Proxying request to: ${url.toString()}`);

    // Include authorization header if environment variable exists
    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // First try to use API key if available
    if (process.env.NEXT_PUBLIC_GRAPH_API_KEY) {
      headers["X-Api-Key"] = process.env.NEXT_PUBLIC_GRAPH_API_KEY;
    }
    // Fall back to JWT token if no API key
    else if (process.env.NEXT_PUBLIC_GRAPH_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_GRAPH_TOKEN}`;
    } else {
      console.warn(
        "⚠️ No API token or key found in environment variables. API calls may fail due to authentication issues.",
      );
    }

    // Make the API request
    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store", // Disable caching
    });

    // Log the raw response for debugging
    console.log(`📡 API Response Status: ${response.status}`);

    // Forward response status and body
    let data;
    try {
      data = await response.json();
    } catch (e) {
      const text = await response.text();
      console.error("Failed to parse response as JSON:", text);
      return NextResponse.json({ error: "Failed to parse API response" }, { status: 500 });
    }

    // Return the response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("❌ API Proxy Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    );
  }
}
