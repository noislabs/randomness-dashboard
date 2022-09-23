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
import { GlobalContext, VerifiedBeacon } from "./GlobalState";
import { approxDateFromTimestamp, noisOracleAddress } from "./oracle";
import { DisplayBeacon, Row } from "./Row";

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

const Home: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const { state, addItems } = useContext(GlobalContext);

  useEffect(() => {
    setLoading(true);
    loadLatest(60, addItems);
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
          return <Row key={beacon.round} beacon={beacon} />;
        })}
      </VStack>
    </>
  );
};

export default Home;
