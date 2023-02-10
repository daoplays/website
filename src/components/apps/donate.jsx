import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
    ChakraProvider,
    Box,
    Button,
    useToast,
    HStack,
    theme,
    Input,
    FormControl
} from '@chakra-ui/react';

import * as web3 from '@solana/web3.js';
import {
    ConnectionProvider,
    WalletProvider,
    useConnection,
    useWallet,
} from '@solana/wallet-adapter-react';
import {
    WalletModalProvider,
    WalletMultiButton,
    WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css');

// derived from https://learn.figment.io/tutorials/chakra-ui-with-solana-dapps

export function WalletNotConnected() 
{
    return (
        <Box marginBottom  = "10px">
            <HStack spacing='24px'>
                <Box>
                    <WalletMultiButton />
                </Box>
                <Box>
                    Connect a wallet to get started!
                </Box>
            </HStack>
        </Box>
    );
}

export function WalletConnected(publicKey) 
{

    var pub_string = String(publicKey["publicKey"]);
    return (
        <Box marginBottom  = "10px">
            <HStack spacing='24px'>
                <Box>
                    <WalletDisconnectButton />
                </Box>
                <Box>
                    Connected:
                </Box>
                <Box>
                    {pub_string}
                </Box>
            </HStack>
        </Box>
    );
}

let intervalId;
function useSolanaAccount() 
{
    const [account, setAccount] = useState(null);
    const { connection } = useConnection();
    const wallet = useWallet();

    const init = useCallback(async () => 
    {       
        if (wallet.publicKey) {
            let acc = await connection.getAccountInfo(wallet.publicKey);
            setAccount(acc);
        }

    }, [wallet, connection]);

    useEffect(() => 
    {
        if (wallet.publicKey && !intervalId) {
            intervalId = setInterval(init, 1000);
        }
        else{
            clearInterval(intervalId);
            intervalId = null;
        }
    }, [init, wallet]);

    return { account };
}

export function AirDropApp() 
{
    const { connection } = useConnection();
    const wallet = useWallet();
    const { account } = useSolanaAccount();
    const toast = useToast();
    const [airdropProcessing, setAirdropProcessing] = useState(false);

    const getAirdrop = useCallback(async () => {
    setAirdropProcessing(true);
    try {
        var airdropSignature = await connection.requestAirdrop(
            wallet.publicKey,
            web3.LAMPORTS_PER_SOL
        );
        await connection.confirmTransaction(airdropSignature);
    } catch (error) {
        console.log(error);
        toast({ title: 'Airdrop failed', description: 'unknown error' });
    }
    setAirdropProcessing(false);
}, [toast, wallet, connection]);

    return (
        <Box textAlign="center" fontSize="l">
            {wallet.publicKey &&  <WalletConnected publicKey={wallet.publicKey} />}
            {wallet.publicKey && (
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
                </Box>
            )}
            {!wallet.publicKey && <WalletNotConnected />}

        </Box>
    );
}

export function Donate() {
    const network = 'devnet';
    const endpoint = web3.clusterApiUrl(network);
    const wallets = useMemo(() => 
    [
    ],
    []
  );

    return (
        <ChakraProvider theme={theme}>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <AirDropApp />
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </ChakraProvider>
    );
}