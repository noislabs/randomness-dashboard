import { WasmExtension } from "@cosmjs/cosmwasm-stargate";
import { QueryClient } from "@cosmjs/stargate";
import { approxDateFromTimestamp, queryOracleWith } from "./oracle";

export interface VerifiedBeacon {
  readonly round: number;
  readonly randomness: string;
  readonly published: Date;
  readonly verified: Date;
  /** Diff between verified and published in seconds */
  readonly diff: number;
}

export async function queryBeacons(
  client: QueryClient & WasmExtension,
  startAfter: number | null,
  itemsPerPage: number,
): Promise<VerifiedBeacon[]> {
  const response: { beacons: Array<any> } = await queryOracleWith(client, {
    beacons_desc: { start_after: startAfter, limit: itemsPerPage },
  });

  return response.beacons.map((beacon: any): VerifiedBeacon => {
    const { round, randomness, published, verified } = beacon;
    const publishedDate = approxDateFromTimestamp(published);
    const verifiedDate = approxDateFromTimestamp(verified);
    const diff = (verifiedDate.getTime() - publishedDate.getTime()) / 1000;
    const verifiedBeacon: VerifiedBeacon = {
      round: round,
      randomness: randomness,
      published: publishedDate,
      verified: verifiedDate,
      diff: diff,
    };
    return verifiedBeacon;
  });
}
