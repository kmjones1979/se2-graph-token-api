# Token API Components Tutorial

This tutorial explains how the Token API components in the `packages/nextjs/app/token-api/_components` directory were built using custom hooks and Scaffold-ETH 2 (SE-2) utilities.

## Architecture Overview

The token-api components are built using a layered approach:

1. **Base API Hook**: `useTokenApi` serves as the foundation for all API interactions
2. **Specialized Hooks**: Custom hooks for specific endpoints (e.g., `useTokenMetadata`, `useTokenBalances`)
3. **UI Components**: React components that consume these hooks to display token data

## The Base Hook: useTokenApi

`useTokenApi` is the core hook that handles all API communication, providing consistent error handling, loading states, and data formatting. It's designed as a generic hook that:

-   Makes fetch requests to the token API proxy endpoint
-   Handles loading and error states
-   Supports pagination and interval-based refetching
-   Normalizes API responses

```typescript
export const useTokenApi = <DataType, ParamsType = Record<string, any>>(
    endpoint: string,
    params?: ParamsType,
    options: TokenApiOptions = {}
) => {
    // State management for data, loading, errors
    const [data, setData] = useState<DataType | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);

    // Fetch implementation and other logic
    // ...

    return {
        data,
        isLoading,
        error,
        refetch: fetchData,
        lastUpdated,
    };
};
```

## Specialized Hooks

Each specialized hook extends `useTokenApi` for specific API endpoints, adding type safety and specialized logic:

### useTokenMetadata

Used in `GetMetadata.tsx` to fetch detailed information about ERC20 tokens.

```typescript
export const useTokenMetadata = (
    contract: string | undefined,
    params?: TokenMetadataParams,
    options = { skip: contract ? false : true }
) => {
    // Uses useTokenApi internally with endpoint formatting
    const result = useTokenApi<any>(
        normalizedContract ? `tokens/evm/${normalizedContract}` : "",
        { ...params },
        options
    );

    // Response normalization and formatting
    // ...

    return {
        ...result,
        data: formattedData,
    };
};
```

### Other Specialized Hooks

-   `useTokenBalances`: Used in `GetBalances.tsx` for retrieving token balances
-   `useTokenHolders`: Used in `GetHolders.tsx` for fetching token holder information
-   `useTokenTransfers`: Used in `GetTransfers.tsx` for transaction history (Note: Currently uses balances endpoint as fallback due to API limitations)
-   `useTokenSwaps`: Used in `GetSwaps.tsx` for DEX swap data
-   `useTokenPools`: Used in `GetPools.tsx` for liquidity pool information
-   `useTokenOHLCByPool`: Used in `GetOHLCByPool.tsx` for pool price chart data
-   `useTokenOHLCByContract`: Used in `GetOHLCByContract.tsx` for token price charts

## Component Implementation Pattern

Each component follows a consistent pattern:

1. **State Management**: Using React's `useState` for form inputs and UI state
2. **Hook Integration**: Leveraging the specialized hooks with proper parameters
3. **Error Handling**: Displaying user-friendly error messages
4. **Loading States**: Showing loading indicators during API requests
5. **Data Rendering**: Presenting the fetched data in a structured format

### Component Example: GetMetadata.tsx

```typescript
export const GetMetadata = ({ isOpen = true }: { isOpen?: boolean }) => {
    // Local state for form inputs and UI
    const [contractAddress, setContractAddress] = useState<string>("");
    const [selectedNetwork, setSelectedNetwork] =
        useState<NetworkId>("mainnet");
    const [error, setError] = useState<string | null>(null);
    const [shouldFetch, setShouldFetch] = useState<boolean>(false);

    // Use the specialized hook
    const {
        data: tokenData,
        isLoading,
        error: hookError,
        refetch,
    } = useTokenMetadata(
        contractAddress,
        {
            network_id: selectedNetwork,
            include_market_data: true,
        },
        { skip: !shouldFetch } // Skip initial fetch until explicitly triggered
    );

    // Error handling, UI rendering, etc.
    // ...
};
```

## Integration with Scaffold-ETH 2 Components

The token-api components leverage SE-2's pre-built components for enhanced UX:

-   **Address**: Used to display wallet and contract addresses with ENS support
-   **AddressInput**: Used for user input of Ethereum addresses with validation
-   **Balance**: Used to display token balances in the UI

Example from GetMetadata.tsx:

```typescript
<AddressInput
    value={contractAddress}
    onChange={setContractAddress}
    placeholder="Enter token contract address"
/>
```

## Hook Usage in Each Component

1. **GetMetadata.tsx**

    - Uses `useTokenMetadata` to fetch basic token information
    - Displays token name, symbol, supply, and price data

2. **GetBalances.tsx**

    - Uses `useTokenBalances` to fetch account token balances
    - Displays balance information with proper decimals handling

3. **GetHolders.tsx**

    - Uses `useTokenHolders` to fetch top token holders
    - Implements pagination through the hook's options

