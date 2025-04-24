"use client";

import { useState } from "react";
import { NetworkId } from "../_hooks/useTokenApi";
import { TokenMetadata, useTokenMetadata } from "../_hooks/useTokenMetadata";
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
  { id: "matic", name: "Polygon" },
];

// Extended token metadata interface for our component
interface TokenMetadataResponse extends TokenMetadata {
  date?: string;
  timestamp?: string;
  block_num?: number;
  address?: string;
  network_id?: string;
  circulating_supply?: string;
  holders?: number;
  icon?: {
    web3icon?: string;
  };
  price_usd?: number;
  market_cap?: number;
}

interface ApiResponse {
  data?: TokenMetadataResponse[];
  statistics?: {
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
      matic: 50000000, // Polygon
    }[networkId] || 19200000;

  // Average block time in seconds for different networks
  const blockTime =
    {
      mainnet: 12,
      "arbitrum-one": 0.25,
      base: 2,
      bsc: 3,
      optimism: 2,
      matic: 2.5,
    }[networkId] || 12;

  // Calculate seconds since the block
  const blockDiff = Math.max(0, currentBlock - blockNum); // Ensure non-negative
  const secondsAgo = blockDiff * blockTime;

  // Calculate the date, ensuring it's not in the future
  const now = new Date();
  const estimatedDate = new Date(now.getTime() - secondsAgo * 1000);
  return estimatedDate > now ? now : estimatedDate;
};

