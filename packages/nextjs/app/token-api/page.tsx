"use client";

import { GetBalances } from "./_components/GetBalances";
import { GetHolders } from "./_components/GetHolders";
import { GetMetadata } from "./_components/GetMetadata";
import { GetTransfers } from "./_components/GetTransfers";
import type { NextPage } from "next";

const TokenAPI: NextPage = () => {
  return (
    <div className="flex flex-col py-8 px-4 md:px-8 lg:px-12 w-full max-w-[1200px] mx-auto">
      <h1 className="text-4xl font-bold mb-8">Token API Explorer</h1>
      <div className="flex flex-col gap-4">
        <GetBalances />
        <GetTransfers />
        <GetHolders />
        <GetMetadata />
      </div>
    </div>
  );
};

export default TokenAPI;
