import { Badge, Box, Code, Flex, Heading, Spacer, Square, Text, VStack } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { numberOfRewardedSubmissions } from "../lib/constants";
import { Bot, GlobalContext } from "../lib/GlobalState";
import { Submission, submissionDiff } from "../lib/submissions";
import { VerifiedBeacon } from "../lib/beacons";

export interface MissingBeacon {
  readonly round: number;
}

export type DisplayBeacon = VerifiedBeacon | MissingBeacon;

export function isVerifiedBeacon(beacon: DisplayBeacon): beacon is VerifiedBeacon {
  return typeof (beacon as VerifiedBeacon).diff === "number";
}

interface Props {
  readonly beacon: DisplayBeacon;
  readonly highlightedAddress: string | null;
  readonly onHighlightAddress: (address: string | null) => void;
}

export function Row({ beacon, highlightedAddress, onHighlightAddress }: Props): JSX.Element {
  // roundSubmissions is null as long as submissions have not been loaded
  const [roundSubmissions, setRoundSubmissions] = useState<readonly Submission[] | null>(null);
  const { submissions, getSubmissions, getBotInfo } = useContext(GlobalContext);
  const [botInfos, setBotInfos] = useState<Map<string, Bot | null>>(new Map());

  useEffect(() => {
    getSubmissions(beacon.round).then(
      (submissions) => {
        const addresses = submissions.map((sub) => sub.bot);
        // Load bot infos later
        setTimeout(() => {
          (async () => {
            const infos = await Promise.all(
              addresses.map(async (address) => {
                const info = await getBotInfo(address);
                return [address, info] as const;
              }),
            );
            setBotInfos(new Map(infos));
          })();
        });
        setRoundSubmissions(submissions);
      },
      (err) => console.error(err),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundSubmissions, submissions, getSubmissions, beacon.round]);

  const roundText = `#${beacon.round}`;
  const split1 = roundText.slice(0, 4);
  const split2 = roundText.slice(4);
  return (
    <Flex w="100%" alignItems="center" gap="2">
      <Square bg={"transparent"} size="100px" borderRadius="lg">
        <VStack>
          <Heading size="lg">
            <Link href={`/rounds/${beacon.round}`}>
              {split1}
              <br />
              {split2}
            </Link>
          </Heading>
        </VStack>
      </Square>
      <Box marginLeft="0.5em">
        {isVerifiedBeacon(beacon) ? (
          <>
            <Text marginBottom="0.5em">
              Randomness published at {beacon.published.toUTCString()}:{" "}
              <Code>{beacon.randomness}</Code>
            </Text>
            <Text>
              Submissions ({roundSubmissions?.length ?? "–"}):{" "}
              {(roundSubmissions ?? []).map((submission, index) => {
                const diff = submissionDiff(submission, beacon);
                const address = submission.bot;
                const moniker = botInfos.get(submission.bot)?.moniker;
                const color = index < numberOfRewardedSubmissions ? "green" : "gray";
                const highlighted = address === highlightedAddress;
                return (
                  <Badge
                    key={submission.bot}
                    marginInlineEnd="1"
                    variant={highlighted ? "solid" : "outline"}
                    colorScheme={color}
                    title={address}
                    onClick={() => onHighlightAddress(highlighted ? null : address)}
                    cursor="pointer"
                  >
                    {moniker ? <span title={address}>{moniker}</span> : <>{address}</>} (
                    {diff.toFixed(1)}s)
                  </Badge>
                );
              })}
            </Text>
          </>
        ) : (
          <Text>missing!</Text>
        )}
      </Box>
      <Spacer />
    </Flex>
  );
}
