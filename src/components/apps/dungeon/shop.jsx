import { useCallback, useEffect, useState, useContext } from 'react';
import {
    Box,
    Button,
    HStack,
    Center,
    Text,
    VStack
} from '@chakra-ui/react';
import { isMobile } from "react-device-detect";

import { PublicKey, Keypair, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  } from "@solana/spl-token";

import { DUNGEON_FONT_SIZE, network_string, PROD ,
    PYTH_BTC_DEV, PYTH_BTC_PROD, PYTH_ETH_DEV, PYTH_ETH_PROD, PYTH_SOL_DEV, PYTH_SOL_PROD,
    METAPLEX_META, SHOP_PROGRAM, DUNGEON_PROGRAM, SYSTEM_KEY,
    StateContext} from './constants';

import bs58 from "bs58";
  
import { check_json, request_raw_account_data, request_shop_data, request_shop_user_data, serialise_basic_instruction} from './utils';


import { Metadata } from '@metaplex-foundation/mpl-token-metadata';

import {
    useWallet,
} from '@solana/wallet-adapter-react';
import {
    WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';

// shop items
import key from "./Key.png"
import closed_chest from "./chest_closed.png"
import open_chest from "./chest_open.png"
import shop from "./ShopBuild.gif"

import './style.css';
import './fonts.css';
import './wallet.css';

const WHITELIST_TOKEN =  new PublicKey("CisHceikLeKxYiUqgDVduw2py2GEK71FTRykXGdwf22h");

const COLLECTION_MASTER = new PublicKey('4UV8u1C3VbXZ4JFHPRnBzbQvA44b9P3JnGfe3U8HpeDJ');
const COLLECTION_META = new PublicKey('AD1eii4mdMejHB5PpJu8mCqTEydMY82dDLFdeLVEf5uV');
const COLLECTION_MINT = new PublicKey('8gD8vXEzs3FaPbTdySsSBr5nGLtqCiTCvaA8DNjWZVdJ');
const LAUNCH_DATE = new Date(Date.UTC(2021, 1, 9, 15, 0)).getTime();

const ChestStatus = {
    closed : 0,
    open : 1,
    lead : 2,
    bronze : 3,
    silver : 4,
    gold : 5,
    obsidian  : 6
}

const ShopInstruction = {
    init : 0,
    create_token : 1,
    create_collection : 2,
    burn_token : 3
}

let xpIntervalId;
let keyIntervalId;
let current_key = null;
let current_meta_key = null;
let current_n_keys = -1;
let check_xp = true;
export function ShopScreen()
{
    const wallet = useWallet();
    const [chest_state, setChestState] = useState(ChestStatus.closed);
    const [current_mint, setCurrentMint]  = useState(null);
    const [which_key, setWhichKey] = useState(null);
    const [key_description, setKeyDescription] = useState(null);
    const [key_image, setKeyImage] = useState(null);
    const [xp_req, setXPReq] = useState(null);
    const [num_keys_bought, setNumKeysBought] = useState(0);

    //const [countdown_string, setCountDownString] = useState(null);
    const [countdown_value, setCountDown] = useState(null);


    const [numXP] = useContext(StateContext);

    const valid_shop_text = ["Welcome Adventurer!  Unfortunately the shop isn't quite ready yet, but I do have this magnificent chest of keys.. Rummage around for something you like, i'm sure whatever you find will come in handy in your travels!", 
    "Welcome back Adventurer! I'm glad someone in this bleak world still recognizes quality merchandise when they see it! If it's another key you're after, go right ahead.", 
    "Back again eh Adventurer? Well go ahead and see what else you can find in my chest of keys, third times a charm!"];

    const invalid_shop_text = ["Welcome Adventurer!  Unfortunately the shop isn't quite ready yet, but I do have this magnificent chest of keys.. Sadly for you though I only trade with more seasoned adventurers.", 
    "Welcome back Adventurer!  It looks like the dungeon's been putting you through your paces, but if you want to buy more keys you're going to have to stay ahead of the competition.", 
    "Back for more eh Adventurer? I'm sure these keys are proving their worth to you, but if you want to buy a third one you're going to have to do the same for me!"];

    const check_xp_reqs = useCallback(async() => 
    {
        

        // just set the countdown here also
        var now = new Date().getTime();
        var distance = Math.max(0, LAUNCH_DATE - now);
        setCountDown(distance);

        // Time calculations for days, hours, minutes and seconds
        //var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        //var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        //var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        //var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        //let countdown_string = days + "d " + hours + "h " + minutes + "m " + seconds + "s ";
        //setCountDownString(countdown_string);

        if (!wallet.publicKey)
            return;

        if  (!check_xp)
            return;



        let program_data_key = (PublicKey.findProgramAddressSync(["data_account"], SHOP_PROGRAM))[0];
        let dungeon_key_data_account = (PublicKey.findProgramAddressSync([wallet.publicKey.toBuffer()], SHOP_PROGRAM))[0];


        let user_data = await request_shop_user_data(dungeon_key_data_account);
        

        let user_keys_bought = 0;

        if (user_data !== null ) {
          
            user_keys_bought = user_data.num_keys;
        }

        if (user_keys_bought <= current_n_keys) {
            return;
        }

        setNumKeysBought(user_keys_bought);
        
        if (user_keys_bought >= 3) {
            setXPReq(-1);
            check_xp = false;
            return;
        }

        current_n_keys = user_keys_bought
        

        let shop_data = await request_shop_data(program_data_key);

        // if the shop hasn't been set up yet just return
        if (shop_data === null){
            check_xp = false;
            return;
        }
        
        let total_keys_bought = shop_data.keys_bought;

        // if we have sold out there is nothing to sell
        if (total_keys_bought >= 3500) {
            setXPReq(-2);
            check_xp = false;
            return;
        }

        //console.log("total keys bought: ", total_keys_bought);
        //console.log("user keys bought: ", user_keys_bought);

        let n_levels = 10.0;
        let total_keys = 3000.0;
        let keys_per_level = total_keys / n_levels;
        let current_level = Math.floor(total_keys_bought / keys_per_level);


        let base_xp = 100;
        let xp_cap_per_key = 500;
        var base_xp_req = base_xp + current_level * 50;

        //console.log("xp calc: ", n_levels, keys_per_level, current_level, base_xp_req);
        var total_xp_req = base_xp_req + user_keys_bought * 50;

        if (total_xp_req > xp_cap_per_key) {
            total_xp_req = xp_cap_per_key;
        }

        //console.log("total xp req ", total_xp_req);
        setXPReq(total_xp_req);
        check_xp = false;

    }, [wallet]);

    const check_key = useCallback(async() =>
    {
        
        if (current_key  === null)
            return;

        try {

            //console.log("request meta data");
            let raw_meta_data = await request_raw_account_data(current_meta_key);

            if (raw_meta_data === null) {
                return;
            }

            //console.log("deserialize meta data");
            let meta_data = Metadata.deserialize(raw_meta_data);

            //console.log(meta_data);
            let uri_json = await fetch(meta_data[0].data.uri).then(res => res.json());

            setWhichKey(uri_json["name"]);
            setKeyDescription(uri_json["description"]);
            setKeyImage(uri_json["image"]);
            setCurrentMint(meta_data[0].mint.toString());
            setChestState(ChestStatus.closed);

            current_key = null;
        
        } catch(error) {
            console.log(error);
            return;
        }
            

    }, []);

    useEffect(() => 
    {
        if (wallet.publicKey && !keyIntervalId) {
            keyIntervalId = setInterval(check_key, 1000);
        }
        else{
            clearInterval(keyIntervalId);
            keyIntervalId = null;
        }

    }, [check_key, wallet]);

    useEffect(() => 
    {
        //console.log("in use effect ", xpIntervalId);
        if (wallet.publicKey && !xpIntervalId) {
            xpIntervalId = setInterval(check_xp_reqs, 1000);
        }
        else{
            clearInterval(xpIntervalId);
            xpIntervalId = null;
        }
        return () => {clearInterval(xpIntervalId);xpIntervalId = null;}

    }, [check_xp_reqs, wallet]);


    useEffect(() => 
    {
        current_n_keys = -1;
        check_xp = true;
        
    }, [wallet]);

    useEffect(() => 
    {
        //console.log("set check xp");
        check_xp = true;

        // just set the countdown here also
        var now = new Date().getTime();
        var distance = Math.max(0, LAUNCH_DATE - now);
        setCountDown(distance);
        
    }, []);


    const DisplayChest = ({visibility}) => {

         if (chest_state === ChestStatus.closed) {
             return ( <img style={{"imageRendering":"pixelated", "visibility": visibility}} src={closed_chest} width="10000" alt={""}/> );
         }
         if (chest_state === ChestStatus.open) {
             return ( <img style={{"imageRendering":"pixelated", "visibility": visibility}} src={open_chest} width="10000" alt={""}/> );
         }        
     }



    const Mint = useCallback( async () => 
    {

            setWhichKey(null);
            setKeyDescription(null);
            setKeyImage(null);
       
            setChestState(ChestStatus.open);

            const nft_mint_keypair = Keypair.generate();
            var nft_mint_pubkey = nft_mint_keypair.publicKey;
            
            let program_data_key = (PublicKey.findProgramAddressSync(["data_account"], SHOP_PROGRAM))[0];
            let dungeon_key_data_account = (PublicKey.findProgramAddressSync([wallet.publicKey.toBuffer()], SHOP_PROGRAM))[0];
            let dungeon_key_meta_account = (PublicKey.findProgramAddressSync(["key_meta", nft_mint_pubkey.toBuffer()], SHOP_PROGRAM))[0];


            let nft_meta_key = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
            METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer()], METAPLEX_META))[0];

            let nft_master_key = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
            METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer(), Buffer.from("edition")], METAPLEX_META))[0];

            let nft_account_key = await getAssociatedTokenAddress(
                nft_mint_pubkey, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );

            let whitelist_account_key = await getAssociatedTokenAddress(
                WHITELIST_TOKEN, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );

            let player_data_key = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes()], DUNGEON_PROGRAM))[0];

            const create_token_data = serialise_basic_instruction(ShopInstruction.create_token);
            const init_data = serialise_basic_instruction(ShopInstruction.init);

            var account_vector  = [
                {pubkey: wallet.publicKey, isSigner: true, isWritable: true},

                {pubkey: nft_mint_pubkey, isSigner: true, isWritable: true},
                {pubkey: nft_account_key, isSigner: false, isWritable: true},
                {pubkey: nft_meta_key, isSigner: false, isWritable: true},
                {pubkey: nft_master_key, isSigner: false, isWritable: true},

                {pubkey: player_data_key, isSigner: false, isWritable: true},
                {pubkey: dungeon_key_data_account, isSigner: false, isWritable: true},
                {pubkey: program_data_key, isSigner: false, isWritable: true},
                {pubkey: dungeon_key_meta_account, isSigner: false, isWritable: true}

            ];

            account_vector.push({pubkey: COLLECTION_MINT, isSigner: false, isWritable: true});
            account_vector.push({pubkey: COLLECTION_META, isSigner: false, isWritable: true});
            account_vector.push({pubkey: COLLECTION_MASTER, isSigner: false, isWritable: true});


            if (PROD) {
                account_vector.push({pubkey: PYTH_BTC_PROD, isSigner: false, isWritable: false});
                account_vector.push({pubkey: PYTH_ETH_PROD, isSigner: false, isWritable: false});
                account_vector.push({pubkey: PYTH_SOL_PROD, isSigner: false, isWritable: false});
            }
            else {
                account_vector.push({pubkey: PYTH_BTC_DEV, isSigner: false, isWritable: false});
                account_vector.push({pubkey: PYTH_ETH_DEV, isSigner: false, isWritable: false});
                account_vector.push({pubkey: PYTH_SOL_DEV, isSigner: false, isWritable: false});
            } 

            account_vector.push({pubkey: WHITELIST_TOKEN, isSigner: false, isWritable: true});
            account_vector.push({pubkey: whitelist_account_key, isSigner: false, isWritable: true});


            
            account_vector.push({pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false});
            account_vector.push({pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false});
            account_vector.push({pubkey: SYSTEM_KEY, isSigner: false, isWritable: true});
            account_vector.push({pubkey: METAPLEX_META, isSigner: false, isWritable: false});



            const create_token_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: SHOP_PROGRAM,
                data: create_token_data
            });

            const init_instruction = new TransactionInstruction({
                keys: [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                    {pubkey: program_data_key, isSigner: false, isWritable: true},
                    {pubkey: SYSTEM_KEY, isSigner: false, isWritable: true}
                ],
                programId: SHOP_PROGRAM,
                data: init_data
            });

            const blockhash_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getLatestBlockhash&p1=`;
            const blockhash_data_result = await fetch(blockhash_url).then((res) => res.json());
            let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
            let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];
            const txArgs = { blockhash: blockhash, lastValidBlockHeight: last_valid};

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;


            transaction.add(create_token_instruction);
            transaction.add(init_instruction);

            transaction.partialSign(nft_mint_keypair);


            try {
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                const send_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=sendTransaction&p1=`+encoded_transaction;
                let transaction_response = await fetch(send_url).then((res) => res.json());

                let valid_response = check_json(transaction_response)

                if (!valid_response) {
                    console.log(transaction_response)
                    return;
                }

                //console.log(transaction_response);
                //let signature = transaction_response["result"];
                //console.log("sig: ", signature);
     
            } catch(error) {
                console.log(error);
                return;
            }

            
            current_key = nft_mint_pubkey;
            current_meta_key = nft_meta_key;
            check_xp = true;
            
            return;
        

    },[wallet]);
