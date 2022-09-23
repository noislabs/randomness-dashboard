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
import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { GlobalContext } from "./GlobalState";
import { DisplayBeacon, Row } from "./Row";

assert(process.env.NEXT_PUBLIC_ENDPOINT, "NEXT_PUBLIC_ENDPOINT must be set");
export const rpcEndpoint = process.env.NEXT_PUBLIC_ENDPOINT;

const Home: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const [displayBeacons, setBeacons] = useState<DisplayBeacon[]>([]);
  const { state } = useContext(GlobalContext);

  useEffect(() => {
    setLoading(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
