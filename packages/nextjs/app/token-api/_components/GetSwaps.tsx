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

// Define TypeScript interfaces for the swaps API response
interface SwapEvent {
  block_num: number;
  datetime: string;
  network_id: string;
  transaction_id: string;
  caller: string;
  sender: string;
  recipient: string;
  factory: string;
  pool: string;
  amount0: string;
  amount1: string;
  price0: number;
  price1: number;
  protocol: string;
}

interface ApiResponse {
  data: SwapEvent[];
  statistics: {
    bytes_read: number;
    rows_read: number;
    elapsed: number;
  };
}

export const GetSwaps = () => {
  // State for search parameters
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [callerAddress, setCallerAddress] = useState<string>("");
  const [senderAddress, setSenderAddress] = useState<string>("");
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("mainnet");
  const [selectedProtocol, setSelectedProtocol] = useState<string>("uniswap_v3");
  const [limit, setLimit] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // State for API results
  const [swaps, setSwaps] = useState<SwapEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork);
    setSwaps([]);
    setError(null);
  };

  // Handle protocol change
  const handleProtocolChange = (newProtocol: string) => {
    setSelectedProtocol(newProtocol);
    setSwaps([]);
    setError(null);
  };

  const fetchSwaps = async () => {
    // Remove the validation check since all parameters are optional
    setIsLoading(true);
    setError(null);

    try {
      // Use the token-proxy API route
      const url = new URL("/api/token-proxy", window.location.origin);

      // Add the path and query parameters
      url.searchParams.append("path", "swaps/evm");
      url.searchParams.append("network_id", selectedNetwork);
      url.searchParams.append("protocol", selectedProtocol);
      url.searchParams.append("limit", limit.toString());
      url.searchParams.append("page", page.toString());

      // Add optional parameters if provided
      if (poolAddress) url.searchParams.append("pool", poolAddress);
      if (callerAddress) url.searchParams.append("caller", callerAddress);
      if (senderAddress) url.searchParams.append("sender", senderAddress);
      if (recipientAddress) url.searchParams.append("recipient", recipientAddress);
      if (transactionId) url.searchParams.append("transaction_id", transactionId);

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
        - Number of Swaps: ${data.data?.length || 0}
        - Network: ${selectedNetwork}
        - Protocol: ${selectedProtocol}
      `);

      setSwaps(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching swaps:", err);
      setError(errorMessage);
      setSwaps([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  // Format amount with token decimals (this is a simplification as we don't know the decimals)
  const formatAmount = (amount: string) => {
    // The amount might be positive or negative
    const isNegative = amount.startsWith("-");
    const absoluteAmount = isNegative ? amount.substring(1) : amount;

    // Format with commas for readability
    const formattedAmount = new Intl.NumberFormat().format(Number(absoluteAmount));

    return isNegative ? `-${formattedAmount}` : formattedAmount;
  };

  // Get network name by ID
  const getNetworkName = (networkId: string) => {
    return EVM_NETWORKS.find(n => n.id === networkId)?.name || networkId;
  };

  // Generate block explorer URL for transaction
  const getExplorerUrl = (txId: string, networkId: string) => {
    const explorerBaseUrls: { [key: string]: string } = {
      mainnet: "https://etherscan.io",
      base: "https://basescan.org",
      "arbitrum-one": "https://arbiscan.io",
      bsc: "https://bscscan.com",
      optimism: "https://optimistic.etherscan.io",
      matic: "https://polygonscan.com",
    };

    const baseUrl = explorerBaseUrls[networkId] || "https://etherscan.io";
    return `${baseUrl}/tx/${txId}`;
  };

  // Handle pagination
  const goToNextPage = () => {
    setPage(prevPage => prevPage + 1);
    // Refetch data with the new page
    setTimeout(fetchSwaps, 0);
  };

  const goToPrevPage = () => {
    if (page > 1) {
      setPage(prevPage => prevPage - 1);
      // Refetch data with the new page
      setTimeout(fetchSwaps, 0);
    }
  };

  return (
    <details className="collapse bg-base-200 shadow-lg" open>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>💱 DEX Swaps - Explore token swap events across protocols</span>
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
                      <span className="label-text text-base font-bold">Caller Address (optional)</span>
                    </label>
                    <AddressInput
                      value={callerAddress}
                      onChange={setCallerAddress}
                      placeholder="Enter caller address"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Sender Address (optional)</span>
                    </label>
                    <AddressInput
                      value={senderAddress}
                      onChange={setSenderAddress}
                      placeholder="Enter sender address"
                    />
                  </div>
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Recipient Address (optional)</span>
                    </label>
                    <AddressInput
                      value={recipientAddress}
                      onChange={setRecipientAddress}
                      placeholder="Enter recipient address"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Transaction ID (optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter transaction ID"
                      className="input input-bordered w-full"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Results per Page</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={limit}
                      onChange={e => setLimit(Number(e.target.value))}
                    >
                      <option value={10}>10 Results</option>
                      <option value={25}>25 Results</option>
                      <option value={50}>50 Results</option>
                      <option value={100}>100 Results</option>
                    </select>
                  </div>
                  <div className="flex items-end justify-end w-full">
                    <button
                      className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                      onClick={fetchSwaps}
                      disabled={isLoading}
                    >
                      {isLoading ? "Searching..." : "Search Swaps"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Searching for swaps on {getNetworkName(selectedNetwork)}...</span>
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

          {!isLoading && !error && swaps.length > 0 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title">
                    {swaps.length} Swap{swaps.length !== 1 ? "s" : ""} Found on {getNetworkName(selectedNetwork)}
                  </h2>
                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-outline" onClick={goToPrevPage} disabled={page <= 1 || isLoading}>
                      Previous
                    </button>
                    <span className="flex items-center">Page {page}</span>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={goToNextPage}
                      disabled={swaps.length < limit || isLoading}
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Transaction</th>
                        <th>Pool</th>
                        <th>Time</th>
                        <th>Amount0</th>
                        <th>Amount1</th>
                        <th>Caller</th>
                      </tr>
                    </thead>
                    <tbody>
                      {swaps.map((swap, index) => (
                        <tr key={`${swap.transaction_id}-${index}`}>
                          <td>
                            <a
                              href={getExplorerUrl(swap.transaction_id, swap.network_id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link link-hover link-primary"
                            >
                              {swap.transaction_id.substring(0, 10)}...
                            </a>
                          </td>
                          <td>
                            <Address address={swap.pool} />
                          </td>
                          <td>{formatDate(swap.datetime)}</td>
                          <td className={Number(swap.amount0) >= 0 ? "text-success" : "text-error"}>
                            {formatAmount(swap.amount0)}
                          </td>
                          <td className={Number(swap.amount1) >= 0 ? "text-success" : "text-error"}>
                            {formatAmount(swap.amount1)}
                          </td>
                          <td>
                            <Address address={swap.caller} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && swaps.length === 0 && (
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
              <span>No swaps found matching your criteria on {getNetworkName(selectedNetwork)}</span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
