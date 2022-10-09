import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { assert } from "@cosmjs/utils";
import { noisOracleAddress } from "./constants";

export async function queryOracleWith(client: CosmWasmClient, requestMsg: any) {
  console.log("Sending query:", JSON.stringify(requestMsg));
  return client.queryContractSmart(noisOracleAddress, requestMsg);
}

export function approxDateFromTimestamp(time: string): Date {
  // Nanoseconds to milliseconds
  return new Date(Number(BigInt(time) / BigInt(1_000_000)));
}
