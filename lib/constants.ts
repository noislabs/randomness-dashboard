import { assert } from "@cosmjs/utils";

export const numberOfRewardedSubmissions = 5;

assert(process.env.NEXT_PUBLIC_NOIS_CONTRACT, "NEXT_PUBLIC_NOIS_CONTRACT must be set");
export const noisOracleAddress = process.env.NEXT_PUBLIC_NOIS_CONTRACT;

assert(process.env.NEXT_PUBLIC_ENDPOINT, "NEXT_PUBLIC_ENDPOINT must be set");
export const rpcEndpoint = process.env.NEXT_PUBLIC_ENDPOINT;
