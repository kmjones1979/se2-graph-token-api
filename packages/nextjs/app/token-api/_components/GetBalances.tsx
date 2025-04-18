"use client";

import { useEffect, useState } from "react";
import { AddressInput } from "~~/components/scaffold-eth";

// Define supported EVM networks
interface EVMNetwork {
  id: string;
  name: string;
  icon?: string;
}

const EVM_NETWORKS: EVMNetwork[] = [
  { id: "mainnet", name: "Ethereum" },
  { id: "base", name: "Base" },
  { id: "arbitrum-one", name: "Arbitrum" },
  { id: "bsc", name: "BSC" },
  { id: "optimism", name: "Optimism" },
];

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
  const [selectedNetwork, setSelectedNetwork] = useState<string>("mainnet");
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork);
    setBalances([]); // Clear existing balances
    setError(null);
  };

  const fetchBalances = async () => {
    if (!address) {
      setError("Please enter an address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Construct URL with correct endpoint structure
      const baseUrl = "https://token-api.thegraph.com";
      const url = new URL(`${baseUrl}/balances/evm/${address}`, baseUrl);

      // Add network as a query parameter
      url.searchParams.append("network_id", selectedNetwork);

      console.log(`🌐 Making API request to: ${url.toString()}`);
      console.log(`🔑 Using network: ${selectedNetwork}`);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_GRAPH_TOKEN}`,
          "Content-Type": "application/json",
        },
        cache: "no-store", // Disable caching
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error Response:", errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data: ApiResponse = await response.json();

      // Detailed response logging
      console.log("📊 Full API Response:", JSON.stringify(data, null, 2));
      console.log(`📈 Response Statistics:
        - Total Results: ${data.total_results}
        - Current Page: ${data.pagination?.current_page}
        - Network: ${selectedNetwork}
        - Number of Balances: ${data.data?.length || 0}
      `);

      setBalances(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching balances:", err);
      setError(errorMessage);
      setBalances([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <details className="collapse bg-base-200" open>
      <summary className="collapse-title text-xl font-bold">
        💰 Token Balances - Check token balances for any address
      </summary>
      <div className="collapse-content">
        <div className="flex flex-col gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <label className="label">
                    <span className="label-text text-xl font-bold">Enter Ethereum Address</span>
                  </label>
                  <AddressInput value={address} onChange={setAddress} placeholder="Enter any address" />
                </div>
                <div className="w-full">
                  <label className="label">
                    <span className="label-text text-base">Select Network</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={selectedNetwork}
                    onChange={e => handleNetworkChange(e.target.value)}
                  >
                    {EVM_NETWORKS.map(network => (
                      <option key={network.id} value={network.id}>
                        {network.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={fetchBalances}
                  disabled={isLoading || !address}
                >
                  {isLoading ? "Fetching..." : "Fetch Balances"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading token balances on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}...</span>
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
                <h2 className="card-title mb-4">
                  Token Balances on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}
                </h2>
                <div className="flex flex-col gap-2">
                  {balances && balances.length > 0 ? (
                    balances.map((token, index) => (
                      <div key={`${token.contract}-${index}`} className="card bg-base-200 shadow-sm">
                        <div className="card-body p-4">
                          <div className="flex flex-col">
                            <div className="text-lg font-semibold">{token.symbol}</div>
                            <div className="text-xl">
                              {(Number(token.amount) / Math.pow(10, token.decimals)).toFixed(6)} {token.symbol}
                            </div>
                            {token.value_usd && (
                              <div className="text-sm text-success">${token.value_usd.toFixed(2)}</div>
                            )}
                            <div className="text-xs opacity-70">
                              Last updated: {new Date(token.datetime).toLocaleDateString()}
                            </div>
                          </div>
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
                      <span>
                        No token balances found for this address on{" "}
                        {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