4. **GetTransfers.tsx**

    - Currently uses balances endpoint as a workaround due to API limitations
    - Originally designed to use `useTokenTransfers` hook
    - Formats balance data to resemble transfers for UI consistency

5. **GetSwaps.tsx**

    - Uses `useTokenSwaps` to fetch DEX swap events
    - Displays price impact and slippage information

6. **GetPools.tsx**

    - Uses `useTokenPools` to fetch liquidity pool data
    - Shows TVL and fee tier information

7. **GetOHLCByPool.tsx** and **GetOHLCByContract.tsx**

    - Use `useTokenOHLCByPool` and `useTokenOHLCByContract` respectively
    - Implement time interval selection and chart rendering
    - Support different parameter formats based on API requirements

8. **GetHistorical.tsx**
    - Uses `useTokenHistorical` for historical price and volume data
    - Formats data for time-series visualization

## Testing All Hooks: test/page.tsx

In `packages/nextjs/app/test/page.tsx`, we've implemented a complete testing page for all Token API hooks:

```typescript
// Common state for all hooks
const [contractAddress, setContractAddress] = useState<string>(
    "0xc944E90C64B2c07662A292be6244BDf05Cda44a7"
);
const [walletAddress, setWalletAddress] = useState<string>(
    "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
);
const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
const [shouldFetch, setShouldFetch] = useState<boolean>(false);
const [poolAddress, setPoolAddress] = useState<string>(
    "0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801"
);
```

This test page demonstrates:

1. **Centralized State Management**: Common state for all hooks
2. **Optimized Data Fetching**: Using the `skip` option to prevent unnecessary API calls until triggered
3. **Comprehensive Error Handling**: Displaying error states for each hook
4. **Parallel Data Loading**: Managing multiple concurrent API requests
5. **Consistent UI Patterns**: Using the same rendering patterns across all data types

The page initializes all hooks with the skip parameter set to true, then fetches all data simultaneously when the user clicks a button:

```typescript
const fetchAllData = () => {
    setShouldFetch(true);

    refetchMetadata?.();
    refetchBalances?.();
    refetchHolders?.();
    refetchTransfers?.();
    refetchPools?.();
    refetchSwaps?.();
    refetchOhlcPool?.();
    refetchOhlcContract?.();
};
```

## Best Practices Implemented

1. **Controlled Fetching**: Using `skip` option to prevent unnecessary API calls

    ```typescript
    {
        skip: !shouldFetch;
    }
    ```

2. **Error Handling**: Providing user-friendly error messages

    ```typescript
    if (errorMessage.includes("404")) {
        setError(`No data found for this token contract. Please verify...`);
    }
    ```

3. **Loading States**: Clear loading indicators during data fetching

    ```typescript
    {
        isLoading && (
            <div className="alert">
                <span className="loading loading-spinner loading-md"></span>
                <span>Loading token data...</span>
            </div>
        );
    }
    ```

4. **Data Formatting**: Consistent number and address formatting

    ```typescript
    const formatSupply = (supply: string, decimals: number | undefined) => {
        const actualDecimals = decimals || 18; // Default to 18 if undefined
        const amount = Number(supply) / Math.pow(10, actualDecimals);
        return formatNumber(amount.toFixed(2));
    };
    ```

5. **Proper Component Composition**: Using Scaffold-ETH components like `<Address>` for consistent UI

6. **Conditional Rendering**: Displaying appropriate UI based on data state

    ```typescript
    {
        transfersData && transfersData.length > 0
            ? `${transfersData.length} balances found`
            : "-";
    }
    ```

7. **API Fallbacks**: Implementing workarounds when specific endpoints aren't available

    ```typescript
    // Using balances endpoint as fallback for transfers
    const {
      data: transfersData,
      isLoading: transfersLoading,
      error: transfersError,
    } = useTokenBalances(walletAddress, {...});
    ```

## Handling API Limitations

When dealing with the Token API, we've implemented fallback strategies to handle endpoint limitations:

1. **Transfers API**: Due to limitations with the `transfers/evm/{address}` endpoint, we use the balances endpoint as a fallback:

    ```typescript
    // Instead of transfers/evm/{address}
    const endpoint = `balances/evm/${formattedAddress}`;
    ```

2. **Response Format Flexibility**: Handling different response formats from the API:

    ```typescript
    // Handle different response formats
    if (jsonData.data && Array.isArray(jsonData.data)) {
        // Process data array
    } else if (Array.isArray(jsonData)) {
        // Handle direct array response
    }
    ```

## Conclusion

The token-api components demonstrate a well-structured approach to building data-driven React components with:

1. A reusable base hook for API communication
2. Specialized hooks for different data types
3. Consistent UI patterns and error handling
4. Integration with Scaffold-ETH 2 components and utilities
5. Comprehensive testing through a dedicated test page

This architecture allows for easy addition of new components and features while maintaining code consistency and developer experience.
