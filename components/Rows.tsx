import { DisplayBeacon, Row } from "./Row";

interface Props {
  readonly beacons: DisplayBeacon[];
  readonly highlightedAddress: string | null;
  readonly onHighlightAddress: (address: string | null) => void;
}

const maxRows = 100;

export function Rows({ beacons, highlightedAddress, onHighlightAddress }: Props): JSX.Element {
  return (
    <>
      {beacons.slice(0, maxRows).map((beacon) => {
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
