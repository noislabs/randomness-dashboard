import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { assert } from "@cosmjs/utils";
import { VerifiedBeacon } from "./GlobalState";
import { approxDateFromTimestamp, noisOracleAddress } from "./oracle";

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

/** Returns the diff between round publishing and successful submission in seconds */
export function submissionDiff(submission: Submission, beacon: VerifiedBeacon): number {
  const d1 = beacon.published;
  const d2 = approxDateFromTimestamp(submission.time);
  return (d2.getTime() - d1.getTime()) / 1000;
}
