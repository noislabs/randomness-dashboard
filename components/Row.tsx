import { Badge, Box, Code, Flex, Heading, Spacer, Square, Text, VStack } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { numberOfRewardedSubmissions } from "../lib/constants";
import { Bot, GlobalContext, VerifiedBeacon } from "../lib/GlobalState";
import { Submission, submissionDiff } from "../lib/submissions";

export interface MissingBeacon {
  readonly round: number;
}

export type DisplayBeacon = VerifiedBeacon | MissingBeacon;

export function isVerifiedBeacon(beacon: DisplayBeacon): beacon is VerifiedBeacon {
  return typeof (beacon as VerifiedBeacon).diff === "number";
}

interface Props {
  readonly beacon: DisplayBeacon;
}

export function Row({ beacon }: Props): JSX.Element {
  // roundSubmissions is null as long as submissions have not been loaded
  const [roundSubmissions, setRoundSubmissions] = useState<readonly Submission[] | null>(null);
  const { getSubmissions, getBotInfo } = useContext(GlobalContext);
  const [botInfos, setBotInfos] = useState<Map<string, Bot | null>>(new Map());

  useEffect(() => {
    if (roundSubmissions === null) {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundSubmissions, getSubmissions, beacon.round]);

  const roundText = `#${beacon.round}`;
  const split1 = roundText.slice(0, 4);
  const split2 = roundText.slice(4);
  return (
    <Flex w="100%" alignItems="center" gap="2">
      <Square bg={"transparent"} size="100px" borderRadius="lg">
        <VStack>
          <Heading size="lg">
            {split1}
            <br />
            {split2}
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
                return (
                  <Badge
                    key={submission.bot}
                    marginInlineEnd="1"
                    variant="outline"
                    colorScheme={color}
                    title={address}
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
