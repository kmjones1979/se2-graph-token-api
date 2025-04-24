"use client";

import { useState } from "react";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import {
  OHLCDataPoint,
  PoolOHLCParams,
  PoolOHLCResponse,
  useTokenOHLCByPool,
} from "~~/app/token-api/_hooks/useTokenOHLCByPool";
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
const TIME_INTERVALS: { id: PoolOHLCParams["resolution"]; name: string }[] = [
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

// Extended OHLC data interface for our component
interface OHLCDataExtended extends OHLCDataPoint {
  datetime?: string;
  network_id?: string;
  pair?: string;
}

interface ApiResponse {
  data?: OHLCDataExtended[];
  statistics?: {
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
  pool_address?: string;
  token0_address?: string;
  token0_symbol?: string;
  token0_name?: string;
  token0_decimals?: number;
  token1_address?: string;
  token1_symbol?: string;
  token1_name?: string;
  token1_decimals?: number;
  protocol?: string;
  network_id?: NetworkId;
  resolution?: string;
  ohlc?: OHLCDataPoint[];
}

export const GetOHLCByPool = ({ isOpen = true }: { isOpen?: boolean }) => {
  // State for search parameters
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [selectedInterval, setSelectedInterval] = useState<PoolOHLCParams["resolution"]>("1d");
  const [selectedTimeSpan, setSelectedTimeSpan] = useState<string>("30d");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [useMinimalParams, setUseMinimalParams] = useState<boolean>(true);

  // State for API results
  const [ohlcData, setOhlcData] = useState<OHLCDataExtended[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [poolInfo, setPoolInfo] = useState<{
    token0Symbol?: string;
    token1Symbol?: string;
    protocol?: string;
  } | null>(null);

  // Use the hook to get types but skip automatic fetching
  const {
    data,
    isLoading: hookLoading,
    error: hookError,
  } = useTokenOHLCByPool(
    poolAddress,
    {
      network_id: selectedNetwork,
      resolution: selectedInterval,
      from_timestamp: getTimeRange().startTime,
      to_timestamp: getTimeRange().endTime,
    },
    { skip: true }, // Skip initial fetch until explicitly triggered
  );

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
    setSelectedNetwork(newNetwork as NetworkId);
    setOhlcData([]);
    setError(null);
    setPage(1);
    setPoolInfo(null);
  };

  // Handle interval change
  const handleIntervalChange = (newInterval: PoolOHLCParams["resolution"]) => {
    setSelectedInterval(newInterval);
    setOhlcData([]);
    setError(null);
  };

  // Calculate time range based on selected time span
  function getTimeRange() {
    const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    const timeSpanObj = TIME_SPANS.find(span => span.id === selectedTimeSpan);
    if (!timeSpanObj) return { startTime: now - 2592000, endTime: now }; // Default to 30 days

    return {
      startTime: now - timeSpanObj.seconds,
      endTime: now,
    };
  }

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
    setPoolInfo(null);

    try {
      // Ensure the address has 0x prefix
      const formattedAddress = poolAddress.startsWith("0x") ? poolAddress : `0x${poolAddress}`;

      // Define the API endpoint
      const endpoint = `ohlc/pools/evm/${formattedAddress}`;
      console.log("🔍 API endpoint:", endpoint);

      // Build the query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("path", endpoint);
      queryParams.append("network_id", selectedNetwork);

      // Only add additional parameters if not using minimal params mode
      if (!useMinimalParams) {
        const { startTime, endTime } = getTimeRange();
        queryParams.append("resolution", selectedInterval ?? "1d");
        queryParams.append("from_timestamp", startTime.toString());
        queryParams.append("to_timestamp", endTime.toString());
      }

      // Call the API directly
      const fullUrl = `/api/token-proxy?${queryParams.toString()}`;
      console.log("🔍 Making direct API request to:", fullUrl);
      console.log(`🔑 Using network: ${selectedNetwork}`);
      console.log(`🔧 Mode: ${useMinimalParams ? "Minimal parameters" : "Full parameters"}`);

      const response = await fetch(fullUrl);
      console.log("🔍 API response status:", response.status);

      // Handle 404 with custom error message
      if (response.status === 404) {
        const errorText = await response.text();
        throw new Error(`No OHLC data found for this liquidity pool. Please verify:
          1. The pool address is correct
          2. The pool has trading activity
          3. The selected network is correct (currently: ${selectedNetwork})
          
          Try these example pools:
          - Mainnet (ETH/USDC): ${examplePools.mainnet}
          - Base (ETH/USDbC): ${examplePools.base}
          - Arbitrum (ETH/USDC): ${examplePools["arbitrum-one"]}
          - BSC (BNB/BUSD): ${examplePools.bsc}
          - Optimism (ETH/USDC): ${examplePools.optimism}
          - Polygon (MATIC/USDC): ${examplePools.matic}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API error response:", errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const jsonData: ApiResponse = await response.json();
      console.log("🔍 API response data:", jsonData);

      // Process the response based on format
      if (jsonData.data && Array.isArray(jsonData.data)) {
        console.log("📊 Setting OHLC data from jsonData.data");
        setOhlcData(jsonData.data);

        // Update pagination info if available
        if (jsonData.pagination) {
          setTotalPages(jsonData.pagination.total_pages);
        } else if (jsonData.total_results) {
          setTotalPages(Math.ceil(jsonData.total_results / limit));
        }
      } else if (jsonData.ohlc && Array.isArray(jsonData.ohlc)) {
        console.log("📊 Setting OHLC data from jsonData.ohlc");

        // Convert the data to our expected format
        const formattedData = jsonData.ohlc.map(item => ({
          ...item,
          // Convert timestamp to datetime string for display
          datetime: new Date(item.timestamp * 1000).toISOString(),
          network_id: jsonData.network_id,
          // Create pair name from token symbols if available
          pair:
            jsonData.token0_symbol && jsonData.token1_symbol
              ? `${jsonData.token0_symbol}/${jsonData.token1_symbol}`
              : undefined,
        }));

        setOhlcData(formattedData);

        // Set pool info if available
        if (jsonData.token0_symbol || jsonData.token1_symbol || jsonData.protocol) {
          setPoolInfo({
            token0Symbol: jsonData.token0_symbol,
            token1Symbol: jsonData.token1_symbol,
            protocol: jsonData.protocol,
          });
        }

        // Default pagination for this format
        setTotalPages(1);
      } else {
        console.log("⚠️ No OHLC data found in response or unexpected format");
        setOhlcData([]);
        setPoolInfo(null);
        setTotalPages(1);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching OHLC data:", err);
      setError(errorMessage);
      setOhlcData([]);
      setPoolInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string | number | undefined) => {
    if (typeof dateStr === "undefined") {
      return new Date().toLocaleString(); // Default to current date if undefined
    }
    if (typeof dateStr === "number") {
      return new Date(dateStr * 1000).toLocaleString();
    }
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
    <details className="collapse bg-blue-500/20 shadow-lg mb-4 rounded-xl border border-blue-500/30" open={isOpen}>
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
                      onChange={e => handleIntervalChange(e.target.value as PoolOHLCParams["resolution"])}
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
                    {poolInfo && poolInfo.token0Symbol && poolInfo.token1Symbol && (
                      <span className="ml-2 text-sm font-normal">
                        ({poolInfo.token0Symbol}/{poolInfo.token1Symbol}
                        {poolInfo.protocol && ` on ${poolInfo.protocol}`})
                      </span>
                    )}
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
                        {!useMinimalParams && <th>Volume USD</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {ohlcData.map((data, index) => (
                        <tr key={`${data.datetime || data.timestamp}-${index}`}>
                          <td>{formatDate(data.datetime || data.timestamp)}</td>
                          <td>
                            {data.pair || (poolInfo && `${poolInfo.token0Symbol}/${poolInfo.token1Symbol}`) || "—"}
                          </td>
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
                          <td>
                            $
                            {formatVolume(
                              "volume_token0" in data
                                ? (data as any).volume_token0
                                : "volume" in data
                                  ? (data as any).volume
                                  : 0,
                            )}
                          </td>
                          {!useMinimalParams && <td>${formatVolume(data.volume_usd || 0)}</td>}
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
