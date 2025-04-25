"use client";

import { useState } from "react";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import {
  ContractOHLCParams,
  ContractOHLCResponse,
  OHLCDataPoint,
  useTokenOHLCByContract,
} from "~~/app/token-api/_hooks/useTokenOHLCByContract";
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
const TIME_INTERVALS: { id: ContractOHLCParams["resolution"]; name: string }[] = [
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
  contract_address?: string;
  token_name?: string;
  token_symbol?: string;
  token_decimals?: number;
  network_id?: NetworkId;
  resolution?: string;
  ohlc?: OHLCDataPoint[];
}

export const GetOHLCByContract = ({ isOpen = true }: { isOpen?: boolean }) => {
  // State for search parameters
  const [contractAddress, setContractAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [selectedInterval, setSelectedInterval] = useState<ContractOHLCParams["resolution"]>("1d");
  const [selectedTimeSpan, setSelectedTimeSpan] = useState<string>("30d");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [useMinimalParams, setUseMinimalParams] = useState<boolean>(true);

  // State for API results
  const [ohlcData, setOhlcData] = useState<OHLCDataExtended[]>([]);
  const [tokenInfo, setTokenInfo] = useState<{ symbol: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Use the hook to get types but skip automatic fetching
  const {
    data,
    isLoading: hookLoading,
    error: hookError,
  } = useTokenOHLCByContract(
    contractAddress,
    {
      network_id: selectedNetwork,
      resolution: selectedInterval,
      from_timestamp: getTimeRange().startTime,
      to_timestamp: getTimeRange().endTime,
    },
    { skip: true }, // Skip initial fetch until explicitly triggered
  );

  // Example token addresses
  const exampleTokens = {
    mainnet: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
    base: "0x4200000000000000000000000000000000000006", // WETH
    "arbitrum-one": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // WETH
    bsc: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", // WBNB
    optimism: "0x4200000000000000000000000000000000000006", // WETH
    matic: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270", // WMATIC
  };

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setOhlcData([]);
    setError(null);
    setPage(1);
  };

  // Handle interval change
  const handleIntervalChange = (newInterval: ContractOHLCParams["resolution"]) => {
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
    if (!contractAddress) {
      setError("Please enter a token contract address");
      return;
    }

    // Basic validation for Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      setError("Please enter a valid token contract address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Ensure the address has 0x prefix
      const formattedAddress = contractAddress.startsWith("0x") ? contractAddress : `0x${contractAddress}`;

      // Define the API endpoint
      const endpoint = `ohlc/prices/evm/${formattedAddress}`;
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
        throw new Error(`No OHLC data found for this token contract. Please verify:
          1. The contract address is correct
          2. The contract is a tradable token
          3. The selected network is correct (currently: ${selectedNetwork})
          
          Try these example tokens:
          - Mainnet (WETH): ${exampleTokens.mainnet}
          - Base (WETH): ${exampleTokens.base}
          - Arbitrum (WETH): ${exampleTokens["arbitrum-one"]}
          - BSC (WBNB): ${exampleTokens.bsc}
          - Optimism (WETH): ${exampleTokens.optimism}
          - Polygon (WMATIC): ${exampleTokens.matic}`);
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

        // Extract token info if available
        if (jsonData.data.length > 0 && jsonData.data[0].pair) {
          const pairParts = jsonData.data[0].pair.split("/");
          if (pairParts.length >= 1) {
            setTokenInfo({
              symbol: pairParts[0],
              name: pairParts[0],
            });
          }
        }

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
        }));

        setOhlcData(formattedData);

        // Set token info if available
        if (jsonData.token_symbol || jsonData.token_name) {
          setTokenInfo({
            symbol: jsonData.token_symbol || "",
            name: jsonData.token_name || "",
          });
        }

        // Default pagination for this format
        setTotalPages(1);
      } else {
        console.log("⚠️ No OHLC data found in response or unexpected format");
        setOhlcData([]);
        setTokenInfo(null);
        setTotalPages(1);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching OHLC data:", err);
      setError(errorMessage);
      setOhlcData([]);
      setTokenInfo(null);
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
      const newPage = page + 1;
      setPage(newPage);
      // Use setTimeout to ensure state is updated before fetch
      setTimeout(() => {
        fetchOHLCData();
      }, 10);
    }
  };

  const goToPrevPage = () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      // Use setTimeout to ensure state is updated before fetch
      setTimeout(() => {
        fetchOHLCData();
      }, 10);
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
          <span>💹 Token OHLC Data - View price history for tokens</span>
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
                    placeholder="Enter the token contract address"
                  />
                  <div className="mt-2 text-sm opacity-70">
                    Example for {selectedNetwork}: {exampleTokens[selectedNetwork as keyof typeof exampleTokens]}
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
                      onChange={e => handleIntervalChange(e.target.value as ContractOHLCParams["resolution"])}
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
                  disabled={isLoading || !contractAddress}
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
                    Price Data for Token <Address address={contractAddress} />
                    {tokenInfo && <span className="ml-2 text-sm font-normal">({tokenInfo.symbol})</span>}
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
                          {!useMinimalParams && <td>${formatVolume(data.volume_usd || 0)}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && ohlcData.length === 0 && contractAddress && (
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
                No OHLC data found for this token on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}. Make sure
                you've entered a valid token contract address for the selected network.
              </span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
