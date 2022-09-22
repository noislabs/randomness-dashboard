import {
  Avatar,
  Badge,
  Box,
  Code,
  Container,
  Flex,
  SimpleGrid,
  Skeleton,
  Spacer,
  Square,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { assert } from "@cosmjs/utils";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import { GlobalContext, VerifiedBeacon } from "./GlobalState";
import { approxDateFromTimestamp, noisOracleAddress, querySubmissions } from "./oracle";

assert(process.env.NEXT_PUBLIC_ENDPOINT, "NEXT_PUBLIC_ENDPOINT must be set");
export const rpcEndpoint = process.env.NEXT_PUBLIC_ENDPOINT;

async function loadLatest(itemsPerPage: number, addItems: (items: VerifiedBeacon[]) => void) {
  console.log("Running loadLatest() ...");

  const client = await CosmWasmClient.connect(rpcEndpoint);

  const request = {
    beacons_desc: { start_after: null, limit: itemsPerPage },
  };
  console.log("Query request:", JSON.stringify(request));
  const response = await client.queryContractSmart(noisOracleAddress, request);
  for (const beacon of response.beacons) {
    const { round, randomness, published, verified } = beacon;
    const diff = Number(BigInt(verified) - BigInt(published)) / 1_000_000_000;
    const verifiedBeacon: VerifiedBeacon = {
      round: round,
      randomness: randomness,
      published: approxDateFromTimestamp(published),
      verified: approxDateFromTimestamp(verified),
      diff: diff,
    };
    addItems([verifiedBeacon]);
  }

  // Repeat but with small number of items
  setTimeout(() => loadLatest(10, addItems), 9_000);
}

interface MissingBeacon {
  readonly round: number;
}

type DisplayBeacon = VerifiedBeacon | MissingBeacon;

function isVerifiedBeacon(beacon: DisplayBeacon): beacon is VerifiedBeacon {
  return typeof (beacon as VerifiedBeacon).diff === "number";
}

const Home: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const { state, submissions, addItems } = useContext(GlobalContext);

  useEffect(() => {
    setLoading(true);
    loadLatest(150, addItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [displayBeacons, setBeacons] = useState<DisplayBeacon[]>([]);
  useEffect(() => {
    let out = new Array<DisplayBeacon>();
    for (let r = state.highest; r >= state.lowest; r -= 1) {
      const found = state.beacons.get(r);
      if (found) out.push(found);
      else out.push({ round: r });
    }
    if (out.length !== 0) setLoading(false);
    setBeacons(out);
  }, [state]);

  return (
    <>
      {loading && (
        <Stack>
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
        </Stack>
      )}

      <VStack>
        {displayBeacons.map((beacon) => {
          const diffDisplay = isVerifiedBeacon(beacon) ? `${beacon.diff.toFixed(2)}s` : null;
          const color = isVerifiedBeacon(beacon)
            ? beacon.diff < 2
              ? "green.500"
              : "orange.500"
            : "red.500";
          return (
            <Container key={beacon.round} maxW="800px">
              <Flex alignItems="center" gap="2">
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
                        Published: {beacon.published.toUTCString()}, verified:{" "}
                        {beacon.verified.toUTCString()}
                        <br />
                        {(submissions.get(beacon.round) ?? [])
                          .map((submission) => submission.bot)
                          .join(", ")}
                      </Text>
                    </>
                  ) : (
                    <Text>missing!</Text>
                  )}
                </Box>
                <Spacer />
              </Flex>
            </Container>
          );
        })}
      </VStack>
    </>
  );
};

export default Home;
