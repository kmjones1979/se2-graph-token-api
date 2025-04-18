"use client";

import { useState } from "react";
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

// Define TypeScript interfaces for the metadata API response
interface TokenMetadata {
  date: string;
  timestamp: string;
  block_num: number;
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  network_id: string;
  circulating_supply: string;
  holders: number;
  icon?: {
    web3icon: string;
  };
  price_usd?: number;
  market_cap?: number;
}

interface ApiResponse {
  data: TokenMetadata[];
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

export const GetMetadata = () => {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("mainnet");
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork);
    setMetadata(null);
    setError(null);
  };

  const fetchMetadata = async () => {
    if (!contractAddress) {
      setError("Please enter a contract address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Construct URL with correct endpoint structure
      const baseUrl = "https://token-api.thegraph.com";
      const url = new URL(`${baseUrl}/tokens/evm/${contractAddress}`, baseUrl);

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

      if (data.data && data.data.length > 0) {
        setMetadata(data.data[0]);
      } else {
        setError("No metadata found for this token");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching metadata:", err);
      setError(errorMessage);
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Format large numbers with commas
  const formatNumber = (num: string | number) => {
    return new Intl.NumberFormat().format(Number(num));
  };

  // Format supply with decimals
  const formatSupply = (supply: string, decimals: number) => {
    const amount = Number(supply) / Math.pow(10, decimals);
    return formatNumber(amount.toFixed(2));
  };

  return (
    <details className="collapse bg-base-200" open>
      <summary className="collapse-title text-xl font-bold">
        🔍 Token Metadata - Get detailed information about any ERC20 token
      </summary>
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
                  onClick={fetchMetadata}
                  disabled={isLoading || !contractAddress}
                >
                  {isLoading ? "Fetching..." : "Fetch Metadata"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading token metadata on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}...</span>
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

          {!isLoading && !error && metadata && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                  {metadata.icon?.web3icon && (
                    <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{metadata.icon.web3icon}</span>
                    </div>
                  )}
                  <div className="flex-grow min-w-0">
                    <h2 className="card-title text-2xl">{metadata.name}</h2>
                    <p className="text-lg opacity-70">{metadata.symbol}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="stat bg-base-200 rounded-box p-4">
                    <div className="stat-title">Contract Address</div>
                    <div className="stat-value text-base break-all font-mono">{metadata.address}</div>
                  </div>

                  <div className="stat bg-base-200 rounded-box p-4">
                    <div className="stat-title">Network</div>
                    <div className="stat-value">{EVM_NETWORKS.find(n => n.id === metadata.network_id)?.name}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="stat bg-base-200 rounded-box p-4">
                      <div className="stat-title">Circulating Supply</div>
                      <div className="stat-value text-primary text-2xl sm:text-3xl break-all">
                        {formatSupply(metadata.circulating_supply, metadata.decimals)}
                      </div>
                      <div className="stat-desc">Decimals: {metadata.decimals}</div>
                    </div>

                    <div className="stat bg-base-200 rounded-box p-4">
                      <div className="stat-title">Total Holders</div>
                      <div className="stat-value text-secondary">{formatNumber(metadata.holders)}</div>
                    </div>

                    {metadata.price_usd && (
                      <div className="stat bg-base-200 rounded-box p-4">
                        <div className="stat-title">Price (USD)</div>
                        <div className="stat-value">${metadata.price_usd.toFixed(4)}</div>
                      </div>
                    )}

                    {metadata.market_cap && (
                      <div className="stat bg-base-200 rounded-box p-4">
                        <div className="stat-title">Market Cap (USD)</div>
                        <div className="stat-value text-2xl sm:text-3xl break-all">
                          ${formatNumber(metadata.market_cap.toFixed(2))}
                        </div>
                      </div>
                    )}

                    <div className="stat bg-base-200 rounded-box p-4">
                      <div className="stat-title">Last Updated</div>
                      <div className="stat-value text-base">
                        {metadata.timestamp
                          ? new Date(metadata.timestamp.replace(" ", "T")).toLocaleString()
                          : estimateDateFromBlock(metadata.block_num, metadata.network_id).toLocaleString()}
                      </div>
                      <div className="stat-desc">Block: {metadata.block_num}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
