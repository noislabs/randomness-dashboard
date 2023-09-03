import { Box, Code, Flex, Heading, Link, Spacer, Square, Text, VStack } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import NextLink from "next/link";
import { Bot, GlobalContext } from "../lib/GlobalState";
import { Submission, submissionDiff } from "../lib/submissions";
import { VerifiedBeacon } from "../lib/beacons";
import { SubmissionBadge } from "./SubmissionBadge";

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
  const { submissions, getSubmissions, getBotInfo, allowlist } = useContext(GlobalContext);
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

  return (
    <Flex w="100%" alignItems="center" gap="2">
      <Square bg={"transparent"} size="100px" borderRadius="lg">
        <VStack>
          <Heading size="lg" style={{ maxWidth: "2.8em", overflowWrap: "anywhere" }}>
            <Link as={NextLink} href={`/rounds/${beacon.round}`}>
              #{beacon.round}
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
                const info = botInfos.get(submission.bot) ?? null;
                const isRegistered = !!info;
                const isAllowlisted = allowlist.includes(address);
                const isEligable = isRegistered && isAllowlisted;
                const highlighted = address === highlightedAddress;
                return (
                  <SubmissionBadge
                    key={address}
                    address={address}
                    diff={diff}
                    eligable={isEligable}
                    highlighted={highlighted}
                    index={index}
                    info={info}
                    onClick={(address) => onHighlightAddress(highlighted ? null : address)}
                  />
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