export const GetMetadata = ({ isOpen = true }: { isOpen?: boolean }) => {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [metadata, setMetadata] = useState<TokenMetadataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the hook to get types but skip automatic fetching
  const {
    data,
    isLoading: hookLoading,
    error: hookError,
  } = useTokenMetadata(
    contractAddress,
    {
      network_id: selectedNetwork,
      include_market_data: true,
    },
    { skip: true }, // Skip initial fetch until explicitly triggered
  );

  // Example token addresses for testing
  const exampleTokens = {
    mainnet: "0xc944E90C64B2c07662A292be6244BDf05Cda44a7", // GRT Token
    "arbitrum-one": "0x912CE59144191C1204E64559FE8253a0e49E6548", // ARB Token
    base: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", // cbETH
    bsc: "0x55d398326f99059fF775485246999027B3197955", // BSC-USD
    optimism: "0x4200000000000000000000000000000000000042", // OP Token
    matic: "0x0000000000000000000000000000000000001010", // MATIC
  };

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setMetadata(null);
    setError(null);
  };

  const fetchMetadata = async () => {
    if (!contractAddress) {
      setError("Please enter a contract address");
      return;
    }

    // Basic validation for Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      setError("Please enter a valid ERC20 contract address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Ensure the address has 0x prefix
      const formattedAddress = contractAddress.startsWith("0x") ? contractAddress : `0x${contractAddress}`;

      // Define the API endpoint
      const endpoint = `tokens/evm/${formattedAddress}`;
      console.log("🔍 API endpoint:", endpoint);

      // Build the query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("path", endpoint);
      queryParams.append("network_id", selectedNetwork);
      queryParams.append("include_market_data", "true");

      // Call the API directly
      const fullUrl = `/api/token-proxy?${queryParams.toString()}`;
      console.log("🔍 Making direct API request to:", fullUrl);
      console.log(`🔑 Using network: ${selectedNetwork}`);
      console.log(`📝 Contract Address: ${contractAddress}`);

      const response = await fetch(fullUrl);
      console.log("🔍 API response status:", response.status);

      // Handle 404 with custom error message
      if (response.status === 404) {
        const errorText = await response.text();
        throw new Error(`No metadata found for this token contract. Please verify:
          1. The contract address is correct
          2. The contract is an ERC20 token
          3. The selected network is correct (currently: ${selectedNetwork})
          
          Try these example tokens:
          - Mainnet (GRT): ${exampleTokens.mainnet}
          - Arbitrum (ARB): ${exampleTokens["arbitrum-one"]}
          - Base (cbETH): ${exampleTokens.base}
          - BSC (BSC-USD): ${exampleTokens.bsc}
          - Optimism (OP): ${exampleTokens.optimism}
          - Polygon (MATIC): ${exampleTokens.matic}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API error response:", errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const jsonData: ApiResponse = await response.json();
      console.log("🔍 API response data:", jsonData);

      // Process the response based on format
      if (jsonData.data && Array.isArray(jsonData.data) && jsonData.data.length > 0) {
        console.log("📊 Setting metadata from jsonData.data[0]");
        setMetadata(jsonData.data[0]);
      } else if (typeof jsonData === "object" && jsonData !== null) {
        // Handle case where the API returns the token data directly
        console.log("📊 Setting metadata from direct object response");

        // Check if it has token metadata properties
        if ("name" in jsonData || "symbol" in jsonData || "decimals" in jsonData) {
          setMetadata(jsonData as TokenMetadataResponse);
        } else {
          console.error("❌ Unexpected response format:", jsonData);
          throw new Error("Unexpected response format. No token metadata found.");
        }
      } else {
        console.log("⚠️ No token metadata found in response or unexpected format");
        setMetadata(null);
        throw new Error("No metadata found for this token contract");
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
    <details className="collapse bg-blue-500/20 shadow-lg mb-4 rounded-xl border border-blue-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>🔍 Token Metadata - Get detailed information about any ERC20 token</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 transform transition-transform duration-200 details-toggle"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </summary>
      <style jsx>{`
        details[open] .details-toggle {
          transform: rotate(180deg);
        }
      `}</style>
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
                  <div className="mt-2 text-sm opacity-70">
                    Example for {selectedNetwork}: {exampleTokens[selectedNetwork as keyof typeof exampleTokens]}
                  </div>
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
                  {metadata.logo_url && (
                    <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center flex-shrink-0">
                      <img src={metadata.logo_url} alt="Token logo" className="w-10 h-10 rounded-full" />
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
                    <div className="stat-value text-base break-all font-mono">
                      {metadata.contract_address || metadata.address}
                    </div>
                  </div>

                  <div className="stat bg-base-200 rounded-box p-4">
                    <div className="stat-title">Network</div>
                    <div className="stat-value">
                      {EVM_NETWORKS.find(n => n.id === (metadata.network_id || selectedNetwork))?.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="stat bg-base-200 rounded-box p-4">
                      <div className="stat-title">Circulating Supply</div>
                      <div className="stat-value text-primary text-2xl sm:text-3xl break-all">
                        {formatSupply(metadata.circulating_supply || metadata.total_supply || "0", metadata.decimals)}
                      </div>
                      <div className="stat-desc">Decimals: {metadata.decimals}</div>
                    </div>

                    <div className="stat bg-base-200 rounded-box p-4">
                      <div className="stat-title">Total Holders</div>
                      <div className="stat-value text-secondary">{formatNumber(metadata.holders || 0)}</div>
                    </div>

                    {(metadata.market_data?.price_usd || metadata.price_usd) && (
                      <div className="stat bg-base-200 rounded-box p-4">
                        <div className="stat-title">Price (USD)</div>
                        <div className="stat-value">
                          ${(metadata.market_data?.price_usd || metadata.price_usd || 0).toFixed(4)}
                        </div>
                        {metadata.market_data?.price_change_percentage_24h && (
                          <div
                            className={`stat-desc ${metadata.market_data.price_change_percentage_24h >= 0 ? "text-success" : "text-error"}`}
                          >
                            {metadata.market_data.price_change_percentage_24h >= 0 ? "↗︎" : "↘︎"}
                            {metadata.market_data.price_change_percentage_24h.toFixed(2)}% (24h)
                          </div>
                        )}
                      </div>
                    )}

                    {(metadata.market_data?.market_cap || metadata.market_cap) && (
                      <div className="stat bg-base-200 rounded-box p-4">
                        <div className="stat-title">Market Cap (USD)</div>
                        <div className="stat-value text-2xl sm:text-3xl break-all">
                          ${formatNumber((metadata.market_data?.market_cap || metadata.market_cap || 0).toFixed(2))}
                        </div>
                      </div>
                    )}

                    {metadata.market_data?.total_volume_24h && (
                      <div className="stat bg-base-200 rounded-box p-4">
                        <div className="stat-title">24h Volume (USD)</div>
                        <div className="stat-value">
                          ${formatNumber(metadata.market_data.total_volume_24h.toFixed(2))}
                        </div>
                      </div>
                    )}

                    <div className="stat bg-base-200 rounded-box p-4">
                      <div className="stat-title">Last Updated</div>
                      <div className="stat-value text-base">
                        {metadata.block_timestamp
                          ? new Date(metadata.block_timestamp * 1000).toLocaleString()
                          : metadata.timestamp
                            ? new Date(metadata.timestamp.replace(" ", "T")).toLocaleString()
                            : metadata.block_number || metadata.block_num
                              ? estimateDateFromBlock(
                                  metadata.block_number || metadata.block_num || 0,
                                  metadata.network_id || selectedNetwork,
                                ).toLocaleString()
                              : new Date().toLocaleString()}
                      </div>
                      <div className="stat-desc">Block: {metadata.block_number || metadata.block_num || "Unknown"}</div>
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
