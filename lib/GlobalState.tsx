import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { assert } from "@cosmjs/utils";
import { useState, createContext, useContext, ReactNode, useEffect } from "react";
import { rpcEndpoint } from "../pages";
import { approxDateFromTimestamp, queryOracleWith } from "./oracle";
import { querySubmissions } from "./submissions";

export interface VerifiedBeacon {
  readonly round: number;
  readonly randomness: string;
  readonly published: Date;
  readonly verified: Date;
  /** Diff between verified and published in seconds */
  readonly diff: number;
}

interface State {
  highest: number;
  lowest: number;
  beacons: Map<number, VerifiedBeacon>;
}

// The initial state, you can setup any properties initilal values here.
const initialState: State = {
  // Initially the interval [lowest,heighest] is empty
  highest: 0,
  lowest: Number.MAX_SAFE_INTEGER,
  beacons: new Map(),
};

interface Submission {
  bot: string;
  time: string;
}

interface Context {
  state: State;
  addBeacons: (beacons: VerifiedBeacon[]) => void;
  getSubmissions: (round: number) => Promise<readonly Submission[]>;
  getBotInfo: (address: string) => Promise<Bot | null>;
}

// create the context object for delivering your state across your app.
export const GlobalContext = createContext<Context>({
  state: initialState,
  addBeacons: () => {},
  getSubmissions: (round) => Promise.resolve([]),
  getBotInfo: (address) => Promise.resolve(null),
});

interface Props {
  children: ReactNode;
}

export interface Bot {
  readonly moniker: string;
  readonly address: string;
  readonly rounds_added: number;
}

// custom component to provide the state to your app
export const GlobalProvider = ({ children }: Props) => {
  const [globalState, setGlobalState] = useState(initialState);
  const [client, setClient] = useState<CosmWasmClient | null>(null);
  const [submissions, setSubmissions] = useState<Map<number, Promise<readonly Submission[]>>>(
    new Map(),
  );
  // A map from address to registered bots. Uses Promises to be able to
  // put pending requersts into a cache and do not send more queries then necessary.
  const [botInfos, setBotInfos] = useState<Map<string, Promise<Bot | null>>>(new Map());
  const [stopLoadingEnd, setStopLoadingEnd] = useState<boolean>(false);

  useEffect(() => {
    console.log("Connect client effect");
    CosmWasmClient.connect(rpcEndpoint).then(
      (c) => setClient(c),
      (error) => console.error("Could not connect client", error),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loads a page and returns the number of results
  async function loadPage(
    client: CosmWasmClient,
    startAfter: null | number,
    itemsPerPage: number,
  ): Promise<number> {
    console.log(`Running loadPage(${startAfter}, ${itemsPerPage}) ...`);
    const request = {
      beacons_desc: { start_after: startAfter, limit: itemsPerPage },
    };
    const response = await queryOracleWith(client, request);
    const verifiedBeacons = (response.beacons as Array<any>).map((beacon: any): VerifiedBeacon => {
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
    addBeacons(verifiedBeacons);
    return verifiedBeacons.length;
  }

  useEffect(() => {
    if (!client) return;
    if (stopLoadingEnd) return;
    loadPage(client, globalState.lowest, 10).then(
      (count) => {
        if (count === 0) setStopLoadingEnd(true);
        if (globalState.highest - globalState.lowest >= 60) {
          setStopLoadingEnd(true);
        }
      },
      (err) => console.error(err),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, globalState.lowest, stopLoadingEnd]);

  function loadTopRecursive(client: CosmWasmClient) {
    loadPage(client, null, 10);
    // Repeat but with small number of items
    setTimeout(() => loadTopRecursive(client), 9_000);
  }

  useEffect(() => {
    if (!client) return;
    // Start reload loop after initial load was done
    setTimeout(() => loadTopRecursive(client), 9_000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

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

    if (client) {
      const respPromise = querySubmissions(client, round);
      const respPromiseMapped = respPromise.then((resp) => {
        assert(typeof resp === "object");
        assert(typeof resp.submissions === "object"); // object can be null
        return resp.submissions;
      });
      setSubmissions((current) => {
        current.set(round, respPromiseMapped);
        return current;
      });
      return respPromiseMapped;
    } else {
      return Promise.resolve([]);
    }
  }

  function getBotInfo(address: string): Promise<Bot | null> {
    // console.log("Requested", address);
    const existing = botInfos.get(address);
    if (typeof existing !== "undefined") {
      console.log(`Found bot info for ${address}`);
      return existing;
    }

    if (client) {
      const respPromise = queryOracleWith(client, { bot: { address } });
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

  return (
    <GlobalContext.Provider
      value={{
        state: globalState,
        getSubmissions,
        getBotInfo,
        addBeacons,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

// custom hook for retrieving the provided state
export const useGlobalState = () => useContext(GlobalContext);
