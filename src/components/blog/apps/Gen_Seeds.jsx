import React, { useCallback, useState } from 'react';
import { Box, HStack, VStack, Button, Stack, Radio, RadioGroup } from '@chakra-ui/react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import Plot from 'react-plotly.js';
import BN from "bn.js";
import { struct, u64, u8 } from "@project-serum/borsh";
import { randomBytes } from 'crypto';

const genprogramId = new PublicKey('Hqw9GzaxEg1efH8BciNN5D32A5fMAfBdDM3qudRdb9o5');
const btc_pyth = new PublicKey('HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J');
const eth_pyth = new PublicKey('EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw');
const sol_pyth = new PublicKey('J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix');

const RNGArgs = struct([
    u8("instruction")
]);


const RNGInstruction = {
    make_seed : 0
}

export function GenSeed() 
{
    const wallet = useWallet();
    const { connection } = useConnection();

    const gen_seed = useCallback( async () => 
    {

        const data = Buffer.alloc(RNGArgs.span);
        RNGArgs.encode(
            {
                instruction: RNGInstruction.make_seed
            },
            data
        );

        const seed_instruction = new TransactionInstruction({
            keys: [
                {pubkey: btc_pyth, isSigner: false, isWritable: false},
                {pubkey: eth_pyth, isSigner: false, isWritable: false},
                {pubkey: sol_pyth, isSigner: false, isWritable: false}

            ],
            programId: genprogramId,
            data: data
        });

        var response = null;
        var signature;
        document.getElementById("myspan").style.fontSize = "medium";
        try {
            var text = "<p style=\"text-align:left\">Sending Transaction... ";
            document.getElementById("myspan").innerHTML=text+"<br /><br /><br /><br /><br /></p>";
            signature = await wallet.sendTransaction(
                new Transaction().add(seed_instruction),
                connection
            );
            text+="transaction sent<br>";
            text+="confirming execution.. ";

            document.getElementById("myspan").innerHTML=text+"<br /><br /><br /><br /></p>";

            await connection.confirmTransaction(signature, 'processed');
            console.log("signature: ", signature);
            text+="execution confirmed<br>";
            text+="getting logs:<br>";
            document.getElementById("myspan").innerHTML=text+"<br /><br /><br /></p>";


        } catch(error) {
            console.log(error);
        }

        while (response == null) {
            response = await connection.getTransaction(signature);
        }   

        console.log("result: ", response["meta"]["logMessages"].length);
        const logs = response["meta"]["logMessages"];
        text += logs[1] + "<br>";
        text += logs[2] + "<br>";
        text += logs[3] + "<br>";   
        text += logs[4] + "<br>";   
        text += logs[5] + "<br>";   

        
        document.getElementById("myspan").innerHTML=text+"</p>";

    },
    [connection, wallet]
    );

    return (

    <Box textAlign="left" fontSize="l" width="full" spacing={8} borderRadius={10} borderWidth={2} p={10}>

            
            <Box marginBottom={10}>
                <Button onClick={gen_seed}>Generate Seed</Button>
            </Box>
           
            <Box>
                <span id="myspan" > Waiting To Generate Seed <br /><br /><br /><br /><br /></span>
            </Box>
    </Box>
  );
}