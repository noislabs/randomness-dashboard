import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { assert } from "@cosmjs/utils";

assert(process.env.NEXT_PUBLIC_NOIS_CONTRACT, "NEXT_PUBLIC_NOIS_CONTRACT must be set");
export const noisOracleAddress = process.env.NEXT_PUBLIC_NOIS_CONTRACT;

export async function querySubmissions(client: CosmWasmClient, round: number) {
  const response = await client.queryContractSmart(noisOracleAddress, {
    submissions: { round: round },
  });
  return response;
}

export function approxDateFromTimestamp(time: string): Date {
  // Nanoseconds to milliseconds
  return new Date(Number(BigInt(time) / BigInt(1_000_000)));
}
