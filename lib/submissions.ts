import { WasmExtension } from "@cosmjs/cosmwasm-stargate";
import { QueryClient } from "@cosmjs/stargate";
import { VerifiedBeacon } from "./beacons";
import { approxDateFromTimestamp, queryDrandWith } from "./drand";

export interface Submission {
  /** Address of the bot */
  readonly bot: string;
  readonly time: string;
  readonly height: number;
  readonly tx_index: number | null;
}

export async function querySubmissions(
  client: QueryClient & WasmExtension,
  round: number,
): Promise<{ submissions: ReadonlyArray<Submission> }> {
  const response = await queryDrandWith(client, {
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
