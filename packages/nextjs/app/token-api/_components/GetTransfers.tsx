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

// Define TypeScript interfaces for the transfers API response
interface TokenTransfer {
  block_num: number;
  timestamp: number;
  date: string;
  contract: string;
  from: string;
  to: string;
  amount: string;
  transaction_id: string;
  decimals: number;
  symbol: string;
  network_id: string;
  price_usd?: number;
  value_usd?: number;
}

interface ApiResponse {
  data: TokenTransfer[];
  statistics: {
    bytes_read: number;
    rows_read: number;
    elapsed: number;
  };
}

// Helper function to estimate date from block number
const estimateDateFromBlock = (blockNum: number, networkId: string): Date => {
  // Current block numbers as of May 2024 (conservative estimates)
  const currentBlock =
    {
      mainnet: 19200000, // Ethereum mainnet
      "arbitrum-one": 175000000, // Arbitrum
      base: 10000000, // Base
      bsc: 34000000, // BSC
      optimism: 110000000, // Optimism
    }[networkId] || 19200000;

  // Average block time in seconds for different networks
  const blockTime =
    {
      mainnet: 12,
      "arbitrum-one": 0.25,
      base: 2,
      bsc: 3,
      optimism: 2,
    }[networkId] || 12;

  // Calculate seconds since the block
  const blockDiff = Math.max(0, currentBlock - blockNum); // Ensure non-negative
  const secondsAgo = blockDiff * blockTime;

  // Calculate the date, ensuring it's not in the future
  const now = new Date();
  const estimatedDate = new Date(now.getTime() - secondsAgo * 1000);
  return estimatedDate > now ? now : estimatedDate;
};

export const GetTransfers = () => {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("mainnet");
  const [transfers, setTransfers] = useState<TokenTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [age, setAge] = useState<number>(30); // Default to 30 days as per docs

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork);
    setTransfers([]); // Clear existing transfers
    setError(null);
  };

  const fetchTransfers = async () => {
    if (!contractAddress) {
      setError("Please enter a contract address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Construct URL with correct endpoint structure
      const baseUrl = "https://token-api.thegraph.com";
      const url = new URL(`${baseUrl}/transfers/evm/${contractAddress}`, baseUrl);

      // Add query parameters
      url.searchParams.append("network_id", selectedNetwork);
      url.searchParams.append("age", age.toString());
      url.searchParams.append("limit", "100"); // Request 100 transfers

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
        - Number of Transfers: ${data.data?.length || 0}
        - Network: ${selectedNetwork}
        - Time Range: Last ${age} days
      `);

      setTransfers(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching transfers:", err);
      setError(errorMessage);
      setTransfers([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <details className="collapse bg-base-200" open>
      <summary className="collapse-title text-xl font-bold">🔄 Token Transfers - View token transfer history</summary>
      <div className="collapse-content">
        <div className="flex flex-col gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <label className="label">
                    <span className="label-text text-xl font-bold">Enter Token Contract Address</span>
                  </label>
                  <AddressInput
                    value={contractAddress}
                    onChange={setContractAddress}
                    placeholder="Enter token contract address"
                  />
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
                  onClick={fetchTransfers}
                  disabled={isLoading || !contractAddress}
                >
                  {isLoading ? "Fetching..." : "Fetch Transfers"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading token transfers on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}...</span>
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

          {!isLoading && !error && contractAddress && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">
                  Token Transfers on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}
                </h2>
                <div className="flex flex-col gap-2">
                  {transfers && transfers.length > 0 ? (
                    transfers.map((transfer, index) => (
                      <div key={`${transfer.transaction_id}-${index}`} className="card bg-base-200 shadow-sm">
                        <div className="card-body p-4">
                          <div className="flex flex-col">
                            <div className="text-lg font-semibold">{transfer.symbol}</div>
                            <div className="flex justify-between items-center">
                              <div className="text-sm opacity-70">From: {transfer.from}</div>
                              <div className="text-sm opacity-70">To: {transfer.to}</div>
                            </div>
                            <div className="text-xl">
                              {(Number(transfer.amount) / Math.pow(10, transfer.decimals)).toFixed(6)} {transfer.symbol}
                            </div>
                            {transfer.value_usd && (
                              <div className="text-sm text-success">${transfer.value_usd.toFixed(2)}</div>
                            )}
                            <div className="text-xs opacity-70">
                              Date:{" "}
                              {transfer.timestamp
                                ? new Date(transfer.timestamp * 1000).toLocaleString()
                                : estimateDateFromBlock(transfer.block_num, transfer.network_id).toLocaleString()}
                            </div>
                            <div className="text-xs opacity-70">
                              <a
                                href={`https://etherscan.io/tx/${transfer.transaction_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-primary"
                              >
                                View Transaction
                              </a>
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
                        No token transfers found for this address on{" "}
                        {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name} in the last {age} days
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
