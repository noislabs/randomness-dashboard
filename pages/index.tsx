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
  Flex,
  FormLabel,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Skeleton,
  Spacer,
  Square,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { assert } from "@cosmjs/utils";
import type { NextPage } from "next";
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { FaInfoCircle } from "react-icons/fa";

import { GlobalContext } from "../lib/GlobalState";
import { DisplayBeacon, Row } from "../components/Row";
import { noisOracleAddress, rpcEndpoint } from "../lib/constants";
import { Rows } from "../components/Rows";

const Home: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const [displayBeacons, setBeacons] = useState<DisplayBeacon[]>([]);
  const { state } = useContext(GlobalContext);
  const [hightlighted, setHighlighted] = useState<string | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = React.useRef(null);

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
            onHighlightAddress={setHighlighted}
          />
        </VStack>
      </Container>
    </>
  );
};

export default Home;
