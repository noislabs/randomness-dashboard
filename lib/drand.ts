import { WasmExtension } from "@cosmjs/cosmwasm-stargate";
import { QueryClient } from "@cosmjs/stargate";

import { noisDrandAddress } from "./constants";

export async function queryAllowList(client: QueryClient & WasmExtension): Promise<string[]> {
  const { allowed } = await queryDrandWith(client, { allow_list: {} });
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

/** Returns true if this round is allowed for the nois-drand contract */
export function isAllowedRound(round: number) {
  return round % 10 === 0;
}
