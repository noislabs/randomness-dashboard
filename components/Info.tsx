import {
  Badge,
  Box,
  Divider,
  DrawerBody,
  FormLabel,
  Heading,
  Input,
  Stack,
  Table,
  TableContainer,
  TableCaption,
  Td,
  Text,
  Textarea,
  Tfoot,
  Th,
  Tr,
  Thead,
  Tbody,
  Link,
} from "@chakra-ui/react";
import { numberOfRewardedSubmissions } from "../lib/constants";
import { SubmissionBadge } from "./SubmissionBadge";

interface Props {
  allowList: string;
  rpcEndpoint: string;
  drandContractAddress: string;
}

export function Info({ allowList, rpcEndpoint, drandContractAddress }: Props): JSX.Element {
  return (
    <DrawerBody>
      <Stack spacing={6}>
        <Stack spacing={3}>
          <Text>
            This tools shows randomness that was verified on the Nois blockchain. The source of
            randomness is <Link href="https://drand.love/">drand</Link>, a decentralized random
            number generator which produces a so called &quot;random beacon&quot; every 30 seconds.
            Beacons are submitted as transaction to Nois by off-chain bots. Since beacons are
            cryptographically signed by drand, bots cannot influence the randomness. A strong and
            diverse set of bot operator makes the submission of beacons fast and relyable. Bots are
            incentivised for submissions. They receive a rewards if they are registered,
            allow-listed and amongst the first {numberOfRewardedSubmissions} submissions in a given
            round.
          </Text>
          <Heading size="sm">Registration</Heading>
          <Text>
            Bots register themselves by sending a transaction containing their moniker. The bot
            software does this automatically on every start. Once registered, the number of total
            submissions is stored on-chain.
          </Text>
          <Heading size="sm">Allowlist</Heading>
          <Text>
            In order to prevent siblings, a basic allow listing mechanism is used. Bot addresses
            currently allow listed:
          </Text>
          <Textarea value={allowList} readOnly={true} />
          <Heading size="sm">Legend</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Badge style</Th>
                <Th>Description</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>
                  <SubmissionBadge
                    address="nois1enwhnv85g4n99a2kzg8gey22xu6u43l4exqxnp"
                    diff={1.2}
                    eligable={true}
                    index={1}
                    info={{ moniker: "Bob", rounds_added: 54321 }}
                  />
                </Td>
                <Td>
                  Submission of bot &quot;Bob&quot; with 54 thousand total submissions received a
                  reward
                </Td>
              </Tr>
              <Tr>
                <Td>
                  <SubmissionBadge
                    address="nois1enwhnv85g4n99a2kzg8gey22xu6u43l4exqxnp"
                    diff={3.4}
                    eligable={true}
                    index={9}
                    info={{ moniker: "Bob", rounds_added: 54321 }}
                  />
                </Td>
                <Td>
                  &quot;Bob&quot; is registered and allow-listed but not in top{" "}
                  {numberOfRewardedSubmissions} for this round
                </Td>
              </Tr>
              <Tr>
                <Td>
                  <SubmissionBadge
                    address="nois1enwhnv85g4n99a2kzg8gey22xu6u43l4exqxnp"
                    diff={1.2}
                    eligable={false}
                    index={1}
                    info={{ moniker: "Bob", rounds_added: 54321 }}
                  />
                </Td>
                <Td>
                  Submission is valid but bot is not eligable for a reward (not registered or not
                  allow-listed)
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </Stack>
        <Divider />
        <Stack spacing={3}>
          <Heading size="sm">Dashboard settings</Heading>
          <Box>
            <FormLabel htmlFor="rpcEndpoint">RPC endpoint</FormLabel>
            <Input id="rpcEndpoint" value={rpcEndpoint} readOnly={true} />
          </Box>
          <Box>
            <FormLabel htmlFor="drandContractAddress">Drand contract address</FormLabel>
            <Input id="drandContractAddress" value={drandContractAddress} readOnly={true} />
          </Box>
        </Stack>
      </Stack>
    </DrawerBody>
  );
}
