import { NextRequest, NextResponse } from "next/server";

// Get the API URL from the environment variables or use the default
const API_URL = process.env.NEXT_PUBLIC_GRAPH_API_URL || "https://token-api.thegraph.com";

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

    if (process.env.NEXT_PUBLIC_GRAPH_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_GRAPH_TOKEN}`;
    }

    // Make the API request
    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store", // Disable caching
    });

    // Forward response status and body
    const data = await response.json();

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
