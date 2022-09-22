import { useState, createContext, useContext, ReactNode } from "react";

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

interface Context {
  state: State;
  addItems: (items: VerifiedBeacon[]) => void;
}

// create the context object for delivering your state across your app.
export const GlobalContext = createContext<Context>({
  state: initialState,
  addItems: () => {},
});

interface Props {
  children: ReactNode;
}

// custom component to provide the state to your app
export const GlobalProvider = ({ children }: Props) => {
  const [globalState, setGlobalState] = useState(initialState);

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

  return (
    <GlobalContext.Provider
      value={{
        state: globalState,
        addItems,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

// custom hook for retrieving the provided state
export const useGlobalState = () => useContext(GlobalContext);
