import {
  Code,
  Container,
  Heading,
  HStack,
  IconButton,
  Link,
  Skeleton,
  Spacer,
  Stack,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { assert } from "@cosmjs/utils";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { FaHome } from "react-icons/fa";
import NextLink from "next/link";

import { Bot, GlobalContext } from "../lib/GlobalState";
import { explorerAccount } from "../lib/constants";

export function ellideMiddle(str: string, maxOutLen: number): string {
  if (str.length <= maxOutLen) {
    return str;
  }
  const ellide = "…";
  const frontLen = Math.ceil((maxOutLen - ellide.length) / 2);
  const tailLen = Math.floor((maxOutLen - ellide.length) / 2);
  return str.slice(0, frontLen) + ellide + str.slice(str.length - tailLen, str.length);
}

const Bots: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const { ready, getBots, allowList } = useContext(GlobalContext);
  const [bots, setBots] = useState<Bot[]>([]);

  useEffect(() => {
    if (!ready) return;

    setLoading(true);

    getBots()
      .then(
        (bots) => {
          bots.sort((a, b) => b.rounds_added - a.rounds_added); // sort by rounds added, descending
          setBots(bots);
        },
        (err) => console.error(err),
      )
      .finally(() => setLoading(false));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <>
      <Head>
        <title>Registered bots</title>
      </Head>
      <HStack padding="20px" direction="row">
        <NextLink href="/">
          <IconButton colorScheme="gray" aria-label="Home" size="md" icon={<FaHome />} />
        </NextLink>
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
          <Heading size="lg">Leaderboard</Heading>
          <Text>All registered bots orderd by number of submissions.</Text>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>#</Th>
                  <Th>Moniker</Th>
                  <Th>Address</Th>
                  <Th>Allow&shy;listed</Th>
                  <Th isNumeric>Beacons added</Th>
                </Tr>
              </Thead>
              <Tbody>
                {bots.map((bot, index) => (
                  <Tr key={bot.address}>
                    <Td>{index + 1}</Td>
                    <Td>{bot.moniker}</Td>
                    <Td>
                      <Link title={bot.address} href={explorerAccount(bot.address)}>
                        {ellideMiddle(bot.address, 15)}
                      </Link>
                    </Td>
                    <Td>{allowList.includes(bot.address) ? "✅" : ""}</Td>
                    <Td>{bot.rounds_added}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Stack>
      </Container>
    </>
  );
};

export default Bots;
