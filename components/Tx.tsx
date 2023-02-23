import { Link } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";

import { GlobalContext } from "../lib/GlobalState";
import { explorerTx } from "../lib/constants";
import { ellideMiddle } from "../lib/ellide";

interface Props {
  height: number;
  txIndex: number;
  maxLen?: number;
}

export function Tx({ height, txIndex, maxLen }: Props): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [hash, setHash] = useState<string>();
  const { ready, getTransaction } = useContext(GlobalContext);

  useEffect(() => {
    if (!ready) return;

    setLoading(true);

    getTransaction(height, txIndex)
      .then(
        (tx) => setHash(tx?.hash),
        (err) => console.error(err),
      )
      .finally(() => setLoading(false));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <Link title={hash} href={explorerTx(hash ?? "")}>
      {hash && ellideMiddle(hash, maxLen ?? Number.MAX_SAFE_INTEGER)}
    </Link>
  );
}
