import { Text } from "@chakra-ui/react";
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
      {beacons.length ? (
        beacons
          .slice(0, maxBeaconRows)
          .map((beacon) => (
            <Row
              key={beacon.round}
              beacon={beacon}
              highlightedAddress={highlightedAddress}
              onHighlightAddress={onHighlightAddress}
            />
          ))
      ) : (
        <Text>No beacons available</Text>
      )}
    </>
  );
}
