"use client";

import { useEffect, useRef, useState } from "react";
import { EVM_NETWORKS, getNetworkName } from "~~/app/token-api/_config/networks";
import { TIME_INTERVALS, TIME_SPANS, getTimeRange } from "~~/app/token-api/_config/timeConfig";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import { OHLCDataPoint, PoolOHLCParams, useTokenOHLCByPool } from "~~/app/token-api/_hooks/useTokenOHLCByPool";
import { Address, AddressInput } from "~~/components/scaffold-eth";

// Example pool addresses
const examplePools: Record<string, string> = {
  mainnet: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640", // ETH/USDC on Uniswap V3
  base: "0x4c36388be6f416a29c8d8eee81c771ce6be14b18", // ETH/USDbC on BaseSwap
  "arbitrum-one": "0xc31e54c7a869b9fcbecc14363cf510d1c41fa443", // ETH/USDC on Uniswap V3
  bsc: "0x58f876857a02d6762e0101bb5c46a8c1ed44dc16", // BNB/BUSD on PancakeSwap
  optimism: "0x85149247691df622eaf1a8bd0cafd40bc45154a9", // ETH/USDC on Uniswap V3
  matic: "0xa374094527e1673a86de625aa59517c5de346d32", // MATIC/USDC on Quickswap
};

// Extended OHLC data interface for our component
interface OHLCDataExtended extends OHLCDataPoint {
  datetime?: string;
  network_id?: string;
  pair?: string;
}

export const GetOHLCByPool = ({ isOpen = true }: { isOpen?: boolean }) => {
  // State for search parameters
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [selectedInterval, setSelectedInterval] = useState<PoolOHLCParams["resolution"]>("1d");
  const [selectedTimeSpan, setSelectedTimeSpan] = useState<string>("30d");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [shouldFetch, setShouldFetch] = useState<boolean>(false);
  const processingData = useRef(false);

  // State for API results
  const [ohlcData, setOhlcData] = useState<OHLCDataExtended[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [poolInfo, setPoolInfo] = useState<{
    token0Symbol?: string;
    token1Symbol?: string;
    protocol?: string;
  } | null>(null);

  // Use the hook properly with a controlled skip parameter
  const { startTime, endTime } = getTimeRange(selectedTimeSpan);
  const {
    data,
    isLoading: hookLoading,
    error: hookError,
    refetch,
  } = useTokenOHLCByPool(
    poolAddress,
    {
      network_id: selectedNetwork,
      resolution: selectedInterval,
      from_timestamp: startTime,
      to_timestamp: endTime,
    },
    { skip: !shouldFetch }, // Only fetch when explicitly triggered
  );

  // Process data from the hook when it's available
  useEffect(() => {
    if (!data || processingData.current) return;

    // Set the processing flag to prevent re-entry
    processingData.current = true;

    try {
      console.log("📊 Received OHLC data from hook:", data);

      if (data.ohlc && Array.isArray(data.ohlc)) {
        // Convert the data to our expected format
        const formattedData = data.ohlc.map(item => ({
          ...item,
          // Convert timestamp to datetime string for display
          datetime: new Date(item.timestamp * 1000).toISOString(),
          network_id: data.network_id,
          // Create pair name from token symbols if available
          pair: data.token0_symbol && data.token1_symbol ? `${data.token0_symbol}/${data.token1_symbol}` : undefined,
        }));

        setOhlcData(formattedData);

        // Set pool info if available
        if (data.token0_symbol || data.token1_symbol || data.protocol) {
          setPoolInfo({
            token0Symbol: data.token0_symbol,
            token1Symbol: data.token1_symbol,
            protocol: data.protocol,
          });
        }

        // Handle pagination
        setTotalPages(Math.ceil(data.ohlc.length / limit) || 1);
      } else {
        console.log("⚠️ No OHLC data found in response or unexpected format");
        setOhlcData([]);
        setPoolInfo(null);
      }
    } catch (err) {
      console.error("❌ Error processing OHLC data:", err);
    } finally {
      // Always release the processing flag after handling the data
      setTimeout(() => {
        processingData.current = false;
      }, 100);
    }
  }, [data, limit]);

  // Handle API errors separately
  useEffect(() => {
    if (!hookError) return;

    console.error("❌ API error from hook:", hookError);
    const errorMessage = typeof hookError === "string" ? hookError : "Failed to fetch OHLC data";

    // Custom error message for 404 responses
    if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      setError(`No OHLC data found for this liquidity pool. Please verify:
        1. The pool address is correct
        2. The pool has trading activity
        3. The selected network is correct (currently: ${getNetworkName(selectedNetwork)})
        
        Try these example pools:
        - Mainnet (ETH/USDC): ${examplePools.mainnet}
        - Base (ETH/USDbC): ${examplePools.base}
        - Arbitrum (ETH/USDC): ${examplePools["arbitrum-one"]}
        - BSC (BNB/BUSD): ${examplePools.bsc}
        - Optimism (ETH/USDC): ${examplePools.optimism}
        - Polygon (MATIC/USDC): ${examplePools.matic}`);
    } else {
      setError(errorMessage);
    }
  }, [hookError, selectedNetwork]);

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setOhlcData([]);
    setError(null);
    setPage(1);
    setPoolInfo(null);
    setShouldFetch(false);
  };

  // Handle interval change
  const handleIntervalChange = (newInterval: PoolOHLCParams["resolution"]) => {
    setSelectedInterval(newInterval);
    setOhlcData([]);
    setError(null);
    setShouldFetch(false);
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

    // Reset state before fetching
    setError(null);
    setOhlcData([]);
    setPoolInfo(null);
    processingData.current = false;
    setShouldFetch(true);

    try {
      // Use the refetch function from the hook
      await refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching OHLC data:", err);
      setError(errorMessage);
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
      const newPage = page + 1;
      setPage(newPage);
    }
  };

  const goToPrevPage = () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
    }
  };

  // Price change percentage calculation
  const calculatePriceChange = (open: number, close: number) => {
    if (open === 0) return 0;
    const change = ((close - open) / open) * 100;
    return change.toFixed(2);
  };

  // Filter data based on current page
  const paginatedData = ohlcData.slice((page - 1) * limit, page * limit);

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
                    Example for {getNetworkName(selectedNetwork)}:{" "}
                    {examplePools[selectedNetwork as keyof typeof examplePools]}
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
                    >
                      <option value={10}>10 Records</option>
                      <option value={25}>25 Records</option>
                      <option value={50}>50 Records</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  className={`btn btn-primary ${hookLoading ? "loading" : ""}`}
                  onClick={fetchOHLCData}
                  disabled={hookLoading || !poolAddress}
                >
                  {hookLoading ? "Fetching..." : "Fetch OHLC Data"}
                </button>
              </div>
            </div>
          </div>

          {hookLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading OHLC data on {getNetworkName(selectedNetwork)}...</span>
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

          {!hookLoading && !error && paginatedData.length > 0 && (
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
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={goToPrevPage}
                      disabled={page <= 1 || hookLoading}
                    >
                      Previous
                    </button>
                    <span className="flex items-center">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={goToNextPage}
                      disabled={page >= totalPages || hookLoading}
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
                        <th>Volume USD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((data, index) => (
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
                          <td>${formatVolume("volume_token0" in data ? data.volume_token0 : 0)}</td>
                          <td>${formatVolume(data.volume_usd || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!hookLoading && !error && ohlcData.length === 0 && poolAddress && (
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
                No OHLC data found for this pool on {getNetworkName(selectedNetwork)}. Make sure you've entered a valid
                DEX pool address for the selected network.
              </span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
