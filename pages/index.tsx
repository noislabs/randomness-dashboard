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
import { assert } from "@cosmjs/utils";
import type { NextPage } from "next";
import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { GlobalContext } from "../lib/GlobalState";
import { DisplayBeacon, Row } from "../components/Row";

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
    <Container maxW="800px" paddingTop="25px" paddingBottom="25px">
      {loading && (
        <Stack spacing="25px">
          <Skeleton height="150px" />
          <Skeleton height="150px" />
          <Skeleton height="150px" />
          <Skeleton height="150px" />
          <Skeleton height="150px" />
        </Stack>
      )}

      <VStack spacing="25px">
        {displayBeacons.map((beacon) => {
          return <Row key={beacon.round} beacon={beacon} />;
        })}
      </VStack>
    </Container>
  );
};

export default Home;
