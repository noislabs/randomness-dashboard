import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { assert } from "@cosmjs/utils";
import { noisOracleAddress } from "./oracle";

export interface Submission {
  readonly bot: string;
  readonly time: string;
}

export async function querySubmissions(
  client: CosmWasmClient,
  round: number,
): Promise<{ submissions: ReadonlyArray<Submission> }> {
  const response = await client.queryContractSmart(noisOracleAddress, {
    submissions: { round: round },
  });
  return response;
}
