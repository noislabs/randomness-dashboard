import {
  Box,
  Center,
  Code,
  Container,
  Divider,
  Flex,
  ListItem,
  OrderedList,
  Spacer,
  Square,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
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
  const [roundSubmissions, setRoundSubmissions] = useState<readonly Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const { submissions, getSubmissions, getBotInfo } = useContext(GlobalContext);
  const [botInfos, setBotInfos] = useState<Map<string, Bot | null>>(new Map());

  useEffect(() => {
    for (const sub of roundSubmissions) {
      const address = sub.bot;
      getBotInfo(address).then(
        (bot) => {
          // console.log("Found bot", bot, "for", address);
          setBotInfos((current) => {
            current.set(address, bot);
            return current;
          });
        },
        (err) => console.error(err),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundSubmissions]);

  useEffect(() => {
    const loaded = submissions.get(beacon.round);
    if (loaded) {
      setRoundSubmissions(loaded);
    } else {
      if (!loading) {
        setLoading(true);
        getSubmissions(beacon.round)
          .then(
            (submissions) => setRoundSubmissions(submissions),
            (err) => console.error(err),
          )
          .finally(() => setLoading(false));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions, getSubmissions, beacon.round]);

  const diffDisplay = isVerifiedBeacon(beacon) ? `${beacon.diff.toFixed(2)}s` : null;
  const color = isVerifiedBeacon(beacon)
    ? beacon.diff < 2
      ? "green.500"
      : "orange.500"
    : "red.500";

  return (
    <Flex w="100%" alignItems="center" gap="2">
      <Square bg={color} size="90px" borderRadius="lg">
        <VStack>
          <Text>#{beacon.round}</Text>
          {diffDisplay && <Text>{diffDisplay}</Text>}
        </VStack>
      </Square>
      <Box ml="3">
        {isVerifiedBeacon(beacon) ? (
          <>
            <Text>Randomness</Text>
            <Text>
              <Code>{beacon.randomness}</Code>
            </Text>
            <Text fontSize="sm">
              Published: {beacon.published.toUTCString()}, verified: {beacon.verified.toUTCString()}
              <br />
            </Text>
            <OrderedList>
              {roundSubmissions.map((submission) => {
                const diff = submissionDiff(submission, beacon);
                const moniker = botInfos.get(submission.bot);
                return (
                  <ListItem key={submission.bot}>
                    {moniker?.moniker ?? submission.bot} ({diff.toFixed(2)}s)
                  </ListItem>
                );
              })}
            </OrderedList>
          </>
        ) : (
          <Text>missing!</Text>
        )}
      </Box>
      <Spacer />
    </Flex>
  );
}
