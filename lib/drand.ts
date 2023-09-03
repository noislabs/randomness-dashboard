import { WasmExtension } from "@cosmjs/cosmwasm-stargate";
import { QueryClient } from "@cosmjs/stargate";

import { noisDrandAddress } from "./constants";

export async function queryAllowlist(client: QueryClient & WasmExtension): Promise<string[]> {
  const { allowed } = await queryDrandWith(client, { allowlist: {} });
  return allowed;
}

export async function queryDrandWith(client: QueryClient & WasmExtension, requestMsg: any) {
  console.log("Sending query:", JSON.stringify(requestMsg));
  return client.wasm.queryContractSmart(noisDrandAddress, requestMsg);
}

export function approxDateFromTimestamp(time: string): Date {
  // Nanoseconds to milliseconds
  return new Date(Number(BigInt(time) / BigInt(1_000_000)));
}

/** Returns true if this round is expected to have submission */
export function isExpectedRound(round: number) {
  return round % 10 === 0;
}
