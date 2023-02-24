import { Link } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { fromUtf8 } from "@cosmjs/encoding";
import { Event } from "@cosmjs/tendermint-rpc";
import { Decimal } from "@cosmjs/math";

import { GlobalContext } from "../lib/GlobalState";
import { explorerTx } from "../lib/constants";
import { ellideMiddle } from "../lib/ellide";
import { parseCoins } from "@cosmjs/stargate";
import { assert } from "@cosmjs/utils";

// NARROW NO-BREAK SPACE (U+202F)
const thinSpace = "\u202F";

function printableCoinString(coinString: string): string {
  const coins = parseCoins(coinString);
  assert(coins.length === 1);
  const coin = coins[0];
  if (coin.denom?.startsWith("u")) {
    const ticker = coin.denom.slice(1).toUpperCase();
    return Decimal.fromAtomics(coin.amount ?? "0", 6).toString() + thinSpace + ticker;
  } else {
    return coin.amount + thinSpace + coin.denom;
  }
}

interface Props {
  height: number;
  txIndex: number;
}

export function Reward({ height, txIndex }: Props): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const [events, setEvents] = useState<readonly Event[]>([]);
  const { ready, getTransaction, getTransactionResult } = useContext(GlobalContext);

  useEffect(() => {
    if (!ready) return;

    setLoading(true);

    getTransaction(height, txIndex).then(
      (tx) => {
        getTransactionResult(tx.hash)
          .then(
            (data) => {
              setEvents(data?.events ?? []);
            },
            (err) => console.error(err),
          )
          .finally(() => setLoading(false));
      },
      (err) => {
        console.error(err);
        setLoading(false);
      },
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const wasmEvents = events.filter((event) => event.type === "wasm");
  const rewardPoints = fromUtf8(
    wasmEvents
      .flatMap((event) => event.attributes)
      .find((attr) => fromUtf8(attr.key, true) === "reward_points")?.value ?? new Uint8Array(),
    true,
  );
  const rewardPayout = fromUtf8(
    wasmEvents
      .flatMap((event) => event.attributes)
      .find((attr) => fromUtf8(attr.key, true) === "reward_payout")?.value ?? new Uint8Array(),
    true,
  );

  return (
    <>
      {rewardPoints} points
      <br />
      {rewardPayout && printableCoinString(rewardPayout)}
    </>
  );
}
