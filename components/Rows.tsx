import { maxBeaconRows } from "../lib/settings";
import { DisplayBeacon, Row } from "./Row";

interface Props {
  readonly beacons: DisplayBeacon[];
  readonly highlightedAddress: string | null;
  readonly onHighlightAddress: (address: string | null) => void;
}

export function Rows({ beacons, highlightedAddress, onHighlightAddress }: Props): JSX.Element {
  return (
    <>
      {beacons.slice(0, maxBeaconRows).map((beacon) => {
        return (
          <Row
            key={beacon.round}
            beacon={beacon}
            highlightedAddress={highlightedAddress}
            onHighlightAddress={onHighlightAddress}
          />
        );
      })}
    </>
  );
}
