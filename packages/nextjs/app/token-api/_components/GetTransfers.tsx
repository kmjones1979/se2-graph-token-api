"use client";

import { useEffect, useState } from "react";
import { NetworkId } from "../_hooks/useTokenApi";
import { TokenTransfer, TokenTransferItem, useTokenTransfers } from "../_hooks/useTokenTransfers";
import { EVMNetwork } from "../_types/common";
import { Address, AddressInput } from "~~/components/scaffold-eth";

// Combined type to handle both API response formats
type CombinedTransfer = TokenTransferItem | TokenTransfer;

const EVM_NETWORKS: EVMNetwork[] = [
  { id: "mainnet", name: "Ethereum" },
  { id: "base", name: "Base" },
  { id: "arbitrum-one", name: "Arbitrum" },
  { id: "bsc", name: "BNB Smart Chain" },
  { id: "optimism", name: "Optimism" },
  { id: "matic", name: "Polygon" },
];

// Helper function to estimate date from block number and network
const estimateDateFromBlock = (blockNum: number, networkId: string): Date => {
  const now = new Date();
  const blockTime = networkId === "mainnet" ? 12 : 3; // Estimated seconds per block
  // Current block estimates based on network
  const currentBlock = now.getTime() / 1000 / blockTime;
  const blockDiff = Math.max(0, currentBlock - blockNum); // Ensure non-negative
  const secondsAgo = blockDiff * blockTime;

  // Calculate the date, ensuring it's not in the future
  const estimatedDate = new Date(now.getTime() - secondsAgo * 1000);
  return estimatedDate > now ? now : estimatedDate;
};

