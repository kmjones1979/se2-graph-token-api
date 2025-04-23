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

// Define supported time intervals
const TIME_INTERVALS = [
  { id: "1h", name: "1 Hour" },
  { id: "4h", name: "4 Hours" },
  { id: "1d", name: "1 Day" },
  { id: "1w", name: "1 Week" },
];

// Define time span options
const TIME_SPANS = [
  { id: "1d", name: "Last 24 Hours", seconds: 86400 },
  { id: "7d", name: "Last 7 Days", seconds: 604800 },
  { id: "30d", name: "Last 30 Days", seconds: 2592000 },
  { id: "90d", name: "Last 90 Days", seconds: 7776000 },
  { id: "180d", name: "Last 180 Days", seconds: 15552000 },
  { id: "1y", name: "Last Year", seconds: 31536000 },
];

// Define TypeScript interfaces for the historical balances API response
interface HistoricalBalance {
  datetime: string;
  contract: string;
  name: string;
  symbol: string;
  decimals: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ApiResponse {
  data: HistoricalBalance[];
  statistics: {
    bytes_read: number;
    rows_read: number;
    elapsed: number;
  };
  pagination?: {
    previous_page: number;
    current_page: number;
    next_page: number;
    total_pages: number;
  };
  results?: number;
  total_results?: number;
}

export const GetHistorical = () => {
  // State for search parameters
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("mainnet");
  const [selectedInterval, setSelectedInterval] = useState<string>("1d");
  const [selectedTimeSpan, setSelectedTimeSpan] = useState<string>("30d");
  const [contractFilter, setContractFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [useMinimalParams, setUseMinimalParams] = useState<boolean>(true);

  // State for API results
  const [historicalBalances, setHistoricalBalances] = useState<HistoricalBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork);
    setHistoricalBalances([]);
    setError(null);
    setPage(1);
  };

  // Handle interval change
  const handleIntervalChange = (newInterval: string) => {
    setSelectedInterval(newInterval);
    setHistoricalBalances([]);
    setError(null);
  };

  // Calculate time range based on selected time span
  const getTimeRange = () => {
    const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    const timeSpanObj = TIME_SPANS.find(span => span.id === selectedTimeSpan);
    if (!timeSpanObj) return { startTime: now - 2592000, endTime: now }; // Default to 30 days

    return {
      startTime: now - timeSpanObj.seconds,
      endTime: now,
    };
  };

  const fetchHistoricalBalances = async () => {
    if (!walletAddress) {
      setError("Please enter a wallet address");
      return;
    }

    // Basic validation for Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setError("Please enter a valid Ethereum address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the token-proxy API route
      const url = new URL("/api/token-proxy", window.location.origin);

      // Add the essential path parameter
      url.searchParams.append("path", `historical/balances/evm/${walletAddress}`);

      // Add network_id as it's typically required
      url.searchParams.append("network_id", selectedNetwork);

      // Only add additional parameters if not using minimal params mode
      if (!useMinimalParams) {
        const { startTime, endTime } = getTimeRange();
        url.searchParams.append("interval", selectedInterval);
        url.searchParams.append("startTime", startTime.toString());
        url.searchParams.append("endTime", endTime.toString());
        url.searchParams.append("limit", limit.toString());
        url.searchParams.append("page", page.toString());

        // Add contract filter if provided
        if (contractFilter) {
          url.searchParams.append("contracts", contractFilter);
        }
      }

      console.log(`🌐 Making API request via proxy: ${url.toString()}`);
      console.log(`🔑 Using network: ${selectedNetwork}`);
      console.log(`🔧 Mode: ${useMinimalParams ? "Minimal parameters" : "Full parameters"}`);

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
        - Number of Historical Balances: ${data.data?.length || 0}
        - Network: ${selectedNetwork}
        - Interval: ${selectedInterval}
      `);

      setHistoricalBalances(data.data || []);

      // Update pagination info if available
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages);
      } else if (data.total_results) {
        setTotalPages(Math.ceil(data.total_results / limit));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching historical balances:", err);
      setError(errorMessage);
      setHistoricalBalances([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format number with appropriate decimal places
  const formatNumber = (num: number, decimals: string) => {
    const decimalPlaces = Math.min(6, Number(decimals)); // Cap at 6 decimal places
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimalPlaces,
    });
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  // Handle pagination
  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(prevPage => prevPage + 1);
      fetchHistoricalBalances();
    }
  };

  const goToPrevPage = () => {
    if (page > 1) {
      setPage(prevPage => prevPage - 1);
      fetchHistoricalBalances();
    }
  };

  return (
    <details className="collapse bg-base-200 shadow-lg" open>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>📈 Historical Balances - Track token balance changes over time</span>
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
                    <span className="label-text text-xl font-bold">Enter Wallet Address</span>
                  </label>
                  <AddressInput value={walletAddress} onChange={setWalletAddress} placeholder="Enter wallet address" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <span className="label-text text-base">Filter by Contract (optional)</span>
                    </label>
                    <AddressInput
                      value={contractFilter}
                      onChange={setContractFilter}
                      placeholder="Enter token contract address to filter"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Time Period</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={selectedTimeSpan}
                      onChange={e => setSelectedTimeSpan(e.target.value)}
                    >
                      {TIME_SPANS.map(span => (
                        <option key={span.id} value={span.id}>
                          {span.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Interval</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={selectedInterval}
                      onChange={e => handleIntervalChange(e.target.value)}
                    >
                      {TIME_INTERVALS.map(interval => (
                        <option key={interval.id} value={interval.id}>
                          {interval.name}
                        </option>
                      ))}
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
                      <option value={10}>10 Records</option>
                      <option value={25}>25 Records</option>
                      <option value={50}>50 Records</option>
                    </select>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={useMinimalParams}
                      onChange={e => setUseMinimalParams(e.target.checked)}
                    />
                    <span className="label-text">Use minimal parameters (recommended for initial query)</span>
                  </label>
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={fetchHistoricalBalances}
                  disabled={isLoading || !walletAddress}
                >
                  {isLoading ? "Fetching..." : "Fetch Historical Balances"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading historical balances on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}...</span>
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

          {!isLoading && !error && historicalBalances.length > 0 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title">
                    Historical Balances for <Address address={walletAddress} />
                  </h2>
                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-outline" onClick={goToPrevPage} disabled={page <= 1 || isLoading}>
                      Previous
                    </button>
                    <span className="flex items-center">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={goToNextPage}
                      disabled={page >= totalPages || isLoading}
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Date/Time</th>
                        <th>Token</th>
                        <th>Contract</th>
                        <th>Open</th>
                        <th>High</th>
                        <th>Low</th>
                        <th>Close</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicalBalances.map((balance, index) => (
                        <tr key={`${balance.contract}-${balance.datetime}-${index}`}>
                          <td>{formatDate(balance.datetime)}</td>
                          <td>
                            <div className="flex flex-col">
                              <span>{balance.symbol}</span>
                              <span className="text-xs opacity-70">{balance.name}</span>
                            </div>
                          </td>
                          <td>
                            <Address address={balance.contract} />
                          </td>
                          <td>{formatNumber(balance.open, balance.decimals)}</td>
                          <td>{formatNumber(balance.high, balance.decimals)}</td>
                          <td>{formatNumber(balance.low, balance.decimals)}</td>
                          <td>{formatNumber(balance.close, balance.decimals)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && historicalBalances.length === 0 && walletAddress && (
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
                No historical balance data found for this address on{" "}
                {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
