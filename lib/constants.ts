import { assert } from "@cosmjs/utils";

export const numberOfRewardedSubmissions = 6;
export const incentivePrice=0.003;
export const submissionCost=0.03;

assert(process.env.NEXT_PUBLIC_NOIS_CONTRACT, "NEXT_PUBLIC_NOIS_CONTRACT must be set");
export const noisDrandAddress = process.env.NEXT_PUBLIC_NOIS_CONTRACT;

assert(process.env.NEXT_PUBLIC_ENDPOINT, "NEXT_PUBLIC_ENDPOINT must be set");
export const rpcEndpoint = process.env.NEXT_PUBLIC_ENDPOINT;

export function explorerAccount(address: string): string {
  assert(process.env.NEXT_PUBLIC_EXPLORER_ACCOUNT, "NEXT_PUBLIC_EXPLORER_ACCOUNT must be set");
  return process.env.NEXT_PUBLIC_EXPLORER_ACCOUNT.replace("{}", address);
}

export function explorerTx(txHash: string): string {
  assert(process.env.NEXT_PUBLIC_EXPLORER_TX, "NEXT_PUBLIC_EXPLORER_TX must be set");
  return process.env.NEXT_PUBLIC_EXPLORER_TX.replace("{}", txHash);
}
