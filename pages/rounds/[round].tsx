import { Container, Heading, Skeleton, Stack } from "@chakra-ui/react";
import { assert } from "@cosmjs/utils";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { GlobalContext, VerifiedBeacon } from "../../lib/GlobalState";

const Round: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const [beacon, setBeacon] = useState<VerifiedBeacon | undefined>();
  const { state } = useContext(GlobalContext);

  const router = useRouter();
  const { round } = router.query;
  assert(!Array.isArray(round));

  useEffect(() => {
    setLoading(true);

    const beacon = state.beacons.get(parseInt(round ?? "0", 10));
    setBeacon(beacon);

    setLoading(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
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

      <Heading size="lg">Round #{round}</Heading>
      <div>{beacon ? JSON.stringify(beacon, null, 2) : <>Not found</>}</div>
    </Container>
  );
};

export default Round;
