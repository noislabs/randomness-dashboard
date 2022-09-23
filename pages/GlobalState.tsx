import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { useState, createContext, useContext, ReactNode, useEffect } from "react";
import { rpcEndpoint } from ".";
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
  setClient: (client: CosmWasmClient) => void;
  addItems: (items: VerifiedBeacon[]) => void;
  getSubmissions: (round: number) => Promise<readonly Submission[]>;
}

// create the context object for delivering your state across your app.
export const GlobalContext = createContext<Context>({
  state: initialState,
  submissions: new Map(),
  setClient: () => {},
  addItems: () => {},
  getSubmissions: (round) => Promise.resolve([]),
});

interface Props {
  children: ReactNode;
}

// custom component to provide the state to your app
export const GlobalProvider = ({ children }: Props) => {
  const [globalState, setGlobalState] = useState(initialState);
  const [clientInternal, setClientInternal] = useState<CosmWasmClient | null>(null);
  const [submissions, setSubmissions] = useState<Map<number, readonly Submission[]>>(new Map());

  function setClient(client: CosmWasmClient) {
    setClientInternal((old) => {
      old?.disconnect();
      return client;
    });
  }

  useEffect(() => {
    console.log("Connect client effect");
    CosmWasmClient.connect(rpcEndpoint).then(
      (client) => setClient(client),
      (error) => console.error("Could not connect client", error),
    );
  }, []);

  // Update statements
  // useEffect(() => {
  //   console.log("Update statements effect");
  //   if (!clientInternal) return;
  //   for (const round of globalState.beacons.keys()) {
  //     querySubmissions(clientInternal, round).then(
  //       (queryResult) =>
  //         setSubmissions((current) => {
  //           current.set(round, queryResult.submissions);
  //           return current;
  //         }),
  //       (err) => console.warn(err),
  //     );
  //   }
  // }, [clientInternal, globalState]);

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
    if (clientInternal) {
      let { submissions } = await querySubmissions(clientInternal, round);
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
        setClient,
        addItems,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

// custom hook for retrieving the provided state
export const useGlobalState = () => useContext(GlobalContext);
