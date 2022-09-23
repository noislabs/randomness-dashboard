import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { assert } from "console";
import { useState, createContext, useContext, ReactNode, useEffect } from "react";
import { rpcEndpoint } from ".";
import { approxDateFromTimestamp, noisOracleAddress } from "./oracle";
import { querySubmissions } from "./submissions";

export interface VerifiedBeacon {
  readonly round: number;
  readonly randomness: string;
  readonly published: Date;
  readonly verified: Date;
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
  submissions: Map<number, readonly Submission[]>;
  addItems: (items: VerifiedBeacon[]) => void;
  getSubmissions: (round: number) => Promise<readonly Submission[]>;
}

// create the context object for delivering your state across your app.
export const GlobalContext = createContext<Context>({
  state: initialState,
  submissions: new Map(),
  addItems: () => {},
  getSubmissions: (round) => Promise.resolve([]),
});

interface Props {
  children: ReactNode;
}

// custom component to provide the state to your app
export const GlobalProvider = ({ children }: Props) => {
  const [globalState, setGlobalState] = useState(initialState);
  const [client, setClient] = useState<CosmWasmClient | null>(null);
  const [submissions, setSubmissions] = useState<Map<number, readonly Submission[]>>(new Map());

  useEffect(() => {
    console.log("Connect client effect");
    CosmWasmClient.connect(rpcEndpoint).then(
      (c) => setClient(c),
      (error) => console.error("Could not connect client", error),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLatest(itemsPerPage: number) {
    console.log("Running loadLatest() ...");
    if (!client) {
      console.log("No client yet");
      return;
    }

    const request = {
      beacons_desc: { start_after: null, limit: itemsPerPage },
    };
    console.log("Query request:", JSON.stringify(request));
    const response = await client.queryContractSmart(noisOracleAddress, request);
    for (const beacon of response.beacons) {
      const { round, randomness, published, verified } = beacon;
      const diff = Number(BigInt(verified) - BigInt(published)) / 1_000_000_000;
      const verifiedBeacon: VerifiedBeacon = {
        round: round,
        randomness: randomness,
        published: approxDateFromTimestamp(published),
        verified: approxDateFromTimestamp(verified),
        diff: diff,
      };
      addItems([verifiedBeacon]);
    }

    // Repeat but with small number of items
    setTimeout(() => loadLatest(10), 9_000);
  }

  useEffect(() => {
    loadLatest(60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  function addItems(items: VerifiedBeacon[]) {
    setGlobalState((current) => {
      const rounds = items.map((i) => i.round);
      for (const item of items) {
        current.beacons.set(item.round, item);
      }
      return {
        highest: Math.max(current.highest, ...rounds),
        lowest: Math.min(current.lowest, ...rounds),
        beacons: current.beacons,
      };
    });
  }

  async function getSubmissions(round: number): Promise<readonly Submission[]> {
    if (client) {
      let { submissions } = await querySubmissions(client, round);
      setSubmissions((current) => {
        current.set(round, submissions);
        return current;
      });
      return submissions;
    } else {
      return [];
    }
  }

  return (
    <GlobalContext.Provider
      value={{
        state: globalState,
        submissions: submissions,
        getSubmissions,
        addItems,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

// custom hook for retrieving the provided state
export const useGlobalState = () => useContext(GlobalContext);
