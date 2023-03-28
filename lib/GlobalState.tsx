import { setupWasmExtension, WasmExtension } from "@cosmjs/cosmwasm-stargate";
import { QueryClient } from "@cosmjs/stargate";
import { Tendermint34Client, HttpBatchClient, TxData } from "@cosmjs/tendermint-rpc";
import { assert } from "@cosmjs/utils";
import { sha256 } from "@cosmjs/crypto";
import { fromHex, toHex } from "@cosmjs/encoding";
import { useState, createContext, useContext, ReactNode, useEffect } from "react";
import { queryBeacon, queryBeacons, VerifiedBeacon } from "./beacons";
import { rpcEndpoint } from "./constants";
import { queryAllowList, queryDrandWith } from "./drand";
import {
  itemsInitialLoad,
  itemsRefresh,
  refreshInterval,
  reloadSubmissionsAfter1,
  reloadSubmissionsAfter2,
} from "./settings";
import { querySubmissions, Submission } from "./submissions";

interface State {
  highest: number;
  lowest: number;
  beacons: Map<number, VerifiedBeacon>;
}

interface Tx {
  hash: string;
}

// The initial state, you can setup any properties initilal values here.
const initialState: State = {
  // Initially the interval [lowest,heighest] is empty
  highest: 0,
  lowest: Number.MAX_SAFE_INTEGER,
  beacons: new Map(),
};

interface Context {
  state: State;
  ready: boolean;
  submissions: Map<number, Promise<readonly Submission[]>>;
  allowList: string[];
  getSubmissions: (round: number) => Promise<readonly Submission[]>;
  getBotInfo: (address: string) => Promise<Bot | null>;
  getBots: () => Promise<Bot[]>;
  getBeacon: (round: number) => Promise<VerifiedBeacon | null>;
  addBeacons: (beacons: VerifiedBeacon[]) => void;
  getTransaction: (height: number, txIndex: number) => Promise<Tx>;
  getTransactionResult: (txHash: string) => Promise<TxData>;
}

// create the context object for delivering your state across your app.
export const GlobalContext = createContext<Context>({
  state: initialState,
  ready: false,
  submissions: new Map(),
  allowList: [],
  getSubmissions: (round) => Promise.resolve([]),
  getBotInfo: (address) => Promise.resolve(null),
  getBots: () => Promise.resolve([]),
  getBeacon: (round) => Promise.resolve(null),
  addBeacons: () => {},
  getTransaction: (height, txIndex) => Promise.reject("Uninitialized GlobalContext"),
  getTransactionResult: (txHash) => Promise.reject("Uninitialized GlobalContext"),
});

interface Props {
  children: ReactNode;
}

export interface Bot {
  readonly moniker: string;
  readonly address: string;
  readonly reward_points: number;
  readonly rounds_added: number;
}