export const GetTransfers = ({ isOpen = true }: { isOpen?: boolean }) => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [transfers, setTransfers] = useState<CombinedTransfer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [age, setAge] = useState<number>(180); // Default to 180 days (maximum time frame)
  const [limit, setLimit] = useState<number>(100); // Default to 100 results
  const [page, setPage] = useState<number>(1); // Default to first page
  const [totalPages, setTotalPages] = useState<number>(1); // Total available pages
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Skip the API call until explicitly triggered
  const {
    data,
    isLoading: apiLoading,
    error: apiError,
    refetch,
  } = useTokenTransfers(
    walletAddress,
    {
      network_id: selectedNetwork,
      page_size: 100,
    },
    { skip: true }, // Always skip initial fetch
  );

  // Extract transaction ID helper function
  const getTxId = (transfer: CombinedTransfer): string => {
    return (transfer as TokenTransferItem).transaction_id || (transfer as TokenTransfer).tx_hash || "";
  };

  // Extract from address helper function
  const getFromAddress = (transfer: CombinedTransfer): string => {
    return (transfer as TokenTransferItem).from || (transfer as TokenTransfer).from_address || "";
  };

  // Extract to address helper function
  const getToAddress = (transfer: CombinedTransfer): string => {
    return (transfer as TokenTransferItem).to || (transfer as TokenTransfer).to_address || "";
  };

  // Extract amount/value helper function
  const getAmount = (transfer: CombinedTransfer): string => {
    return (
      (transfer as TokenTransferItem).amount ||
      (transfer as TokenTransfer).value_display ||
      (transfer as TokenTransfer).value ||
      ""
    );
  };

  // Extract timestamp helper function
  const getTimestamp = (transfer: CombinedTransfer): number => {
    if ((transfer as TokenTransferItem).datetime) {
      // Try to parse datetime string to timestamp
      try {
        return new Date((transfer as TokenTransferItem).datetime).getTime() / 1000;
      } catch (e) {
        console.error("Error parsing datetime:", e);
      }
    }
    return (transfer as TokenTransferItem).timestamp || (transfer as TokenTransfer).block_timestamp || 0;
  };

  // Extract symbol helper function
  const getSymbol = (transfer: CombinedTransfer): string => {
    return (transfer as TokenTransferItem).symbol || (transfer as TokenTransfer).type || "";
  };

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setTransfers([]); // Clear existing transfers
    setError(null);
  };

  // Function to go to next page
  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
      fetchTransfers(page + 1);
    }
  };

  // Function to go to previous page
  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
      fetchTransfers(page - 1);
    }
  };

  // Fetch transfers when button is clicked
  const fetchTransfers = async (pageNum = page) => {
    if (!walletAddress) {
      setError("Please enter a wallet address");
      return;
    }

    setError(null);
    setTransfers([]); // Clear existing transfers
    setIsLoading(true); // Set loading state manually

    console.log("🔍 Fetching transfers for wallet:", walletAddress);
    console.log("🔍 Using network:", selectedNetwork);
    console.log("🔍 Looking back:", age, "days");
    console.log("🔍 Page:", pageNum, "with", limit, "results per page");

    try {
      // Ensure the address has 0x prefix
      const formattedAddress = walletAddress.startsWith("0x") ? walletAddress : `0x${walletAddress}`;

      // Try a different endpoint format based on Pinax API documentation
      // Instead of transfers/evm/{address}, try just transfers with address as a param
      const endpoint = `balances/evm/${formattedAddress}`;
      console.log("🔍 API endpoint:", endpoint);

      // Build the query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("path", endpoint);
      queryParams.append("network_id", selectedNetwork);
      // Don't include age parameter for balances endpoint
      queryParams.append("page_size", limit.toString());
      queryParams.append("page", pageNum.toString());

      // Call the API directly
      const fullUrl = `/api/token-proxy?${queryParams.toString()}`;
      console.log("🔍 Making direct API request to:", fullUrl);

      try {
        const response = await fetch(fullUrl);
        console.log("🔍 API response status:", response.status);

        // Handle 404 responses with "No data found" message more gracefully
        if (response.status === 404) {
          console.log("⚠️ API returned 404 - No data found for this wallet");
          setTransfers([]);
          return; // Exit without throwing an error
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API error response:", errorText);
          throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const jsonData = await response.json();
        console.log("🔍 API response data:", jsonData);

        // Process the response - this is for balances, but we'll adapt it to show as transfers
        if (jsonData.data && Array.isArray(jsonData.data)) {
          console.log("📊 Setting transfers from jsonData.data");
          // Convert balances to a transfer-like format for display
          const balancesAsTransfers = jsonData.data.map((balance: any) => ({
            block_num: balance.block_num,
            datetime: balance.datetime,
            contract: balance.contract,
            from: "0x0000000000000000000000000000000000000000", // Unknown sender for balances
            to: walletAddress,
            amount: balance.amount,
            value: balance.value,
            network_id: balance.network_id,
            symbol: balance.symbol,
            decimals: balance.decimals,
            transaction_id: "N/A", // Not available for balances
            price_usd: balance.price_usd,
            value_usd: balance.value_usd,
          }));

          setTransfers(balancesAsTransfers);

          // Update pagination info if available
          if (jsonData.pagination) {
            setTotalPages(jsonData.pagination.total_pages || 1);
          }

          // Show total results info
          if (jsonData.total_results !== undefined) {
            console.log(`📊 Total balances available: ${jsonData.total_results}`);
          }
        } else if (Array.isArray(jsonData)) {
          console.log("📊 Setting transfers from array jsonData");
          setTransfers(jsonData);
        } else if (jsonData.transfers && Array.isArray(jsonData.transfers)) {
          console.log("📊 Setting transfers from jsonData.transfers");
          setTransfers(jsonData.transfers);
        } else {
          console.log("⚠️ No token data found in response");
          setTransfers([]);
        }
      } catch (fetchError) {
        console.error("❌ Fetch error:", fetchError);
        throw fetchError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching transfers:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false); // Always reset loading state
    }
  };

  // Update transfers when data is received from the hook
  useEffect(() => {
    console.log("Full API response:", data);

    if (data) {
      // Check if data is an array (direct response format)
      if (Array.isArray(data)) {
        console.log("📊 Transfers received (array format):", data.length);
        setTransfers(data);
      }
      // Check for traditional TokenTransfersResponse format
      else if (data.transfers) {
        console.log("📊 Transfers received (transfers format):", data.transfers.length);
        setTransfers(data.transfers);
      }
      // Check for alternative API response format
      else if (data.data) {
        console.log("📊 Transfers received (data format):", data.data.length);
        setTransfers(data.data);
      }
      // Handle empty or unexpected response
      else {
        console.warn("Unexpected API response format:", data);
        setTransfers([]);
      }
    } else if (apiError) {
      console.error("❌ API Error:", apiError);
      setError(typeof apiError === "string" ? apiError : "Failed to fetch transfers");
    }
  }, [data, apiError]);

  // Add useEffect to monitor state changes
  useEffect(() => {
    console.log("Wallet address state changed:", walletAddress);
    console.log("Is loading state:", apiLoading);
    console.log("Button should be disabled:", apiLoading || !walletAddress);
  }, [walletAddress, apiLoading]);

  return (
    <details className="collapse bg-blue-500/20 shadow-lg mb-4 rounded-xl border border-blue-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>🔄 Token Transfers - View token transfer history</span>
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
                  <AddressInput
                    value={walletAddress}
                    onChange={setWalletAddress}
                    placeholder="Enter wallet address to view transfers"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <span className="label-text text-base">Age (Days)</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={age}
                      onChange={e => setAge(Number(e.target.value))}
                    >
                      <option value={7}>Last 7 days</option>
                      <option value={30}>Last 30 days</option>
                      <option value={90}>Last 90 days</option>
                      <option value={180}>Last 180 days (max)</option>
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
                      <option value={10}>10 Results</option>
                      <option value={25}>25 Results</option>
                      <option value={50}>50 Results</option>
                      <option value={100}>100 Results</option>
                      <option value={1000}>1000 Results (max)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={() => fetchTransfers()}
                  disabled={isLoading || !walletAddress}
                >
                  {isLoading ? "Fetching..." : "Fetch Transfers"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading token transfers on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}...</span>
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

          {!isLoading && !error && walletAddress && transfers.length === 0 && (
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
                No token transfers found for this wallet on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name} in
                the last {age} days. Try another wallet address or network.
              </span>
            </div>
          )}

          {!isLoading && !error && walletAddress && transfers.length > 0 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title">
                    Token Transfers on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-sm btn-outline" onClick={prevPage} disabled={page <= 1}>
                      Previous
                    </button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <button className="btn btn-sm btn-outline" onClick={nextPage} disabled={page >= totalPages}>
                      Next
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {transfers.map((transfer, index) => (
                    <div key={`${getTxId(transfer)}-${index}`} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4">
                        <div className="flex flex-col">
                          <div className="text-lg font-semibold">{getSymbol(transfer) || "Token Transfer"}</div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm opacity-70">
                              From: <Address address={getFromAddress(transfer)} />
                            </div>
                            <div className="text-sm opacity-70">
                              To: <Address address={getToAddress(transfer)} />
                            </div>
                          </div>
                          <div className="text-xl">
                            {getAmount(transfer)} {getSymbol(transfer)}
                          </div>
                          {transfer.value_usd && (
                            <div className="text-sm text-success">${transfer.value_usd.toFixed(2)}</div>
                          )}
                          <div className="text-xs opacity-70">
                            Date: {new Date(getTimestamp(transfer) * 1000).toLocaleString()}
                          </div>
                          <div className="text-xs opacity-70">
                            <a
                              href={`https://etherscan.io/tx/${getTxId(transfer)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link link-primary"
                            >
                              View Transaction
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
