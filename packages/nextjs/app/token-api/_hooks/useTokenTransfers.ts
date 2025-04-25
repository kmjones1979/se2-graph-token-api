"use client";

import { useTokenApi } from "./useTokenApi";
import type { NetworkId } from "./useTokenApi";

/**
 * Token transfer information
 */
export interface TokenTransfer {
  token_address: string;
  token_id?: string;
  from_address: string;
  to_address: string;
  value: string;
  value_display?: string;
  value_usd?: number;
  tx_hash: string;
  tx_index: number;
  block_number: number;
  block_timestamp: number;
  log_index: number;
  type: "erc20" | "erc721" | "erc1155";
}

/**
 * Alternative token transfer structure from API
 */
export interface TokenTransferItem {
  block_num: number;
  datetime?: string;
  timestamp?: number;
  date?: string;
  contract: string;
  from: string;
  to: string;
  amount: string;
  value?: number;
  transaction_id: string;
  decimals: number;
  symbol: string;
  network_id: string;
  price_usd?: number;
  value_usd?: number;
}

/**
 * Token transfers API response
 */
export interface TokenTransfersResponse {
  data: TokenTransferItem[];
  transfers?: TokenTransfer[];
  statistics?: {
    bytes_read: number;
    rows_read: number;
    elapsed: number;
  };
  pagination?: {
    page: number;
    page_size: number;
    total_pages: number;
  };
  results?: number;
  total_results?: number;
}

/**
 * Parameters for token transfers API call
 */
export interface TokenTransfersParams {
  network_id?: NetworkId;
  contract_address?: string;
  from_address?: string;
  to_address?: string;
  token_type?: "erc20" | "erc721" | "erc1155";
  page?: number;
  page_size?: number;
  start_block?: number;
  end_block?: number;
  start_timestamp?: number;
  end_timestamp?: number;
  include_prices?: boolean;
}

/**
 * Hook to fetch token transfers
 *
 * @param address - Contract or wallet address
 * @param params - Optional parameters
 * @param options - Hook options
 * @returns Token transfers data and functions
 */
export const useTokenTransfers = (
  address: string | undefined,
  params?: TokenTransfersParams,
  options = { skip: address ? false : true },
) => {
  // Normalize the address (ensure it has 0x prefix)
  const normalizedAddress = address && !address.startsWith("0x") ? `0x${address}` : address;

  const result = useTokenApi<TokenTransfersResponse | { data: TokenTransferItem[] }>(
    normalizedAddress ? `transfers/evm/${normalizedAddress}` : "",
    { ...params },
    options,
  );

  // Handle both response formats
  const formattedData: TokenTransfersResponse =
    result.data && "data" in result.data && !("transfers" in result.data) && !("statistics" in result.data)
      ? { data: result.data.data }
      : (result.data as TokenTransfersResponse);

  return {
    ...result,
    data: formattedData,
  };
};