/*
    const Burn = useCallback( async () => 
    {

            
            var nft_mint_pubkey = new PublicKey("AdWqAKwFusKTo2JavMNnUUVY7YoBHx9v58BPvRF3DNcW");
            
            let nft_meta_key = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
            METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer()], METAPLEX_META))[0];

            let nft_master_key = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
            METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer(), Buffer.from("edition")], METAPLEX_META))[0];

            let nft_account_key = await getAssociatedTokenAddress(
                nft_mint_pubkey, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );

            const burn_token_data = serialise_basic_instruction(ShopInstruction.burn_token);

            var account_vector  = [
                {pubkey: wallet.publicKey, isSigner: true, isWritable: true},

                {pubkey: nft_mint_pubkey, isSigner: false, isWritable: true},
                {pubkey: nft_account_key, isSigner: false, isWritable: true},
                {pubkey: nft_meta_key, isSigner: false, isWritable: true},
                {pubkey: nft_master_key, isSigner: false, isWritable: true},


            ];

            account_vector.push({pubkey: COLLECTION_META, isSigner: false, isWritable: true});            
            account_vector.push({pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false});
            account_vector.push({pubkey: SYSTEM_KEY, isSigner: false, isWritable: true});
            account_vector.push({pubkey: METAPLEX_META, isSigner: false, isWritable: false});



            const burn_token_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: SHOP_PROGRAM,
                data: burn_token_data
            });

            const blockhash_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getLatestBlockhash&p1=`;
            const blockhash_data_result = await fetch(blockhash_url).then((res) => res.json());
            let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
            let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];
            const txArgs = { blockhash: blockhash, lastValidBlockHeight: last_valid};

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;


            transaction.add(burn_token_instruction);

            try {
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                const send_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=sendTransaction&p1=`+encoded_transaction;//+"&config=true&p3=skippreflight";
                let transaction_response = await fetch(send_url).then((res) => res.json());

                let valid_response = check_json(transaction_response)

                if (!valid_response) {
                    console.log(transaction_response)
                    return;
                }

                console.log(transaction_response);
                let signature = transaction_response["result"];
                console.log("sig: ", signature);
     
            } catch(error) {
                console.log(error);
                return;
            }

            return;
        

    },[wallet]);
   */
    return(
        <>
        <Box width="100%">
                    <HStack>
                        <Box width="65%"></Box>  
                        <Box width="10%">
                            <div className="font-face-sfpb">
                                    
                                    <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">XP {numXP}</Text>
                                    
                            </div>
                        </Box>
                        <Box width="25%"></Box>  
                    </HStack>
                </Box>
        <Box width="100%">       
            <Center>
            
                <VStack alignItems="center" spacing="2%">

                

                <HStack>
                    <Box width="10%"></Box>         
                    <Box  style={{
                        backgroundImage: `url(${shop})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        imageRendering: "pixelated"

                    } } width="80%">
                        <HStack>
                
                            <Box width="35%"></Box> 
                            {countdown_value !== null && countdown_value === 0 &&           
                                <Box width="15%"> <DisplayChest visibility = {"visible"}/></Box>  
                            }
                            {(countdown_value === null || countdown_value > 0) &&           
                                <Box width="15%"> <DisplayChest visibility = {"hidden"}/></Box>  
                            }
                            <Box width="5%"></Box> 
                            <Box width="15%" pb = "10%"><DisplayChest visibility = {"hidden"}/> </Box>  
                            <Box width="30%"></Box> 

                        </HStack>
                    </Box>
                    <Box width="10%"></Box> 
                </HStack>

                {!wallet.publicKey &&
                <>
                    <div className="font-face-sfpb">
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Welcome Stranger!  Connect your wallet below so we can do business.</Text>
                    </div>

                    {!isMobile &&
                        <div className="font-face-sfpb">
                                    <WalletMultiButton  
                                    className="wallet-button"  
                                    >CONNECT WALLET</WalletMultiButton>
                        </div>
                    }
                     {isMobile &&
                        <div className="font-face-sfpb">
                                    <WalletMultiButton  
                                    className="mobile-wallet-button"  
                                    >CONNECT WALLET</WalletMultiButton>
                        </div>
                    }
                </>
                }

                {wallet.publicKey && 
                <>
                <Box width="80%" >
                    <div className="font-face-sfpb">
                        {/* If they don't have the xp reqs */}
                        {countdown_value !== null && countdown_value === 0 &&
                        <>
                        {xp_req !== null && xp_req > 0 && numXP < xp_req &&
                            <Center>
                            <Box width = "100%">
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> {invalid_shop_text[num_keys_bought]} Come back when you have {xp_req} XP</Text>
                            </Box>
                            </Center>
                        }
                        {xp_req === -2 &&
                            <Center>
                            <Box width = "100%">
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Welcome Adventurer!  If you're here looking for keys i'm afraid you're a bit late! There's been a rush of adventurers like you over the past days and i'm all sold out.</Text>
                            </Box>
                            </Center>
                        }
                        {xp_req === -1 &&
                            <Center>
                            <Box width = "100%">
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Welcome back Adventurer! I'm afraid you've had your fair share of keys from me.  You'll need to find someone else to trade with if you want more.</Text>
                            </Box>
                            </Center>
                        }
                        {xp_req > 0 && numXP >= xp_req &&
                            <Center>
                            <Box width = "100%">
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">{valid_shop_text[num_keys_bought]}</Text>
                            </Box>
                            </Center>
                        }
                        </>
                        }

                        {countdown_value !== null && countdown_value > 0 &&
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Welcome Adventurer!  We are just getting ready for our grand opening, if you come back soon we'll have some rare things on sale!</Text>
                        }
                        {countdown_value === null &&
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white" style={{"visibility": "hidden"}}>Welcome Adventurer!  We are just getting ready for our grand opening, if you come back soon we'll have some rare things on sale!</Text>
                        }
                    </div>
                </Box>

                <HStack alignItems="center">
 
                    {xp_req !== null && xp_req > 0 && numXP >= xp_req &&  countdown_value !== null && countdown_value === 0 &&
                    <>
                        
                        <Box width="15%"> <img style={{"imageRendering":"pixelated"}} src={key} width="100" alt={""}/></Box>
                        
                        <Button variant='link' size='lg' onClick={Mint}>
                            <div className="font-face-sfpb">
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Buy Key (1.5 SOL) </Text>      
                            </div> 
                        </Button>  
   
                    </>
                    }
                    
                </HStack>
                </>
                }

                {which_key !== null &&
                    <>
                    <VStack spacing="3%">
                    <HStack alignItems="center">
                        <Box width="15%">
                            <img style={{"imageRendering":"pixelated"}} src={key_image} width="100" alt={""}/>
                        </Box>
                                    
                            <div className="font-face-sfpb">
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">You have found {which_key}! </Text>
                            </div>
                    </HStack>
                    <Center>
                    <Box width = "100%">
                    <div className="font-face-sfpb">
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">{key_description}  View it <a className="one" target="_blank" rel="noreferrer" href={"https://explorer.solana.com/address/"+current_mint+"?cluster=devnet"}>here</a></Text>
                    </div>
                    </Box>
                    </Center>
                    </VStack>
                    </>            
                }


                </VStack>
            </Center>
        </Box>
        </>
    );
}

