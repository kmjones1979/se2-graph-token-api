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
];

// Define TypeScript interfaces for the OHLC API response
interface OHLCData {
  datetime: string;
  network_id: string;
  pair: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  uaw?: number; // Unique active wallets
  transactions?: number;
}

interface ApiResponse {
  data: OHLCData[];
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

export const GetOHLCByPool = () => {
  // State for search parameters
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("mainnet");
  const [selectedInterval, setSelectedInterval] = useState<string>("1d");
  const [selectedTimeSpan, setSelectedTimeSpan] = useState<string>("30d");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [useMinimalParams, setUseMinimalParams] = useState<boolean>(true);

  // State for API results
  const [ohlcData, setOhlcData] = useState<OHLCData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Example pool addresses
  const examplePools = {
    mainnet: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640", // ETH/USDC on Uniswap V3
    base: "0x4c36388be6f416a29c8d8eee81c771ce6be14b18", // ETH/USDbC on BaseSwap
    "arbitrum-one": "0xc31e54c7a869b9fcbecc14363cf510d1c41fa443", // ETH/USDC on Uniswap V3
    bsc: "0x58f876857a02d6762e0101bb5c46a8c1ed44dc16", // BNB/BUSD on PancakeSwap
    optimism: "0x85149247691df622eaf1a8bd0cafd40bc45154a9", // ETH/USDC on Uniswap V3
    matic: "0xa374094527e1673a86de625aa59517c5de346d32", // MATIC/USDC on Quickswap
  };

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork);
    setOhlcData([]);
    setError(null);
    setPage(1);
  };

  // Handle interval change
  const handleIntervalChange = (newInterval: string) => {
    setSelectedInterval(newInterval);
    setOhlcData([]);
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

  const fetchOHLCData = async () => {
    if (!poolAddress) {
      setError("Please enter a pool address");
      return;
    }

    // Basic validation for Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(poolAddress)) {
      setError("Please enter a valid pool address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the token-proxy API route
      const url = new URL("/api/token-proxy", window.location.origin);

      // Add the essential path parameter
      url.searchParams.append("path", `ohlc/pools/evm/${poolAddress}`);

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
        - Number of OHLC Records: ${data.data?.length || 0}
        - Network: ${selectedNetwork}
        - Interval: ${selectedInterval}
      `);

      setOhlcData(data.data || []);

      // Update pagination info if available
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages);
      } else if (data.total_results) {
        setTotalPages(Math.ceil(data.total_results / limit));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching OHLC data:", err);
      setError(errorMessage);
      setOhlcData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  // Format price
  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  // Format volume
  const formatVolume = (volume: number) => {
    return volume.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Handle pagination
  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(prevPage => prevPage + 1);
      fetchOHLCData();
    }
  };

  const goToPrevPage = () => {
    if (page > 1) {
      setPage(prevPage => prevPage - 1);
      fetchOHLCData();
    }
  };

  // Price change percentage calculation
  const calculatePriceChange = (open: number, close: number) => {
    if (open === 0) return 0;
    const change = ((close - open) / open) * 100;
    return change.toFixed(2);
  };

  return (
    <details className="collapse bg-base-200 shadow-lg" open>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>📊 Pool OHLC Data - View price history for token pools</span>
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
                    <span className="label-text text-xl font-bold">Enter Pool Address</span>
                  </label>
                  <AddressInput
                    value={poolAddress}
                    onChange={setPoolAddress}
                    placeholder="Enter the DEX pool address"
                  />
                  <div className="mt-2 text-sm opacity-70">
                    Example for {selectedNetwork}: {examplePools[selectedNetwork as keyof typeof examplePools]}
                  </div>
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
                      <span className="label-text text-base">Interval</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={selectedInterval}
                      onChange={e => handleIntervalChange(e.target.value)}
                      disabled={useMinimalParams}
                    >
                      {TIME_INTERVALS.map(interval => (
                        <option key={interval.id} value={interval.id}>
                          {interval.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Time Period</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={selectedTimeSpan}
                      onChange={e => setSelectedTimeSpan(e.target.value)}
                      disabled={useMinimalParams}
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
                      <span className="label-text text-base">Results per Page</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={limit}
                      onChange={e => setLimit(Number(e.target.value))}
                      disabled={useMinimalParams}
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
                  onClick={fetchOHLCData}
                  disabled={isLoading || !poolAddress}
                >
                  {isLoading ? "Fetching..." : "Fetch OHLC Data"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading OHLC data on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}...</span>
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

          {!isLoading && !error && ohlcData.length > 0 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title">
                    Price Data for Pool <Address address={poolAddress} />
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
                        <th>Pair</th>
                        <th>Open</th>
                        <th>High</th>
                        <th>Low</th>
                        <th>Close</th>
                        <th>Change</th>
                        <th>Volume</th>
                        {useMinimalParams ? null : <th>Wallets</th>}
                        {useMinimalParams ? null : <th>Transactions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {ohlcData.map((data, index) => (
                        <tr key={`${data.datetime}-${index}`}>
                          <td>{formatDate(data.datetime)}</td>
                          <td>{data.pair}</td>
                          <td>${formatPrice(data.open)}</td>
                          <td>${formatPrice(data.high)}</td>
                          <td>${formatPrice(data.low)}</td>
                          <td>${formatPrice(data.close)}</td>
                          <td
                            className={
                              Number(calculatePriceChange(data.open, data.close)) >= 0 ? "text-success" : "text-error"
                            }
                          >
                            {calculatePriceChange(data.open, data.close)}%
                          </td>
                          <td>${formatVolume(data.volume)}</td>
                          {useMinimalParams ? null : <td>{data.uaw?.toLocaleString() || "N/A"}</td>}
                          {useMinimalParams ? null : <td>{data.transactions?.toLocaleString() || "N/A"}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && ohlcData.length === 0 && poolAddress && (
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
                No OHLC data found for this pool on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}. Make sure
                you've entered a valid DEX pool address for the selected network.
              </span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
