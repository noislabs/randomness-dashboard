import {
  Button,
  Container,
  Drawer,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  IconButton,
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
import { noisDrandAddress, rpcEndpoint } from "../lib/constants";
import { Rows } from "../components/Rows";
import { Info } from "../components/Info";
import { VerifiedBeacon } from "../lib/beacons";

const Home: NextPage = () => {
  const router = useRouter();
  const [displayBeacons, setBeacons] = useState<VerifiedBeacon[]>([]);
  const { state, initialBeaconsLoading } = useContext(GlobalContext);
  const [hightlighted, setHighlighted] = useState<string | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = React.useRef(null);

  useEffect(() => {
    let out = new Array<VerifiedBeacon>();
    for (let round = state.highest; round >= state.lowest; round -= 1) {
      const found = state.beacons.get(round);
      if (found) {
        out.push(found);
      }
    }
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
        <Drawer
          size="md"
          isOpen={isOpen}
          placement="right"
          onClose={onClose}
          finalFocusRef={btnRef}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Randomness Info</DrawerHeader>

            <Info rpcEndpoint={rpcEndpoint} drandContractAddress={noisDrandAddress} />

            <DrawerFooter>
              <Button variant="outline" mr={3} onClick={onClose}>
                Okay
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </HStack>
      <Container maxW="800px" paddingTop="5px" paddingBottom="25px">
        {initialBeaconsLoading && (
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
