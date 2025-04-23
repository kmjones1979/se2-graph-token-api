"use client";

import { useEffect, useState } from "react";
import { Address, AddressInput } from "~~/components/scaffold-eth";

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

// Define TypeScript interfaces for the holders API response
interface TokenHolder {
  block_num: number;
  timestamp: number;
  date: string;
  address: string;
  amount: string;
  decimals: number;
  symbol: string;
  network_id: string;
  price_usd?: number;
  value_usd?: number;
}

interface ApiResponse {
  data: TokenHolder[];
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

export const GetHolders = () => {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("mainnet");
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<string>("desc");
  const [limit, setLimit] = useState<number>(50);
  const [page, setPage] = useState<number>(1);

  // Example token addresses for testing
  const exampleTokens = {
    mainnet: "0xc944E90C64B2c07662A292be6244BDf05Cda44a7", // GRT Token
    "arbitrum-one": "0x912CE59144191C1204E64559FE8253a0e49E6548", // ARB Token
    base: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", // cbETH
    bsc: "0x55d398326f99059fF775485246999027B3197955", // BSC-USD
    optimism: "0x4200000000000000000000000000000000000042", // OP Token
  };

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork);
    setHolders([]);
    setError(null);
    setPage(1); // Reset pagination when network changes
  };

  const fetchHolders = async () => {
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
      // Use the token-proxy API route
      const url = new URL("/api/token-proxy", window.location.origin);

      // Add the path and query parameters
      url.searchParams.append("path", `holders/evm/${contractAddress}`);
      url.searchParams.append("network_id", selectedNetwork);
      url.searchParams.append("order-by", orderBy);
      url.searchParams.append("limit", limit.toString());
      url.searchParams.append("page", page.toString());

      console.log(`🌐 Making API request via proxy: ${url.toString()}`);
      console.log(`🔑 Using network: ${selectedNetwork}`);
      console.log(`📝 Contract Address: ${contractAddress}`);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const responseData = await response.json();
      console.log("📊 API Response:", responseData);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`No holders found for this token contract. Please verify:
            1. The contract address is correct
            2. The contract is an ERC20 token
            3. The selected network is correct (currently: ${selectedNetwork})
            
            Try these example tokens:
            - Mainnet (GRT): ${exampleTokens.mainnet}
            - Arbitrum (ARB): ${exampleTokens["arbitrum-one"]}
            - Base (cbETH): ${exampleTokens.base}
            - BSC (BSC-USD): ${exampleTokens.bsc}
            - Optimism (OP): ${exampleTokens.optimism}`);
        } else {
          throw new Error(responseData.message || "Failed to fetch holders");
        }
      }

      setHolders(responseData.data || []);

      console.log(`📈 Response Statistics:
        - Number of Holders: ${responseData.data?.length || 0}
        - Network: ${selectedNetwork}
        - Order: ${orderBy}
        - Page: ${page}
      `);
    } catch (err) {
      console.error("❌ Error fetching holders:", err);
      setError(err instanceof Error ? err.message : "An error occurred while fetching holders");
      setHolders([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <details className="collapse bg-base-200 shadow-lg" open>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>👥 Token Holders - View all holders of an ERC20 token</span>
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
                <div className="w-full">
                  <label className="label">
                    <span className="label-text text-base">Sort Order</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={orderBy}
                    onChange={e => setOrderBy(e.target.value)}
                  >
                    <option value="desc">Highest Balance First</option>
                    <option value="asc">Lowest Balance First</option>
                  </select>
                </div>
                <div className="w-full">
                  <label className="label">
                    <span className="label-text text-base">Results per Page</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={limit}
                    onChange={e => setLimit(Number(e.target.value))}
                  >
                    <option value={10}>10 Holders</option>
                    <option value={50}>50 Holders</option>
                    <option value={100}>100 Holders</option>
                    <option value={500}>500 Holders</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    Previous
                  </button>
                  <span className="py-1">Page {page}</span>
                  <button
                    className="btn btn-sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={isLoading || holders.length < limit}
                  >
                    Next
                  </button>
                </div>
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={fetchHolders}
                  disabled={isLoading || !contractAddress}
                >
                  {isLoading ? "Fetching..." : "Fetch Holders"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading token holders on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}...</span>
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
                  Token Holders on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}
                </h2>
                <div className="flex flex-col gap-2">
                  {holders && holders.length > 0 ? (
                    holders.map((holder, index) => (
                      <div key={`${holder.address}-${index}`} className="card bg-base-200 shadow-sm">
                        <div className="card-body p-4">
                          <div className="flex flex-col">
                            <div className="flex justify-between items-center">
                              <div className="text-lg font-semibold">Holder #{index + 1}</div>
                              <div className="text-sm opacity-70">
                                <Address address={holder.address} />
                              </div>
                            </div>
                            <div className="text-xl">
                              {(Number(holder.amount) / Math.pow(10, holder.decimals)).toFixed(6)} {holder.symbol}
                            </div>
                            {holder.value_usd && (
                              <div className="text-sm text-success">${holder.value_usd.toFixed(2)}</div>
                            )}
                            <div className="text-xs opacity-70">
                              Last updated:{" "}
                              {holder.timestamp
                                ? new Date(holder.timestamp * 1000).toLocaleString()
                                : estimateDateFromBlock(holder.block_num, holder.network_id).toLocaleString()}
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
                        No token holders found for this contract on{" "}
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
