# Token API Explorer 🚀 built with Scaffold-ETH 2

A modern, responsive web application built with Next.js that interacts with [The Graph Token API](https://thegraph.com/docs/en/token-api/evm/get-balances-evm-by-address/). This explorer allows you to fetch and display token information across multiple EVM networks.

## 📑 Table of Contents

-   [🌟 Features](#-features)
-   [🛠️ Setup](#️-setup)
    -   [Prerequisites](#prerequisites)
    -   [Installation](#installation)
    -   [Running the Application](#running-the-application)
-   [📚 API Components](#-api-components)
    -   [Token Holders Component](#token-holders-component)
    -   [Token Transfers Component](#token-transfers-component)
    -   [Token Metadata Component](#token-metadata-component)
    -   [Token Balances Component](#token-balances-component)
    -   [Historical Balances Component](#historical-balances-component)
    -   [DEX Pool OHLC Component](#dex-pool-ohlc-component)
    -   [Token OHLC Component](#token-ohlc-component)
    -   [DEX Swaps Component](#dex-swaps-component)
    -   [DEX Pools Component](#dex-pools-component)
-   [🔍 Example Addresses for Testing](#-example-addresses-for-testing)
-   [🔑 API Authentication](#-api-authentication)
-   [🌐 Supported Networks](#-supported-networks)
-   [🧩 API Endpoints](#-api-endpoints)
-   [📝 Key Data Structures](#-key-data-structures)
    -   [OHLC Price Data](#ohlc-price-data)
    -   [Historical Balance Data](#historical-balance-data)
    -   [Token Metadata](#token-metadata)
    -   [Token Balance](#token-balance)
    -   [Token Holder](#token-holder)
    -   [Token Transfer](#token-transfer)
    -   [Swap Event](#swap-event)
-   [📱 Component Features](#-component-features)
-   [🔄 Error Handling Examples](#-error-handling-examples)
-   [🎨 Styling](#-styling)
-   [🤝 Contributing](#-contributing)
-   [📄 License](#-license)
-   [Getting Started](#getting-started)
    -   [1. Get Your API Key](#1-get-your-api-key)
    -   [2. Set Up Environment Variables](#2-set-up-environment-variables)
    -   [3. Install Dependencies](#3-install-dependencies)
    -   [4. Start the Development Server](#4-start-the-development-server)
-   [Features](#features)
-   [Built With](#built-with)
-   [🧰 Hook Documentation for Scaffold-ETH](#-hook-documentation-for-scaffold-eth)
-   [🧩 Component Documentation for Scaffold-ETH](#-component-documentation-for-scaffold-eth)
-   [🔍 Token API Component Documentation](#-token-api-component-documentation)
    -   [GetHolders Component](#getholders-component)
    -   [GetBalances Component](#getbalances-component)
    -   [GetTransfers Component](#gettransfers-component)
    -   [GetMetadata Component](#getmetadata-component)
    -   [GetHistorical Component](#gethistorical-component)
    -   [GetOHLCByPool Component](#getohlcbypool-component)
    -   [GetOHLCByContract Component](#getohlcbycontract-component)
    -   [GetSwaps Component](#getswaps-component)
    -   [GetPools Component](#getpools-component)
-   [🪝 Token API Hooks Documentation](#-token-api-hooks-documentation)
    -   [useTokenApi](#usetokenapi)
    -   [useTokenBalances](#usetokenbalances)
    -   [useTokenHolders](#usetokenholders)
    -   [useTokenMetadata](#usetokenmetadata)
    -   [useTokenTransfers](#usetokentransfers)
    -   [useHistoricalBalances](#usehistoricalbalances)
    -   [useTokenOHLCByPool](#usetokenohlcbypool)
    -   [useTokenOHLCByContract](#usetokenohlcbycontract)
    -   [useTokenSwaps](#usetokenswaps)
    -   [useTokenPools](#usetokenpools)
-   [🚀 Tutorial: Setting Up and Using Hooks](#-tutorial-setting-up-and-using-hooks)
-   [🏗 Scaffold-ETH 2](#-scaffold-eth-2)
    -   [Requirements](#requirements)
    -   [Quickstart](#quickstart)
    -   [🚀 Setup The Graph Integration](#-setup-the-graph-integration)
    -   [Shipping to Subgraph Studio 🚀](#shipping-to-subgraph-studio-)
    -   [A list of all available root commands](#a-list-of-all-available-root-commands)
    -   [Documentation](#documentation)
    -   [Contributing to Scaffold-ETH 2](#contributing-to-scaffold-eth-2)

## 🌟 Features

-   📊 Token Holders: View detailed holder information with pagination
-   💰 Token Balances: Check balances for any address
-   🔄 Token Transfers: Track token movement with detailed transaction info
-   ℹ️ Token Metadata: Get comprehensive token information
-   📈 Historical Balances: Track token balance changes over time
-   📊 Pool OHLC Data: View price history for DEX liquidity pools
-   💹 Token OHLC Data: Track price movements for individual tokens
-   💱 Token Swaps: Monitor DEX swap events across networks
-   🌐 Multi-Network Support: Works across Ethereum, Base, Arbitrum, BSC, Optimism, and Polygon
-   🎨 Standardized UI: Consistent, responsive, and collapsible component designs
-   🧩 Modular Architecture: Components can be used independently or combined

## 🛠️ Setup

### Prerequisites

-   Node.js (>= v20.18.3)
-   Yarn (v1 or v2+)
-   A Graph API Token from [The Graph Market](https://thegraph.market/)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/kmjones1979/se2-graph-token-api
cd se2-graph-token-api
```

2. Install dependencies:

```bash
yarn install
```

3. Create a `.env.local` file in the root directory:

1. Visit [The Graph Market](https://thegraph.market/)
1. Navigate to the "Token API" tab
1. Click "Get API Key"
1. Follow the authentication process
1. Copy your API key

```env
NEXT_PUBLIC_GRAPH_TOKEN=your_graph_api_token_here
NEXT_PUBLIC_GRAPH_API_URL=https://token-api.thegraph.com
```

Replace `your_graph_api_token_here` with your actual Graph API Token. The `NEXT_PUBLIC_GRAPH_API_URL` is optional and defaults to `https://token-api.thegraph.com` if not specified.

### Running the Application

```bash
yarn start
```

Visit `http://localhost:3000/token-api` to access the application.

## 📚 API Components

### Token Holders Component

Fetches and displays token holder information for any ERC20 token.

```typescript
// Example usage in your component
import { GetHolders } from "~~/app/token-api/_components/GetHolders";

export default function YourComponent() {
    return (
        <div>
            <GetHolders />
            {/* With custom parameters */}
            <GetHolders
                initialContractAddress="0xc944E90C64B2c07662A292be6244BDf05Cda44a7"
                initialNetwork="mainnet"
                isOpen={true}
            />
        </div>
    );
}
```

### Token Transfers Component

Displays token balances formatted as transfers with proper decimal formatting.

```typescript
import { GetTransfers } from "~~/app/token-api/_components/GetTransfers";

// Basic usage
<GetTransfers />

// With custom address/contract and network
<GetTransfers
  initialAddress="0x1234..."
  initialNetwork="base"
  isOpen={true}
/>
```

**Features:**

-   Shows token contract addresses instead of "from" addresses
-   Formats token amounts properly based on token decimals
-   Displays both formatted and raw amounts when they differ
-   Connects to the balances API endpoint to fetch token data

### Token Metadata Component

Fetches comprehensive token information.

```typescript
// Example usage
import { GetMetadata } from "~~/app/token-api/_components/GetMetadata";

export default function YourComponent() {
    return (
        <div>
            <GetMetadata />
            {/* With custom parameters */}
            <GetMetadata
                initialContractAddress="0x4200000000000000000000000000000000000042"
                initialNetwork="optimism"
                isOpen={true}
            />
        </div>
    );
}
```

### Token Balances Component

Retrieves token balances for any Ethereum address across supported networks.

```typescript
// Example usage
import { GetBalances } from "~~/app/token-api/_components/GetBalances";

export default function YourComponent() {
    return (
        <div>
            <GetBalances />
            {/* With custom parameters */}
            <GetBalances
                initialAddress="0x1234..."
                initialNetwork="arbitrum-one"
                isOpen={true}
            />
        </div>
    );
}
```

### Historical Balances Component

Track token balance changes over time for any wallet address.

```typescript
// Example usage
import { GetHistorical } from "~~/app/token-api/_components/GetHistorical";

export default function YourComponent() {
    return (
        <div>
            <GetHistorical />
            {/* With custom parameters */}
            <GetHistorical
                initialAddress="0x1234..."
                initialNetwork="mainnet"
                isOpen={true}
            />
        </div>
    );
}
```

### DEX Pool OHLC Component

View price history for liquidity pools with OHLCV data.

```typescript
// Example usage
import { GetOHLCByPool } from "~~/app/token-api/_components/GetOHLCByPool";

export default function YourComponent() {
    return (
        <div>
            <GetOHLCByPool />
            {/* With custom parameters */}
            <GetOHLCByPool
                initialPoolAddress="0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
                initialNetwork="mainnet"
                isOpen={true}
            />
        </div>
    );
}
```

### Token OHLC Component

Track price movements for individual token contracts.

```typescript
// Example usage
import { GetOHLCByContract } from "~~/app/token-api/_components/GetOHLCByContract";

export default function YourComponent() {
    return (
        <div>
            <GetOHLCByContract />
            {/* With custom parameters */}
            <GetOHLCByContract
                initialContractAddress="0x4200000000000000000000000000000000000042"
                initialNetwork="optimism"
                isOpen={true}
            />
        </div>
    );
}
```

### DEX Swaps Component

Monitor swap events across DEXs on multiple networks.

```typescript
// Example usage
import { GetSwaps } from "~~/app/token-api/_components/GetSwaps";

export default function YourComponent() {
    return (
        <div>
            <GetSwaps />
            {/* With custom parameters */}
            <GetSwaps initialNetwork="mainnet" isOpen={true} />
        </div>
    );
}
```

### DEX Pools Component

View liquidity pools across different networks.

```typescript
// Example usage
import { GetPools } from "~~/app/token-api/_components/GetPools";

export default function YourComponent() {
    return (
        <div>
            <GetPools />
            {/* With custom parameters */}
            <GetPools initialNetwork="mainnet" isOpen={true} />
        </div>
    );
}
```

## 🔍 Example Addresses for Testing

### Token Contracts

-   Ethereum (GRT): `0xc944E90C64B2c07662A292be6244BDf05Cda44a7`
-   Arbitrum (ARB): `0x912CE59144191C1204E64559FE8253a0e49E6548`
-   Base (cbETH): `0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22`
-   BSC (BSC-USD): `0x55d398326f99059fF775485246999027B3197955`
-   Optimism (OP): `0x4200000000000000000000000000000000000042`

### DEX Pool Addresses

-   Ethereum (ETH/USDC): `0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640`
-   Base (ETH/USDbC): `0x4c36388be6f416a29c8d8eee81c771ce6be14b18`
-   Arbitrum (ETH/USDC): `0xc31e54c7a869b9fcbecc14363cf510d1c41fa443`
-   BSC (BNB/BUSD): `0x58f876857a02d6762e0101bb5c46a8c1ed44dc16`
-   Optimism (ETH/USDC): `0x85149247691df622eaf1a8bd0cafd40bc45154a9`

## 🔑 API Authentication

The application requires a Graph API Token for authentication. The implementation uses a proxy approach for security:

1. Requests are made to a local API route (`/api/token-proxy`)
2. The proxy adds authentication headers and forwards to the Graph Token API
3. This keeps API keys secure and avoids CORS issues

```typescript
// Example of how API requests are made
const url = new URL("/api/token-proxy", window.location.origin);
url.searchParams.append("path", `transfers/evm/${contractAddress}`);
url.searchParams.append("network_id", selectedNetwork);

const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
    cache: "no-store",
});
```

⚠️ **Important**: Never commit your `.env.local` file to version control. Make sure it's included in your `.gitignore`.

## 🌐 Supported Networks

The API supports the following networks:

-   `mainnet`: Ethereum Mainnet
-   `arbitrum-one`: Arbitrum
-   `base`: Base
-   `bsc`: Binance Smart Chain
-   `optimism`: Optimism
-   `matic`: Polygon
-   `unichain`: Unichain (for some endpoints)

## 🧩 API Endpoints

The components interact with these Token API endpoints:

| Component         | Endpoint                             | Description              |
| ----------------- | ------------------------------------ | ------------------------ |
| GetMetadata       | `/tokens/evm/{contract}`             | Retrieves token metadata |
| GetBalances       | `/balances/evm/{address}`            | Fetches token balances   |
| GetTransfers      | `/transfers/evm/{address}`           | Displays token transfers |
| GetHolders        | `/holders/evm/{contract}`            | Shows token holders      |
| GetHistorical     | `/historical/balances/evm/{address}` | Historical balance data  |
| GetOHLCByPool     | `/ohlc/pools/evm/{pool}`             | Price history for pools  |
| GetOHLCByContract | `/ohlc/prices/evm/{contract}`        | Price history for tokens |
| GetSwaps          | `/swaps/evm`                         | DEX swap events          |
| GetPools          | `/pools/evm`                         | Liquidity pool info      |

## 📝 Key Data Structures

### OHLC Price Data

```typescript
interface OHLCData {
    datetime: string;
    network_id: string;
    pair?: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    uaw?: number; // Unique active wallets
    transactions?: number;
}
```

### Historical Balance Data

```typescript
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
```

### Token Metadata

```typescript
interface TokenMetadata {
    contract_address: string;
    name: string;
    symbol: string;
    decimals: number;
    total_supply: string;
    logo_url?: string;
    market_data?: {
        price_usd: number;
        price_change_percentage_24h: number;
        market_cap: number;
        total_volume_24h: number;
    };
}
```

### Token Balance

```typescript
interface TokenBalance {
    contract_address: string;
    amount: string;
    symbol: string;
    decimals: number;
    name?: string;
    amount_usd?: number;
    network_id: string;
}
```

### Token Holder

```typescript
interface TokenHolder {
    address: string;
    balance: string;
    last_updated_block: number;
    balance_usd?: number;
    token_share?: number;
}
```

### Token Transfer

```typescript
interface TokenTransfer {
    tx_hash: string;
    from_address: string;
    to_address: string;
    value: string;
    value_display?: string;
    block_timestamp: number;
    block_number: number;
    type: string;
    network_id?: string;
}
```

### Swap Event

```typescript
interface Swap {
    tx_hash: string;
    pool_address: string;
    amount0_in: string;
    amount1_in: string;
    amount0_out: string;
    amount1_out: string;
    token0_address: string;
    token0_symbol: string;
    token1_address: string;
    token1_symbol: string;
    timestamp: number;
    network_id: string;
    value_usd?: number;
}
```

## 📱 Component Features

All components share these developer-friendly features:

-   **Flexible Parameters**: Optional query parameters for customization
-   **Minimal Parameter Mode**: For easier initial testing
-   **Error Handling**: Comprehensive error states with user-friendly messages
-   **Loading States**: Clear loading indicators
-   **Pagination**: For navigating large datasets
-   **Responsive Design**: Works on mobile and desktop
-   **Address Components**: Uses Scaffold-ETH's `<Address>` component for Ethereum addresses

## 🔄 Error Handling Examples

The components include robust error handling:

```typescript
try {
    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error Response:", errorText);
        throw new Error(
            `API request failed with status ${response.status}: ${errorText}`
        );
    }

    const data = await response.json();
    // Process data...
} catch (err) {
    const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
    console.error("❌ Error fetching data:", err);
    setError(errorMessage);
    // Handle UI state...
}
```

## 🎨 Styling

The application uses Tailwind CSS with DaisyUI components for a consistent, responsive UI. All components follow these styling principles:

-   **Collapsible Containers**: Components use a standardized details/summary pattern for better space management
-   **Card-Based Layout**: Content is organized in distinct cards with consistent styling
-   **Responsive Design**: All components adapt seamlessly to different screen sizes
-   **Interactive Elements**: Buttons, forms, and tables share consistent styling and behavior
-   **Status Indicators**: Consistent loading states, error messages, and empty states
-   **Color System**: Semantic color usage for different data types and states
-   **Typography Hierarchy**: Consistent text sizing and weights for better readability
-   **Visual Feedback**: Clear indicators for interactive elements and data changes

Components can be easily themed by modifying the DaisyUI theme configuration in `tailwind.config.js`.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## Getting Started

### 1. Get Your API Key

1. Visit [The Graph Market](https://thegraph.market/)
2. Navigate to the "Token API" tab
3. Click "Get API Key"
4. Follow the authentication process
5. Copy your API Token

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory and add your API key:

```bash
NEXT_PUBLIC_GRAPH_TOKEN=your_api_key_here
```

### 3. Install Dependencies

```bash
yarn install
```

### 4. Start the Development Server

```bash
yarn start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Features

-   View token metadata across multiple EVM networks
-   Check token balances for any address
-   Track token transfers
-   List token holders
-   Support for multiple networks:
    -   Ethereum Mainnet
    -   Base
    -   Arbitrum
    -   BSC
    -   Optimism

## Built With

-   Next.js
-   Scaffold-ETH 2
-   Tailwind CSS
-   DaisyUI

## 🧰 Hook Documentation for Scaffold-ETH

Please reference the [Scaffold-ETH docs](https://docs.scaffoldeth.io/)

## 🧩 Component Documentation for Scaffold-ETH

Please reference the [Scaffold-ETH docs](https://docs.scaffoldeth.io/)

## 🪝 Token API Hooks Documentation

The Token API Explorer provides a set of React hooks to interact with The Graph Token API. These hooks handle data fetching, caching, error handling, and state management, making it easier to integrate token data into your application.

### useTokenApi

The base hook that all other hooks extend. It provides the core functionality for interacting with the Token API.

```typescript
import { useTokenApi } from "~~/app/token-api/_hooks/useTokenApi";

// Usage example
const { data, isLoading, error, refetch, lastUpdated } =
    useTokenApi<YourDataType>(
        "endpoint/path",
        { param1: "value1", param2: "value2" },
        { skip: false, refetchInterval: 30000 }
    );
```

**Parameters:**

-   `endpoint`: API endpoint path without leading slash
-   `params`: Query parameters object
-   `options`:
    -   `skip`: Whether to skip the API call (default: false)
    -   `refetchInterval`: Interval in milliseconds to refetch data

**Returns:**

-   `data`: The fetched data or undefined
-   `isLoading`: Boolean indicating if the request is in progress
-   `error`: Error message if the request failed
-   `refetch`: Function to manually trigger a refetch
-   `lastUpdated`: Timestamp of the last successful update

### useTokenBalances

Fetches token balances for a given address across supported networks.

```typescript
import { useTokenBalances } from "~~/app/token-api/_hooks/useTokenBalances";

// Basic usage
const { data: balances, isLoading, error } = useTokenBalances("0x1234...abcd");

// With filter parameters
const { data: filteredBalances } = useTokenBalances(address, {
    network_id: "mainnet",
    page: 1,
    page_size: 20,
    min_amount: "1000000",
});
```

**Parameters:**

-   `address`: Wallet address to fetch balances for
-   `params`: Optional filter parameters
    -   `network_id`: Network identifier
    -   `page`: Page number for pagination
    -   `page_size`: Number of results per page
    -   `min_amount`: Minimum token amount
    -   `contract_address`: Filter by specific token contract
-   `options`: Hook options (passed to useTokenApi)

**Returns:**

-   Same as useTokenApi, with `data` being an array of TokenBalance objects

### useTokenHolders

Fetches holder information for a specific token contract.

```typescript
import { useTokenHolders } from "~~/app/token-api/_hooks/useTokenHolders";

// Basic usage
const { data: holders } = useTokenHolders(
    "0xc944E90C64B2c07662A292be6244BDf05Cda44a7"
);

// With parameters
const { data: holders } = useTokenHolders(contractAddress, {
    network_id: "mainnet",
    page: 1,
    page_size: 50,
    order_by: "desc",
});
```

**Parameters:**

-   `contractAddress`: Token contract address
-   `params`: Optional filter parameters
    -   `network_id`: Network identifier
    -   `page`: Page number for pagination
    -   `page_size`: Number of results per page
    -   `order_by`: Sort order for results ("asc" or "desc")
-   `options`: Hook options

**Returns:**

-   Same as useTokenApi, with `data` being an array of TokenHolder objects

### useTokenMetadata

Fetches detailed metadata for a token contract.

```typescript
import { useTokenMetadata } from "~~/app/token-api/_hooks/useTokenMetadata";

// Basic usage
const { data: tokenInfo } = useTokenMetadata(
    "0x4200000000000000000000000000000000000042"
);

// With parameters
const { data: tokenInfo } = useTokenMetadata(contractAddress, {
    network_id: "optimism",
});
```

**Parameters:**

-   `contractAddress`: Token contract address
-   `params`: Optional parameters
    -   `network_id`: Network identifier
-   `options`: Hook options

**Returns:**

-   Same as useTokenApi, with `data` containing token metadata

### useTokenTransfers

Fetches token transfer events for an address or contract.

```typescript
import { useTokenTransfers } from "~~/app/token-api/_hooks/useTokenTransfers";

// Basic usage
const { data: transfers } = useTokenTransfers("0x1234...abcd");

// With parameters
const { data: transfers } = useTokenTransfers(address, {
    network_id: "base",
    page_size: 100,
    days: 30,
    contract_address: "0x4200000000000000000000000000000000000042",
});
```

**Parameters:**

-   `address`: Wallet address or contract address
-   `params`: Optional filter parameters
    -   `network_id`: Network identifier
    -   `page_size`: Number of results per page
    -   `page`: Page number for pagination
    -   `days`: Number of days to look back
    -   `contract_address`: Filter by specific token contract
-   `options`: Hook options

**Returns:**

-   Same as useTokenApi, with `data` being an array of TokenTransfer objects

### useHistoricalBalances

Fetches historical balance data for an address.

```typescript
import { useHistoricalBalances } from "~~/app/token-api/_hooks/useHistoricalBalances";

// Basic usage
const { data: historicalData } = useHistoricalBalances("0x1234...abcd");

// With parameters
const { data: historicalData } = useHistoricalBalances(address, {
    network_id: "mainnet",
    contract_address: "0xc944E90C64B2c07662A292be6244BDf05Cda44a7",
    days: 90,
    interval: "day",
});
```

**Parameters:**

-   `address`: Wallet address
-   `params`: Optional filter parameters
    -   `network_id`: Network identifier
    -   `contract_address`: Token contract address
    -   `days`: Number of days to look back
    -   `interval`: Time interval for data points ("day", "week", "month")
-   `options`: Hook options

**Returns:**

-   Same as useTokenApi, with `data` being an array of HistoricalBalance objects

### useTokenOHLCByPool

Fetches OHLC (Open, High, Low, Close) price data for a DEX liquidity pool.

```typescript
import { useTokenOHLCByPool } from "~~/app/token-api/_hooks/useTokenOHLCByPool";

// Basic usage
const { data: ohlcData } = useTokenOHLCByPool(
    "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
);

// With parameters
const { data: ohlcData } = useTokenOHLCByPool(poolAddress, {
    network_id: "mainnet",
    days: 30,
    interval: "hour",
});
```

**Parameters:**

-   `poolAddress`: DEX pool contract address
-   `params`: Optional filter parameters
    -   `network_id`: Network identifier
    -   `days`: Number of days to look back
    -   `interval`: Time interval for data points ("hour", "day", "week")
-   `options`: Hook options

**Returns:**

-   Same as useTokenApi, with `data` being an array of OHLC data points

### useTokenOHLCByContract

Fetches OHLC price data for a token contract.

```typescript
import { useTokenOHLCByContract } from "~~/app/token-api/_hooks/useTokenOHLCByContract";

// Basic usage
const { data: ohlcData } = useTokenOHLCByContract(
    "0x4200000000000000000000000000000000000042"
);

// With parameters
const { data: ohlcData } = useTokenOHLCByContract(contractAddress, {
    network_id: "optimism",
    days: 180,
    interval: "day",
});
```

**Parameters:**

-   `contractAddress`: Token contract address
-   `params`: Optional filter parameters
    -   `network_id`: Network identifier
    -   `days`: Number of days to look back
    -   `interval`: Time interval for data points ("hour", "day", "week")
-   `options`: Hook options

**Returns:**

-   Same as useTokenApi, with `data` being an array of OHLC data points

### useTokenSwaps

Fetches DEX swap events across supported networks.

```typescript
import { useTokenSwaps } from "~~/app/token-api/_hooks/useTokenSwaps";

// Basic usage
const { data: swaps } = useTokenSwaps({
    network_id: "mainnet",
});

// With parameters
const { data: swaps } = useTokenSwaps({
    network_id: "mainnet",
    pool_address: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
    page: 1,
    page_size: 50,
});
```

**Parameters:**

-   `params`: Optional filter parameters
    -   `network_id`: Network identifier
    -   `pool`: Filter by specific pool address
    -   `caller`: Filter by caller address
    -   `sender`: Filter by sender address
    -   `recipient`: Filter by recipient address
    -   `tx_hash`: Filter by transaction hash
    -   `protocol`: Filter by protocol (e.g., "uniswap_v3")
    -   `page`: Page number for pagination
    -   `page_size`: Number of results per page
-   `options`: Hook options

**Returns:**

-   Same as useTokenApi, with `data` being an array of Swap objects with the following structure:

```typescript
interface Swap {
    block_num: number;
    datetime: string;
    transaction_id: string;
    caller: string;
    pool: string;
    factory?: string;
    sender: string;
    recipient: string;
    network_id: string;
    amount0: string; // Raw token0 amount
    amount1: string; // Raw token1 amount
    token0?:
        | {
              // Token0 information
              address: string; // Token0 contract address
              symbol: string; // Token0 symbol
              decimals: number; // Token0 decimals
          }
        | string;
    token1?:
        | {
              // Token1 information
              address: string; // Token1 contract address
              symbol: string; // Token1 symbol
              decimals: number; // Token1 decimals
          }
        | string;
    token0_symbol?: string; // Legacy field
    token1_symbol?: string; // Legacy field
    amount0_usd?: number; // USD value of token0 amount
    amount1_usd?: number; // USD value of token1 amount
    value0?: number; // Formatted token0 value
    value1?: number; // Formatted token1 value
    price0?: number; // Token0 price
    price1?: number; // Token1 price
    protocol?: string; // Protocol name (e.g., "uniswap_v3")
}
```

### useTokenPools

Fetches DEX liquidity pool information.

```typescript
import { useTokenPools } from "~~/app/token-api/_hooks/useTokenPools";

// Basic usage
const { data: pools } = useTokenPools();

// With parameters
const { data: pools } = useTokenPools({
    network_id: "mainnet",
    token_address: "0xc944E90C64B2c07662A292be6244BDf05Cda44a7",
    page: 1,
    page_size: 20,
});
```

**Parameters:**

-   `params`: Optional filter parameters
    -   `network_id`: Network identifier
    -   `token_address`: Filter by specific token address
    -   `min_tvl_usd`: Minimum Total Value Locked in USD
    -   `page`: Page number for pagination
    -   `page_size`: Number of results per page
-   `options`: Hook options

**Returns:**

-   Same as useTokenApi, with `data` being an array of Pool objects

## 🔍 Token API Component Documentation

### GetHolders Component

Displays token holder information with pagination and filtering.

```typescript
import { GetHolders } from "~~/app/token-api/_components/GetHolders";

// Basic usage
<GetHolders />

// With custom contract and network
<GetHolders
  initialContractAddress="0xc944E90C64B2c07662A292be6244BDf05Cda44a7"
  initialNetwork="mainnet"
  isOpen={true}
/>
```

### GetBalances Component

Displays token balances for any address across supported networks.

```typescript
import { GetBalances } from "~~/app/token-api/_components/GetBalances";

// Basic usage
<GetBalances />

// With custom address and network
<GetBalances
  initialAddress="0x1234..."
  initialNetwork="arbitrum-one"
  isOpen={true}
/>
```

### GetTransfers Component

Displays token balances formatted as transfers with proper decimal formatting.

```typescript
import { GetTransfers } from "~~/app/token-api/_components/GetTransfers";

// Basic usage
<GetTransfers />

// With custom address/contract and network
<GetTransfers
  initialAddress="0x1234..."
  initialNetwork="base"
  isOpen={true}
/>
```

**Features:**

-   Shows token contract addresses instead of "from" addresses
-   Formats token amounts properly based on token decimals
-   Displays both formatted and raw amounts when they differ
-   Connects to the balances API endpoint to fetch token data

### GetMetadata Component

Displays detailed token metadata information.

```typescript
import { GetMetadata } from "~~/app/token-api/_components/GetMetadata";

// Basic usage
<GetMetadata />

// With custom contract and network
<GetMetadata
  initialContractAddress="0x4200000000000000000000000000000000000042"
  initialNetwork="optimism"
  isOpen={true}
/>
```

### GetHistorical Component

Displays historical balance data with filtering options.

```typescript
import { GetHistorical } from "~~/app/token-api/_components/GetHistorical";

// Basic usage
<GetHistorical />

// With custom address and network
<GetHistorical
  initialAddress="0x1234..."
  initialNetwork="mainnet"
  isOpen={true}
/>
```

### GetOHLCByPool Component

Displays interactive price history charts for DEX liquidity pools with comprehensive filtering options and data visualization.

```typescript
import { GetOHLCByPool } from "~~/app/token-api/_components/GetOHLCByPool";

// Basic usage
<GetOHLCByPool />

// With custom pool address and network
<GetOHLCByPool
  initialPoolAddress="0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
  initialNetwork="mainnet"
  isOpen={true}
/>
```

**Key Features:**

-   Collapsible UI with intuitive navigation
-   Detailed pool information display (token pair, protocol)
-   Multiple time range and interval selection options
-   Color-coded price change indicators
-   Example DEX pools across different networks
-   Comprehensive error states and loading indicators
-   Paginated results with responsive table layout

### GetOHLCByContract Component

Displays price history charts for token contracts.

```typescript
import { GetOHLCByContract } from "~~/app/token-api/_components/GetOHLCByContract";

// Basic usage
<GetOHLCByContract />

// With custom contract and network
<GetOHLCByContract
  initialContractAddress="0x4200000000000000000000000000000000000042"
  initialNetwork="optimism"
  isOpen={true}
/>
```

### GetSwaps Component

Displays DEX swap events with filtering options.

```typescript
import { GetSwaps } from "~~/app/token-api/_components/GetSwaps";

// Basic usage
<GetSwaps />

// With custom network
<GetSwaps
  initialNetwork="mainnet"
  isOpen={true}
/>
```

### GetPools Component

Displays DEX liquidity pool information.

```typescript
import { GetPools } from "~~/app/token-api/_components/GetPools";

// Basic usage
<GetPools />

// With custom network
<GetPools
  initialNetwork="mainnet"
  isOpen={true}
/>
```

## 🚀 Tutorial: Setting Up and Using Hooks

This tutorial shows how to build a simple token dashboard using Scaffold-ETH hooks.

### Step 1: Create a Basic Component Structure

**What this step accomplishes:** Sets up the foundation for your token dashboard by creating the basic component structure and importing necessary hooks.

```typescript
// pages/token-dashboard.tsx
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { Address, Balance } from "~~/components/scaffold-eth";
import {
    useScaffoldReadContract,
    useScaffoldWriteContract,
    useScaffoldEventHistory,
} from "~~/hooks/scaffold-eth";

export default function TokenDashboard() {
    const { address } = useAccount();
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");

    return (
        <div className="flex flex-col gap-4 p-4">
            <h1 className="text-2xl font-bold">Token Dashboard</h1>
            {/* We'll add more functionality in the next steps */}
        </div>
    );
}
```

### Step 2: Read Token Information Using Hooks

**What this step accomplishes:** Implements reading data from your token contract using the `useScaffoldReadContract` hook to display basic token information like name, symbol, decimals, and user's balance.

```typescript
// Inside TokenDashboard component, add these hooks
const { data: tokenName } = useScaffoldReadContract({
    contractName: "YourToken",
    functionName: "name",
});

const { data: tokenSymbol } = useScaffoldReadContract({
    contractName: "YourToken",
    functionName: "symbol",
});

const { data: tokenDecimals } = useScaffoldReadContract({
    contractName: "YourToken",
    functionName: "decimals",
});

const { data: userBalance, refetch: refetchBalance } = useScaffoldReadContract({
    contractName: "YourToken",
    functionName: "balanceOf",
    args: [address],
    watch: true, // Automatically update when new blocks are mined
});
```

**Add the UI to display the token information:**

```typescript
// Add this to your return statement
<div className="card bg-base-100 shadow-xl p-4">
    <h2 className="text-xl font-bold">
        {tokenName} ({tokenSymbol})
    </h2>
    <p>Decimals: {tokenDecimals?.toString()}</p>
    <p>Your Balance: {userBalance?.toString()}</p>
</div>
```

### Step 3: Add Token Transfer Functionality

**What this step accomplishes:** Implements the ability to transfer tokens to other addresses using the `useScaffoldWriteContract` hook, which handles transaction submission and state management.

```typescript
// Inside TokenDashboard component, add this hook
const { writeContractAsync, isLoading: isTransferring } =
    useScaffoldWriteContract({
        contractName: "YourToken",
    });

// Add the transfer function
const handleTransfer = async () => {
    if (!recipient || !amount) return;

    try {
        const parsedAmount = BigInt(amount);
        await writeContractAsync({
            functionName: "transfer",
            args: [recipient, parsedAmount],
        });

        // Reset form and refresh balance after successful transfer
        setRecipient("");
        setAmount("");
        refetchBalance();
    } catch (err) {
        console.error("Transfer failed:", err);
    }
};
```

**Add the transfer form UI:**

```typescript
// Add this to your return statement
<div className="card bg-base-100 shadow-xl p-4 mt-4">
    <h2 className="text-xl font-bold">Transfer Tokens</h2>
    <div className="form-control">
        <label className="label">Recipient</label>
        <input
            type="text"
            className="input input-bordered"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
        />
    </div>
    <div className="form-control mt-2">
        <label className="label">Amount</label>
        <input
            type="text"
            className="input input-bordered"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
        />
    </div>
    <button
        className="btn btn-primary mt-4"
        onClick={handleTransfer}
        disabled={isTransferring || !recipient || !amount}
    >
        {isTransferring ? "Sending..." : "Transfer"}
    </button>
</div>
```

### Step 4: Display Transaction History

**What this step accomplishes:** Implements a way to view the user's transfer history using the `useScaffoldEventHistory` hook, which fetches historical contract events with pagination support.

```typescript
// Inside TokenDashboard component, add this hook
const {
    data: transferEvents,
    isLoading: isLoadingEvents,
    fetchNextPage,
    hasNextPage,
} = useScaffoldEventHistory({
    contractName: "YourToken",
    eventName: "Transfer",
    filters: { from: address }, // Only show transfers sent by the user
    blockData: true, // Include block information
    transactionData: true, // Include transaction details
});
```

**Add the transaction history UI:**

```typescript
// Add this to your return statement
<div className="card bg-base-100 shadow-xl p-4 mt-4">
    <h2 className="text-xl font-bold">Your Recent Transfers</h2>
    {isLoadingEvents ? (
        <p>Loading transfer history...</p>
    ) : (
        <div className="overflow-x-auto">
            <table className="table">
                <thead>
                    <tr>
                        <th>To</th>
                        <th>Amount</th>
                        <th>Block</th>
                    </tr>
                </thead>
                <tbody>
                    {transferEvents?.flatMap((page) =>
                        page.map((event, index) => (
                            <tr key={`${event.transaction.hash}-${index}`}>
                                <td>
                                    <Address address={event.args.to} />
                                </td>
                                <td>{event.args.value.toString()}</td>
                                <td>{event.block.number.toString()}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            {hasNextPage && (
                <button
                    className="btn btn-sm mt-2"
                    onClick={() => fetchNextPage()}
                >
                    Load More
                </button>
            )}
        </div>
    )}
</div>
```

### Step 5: Adding Error Handling and UX Improvements

**What this step accomplishes:** Enhances the user experience by adding proper loading states, error handling, and visual feedback for transactions.

```typescript
// Inside TokenDashboard component, add these states
const [error, setError] = useState("");
const [txHash, setTxHash] = useState("");
const [txSuccess, setTxSuccess] = useState(false);

// Update the transfer function with better error handling
const handleTransfer = async () => {
    if (!recipient || !amount) return;

    setError("");
    setTxHash("");
    setTxSuccess(false);

    try {
        const parsedAmount = BigInt(amount);
        const result = await writeContractAsync({
            functionName: "transfer",
            args: [recipient, parsedAmount],
        });

        setTxHash(result);
        setTxSuccess(true);
        setRecipient("");
        setAmount("");
        refetchBalance();
    } catch (err) {
        const errorMessage =
            err instanceof Error ? err.message : "Transaction failed";
        setError(errorMessage);
        console.error("Transfer failed:", err);
    }
};
```

**Add success and error feedback UI:**

```typescript
// Add this to your transfer form
{
    error && (
        <div className="alert alert-error mt-4">
            <p>{error}</p>
        </div>
    );
}

{
    txSuccess && (
        <div className="alert alert-success mt-4">
            <p>
                Transfer successful! Transaction hash:{" "}
                <a
                    href={`https://etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                >
                    {txHash.substring(0, 10)}...
                </a>
            </p>
        </div>
    );
}
```
