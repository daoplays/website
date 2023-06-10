import React, { useMemo } from "react";
import { ChakraProvider, theme } from "@chakra-ui/react";

import * as web3 from "@solana/web3.js";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { GenSeed } from "./Gen_Seeds";
import { AirDropApp } from "./AirDrop";
require("@solana/wallet-adapter-react-ui/styles.css");

function RandomApp() {
    return (
        <>
            <AirDropApp />
            <GenSeed />
        </>
    );
}

export function SeedExample() {
    const network = "devnet";
    const endpoint = web3.clusterApiUrl(network);
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()], []);

    return (
        <ChakraProvider theme={theme}>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <RandomApp />
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </ChakraProvider>
    );
}
