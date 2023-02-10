import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
    ChakraProvider,
    Box,
    Button,
    HStack,
    theme,
    Input,
    FormControl
} from '@chakra-ui/react';

import bs58 from "bs58";

import { SystemProgram, LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import {
    WalletProvider,
    useWallet,
} from '@solana/wallet-adapter-react';
import {
    WalletModalProvider,
    WalletMultiButton,
    WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css');

let have_account_info = false;
export function WalletNotConnected() 
{
    have_account_info = false;
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
    const [lamports, setLamports] = useState(null);
    const wallet = useWallet();

    const init = useCallback(async () => 
    {       
        if (!have_account_info && wallet.publicKey) {
            const url = `/.netlify/functions/solana_dev?function_name=getAccountInfo&p1=`+wallet.publicKey.toString();
            const program_data_result = await fetch(url).then((res) => res.json());
            let lamports_amount = program_data_result["result"]["value"]["lamports"];
            setLamports(lamports_amount);
            have_account_info = true;
        }

    }, [wallet]);

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

    return { lamports };
}

function sleep(time){
    return new Promise((resolve)=>setTimeout(resolve,time))
}

export function AirDropApp() 
{
    const wallet = useWallet();
    const { lamports } = useSolanaAccount();
    const [airdropProcessing, setAirDropProcessing] = useState(false);
    const [transactionProcessing, setTransactionProcessing] = useState(false);

    const getAirdrop = useCallback(async () => {
        setAirDropProcessing(true);
        try {

            const url = `/.netlify/functions/solana_dev?function_name=requestAirdrop&p1=`+wallet.publicKey.toString()+`&p2=`+LAMPORTS_PER_SOL.toString();
            const airdrop_result = await fetch(url).then((res) => res.json());
            var airdropSignature = airdrop_result["result"];      
            console.log(airdrop_result);
            // we just wait 20 seconds which should be long enough for the transaction to be finalized 
            await sleep(20000);

            const signature_url = `/.netlify/functions/sig_status_dev?function_name=getSignatureStatuses&p1=`+airdropSignature;
            const signature_result = await fetch(signature_url).then((res) => res.json());
            const confirmation_status = signature_result["result"]["value"][0]["confirmationStatus"];

            if (confirmation_status === "finalized")
                have_account_info = false;

        } catch (error) {
            console.log(error);
        }
        setAirDropProcessing(false);

    }, [wallet]);

    const handle_transaction = useCallback( async () => 
    {
        const daoplays_key = new PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");
        const transfer_instruction = SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: daoplays_key,
            lamports: 0.1 * LAMPORTS_PER_SOL,
        });
        
        setTransactionProcessing(true);
        try {

            const url = `/.netlify/functions/solana_dev?function_name=getLatestBlockhash`;
            const blockhash_data_result = await fetch(url).then((res) => res.json());
            let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
            let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];
            const txArgs = { blockhash: blockhash, lastValidBlockHeight: last_valid};

            let transaction = new Transaction(txArgs).add(transfer_instruction);
            transaction.feePayer = wallet.publicKey;

            let signed_transaction = await wallet.signTransaction(transaction);

            const encoded_transaction = bs58.encode(signed_transaction.serialize());
            console.log(signed_transaction);
            console.log(encoded_transaction);

            const send_url = `/.netlify/functions/solana_dev?function_name=sendTransaction&p1=`+encoded_transaction;
            const transaction_result = await fetch(send_url).then((res) => res.json());
            var transaction_signature = transaction_result["result"];   
            
            // we just wait 20 seconds which should be long enough for the transaction to be finalized 
            await sleep(20000);

            const signature_url = `/.netlify/functions/sig_status_dev?function_name=getSignatureStatuses&p1=`+transaction_signature;
            const signature_result = await fetch(signature_url).then((res) => res.json());
            const confirmation_status = signature_result["result"]["value"][0]["confirmationStatus"];

            if (confirmation_status === "finalized")
                have_account_info = false;
            
            }catch(error) {
                console.log(error);
            }
            setTransactionProcessing(false);

    }, [wallet]);

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
                                    lamports
                                    ? "Balance: " + lamports / LAMPORTS_PER_SOL + ' SOL'
                                    : 'Balance: Loading..'
                                }
                                readOnly
                            />
                        </FormControl>

                        <Button size='md' onClick={getAirdrop} isLoading={airdropProcessing}>
                            Airdrop 1
                        </Button>

                        <Button size='md' onClick={handle_transaction} isLoading={transactionProcessing}>
                            Transfer 0.1
                        </Button>
                    </HStack>
                    
                </Box>
            )}
            {!wallet.publicKey && <WalletNotConnected />}

        </Box>
    );
}

export function AirDrop() {
    const wallets = useMemo(() => 
    [
    ],
    []
  );

    return (
        <ChakraProvider theme={theme}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <AirDropApp />
                </WalletModalProvider>
            </WalletProvider>
        </ChakraProvider>
    );
}