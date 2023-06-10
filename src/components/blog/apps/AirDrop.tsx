import React, { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { ChakraProvider, Box, HStack, theme, Text } from "@chakra-ui/react";

import * as web3 from "@solana/web3.js";
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider, WalletMultiButton, WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
require("@solana/wallet-adapter-react-ui/styles.css");

// derived from https://learn.figment.io/tutorials/chakra-ui-with-solana-dapps

export function WalletNotConnected() {
    return (
        <Box marginBottom="10px">
            <HStack spacing="24px">
                <Box>
                    <WalletMultiButton />
                </Box>
                <Box>Connect a wallet to get started!</Box>
            </HStack>
        </Box>
    );
}

export function WalletConnected({ publicKey }: { publicKey: String }) {
    return (
        <Box marginBottom="10px">
            <HStack spacing="24px">
                <Box>
                    <WalletDisconnectButton />
                </Box>
                <Box>Connected:</Box>
                <Box>{publicKey}</Box>
            </HStack>
        </Box>
    );
}

export function AirDropApp() {
    const check_balance = useRef<boolean>(true);
    const balance_interval = useRef<number | null>(null);
    const [balance, setBalance] = useState<number>(0);

    const { connection } = useConnection();
    const wallet = useWallet();
    const [airdropProcessing, setAirdropProcessing] = useState(false);

    const get_balance = useCallback(async () => {
        if (!check_balance.current || wallet.publicKey === null) return;

        let acc = await connection.getAccountInfo(wallet.publicKey);

        if (acc == null) return;

        if (acc.lamports / web3.LAMPORTS_PER_SOL === balance) return;

        setBalance(acc.lamports / web3.LAMPORTS_PER_SOL);
        check_balance.current = false;
    }, [wallet, connection, balance]);

    useEffect(() => {
        if (balance_interval.current === null) {
            balance_interval.current = window.setInterval(get_balance, 1000);
        } else {
            window.clearInterval(balance_interval.current);
            balance_interval.current = null;
        }
        // here's the cleanup function
        return () => {
            if (balance_interval.current !== null) {
                window.clearInterval(balance_interval.current);
                balance_interval.current = null;
            }
        };
    }, [get_balance]);

    const getAirdrop = useCallback(async () => {
        if (wallet.publicKey === null) return;

        setAirdropProcessing(true);
        try {
            var airdropSignature = await connection.requestAirdrop(wallet.publicKey, web3.LAMPORTS_PER_SOL);
            console.log(airdropSignature);
            await connection.confirmTransaction(airdropSignature);
        } catch (error) {
            console.log(error);
            setAirdropProcessing(false);
            return;
        }
        check_balance.current = true;
        setAirdropProcessing(false);
    }, [wallet, connection]);

    return (
        <Box textAlign="center" fontSize="l">
            {wallet.publicKey && <WalletConnected publicKey={wallet.publicKey.toString()} />}
            {wallet.publicKey && (
                <Box>
                    <HStack alignItems="center">
                        <Text mb="0"> {balance > 0 ? "Balance: " + balance + " SOL" : "Balance: Loading.."} </Text>

                        <Box borderWidth="1px" borderColor="black" as="button" onClick={airdropProcessing ? undefined : getAirdrop}>
                            Airdrop 1
                        </Box>
                    </HStack>
                </Box>
            )}
            {!wallet.publicKey && <WalletNotConnected />}
        </Box>
    );
}

export function AirDrop() {
    const network = "devnet";
    const endpoint = web3.clusterApiUrl(network);
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()], []);

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
