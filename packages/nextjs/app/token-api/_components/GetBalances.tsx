"use client";

import { useEffect, useState } from "react";
import { NetworkId } from "../_hooks/useTokenApi";
import { TokenBalance, useTokenBalances } from "../_hooks/useTokenBalances";
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

export const GetBalances = ({ isOpen = true }: { isOpen?: boolean }) => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(100);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Use the hook but skip automatic fetching until we have an address and user clicks the button
  const {
    data,
    isLoading: apiLoading,
    error: apiError,
    refetch,
  } = useTokenBalances(
    walletAddress,
    {
      network_id: selectedNetwork,
      page_size: pageSize,
      page: page,
    },
    { skip: true }, // Skip initial fetch until explicitly triggered
  );

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setBalances([]); // Clear existing balances
    setError(null);
  };

  const fetchBalances = async () => {
    if (!walletAddress) {
      setError("Please enter an address");
      return;
    }

    setError(null);
    setBalances([]);
    setIsLoading(true); // Manually set loading state

    try {
      console.log(`🔍 Fetching balances for wallet: ${walletAddress}`);
      console.log(`🔍 Using network: ${selectedNetwork}`);

      // Ensure the address has 0x prefix
      const formattedAddress = walletAddress.startsWith("0x") ? walletAddress : `0x${walletAddress}`;

      // Define the API endpoint
      const endpoint = `balances/evm/${formattedAddress}`;
      console.log("🔍 API endpoint:", endpoint);

      // Build the query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("path", endpoint);
      queryParams.append("network_id", selectedNetwork);
      queryParams.append("page_size", pageSize.toString());
      queryParams.append("page", page.toString());

      // Call the API directly
      const fullUrl = `/api/token-proxy?${queryParams.toString()}`;
      console.log("🔍 Making direct API request to:", fullUrl);

      try {
        const response = await fetch(fullUrl);
        console.log("🔍 API response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API error response:", errorText);
          throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const jsonData = await response.json();
        console.log("🔍 API response data:", jsonData);

        // Process the response
        if (jsonData.data && Array.isArray(jsonData.data)) {
          console.log("📊 Setting balances from jsonData.data, count:", jsonData.data.length);

          // Transform the data to match our TokenBalance interface
          const mappedBalances = jsonData.data.map((balance: any) => ({
            contract_address: balance.contract || balance.address || balance.contract_address,
            amount: balance.amount || balance.balance || "0",
            symbol: balance.symbol || "Unknown",
            decimals: balance.decimals || 18,
            name: balance.name,
            amount_usd: balance.value_usd || balance.amount_usd,
            network_id: balance.network_id || selectedNetwork,
          }));

          setBalances(mappedBalances);
        } else if (Array.isArray(jsonData)) {
          console.log("📊 Setting balances from array jsonData, count:", jsonData.length);

          // Transform array data to match our interface
          const mappedBalances = jsonData.map((balance: any) => ({
            contract_address: balance.contract || balance.address || balance.contract_address,
            amount: balance.amount || balance.balance || "0",
            symbol: balance.symbol || "Unknown",
            decimals: balance.decimals || 18,
            name: balance.name,
            amount_usd: balance.value_usd || balance.amount_usd,
            network_id: balance.network_id || selectedNetwork,
          }));

          setBalances(mappedBalances);
        } else {
          console.log("⚠️ No token data found in response");
          setBalances([]);
        }
      } catch (fetchError) {
        console.error("❌ Fetch error:", fetchError);
        throw fetchError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching balances:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false); // Always reset loading state
    }
  };

  // Update balances when API data changes
  useEffect(() => {
    if (data) {
      console.log("📊 Received balances data from hook:", data);
      if (Array.isArray(data)) {
        setBalances(data);
      } else if (typeof data === "object" && data !== null) {
        // Check if data has a data property that's an array
        const dataArray = (data as any).data;
        if (Array.isArray(dataArray)) {
          setBalances(dataArray);
        }
      }
    }

    if (apiError) {
      console.error("❌ API error:", apiError);
      setError(typeof apiError === "string" ? apiError : "Failed to fetch balances");
    }
  }, [data, apiError]);

  // Format balance value with token decimals
  const formatBalance = (balance: TokenBalance) => {
    if (!balance.amount || balance.decimals === undefined) return "0";

    try {
      // Convert from wei to token units
      const value = Number(balance.amount) / Math.pow(10, balance.decimals);
      // Format with appropriate decimal places
      return value.toLocaleString(undefined, {
        maximumFractionDigits: Math.min(balance.decimals, 6),
        minimumFractionDigits: 0,
      });
    } catch (e) {
      console.error("Error formatting balance:", e);
      return balance.amount;
    }
  };

  return (
    <details className="collapse bg-blue-500/20 shadow-lg mb-4 rounded-xl border border-blue-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>💰 Token Balances - Check token balances for any address</span>
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
                    <span className="label-text text-xl font-bold">Enter Ethereum Address</span>
                  </label>
                  <AddressInput value={walletAddress} onChange={setWalletAddress} placeholder="Enter any address" />
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
                  onClick={fetchBalances}
                  disabled={isLoading || !walletAddress}
                >
                  {isLoading ? "Fetching..." : "Fetch Balances"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading token balances on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}...</span>
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

          {!isLoading && !error && walletAddress && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">
                  Token Balances on {EVM_NETWORKS.find(n => n.id === selectedNetwork)?.name}
                </h2>
                <div className="flex flex-col gap-2">
                  {balances && balances.length > 0 ? (
                    balances.map((token, index) => (
                      <div key={`${token.contract_address}-${index}`} className="card bg-base-200 shadow-sm">
                        <div className="card-body p-4">
                          <div className="flex flex-col">
                            <div className="text-lg font-semibold">{token.symbol || "Unknown Token"}</div>
                            <div className="text-xl">
                              {formatBalance(token)} {token.symbol}
                            </div>
                            {token.amount_usd && (
                              <div className="text-sm text-success">${token.amount_usd.toFixed(2)}</div>
                            )}
                            <div className="text-xs opacity-70 mt-2">Contract: {token.contract_address}</div>
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
                        No token balances found for this address on{" "}
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
