import {
  Code,
  Container,
  Heading,
  HStack,
  IconButton,
  Skeleton,
  Spacer,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Link,
} from "@chakra-ui/react";
import { assert } from "@cosmjs/utils";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { FaHome } from "react-icons/fa";

import { Bot, GlobalContext } from "../../lib/GlobalState";
import { VerifiedBeacon } from "../../lib/beacons";
import { Submission, submissionDiff } from "../../lib/submissions";
import { explorerAccount } from "../../lib/constants";
import { ellideMiddle } from "../../lib/ellide";
import { Tx } from "../../components/Tx";
import { Reward } from "../../components/Reward";

const Round: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const [beacon, setBeacon] = useState<VerifiedBeacon | null | undefined>(undefined);
  const { ready, getBeacon, getSubmissions, getBotInfo, allowList } = useContext(GlobalContext);
  const [roundSubmissions, setRoundSubmissions] = useState<readonly Submission[] | null>(null);
  const [botInfos, setBotInfos] = useState<Map<string, Bot | null>>(new Map());

  const router = useRouter();
  const { round } = router.query;
  assert(!Array.isArray(round));

  useEffect(() => {
    if (!ready) return;

    setLoading(true);

    if (!round) return; // come back with a proper round value

    const numRound = parseInt(round, 10);
    getBeacon(numRound)
      .then(
        (beacon) => {
          setBeacon(beacon);
        },
        (err) => console.error(err),
      )
      .finally(() => setLoading(false));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, round]);

  useEffect(() => {
    if (!beacon) return;

    getSubmissions(beacon.round).then(
      (s) => {
        const addresses = s.map((sub) => sub.bot);
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
        setRoundSubmissions(s);
      },
      (err) => console.error(err),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beacon]);

  return (
    <>
      <Head>
        <title>Nois Oracle Round #{round}</title>
      </Head>
      <HStack padding="20px" direction="row">
        <Link href="/">
          <IconButton colorScheme="gray" aria-label="Home" size="md" icon={<FaHome />} />
        </Link>
        <Spacer />
      </HStack>
      <Container maxW="800px" paddingTop="5px" paddingBottom="25px">
        {loading && (
          <Stack spacing="25px">
            <Skeleton height="150px" />
            <Skeleton height="150px" />
            <Skeleton height="150px" />
            <Skeleton height="150px" />
            <Skeleton height="150px" />
          </Stack>
        )}

        <Stack>
          <Heading size="lg">Round #{round}</Heading>
          {beacon ? (
            <>
              <Text>
                Published: {beacon.published.toUTCString()}
                <br />
                Verified: {beacon.verified.toUTCString()} ({beacon.diff.toFixed(1)}s)
                <br />
                <Code>{beacon.randomness}</Code>
              </Text>
              <Heading size="md">Submissions ({roundSubmissions?.length ?? "–"})</Heading>

              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>#</Th>
                      <Th>Delay</Th>
                      <Th>Moniker</Th>
                      <Th>Address</Th>
                      <Th>Reward</Th>
                      <Th>Transaction</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {(roundSubmissions ?? []).map((submission, index) => {
                      const diff = submissionDiff(submission, beacon);
                      const address = submission.bot;
                      const info = botInfos.get(submission.bot) ?? null;
                      return (
                        <Tr key={address}>
                          <Td>{index + 1}</Td>
                          <Td>{diff.toFixed(1)}s</Td>
                          <Td>{info?.moniker}</Td>
                          <Td>
                            <Link title={address} href={explorerAccount(address)}>
                              {ellideMiddle(address, 12)}
                            </Link>
                          </Td>
                          <Td>
                            <Reward
                              height={submission.height}
                              txIndex={submission.tx_index ?? NaN}
                            />
                          </Td>
                          <Td>
                            <Tx
                              height={submission.height}
                              txIndex={submission.tx_index ?? NaN}
                              maxLen={9}
                            />
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Text>Not found</Text>
          )}
        </Stack>
      </Container>
    </>
  );
};

export default Round;
