import {
  Code,
  Container,
  Heading,
  HStack,
  IconButton,
  Skeleton,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react";
import { assert } from "@cosmjs/utils";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { useContext, useEffect, useState } from "react";

import { GlobalContext } from "../../lib/GlobalState";
import { VerifiedBeacon } from "../../lib/beacons";
import Link from "next/link";

const Round: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const [beacon, setBeacon] = useState<VerifiedBeacon | null | undefined>(undefined);
  const { ready, getBeacon } = useContext(GlobalContext);

  const router = useRouter();
  const { round } = router.query;
  assert(!Array.isArray(round));

  useEffect(() => {
    if (!ready) return;

    setLoading(true);

    const numRound = parseInt(round ?? "0", 10);
    getBeacon(numRound)
      .then(
        (beacon) => {
          setBeacon(beacon);
        },
        (err) => console.error(err),
      )
      .finally(() => setLoading(false));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <Container maxW="800px" paddingTop="5px" paddingBottom="25px">
      <HStack paddingTop="20px" paddingBottom="20px" direction="row">
        <Link href="/">
          <IconButton
            colorScheme="gray"
            aria-label="Home"
            size="md"
            icon={<ArrowBackIcon />}
          />
        </Link>
        <Spacer />
      </HStack>

      {loading && (
        <Stack spacing="25px">
          <Skeleton height="150px" />
          <Skeleton height="150px" />
          <Skeleton height="150px" />
          <Skeleton height="150px" />
          <Skeleton height="150px" />
        </Stack>
      )}

      <Heading size="lg">Round #{round}</Heading>
      <div>
        {beacon ? (
          <Text>
            Published: {beacon.published.toUTCString()}
            <br />
            Verified: {beacon.verified.toUTCString()} ({beacon.diff.toFixed(1)}s)
            <br />
            <Code>{beacon.randomness}</Code>
          </Text>
        ) : (
          <>Not found</>
        )}
      </div>
    </Container>
  );
};

export default Round;
