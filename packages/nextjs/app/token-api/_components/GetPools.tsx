"use client";

import { useState } from "react";
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
  { id: "matic", name: "Polygon" },
  { id: "unichain", name: "Unichain" },
];

// Define supported protocols
const PROTOCOLS = [
  { id: "uniswap_v2", name: "Uniswap V2" },
  { id: "uniswap_v3", name: "Uniswap V3" },
];

// Define TypeScript interfaces for the pools API response
interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

interface PoolInfo {
  block_num: number;
  datetime: string;
  network_id: string;
  transaction_id: string;
  factory: string;
  pool: string;
  token0: TokenInfo;
  token1: TokenInfo;
  fee: number;
  protocol: string;
}

interface ApiResponse {
  data: PoolInfo[];
  statistics: {
    bytes_read: number;
    rows_read: number;
    elapsed: number;
  };
}

export const GetPools = () => {
  // State for search parameters
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("mainnet");
  const [selectedProtocol, setSelectedProtocol] = useState<string>("uniswap_v3");
  const [symbol, setSymbol] = useState<string>("");

  // State for API results
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork);
    setPools([]);
    setError(null);
  };

  // Handle protocol change
  const handleProtocolChange = (newProtocol: string) => {
    setSelectedProtocol(newProtocol);
    setPools([]);
    setError(null);
  };

  const fetchPools = async () => {
    // Require at least one search parameter
    if (!poolAddress && !tokenAddress && !symbol) {
      setError("Please enter at least one search parameter: pool address, token address, or symbol");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the token-proxy API route
      const url = new URL("/api/token-proxy", window.location.origin);

      // Add the path and query parameters
      url.searchParams.append("path", "pools/evm");
      url.searchParams.append("network_id", selectedNetwork);
      url.searchParams.append("protocol", selectedProtocol);

      // Add optional parameters if provided
      if (poolAddress) url.searchParams.append("pool", poolAddress);
      if (tokenAddress) url.searchParams.append("token", tokenAddress);
      if (symbol) url.searchParams.append("symbol", symbol);

      console.log(`🌐 Making API request via proxy: ${url.toString()}`);
      console.log(`🔑 Using network: ${selectedNetwork}`);
      console.log(`🔄 Using protocol: ${selectedProtocol}`);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
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
        - Number of Pools: ${data.data?.length || 0}
        - Network: ${selectedNetwork}
        - Protocol: ${selectedProtocol}
      `);

      setPools(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching pools:", err);
      setError(errorMessage);
      setPools([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format pool info for display
  const formatPoolDisplay = (pool: PoolInfo) => {
    return `${pool.token0.symbol}/${pool.token1.symbol}`;
  };

  // Format fee as percentage
  const formatFee = (fee: number) => {
    return `${fee / 10000}%`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  // Get network name by ID
  const getNetworkName = (networkId: string) => {
    return EVM_NETWORKS.find(n => n.id === networkId)?.name || networkId;
  };

  return (
    <details className="collapse bg-base-200 shadow-lg" open>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>🔄 DEX Pools - Explore liquidity pools across protocols</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base font-bold">Pool Address (optional)</span>
                    </label>
                    <AddressInput
                      value={poolAddress}
                      onChange={setPoolAddress}
                      placeholder="Enter pool contract address"
                    />
                  </div>
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base font-bold">Token Address (optional)</span>
                    </label>
                    <AddressInput
                      value={tokenAddress}
                      onChange={setTokenAddress}
                      placeholder="Enter token contract address"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Symbol (optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter token symbol"
                      className="input input-bordered w-full"
                      value={symbol}
                      onChange={e => setSymbol(e.target.value)}
                    />
                  </div>
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Network</span>
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
                      <span className="label-text text-base">Protocol</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={selectedProtocol}
                      onChange={e => handleProtocolChange(e.target.value)}
                    >
                      {PROTOCOLS.map(protocol => (
                        <option key={protocol.id} value={protocol.id}>
                          {protocol.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={fetchPools}
                  disabled={isLoading || (!poolAddress && !tokenAddress && !symbol)}
                >
                  {isLoading ? "Searching..." : "Search Pools"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Searching for pools on {getNetworkName(selectedNetwork)}...</span>
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

          {!isLoading && !error && pools.length > 0 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">
                  {pools.length} Pool{pools.length !== 1 ? "s" : ""} Found on {getNetworkName(selectedNetwork)}
                </h2>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Pool</th>
                        <th>Pair</th>
                        <th>Fee</th>
                        <th>Created</th>
                        <th>Protocol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pools.map((pool, index) => (
                        <tr key={`${pool.pool}-${index}`}>
                          <td>
                            <Address address={pool.pool} />
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <span>{pool.token0.symbol}</span>
                              <span>/</span>
                              <span>{pool.token1.symbol}</span>
                            </div>
                          </td>
                          <td>{formatFee(pool.fee)}</td>
                          <td>{formatDate(pool.datetime)}</td>
                          <td>
                            <span className="badge badge-accent">
                              {pool.protocol === "uniswap_v3" ? "Uniswap V3" : "Uniswap V2"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && pools.length === 0 && (poolAddress || tokenAddress || symbol) && (
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
              <span>No pools found matching your criteria on {getNetworkName(selectedNetwork)}</span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
