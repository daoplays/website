import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ChakraProvider,
  Box,
  VStack,
  Button,
  useToast,
  HStack,
  theme,
  Input,
} from '@chakra-ui/react';
import { FormControl } from '@chakra-ui/react';

import * as web3 from '@solana/web3.js';
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import { GenSeed } from './Gen_Seeds';
import {WalletConnected, WalletNotConnected} from './AirDrop';
require('@solana/wallet-adapter-react-ui/styles.css');


let intervalId;
function useSolanaAccount() {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const init = useCallback(async () => {
    if (publicKey) {
      let acc = await connection.getAccountInfo(publicKey);
      setAccount(acc);
      let transactions = await connection.getConfirmedSignaturesForAddress2(
        publicKey,
        {
          limit: 10,
        }
      );
      setTransactions(transactions);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (publicKey && !intervalId) {
        intervalId = setInterval(init, 1000);
    }
    else{
        clearInterval(intervalId);
        intervalId = null;
    }
  }, [init, publicKey]);

  return { account, transactions };
}

function RandomApp() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { account } = useSolanaAccount();
  const toast = useToast();
  const [airdropProcessing, setAirdropProcessing] = useState(false);

  const getAirdrop = useCallback(async () => {
    setAirdropProcessing(true);
    try {
      var airdropSignature = await connection.requestAirdrop(
        publicKey,
        web3.LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdropSignature);
    } catch (error) {
      console.log(error);
      toast({ title: 'Airdrop failed', description: 'unknown error' });
    }
    setAirdropProcessing(false);
  }, [toast, publicKey, connection]);

  return (
    <Box textAlign="center" fontSize="l">



              {publicKey &&  <WalletConnected publicKey={publicKey} />}
              {publicKey && (
                <Box>
                  <HStack marginBottom  = "10px" >
                    <FormControl id="balance" maxWidth={"250px"}>
                      <Input
                        type="text"
                        value={
                          account
                            ? "Balance: " + account.lamports / web3.LAMPORTS_PER_SOL + ' SOL'
                            : 'Balance: Loading..'
                        }
                        readOnly
                      />
                    </FormControl>

                    <Button size='md' onClick={getAirdrop} isLoading={airdropProcessing}>
                      Airdrop 1
                    </Button>
                    </HStack>
                  <VStack>
                    <GenSeed />
                  </VStack>
                  </Box>
              )}
              {!publicKey && <WalletNotConnected />}

    </Box>
  );
}

export function SeedExample() {
  const network = 'devnet';
  const endpoint = web3.clusterApiUrl(network);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()], []);

    return (
        <ChakraProvider theme={theme}>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <RandomApp/>
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </ChakraProvider>
    );
}