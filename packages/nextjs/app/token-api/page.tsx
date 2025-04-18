"use client";

import { GetBalances } from "./_components/GetBalances";
import { GetHolders } from "./_components/GetHolders";
import { GetMetadata } from "./_components/GetMetadata";
import { GetTransfers } from "./_components/GetTransfers";

export default function TokenAPI() {
  return (
    <div className="flex flex-col gap-6 py-8 px-4 lg:px-8">
      <h1 className="text-4xl font-bold text-center mb-8">Token API Explorer</h1>
      <GetBalances />
      <GetHolders />
      <GetTransfers />
      <GetMetadata />
    </div>
  );
}
