import React, { useCallback, useState } from 'react';
import { Box,  Button, Radio, RadioGroup, Stack, HStack } from '@chakra-ui/react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

import { struct, u8 } from "@project-serum/borsh";

const genprogramId = new PublicKey('Hqw9GzaxEg1efH8BciNN5D32A5fMAfBdDM3qudRdb9o5');
const btc_pyth = new PublicKey('HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J');
const eth_pyth = new PublicKey('EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw');
const sol_pyth = new PublicKey('J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix');

const RNGArgs = struct([
    u8("instruction"),
    u8("method")
]);

const SeedMethod = {
    shiftmurmur : 0,
    sha256hash : 1,
    none : 2
}


const RNGInstruction = {
    make_seed : 0
}

export function GenSeed() 
{
    const wallet = useWallet();
    const { connection } = useConnection();
    const [radio, setRadio] = useState('ShiftMurmur')

    const gen_seed = useCallback( async () => 
    {
        let method = SeedMethod.shiftmurmur;
        if (radio === "ShiftMurmur") {
            method = SeedMethod.shiftmurmur;
        }
        if (radio === "Sha256") {
            method = SeedMethod.sha256hash;
        }
        if (radio === "None") {
            method = SeedMethod.none;
        }
        const data = Buffer.alloc(RNGArgs.span);
        RNGArgs.encode(
            {
                instruction: RNGInstruction.make_seed,
                method: method
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
        text += logs[6] + "<br>";

        
        document.getElementById("myspan").innerHTML=text+"</p>";

    },
    [radio, connection, wallet]
    );

    return (

        <Box textAlign="center" fontSize="l" width="full" spacing={8} borderRadius={10} borderWidth={2} p={10}>

        <HStack marginBottom  = "10px">
            <Box>
                <Button onClick={gen_seed}>Generate Randoms</Button>
            </Box>
            <Box>
                <RadioGroup onChange={setRadio} value={radio}>
                    <Stack direction='row'>
                        <Box><Radio value='ShiftMurmur'>ShiftMurmur</Radio></Box>
                        <Box><Radio value='Sha256'>Sha256 Hash</Radio></Box>
                        <Box><Radio value='None'>None</Radio></Box>
                    </Stack>
                </RadioGroup>
            </Box>
        </HStack>
        <HStack>
            <Box>
                <span id="myspan" > Waiting To Generate Random Numbers with {radio} <br /><br /><br /><br /><br /></span>
            </Box>
        </HStack>  
    </Box>
  );
}