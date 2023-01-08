import { Badge } from "@chakra-ui/react";
import { numberOfRewardedSubmissions } from "../lib/constants";

interface Props {
  readonly address: string;
  readonly diff: number;
  /** Index of the submission (0-based) */
  readonly index: number;
  readonly eligable: boolean;
  /** Defaults to false */
  readonly highlighted?: boolean;
  readonly info: null | { moniker: string; rounds_added: number };
  readonly onClick?: (address: string) => void;
}

function roundsDisplay(rounds: number): string {
  if (rounds > 3000) {
    return `${Math.round(rounds / 1000)}k`;
  } else {
    return rounds.toString();
  }
}

export function SubmissionBadge({
  address,
  diff,
  index,
  eligable,
  highlighted,
  info,
  onClick,
}: Props): JSX.Element {
  const color = eligable ? (index < numberOfRewardedSubmissions ? "green" : "pink") : "gray";

  return (
    <Badge
      marginInlineEnd="1"
      variant={highlighted ? "solid" : "outline"}
      colorScheme={color}
      title={address}
      onClick={() => onClick && onClick(address)}
      cursor={onClick ? "pointer" : "auto"}
    >
      {info ? (
        <span title={address}>
          {info.moniker} ({roundsDisplay(info.rounds_added)})
        </span>
      ) : (
        <>{address}</>
      )}
      : {diff.toFixed(1)}s
    </Badge>
  );
}
