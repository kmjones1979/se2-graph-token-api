"use client";

import { useEffect, useState } from "react";
import { AddressInput } from "~~/components/scaffold-eth";

// Define TypeScript interfaces for the actual API response
interface TokenBalance {
  block_num: number;
  datetime: string;
  date: string;
  contract: string;
  amount: string;
  decimals: number;
  symbol: string;
  network_id: string;
  price_usd?: number;
  value_usd?: number;
}

interface ApiResponse {
  data: TokenBalance[];
  statistics: {
    bytes_read: number;
    rows_read: number;
    elapsed: number;
  };
  pagination: {
    previous_page: number;
    current_page: number;
    next_page: number;
    total_pages: number;
  };
  results: number;
  total_results: number;
  request_time: string;
  duration_ms: number;
}

export const GetBalances = () => {
  const [address, setAddress] = useState<string>("");
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!address) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log("🔍 Fetching balances for address:", address);

        const response = await fetch(`https://token-api.thegraph.com/balances/evm/${address}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_GRAPH_TOKEN}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API Error Response:", errorText);
          throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const data: ApiResponse = await response.json();
        console.log("📊 API Response:", data);

        setBalances(data.data || []); // Use data.data instead of data.items
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        console.error("❌ Error fetching balances:", err);
        setError(errorMessage);
        setBalances([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the API call to avoid too many requests
    const timeoutId = setTimeout(() => {
      if (address) {
        fetchBalances();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [address]);

  return (
    <div className="flex flex-col gap-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Enter Ethereum Address</h2>
          <AddressInput value={address} onChange={setAddress} placeholder="Enter any address" />
        </div>
      </div>

      {isLoading && (
        <div className="alert">
          <span className="loading loading-spinner loading-md"></span>
          <span>Loading token balances...</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Error: {error}</span>
        </div>
      )}

      {!isLoading && !error && address && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Token Balances</h2>
            <div className="space-y-4">
              {balances && balances.length > 0 ? (
                balances.map((token, index) => (
                  <div key={`${token.contract}-${index}`} className="stats shadow">
                    <div className="stat">
                      <div className="stat-title">{token.symbol}</div>
                      <div className="stat-value">
                        {(Number(token.amount) / Math.pow(10, token.decimals)).toFixed(6)} {token.symbol}
                      </div>
                      {token.value_usd && <div className="stat-desc text-success">${token.value_usd.toFixed(2)}</div>}
                      <div className="stat-desc">Last updated: {new Date(token.datetime).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="alert alert-info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>No token balances found for this address</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
