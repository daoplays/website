import React, { useCallback, useState } from 'react';
import { Box, HStack, Button, Stack, Radio, RadioGroup } from '@chakra-ui/react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import Plot from 'react-plotly.js';
import BN from "bn.js";
import { struct, u64, u8 } from "@project-serum/borsh";
import { randomBytes } from 'crypto';

const genprogramId = new PublicKey('Dj75yJnPpACJdVLi5hgoEVXmQvteohEPPs4ezSkmjekc');
const creator = new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD");


const data_seed = 'rng_v1.0';


const RNGArgs = struct([
    u8("instruction"),
    u64("initial_seed"),
    u8("method"),
]);

const RNGMethod = {
    xorshift : 0,
    hash : 1,
    fasthash : 2,
    none : 3
}

const RNGInstruction = {
    generate : 0
}

export function GenRandoms() 
{
    const wallet = useWallet();
    const { connection } = useConnection();
    const [myArray, setMyArray] = useState([]);
    const [radio, setRadio] = useState('Xorshift')

    const greet = useCallback( async () => 
    {

        const rng_pubkey = await PublicKey.createWithSeed(
            creator,
            data_seed,
            genprogramId
        );

        console.log("have pub key ", rng_pubkey.toString());

        var rng_account = await connection.getAccountInfo(rng_pubkey);
        if (rng_account === null) {
            console.log("data account is null");
        }



        const value2 = randomBytes(8);
        const bn = new BN(value2.toString('hex'), 16);
        const data = Buffer.alloc(RNGArgs.span);
        let method = RNGMethod.xorshift;
        if (radio === "Sha2Hash") {
            method = RNGMethod.hash;
        }
        if (radio === "MurmurHash") {
            method = RNGMethod.fasthash;
        }
        if (radio === "None") {
            method = RNGMethod.none;
        }
        console.log("using", radio, method);

        RNGArgs.encode(
            {
                instruction: RNGInstruction.generate,
                initial_seed: bn,
                method: method
            },
            data
        );

        const rng_instruction = new TransactionInstruction({
            keys: [
                {pubkey: rng_pubkey, isSigner: false, isWritable: true}
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
                new Transaction().add(rng_instruction),
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
        document.getElementById("myspan").innerHTML=text+"</p>";


        // get the data
        rng_account = await connection.getAccountInfo(rng_pubkey);
        let num2 = new Float64Array(rng_account.data.buffer);
        let n_generated = 256;
        if(radio === "Sha2Hash"){
            n_generated = 60;
        }
        if(radio === "None"){
            n_generated = 0;
        }
        for  (let i = 0; i < n_generated; i++) {
            setMyArray( arr => [...arr, num2[i]]);
        }
    },
    [radio,  connection, wallet]
    );

    return (

    <Box textAlign="center" fontSize="l" width="full" spacing={8} borderRadius={10} borderWidth={2} p={10}>

        <HStack marginBottom  = "10px">
            <Box>
                <Button onClick={greet}>Generate Randoms</Button>
            </Box>
            <Box>
                <RadioGroup onChange={setRadio} value={radio}>
                    <Stack direction='row'>
                        <Box><Radio value='Xorshift'>Xorshift</Radio></Box>
                        <Box><Radio value='MurmurHash'>Murmur Hash</Radio></Box>
                        <Box><Radio value='Sha2Hash'>SHA2 Hash</Radio></Box>
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

    
        <Plot
            data={
                [{
                    type: 'histogram', x: myArray, 
                    xbins: {
                        end: 1, 
                        size: 0.05, 
                        start: 0
                    }
                }]
            }
            layout={{
                autosize: false, 
                width: 1000,
                height: 500,     
                shapes: [{
                    type: 'line',
                    x0: 0,
                    y0: myArray.length/20.0,
                    x1: 1,
                    y1: myArray.length/20.0,
                    line:{
                        color: 'rgb(0, 0, 0)',
                        width: 4,
                        dash:'dot'
                    }
                }]
            }}
        />
    </Box>
  );
}