// custom component to provide the state to your app
export const GlobalProvider = ({ children }: Props) => {
  const [globalState, setGlobalState] = useState(initialState);
  // const [client, setClient] = useState<CosmWasmClient | null>(null);
  const [tmClient, setTmClient] = useState<Tendermint34Client>();
  const [queryClient, setQueryClient] = useState<(QueryClient & WasmExtension) | null>(null);
  const [ready, setReady] = useState(false);
  const [submissions, setSubmissions] = useState<Map<number, Promise<readonly Submission[]>>>(
    new Map(),
  );
  const [allowList, setAllowList] = useState<string[]>([]);
  // A map from address to registered bots. Uses Promises to be able to
  // put pending requersts into a cache and do not send more queries then necessary.
  const [botInfos, setBotInfos] = useState<Map<string, Promise<Bot | null>>>(new Map());
  const [stopLoadingEnd, setStopLoadingEnd] = useState<boolean>(false);

  useEffect(() => {
    console.log("Connect client effect");
    // CosmWasmClient.connect(rpcEndpoint).then(
    //   (c) => setClient(c),
    //   (error) => console.error("Could not connect client", error),
    // );
    const httpBatch = new HttpBatchClient(rpcEndpoint);
    Tendermint34Client.create(httpBatch).then(
      (tmClient) => {
        const queryClient = QueryClient.withExtensions(tmClient, setupWasmExtension);
        setTmClient(tmClient);
        setQueryClient(queryClient);
        setReady(true);
      },
      (error) => console.error("Could not connect tendermint client", error),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loads a page and returns the number of results
  async function loadPage(
    client: QueryClient & WasmExtension,
    startAfter: null | number,
    itemsPerPage: number,
  ): Promise<number> {
    console.log(`Running loadPage(startAfter: ${startAfter}, itemsPerPage: ${itemsPerPage}) ...`);
    const verifiedBeacons = await queryBeacons(client, startAfter, itemsPerPage);
    addBeacons(verifiedBeacons);
    return verifiedBeacons.length;
  }

  // Initial beacon list load
  useEffect(() => {
    if (!queryClient) return;
    if (stopLoadingEnd) return;

    // This assumes as have no gaps, even if we do it does not matter much
    const beaconsInState = Math.floor((globalState.highest - globalState.lowest) / 10) + 1;
    if (beaconsInState >= itemsInitialLoad) return;

    loadPage(queryClient, globalState.lowest, 10).then(
      (count) => {
        if (count === 0) setStopLoadingEnd(true);
      },
      (err) => console.error(err),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, globalState.lowest, stopLoadingEnd]);

  function refreshBeacons(client: QueryClient & WasmExtension) {
    loadPage(client, null, itemsRefresh);
    setTimeout(() => refreshBeacons(client), refreshInterval);
  }

  async function getTransaction(height: number, txIndex: number): Promise<Tx> {
    assert(tmClient);
    const block = await tmClient.block(height);
    const tx = block.block.txs[txIndex];
    const hash = sha256(tx);
    return {
      hash: toHex(hash).toUpperCase(),
    };
  }

  async function getTransactionResult(txHash: string): Promise<TxData> {
    assert(tmClient);
    const { result } = await tmClient.tx({ hash: fromHex(txHash) });
    return result;
  }

  useEffect(() => {
    if (!queryClient) return;

    queryAllowList(queryClient).then((listed) => setAllowList(listed));

    // Start reload loop after initial load was done
    setTimeout(() => refreshBeacons(queryClient), refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  async function getBeacon(round: number): Promise<VerifiedBeacon | null> {
    const existing = globalState.beacons.get(round);
    if (typeof existing !== "undefined") {
      console.log(`Found beacon for #${round}`);
      return existing;
    }

    if (queryClient) {
      const response = await queryBeacon(queryClient, round);
      if (response) {
        addBeacons([response]);
      }
      return response;
    } else {
      console.warn("queryClient not set");
      return Promise.resolve(null);
    }
  }

  function addBeacons(beacons: readonly VerifiedBeacon[]) {
    setGlobalState((current) => {
      const addedRounds = beacons.map((b) => b.round);
      for (const beacon of beacons) {
        current.beacons.set(beacon.round, beacon);
      }
      return {
        highest: Math.max(current.highest, ...addedRounds),
        lowest: Math.min(current.lowest, ...addedRounds),
        beacons: current.beacons,
      };
    });
  }

  async function getSubmissions(round: number): Promise<readonly Submission[]> {
    const existing = submissions.get(round);
    if (typeof existing !== "undefined") {
      console.log(`Found submissions for #${round}`);
      return existing;
    }

    if (queryClient) {
      const respPromise = querySubmissions(queryClient, round).then((resp) => {
        assert(typeof resp === "object");
        assert(Array.isArray(resp.submissions));
        return resp.submissions;
      });

      respPromise.then(() => {
        setTimeout(() => updateSubmissions(round), reloadSubmissionsAfter1);
        setTimeout(() => updateSubmissions(round), reloadSubmissionsAfter2);
      });

      setSubmissions((current) => {
        current.set(round, respPromise);
        return current;
      });
      return respPromise;
    } else {
      return Promise.resolve([]);
    }
  }

  async function updateSubmissions(round: number): Promise<void> {
    if (!queryClient) return;

    querySubmissions(queryClient, round)
      .then((resp) => {
        assert(typeof resp === "object");
        assert(Array.isArray(resp.submissions));
        return resp.submissions;
      })
      .then((updated) => {
        setSubmissions((current) => {
          current.set(round, Promise.resolve(updated));
          return current;
        });
      });
  }

  function getBotInfo(address: string): Promise<Bot | null> {
    // console.log("Requested", address);
    const existing = botInfos.get(address);
    if (typeof existing !== "undefined") {
      // console.log(`Found bot info for ${address}`);
      return existing;
    }

    if (queryClient) {
      const respPromise = queryDrandWith(queryClient, { bot: { address } });
      const respPromiseMapped = respPromise.then((resp): Promise<Bot | null> => {
        assert(typeof resp === "object");
        assert(typeof resp.bot === "object"); // object can be null
        return resp.bot;
      });
      setBotInfos((current) => {
        current.set(address, respPromiseMapped);
        return current;
      });
      return respPromiseMapped;
    } else {
      return Promise.resolve(null);
    }
  }

  function getBots(): Promise<Bot[]> {
    if (queryClient) {
      const respPromise = queryDrandWith(queryClient, { bots: {} });
      const respPromiseMapped = respPromise.then((resp): Promise<Bot[]> => {
        assert(typeof resp === "object");
        assert(Array.isArray(resp.bots));
        return resp.bots;
      });
      return respPromiseMapped;
    } else {
      return Promise.resolve([]);
    }
  }

  return (
    <GlobalContext.Provider
      value={{
        state: globalState,
        ready,
        submissions,
        allowList,
        getSubmissions,
        getBotInfo,
        getBots,
        getBeacon,
        addBeacons,
        getTransaction,
        getTransactionResult,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

// custom hook for retrieving the provided state
export const useGlobalState = () => useContext(GlobalContext);
