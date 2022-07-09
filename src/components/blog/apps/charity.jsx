import React, { useCallback, useEffect, useState, useMemo } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {Card, Image, Table} from 'react-bootstrap';
import {ChakraProvider, theme, Box, HStack, Flex, Button, Spacer, Text, VStack, Center,
    useToast, FormControl, Input
 } from '@chakra-ui/react';
import { isMobile } from "react-device-detect";
import { TwitchEmbed, TwitchChat, TwitchClip, TwitchPlayer } from 'react-twitch-embed';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { struct, u64, u8 } from "@project-serum/borsh";
import BN from "bn.js";
import Plot from 'react-plotly.js';


import * as web3 from '@solana/web3.js';

import {
    ACCOUNT_SIZE,
    createAssociatedTokenAccountInstruction,
    createInitializeAccountInstruction,
    getAssociatedTokenAddress,
    getMinimumBalanceForRentExemptAccount,
    TOKEN_PROGRAM_ID,
  } from "@solana/spl-token";
  
import {
    ConnectionProvider,
    WalletProvider,
    useConnection,
    useWallet,
} from '@solana/wallet-adapter-react';
import {
    getPhantomWallet,
    getSolflareWallet,
    getSolletWallet,
    getSolletExtensionWallet,
} from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletMultiButton,
    WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';
import { publicKey } from '@project-serum/borsh';
require('@solana/wallet-adapter-react-ui/styles.css');



function WalletNotConnected() 
{
    return (
        <Box marginBottom  = "10px">
            <HStack spacing='24px'>
                <Box>
                    <WalletMultiButton />
                </Box>
                <Box>
                    Connect a wallet to Play!
                </Box>
            </HStack>
        </Box>
    );
}

function WalletConnected(publicKey) 
{

    var pub_string = String(publicKey["publicKey"]);
    var token_string = "";
    if(publicKey["tokenkey"]) { token_string = String(publicKey["tokenkey"])};

    return (
        <Box marginBottom  = "10px" marginTop = "20px">
            <HStack spacing='24px'>
                <Box>
                    <WalletDisconnectButton />
                </Box>
                <Box>
                    
                </Box>
                <VStack>
                <Box>
                SOL Account: {pub_string}
                </Box>
                <Box>
                  Token Account:  {token_string}
                </Box>
                </VStack>
            </HStack>
        </Box>
    );
}


const PokemonInstruction = {
    press_button : 0
}

const ButtonTypes = {
    A : 0,
    B : 1,
    Up : 2,
    Down : 3,
    Left : 4,
    Right : 5,
    Start : 6,
    Select : 7
}

const ButtonData = struct([
    u8("instruction"),
    u8("button"),
    u64("amount"),
]);




  let intervalId;
  function useSolanaAccount() 
  {
      const [account, setAccount] = useState(null);
      const [token_pubkey, setTokenAccount] = useState(null);
      const [token_amount, setTokenAmount] = useState(null);


      const { connection } = useConnection();
      const wallet = useWallet();
  
      const init = useCallback(async () => 
      {       
          if (wallet.publicKey) {
              let acc = await connection.getAccountInfo(wallet.publicKey);
              setAccount(acc);

                const mintAccount = new web3.PublicKey("CisHceikLeKxYiUqgDVduw2py2GEK71FTRykXGdwf22h");
                let token_pubkey = await getAssociatedTokenAddress(
                    mintAccount, // mint
                    wallet.publicKey, // owner
                    false // allow owner off curve
                );
                setTokenAccount(token_pubkey);

                    let aWalletMyTokenBalance = await connection.getTokenAccountBalance(
                        token_pubkey
                    );
                        let token_amount = aWalletMyTokenBalance["value"].amount;
                        let decimals = aWalletMyTokenBalance["value"].decimals;
                        let token_decs = token_amount / 10.0**decimals;
                        setTokenAmount(token_decs)
                    
                
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
  
      return { account, token_pubkey, token_amount };
  }
  
  export function AirDropApp() 
  {
      const wallet = useWallet();
      const { connection } = useConnection();
      const { account, token_pubkey, token_amount } = useSolanaAccount();

      
  
      return (
          <Box textAlign="center" fontSize="l">
              {wallet.publicKey &&  <WalletConnected publicKey={wallet.publicKey} tokenkey={token_pubkey}/>}
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
                          <FormControl id="tokenbalance" maxWidth={"250px"}>
                              <Input
                                  type="text"
                                  value={
                                    token_amount
                                      ? "Balance: " + token_amount + ' DPP'
                                      : 'Balance: Loading..'
                                  }
                                  readOnly
                              />
                          </FormControl>
                      </HStack>
                  </Box>
              )}
              {!wallet.publicKey && <WalletNotConnected />}
  
          </Box>
      );
  }

export function CharityDapp()
{
    const network = 'devnet';
    const endpoint = web3.clusterApiUrl(network);
    const wallets = useMemo(() => 
    [
        getPhantomWallet(),
        getSolflareWallet(),
        getSolletWallet({ network }),
        getSolletExtensionWallet({ network }),
    ],
    [network]
    );

    return(
        <ChakraProvider theme={theme}>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>

                        <AirDropApp/>

                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </ChakraProvider>

    );
}