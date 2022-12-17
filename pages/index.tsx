import {
  Avatar,
  Badge,
  Box,
  Button,
  Code,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Skeleton,
  Spacer,
  Stack,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import Head from "next/head";
import type { NextPage } from "next";
import React, { useContext, useEffect, useState } from "react";
import { FaInfoCircle } from "react-icons/fa";
import { useRouter } from "next/router";

import { GlobalContext } from "../lib/GlobalState";
import { DisplayBeacon, Row } from "../components/Row";
import { noisOracleAddress, rpcEndpoint } from "../lib/constants";
import { Rows } from "../components/Rows";

const Home: NextPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [displayBeacons, setBeacons] = useState<DisplayBeacon[]>([]);
  const { state } = useContext(GlobalContext);
  const [hightlighted, setHighlighted] = useState<string | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = React.useRef(null);

  useEffect(() => {
    setLoading(true);
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

  useEffect(() => {
    const h = typeof router.query.highlighted === "string" ? router.query.highlighted : null;
    setHighlighted(h);
  }, [router.query.highlighted]);

  function setHighlightedAndUpdateUrl(address: string | null) {
    setHighlighted(address);
    const href = address ? `/?highlighted=${address}` : `/`;
    router.push(href, href, { shallow: true });
  }

  return (
    <>
      <Head>
        <title>Nois Randomness Dashboard</title>
      </Head>
      <HStack padding="20px" direction="row-reverse">
        <Spacer />
        <IconButton
          colorScheme="gray"
          aria-label="Info"
          size="md"
          icon={<FaInfoCircle />}
          ref={btnRef}
          onClick={onOpen}
        />
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} finalFocusRef={btnRef}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Dashboard Info</DrawerHeader>

            <DrawerBody>
              <Stack spacing="24px">
                <Box>
                  <FormLabel htmlFor="rpcEndpoint">RPC endpoint</FormLabel>
                  <Input id="rpcEndpoint" value={rpcEndpoint} readOnly={true} />
                </Box>
                <Box>
                  <FormLabel htmlFor="noisOracleAddress">Oracle contract address</FormLabel>
                  <Input id="noisOracleAddress" value={noisOracleAddress} readOnly={true} />
                </Box>
              </Stack>
            </DrawerBody>

            <DrawerFooter>
              <Button variant="outline" mr={3} onClick={onClose}>
                Okay
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
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

        <VStack spacing="25px">
          <Rows
            beacons={displayBeacons}
            highlightedAddress={hightlighted}
            onHighlightAddress={setHighlightedAndUpdateUrl}
          />
        </VStack>
      </Container>
    </>
  );
};

export default Home;
