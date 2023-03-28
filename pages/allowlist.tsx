import {
  Container,
  Heading,
  HStack,
  IconButton,
  Link,
  Skeleton,
  Spacer,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { NextPage } from "next";
import Head from "next/head";
import { useContext, useEffect, useState } from "react";
import { FaHome } from "react-icons/fa";
import NextLink from "next/link";

import { Bot, GlobalContext } from "../lib/GlobalState";
import { explorerAccount } from "../lib/constants";

const Allowlist: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const { ready, getBots, allowList } = useContext(GlobalContext);
  const [bots, setBots] = useState<Bot[]>([]);

  useEffect(() => {
    if (!ready) return;

    setLoading(true);

    getBots()
      .then(
        (bots) => setBots(bots),
        (err) => console.error(err),
      )
      .finally(() => setLoading(false));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  function findMoniker(addres: string): string | undefined {
    return bots.find((b) => b.address == addres)?.moniker;
  }

  return (
    <>
      <Head>
        <title>Allow-listed bots</title>
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
          <Heading size="lg">Allowlist</Heading>
          <Text>
            Bot addresses must be allowlisted in order to be eligible for rewards. However, the
            submission of beacons is permissionless.
          </Text>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>#</Th>
                  <Th>Address</Th>
                  <Th>Moniker</Th>
                </Tr>
              </Thead>
              <Tbody>
                {allowList.map((address, index) => (
                  <Tr key={address}>
                    <Td>{index + 1}</Td>
                    <Td>
                      <Link title={address} href={explorerAccount(address)}>
                        {address}
                      </Link>
                    </Td>
                    <Td>{findMoniker(address) ?? <Text as="i">unregistered</Text>}</Td>
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

export default Allowlist;
