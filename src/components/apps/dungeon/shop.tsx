import { useCallback, useEffect, useState, useRef } from 'react';
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

import { DUNGEON_FONT_SIZE, PROD ,
    PYTH_BTC_DEV, PYTH_BTC_PROD, PYTH_ETH_DEV, PYTH_ETH_PROD, PYTH_SOL_DEV, PYTH_SOL_PROD,
    METAPLEX_META, SHOP_PROGRAM, DUNGEON_PROGRAM, SYSTEM_KEY} from './constants';

import bs58 from "bs58";
  
import { request_raw_account_data, request_shop_data, request_shop_user_data, serialise_basic_instruction, get_current_blockhash, send_transaction, request_token_amount} from './utils';


import { Metadata } from '@metaplex-foundation/mpl-token-metadata';

import {
    useWallet,
} from '@solana/wallet-adapter-react';
import {
    WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';

// shop items
import key from "./images/Key.png"
import closed_chest from "./images/chest_closed.png"
import open_chest from "./images/chest_open.png"
import shop from "./images/ShopBuild.gif"

import './css/style.css';
import './css/fonts.css';
import './css/wallet.css';

const XP_WHITELIST_TOKEN =  new PublicKey("9dyKcWs1eUJZtJmAU81giNiLmyty4qBLZZduRwQaGw5T");
const PREPAID_WHITELIST_TOKEN =  new PublicKey("EdxJtFgnmt6iVtfQdEfQgfpS2WfUkRUywYP5YjFyu4nR");


const KEY_COLLECTION_MASTER = new PublicKey('7hxHyqBGX2BN2cDePWn1kXCsf6ADmkgYqAFRvU54CAYJ');
const KEY_COLLECTION_META = new PublicKey('HYBWDQeHR5P44621PT52thJbwTQBDsMGy8NwRbbK4xut');
const KEY_COLLECTION_MINT = new PublicKey('9C7CUp5aXDcg5QbSFVJwPeXviyFD4YK6CdQzp1jg7Lcp');

const enum ChestStatus {
    closed = 0,
    open = 1,
    lead = 2,
    bronze = 3,
    silver = 4,
    gold = 5,
    obsidian  = 6
}

const enum ShopInstruction {
    init = 0,
    create_token = 1,
    create_collection = 2
}

const enum CustomerStatus {
    unknown = 0,
    prepaid = 1,
    xp_whitelist = 2,
    other = 3
    
}

export function ShopScreen({num_xp, bearer_token, check_sol_balance} : {num_xp : number, bearer_token : string, check_sol_balance : React.MutableRefObject<boolean>})
{
    const wallet = useWallet();
    const [chest_state, setChestState] = useState<ChestStatus>(ChestStatus.closed);
    const [current_mint, setCurrentMint]  = useState<PublicKey | null>(null);
    const [which_key, setWhichKey] = useState<string | null>(null);
    const [key_description, setKeyDescription] = useState<string | null>(null);
    const [key_image, setKeyImage] = useState<string | null>(null);
    const [xp_req, setXPReq] = useState<number | null>(null);
    const [customer_status, setCustomerStatus] = useState<CustomerStatus>(CustomerStatus.unknown);

    //number of keys this user has bought
    const user_num_keys = useRef<number>(-1);

    // the most recent key bought
    const current_key = useRef<PublicKey | null>(null);
    // interval for checking the key
    const key_interval = useRef<number | null>(null);

    // interval for updating shop state
    const xp_interval = useRef<number | null>(null);
    const check_xp = useRef<boolean>(true);

    const valid_shop_text = ["Welcome Adventurer!  Unfortunately the shop isn't quite ready yet, but I do have this magnificent chest of keys.. Rummage around for something you like, i'm sure whatever you find will come in handy in your travels!", 
    "Welcome back Adventurer! I'm glad someone in this bleak world still recognizes quality merchandise when they see it! If it's another key you're after, go right ahead.", 
    "Back again eh Adventurer? Well go ahead and see what else you can find in my chest of keys, third times a charm!"];

    const invalid_shop_text = ["Welcome Adventurer!  Unfortunately the shop isn't quite ready yet, but I do have this magnificent chest of keys.. Sadly for you though I only trade with more seasoned adventurers.", 
    "Welcome back Adventurer!  It looks like the dungeon's been putting you through your paces, but if you want to buy more keys you're going to have to stay ahead of the competition.", 
    "Back for more eh Adventurer? I'm sure these keys are proving their worth to you, but if you want to buy a third one you're going to have to do the same for me!"];

    const check_xp_reqs = useCallback(async() => 
    {
        

        if (!wallet.publicKey)
            return;

        if  (!check_xp.current)
            return;


        let program_data_key = (PublicKey.findProgramAddressSync([Buffer.from("data_account")], SHOP_PROGRAM))[0];
        let dungeon_key_data_account = (PublicKey.findProgramAddressSync([wallet.publicKey.toBuffer()], SHOP_PROGRAM))[0];

        let user_data = await request_shop_user_data(bearer_token, dungeon_key_data_account);
        
        let user_keys_bought = 0;

        if (user_data !== null ) {
          
            user_keys_bought = user_data.num_keys;
        }

        if (user_keys_bought <= user_num_keys.current) {
            return;
        }

        user_num_keys.current = user_keys_bought;
        
        if (user_keys_bought >= 3) {
            setXPReq(-1);
            check_xp.current = false;
            setCustomerStatus(CustomerStatus.other);
            return;
        }
      

        let shop_data = await request_shop_data(bearer_token, program_data_key);

        // if the shop hasn't been set up yet just return
        if (shop_data === null){
            check_xp.current = false;
            setCustomerStatus(CustomerStatus.other);
            return;
        }
        
        let total_keys_bought = shop_data.keys_bought;

        // if we have sold out there is nothing to sell
        if (total_keys_bought >= 2000) {
            setXPReq(-2);
            check_xp.current = false;
            setCustomerStatus(CustomerStatus.other);
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

        // check if they have any prepaid tokens
        let prepaid_whitelist_account_key = await getAssociatedTokenAddress(
            PREPAID_WHITELIST_TOKEN, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        let token_amount = await request_token_amount(bearer_token, prepaid_whitelist_account_key);

        if (token_amount > 0) {
            setCustomerStatus(CustomerStatus.prepaid);
            setXPReq(total_xp_req);
            check_xp.current = false;    
            return;
        }

        // if they dont have prepaid status then check for xp whitelist
        let xp_whitelist_account_key = await getAssociatedTokenAddress(
            XP_WHITELIST_TOKEN, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        let xp_token_amount = await request_token_amount(bearer_token, xp_whitelist_account_key);

        if (xp_token_amount > 0) {
            setCustomerStatus(CustomerStatus.xp_whitelist);
            setXPReq(total_xp_req);
            check_xp.current = false;
    
            return;
        }

        setCustomerStatus(CustomerStatus.other);
        setXPReq(total_xp_req);
        check_xp.current = false;


    }, [wallet, user_num_keys, bearer_token]);

    const check_key = useCallback(async() =>
    {
        
        if (current_key.current  === null)
            return;

        try {

            //console.log("request meta data");
            let raw_meta_data = await request_raw_account_data(bearer_token, current_key.current);

            if (raw_meta_data === null) {
                return;
            }

            //console.log("deserialize meta data");
            let meta_data = Metadata.deserialize(raw_meta_data);

            //console.log(meta_data);
            let uri_json = await fetch(meta_data[0].data.uri).then(res => res.json());

            setWhichKey(meta_data[0].data.name);
            setKeyDescription(uri_json["description"]);
            setKeyImage(uri_json["image"]);
            setCurrentMint(meta_data[0].mint);
            setChestState(ChestStatus.closed);

            current_key.current = null;
        
        } catch(error) {
            console.log(error);
            return;
        }
            

    }, [bearer_token]);

    // interval for checking key
    useEffect(() => {

        if (key_interval.current === null) {
            key_interval.current = window.setInterval(check_key, 1000);
        }
        else{
            window.clearInterval(key_interval.current);
            key_interval.current = null;
            
        }
        // here's the cleanup function
        return () => {
          if (key_interval.current !== null) {
            window.clearInterval(key_interval.current);
            key_interval.current = null;
          }
        };
    }, [check_key]);

    // interval for checking xp
    useEffect(() => {

    if (xp_interval.current === null) {
        xp_interval.current = window.setInterval(check_xp_reqs, 1000);
    }
    else{
        window.clearInterval(xp_interval.current);
        xp_interval.current = null;
        
    }
    // here's the cleanup function
    return () => {
      if (xp_interval.current !== null) {
        window.clearInterval(xp_interval.current);
        xp_interval.current = null;
      }
    };
  }, [check_xp_reqs]);


    useEffect(() => 
    {
        user_num_keys.current = -1;
        check_xp.current = true;
        setXPReq(null);
        
    }, [wallet]);

    useEffect(() => 
    {
        check_xp.current = true;
        
    }, []);


    const DisplayChest = ({visible} : {visible : boolean}) => {

        if (chest_state === ChestStatus.closed) {
            return ( <img style={{"imageRendering":"pixelated", "visibility": visible ? "visible" : "hidden"}} src={closed_chest} width="10000" alt={""}/> );
        }

        return ( <img style={{"imageRendering":"pixelated", "visibility":  visible ? "visible" : "hidden"}} src={open_chest} width="10000" alt={""}/> );
               
    }



    const Mint = useCallback( async () => 
    {

            if (wallet.publicKey === null || wallet.signTransaction === undefined)
                return;

            setWhichKey(null);
            setKeyDescription(null);
            setKeyImage(null);
       
            setChestState(ChestStatus.open);

            const nft_mint_keypair = Keypair.generate();
            var nft_mint_pubkey = nft_mint_keypair.publicKey;
            
            let program_data_key = (PublicKey.findProgramAddressSync([Buffer.from("data_account")], SHOP_PROGRAM))[0];
            let dungeon_key_data_account = (PublicKey.findProgramAddressSync([wallet.publicKey.toBuffer()], SHOP_PROGRAM))[0];
            let dungeon_key_meta_account = (PublicKey.findProgramAddressSync([Buffer.from("key_meta"), nft_mint_pubkey.toBuffer()], SHOP_PROGRAM))[0];


            let nft_meta_key = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
            METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer()], METAPLEX_META))[0];

            let nft_master_key = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
            METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer(), Buffer.from("edition")], METAPLEX_META))[0];

            let nft_account_key = await getAssociatedTokenAddress(
                nft_mint_pubkey, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );

            let xp_whitelist_account_key = await getAssociatedTokenAddress(
                XP_WHITELIST_TOKEN, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );

            let prepaid_whitelist_account_key = await getAssociatedTokenAddress(
                PREPAID_WHITELIST_TOKEN, // mint
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

            account_vector.push({pubkey: KEY_COLLECTION_MINT, isSigner: false, isWritable: true});
            account_vector.push({pubkey: KEY_COLLECTION_META, isSigner: false, isWritable: true});
            account_vector.push({pubkey: KEY_COLLECTION_MASTER, isSigner: false, isWritable: true});


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

            account_vector.push({pubkey: XP_WHITELIST_TOKEN, isSigner: false, isWritable: true});
            account_vector.push({pubkey: xp_whitelist_account_key, isSigner: false, isWritable: true});

            account_vector.push({pubkey: PREPAID_WHITELIST_TOKEN, isSigner: false, isWritable: true});
            account_vector.push({pubkey: prepaid_whitelist_account_key, isSigner: false, isWritable: true});

            
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

            let txArgs = await get_current_blockhash(bearer_token);
            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;


            transaction.add(create_token_instruction);
            transaction.add(init_instruction);

            transaction.partialSign(nft_mint_keypair);


            try {
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                var transaction_response = await send_transaction(bearer_token, encoded_transaction);
            
                if (transaction_response.result === "INVALID") {
                    console.log(transaction_response)
                    return;
                }
     
            } catch(error) {
                console.log(error);
                return;
            }

            
            current_key.current = nft_meta_key;
            check_xp.current = true;
            check_sol_balance.current = true;
            
            return;
        

    },[wallet, bearer_token, check_sol_balance]);

    const ShopText = (): JSX.Element | null => {

        if (customer_status === CustomerStatus.prepaid) {
            return(
                <Center width = "100%">
                <Box width="80%">
                    <div className="font-face-sfpb">
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Welcome Adventurer! That's a shiny little trinket you have there... Tell you what, how about I trade you for one of my Dungeon Keys?</Text>
                    </div>
                </Box>
            </Center>
            );
        }

        if (xp_req === -1) {
            return(
                <Center width = "100%">
                    <Box width="80%">
                        <div className="font-face-sfpb">
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Welcome back Adventurer! I'm afraid you've had your fair share of keys from me.  You'll need to find someone else to trade with if you want more.</Text>
                        </div>
                    </Box>
                </Center>
            );
        }

        if (customer_status === CustomerStatus.xp_whitelist || (xp_req !== null && num_xp !== null && xp_req > 0 && num_xp >= xp_req)) {
            return (
                <Center width = "100%">
                    <Box width="80%">
                        <div className="font-face-sfpb">
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">{valid_shop_text[user_num_keys.current]}</Text>
                        </div>
                    </Box>
                </Center>
            );
        }

        return (
            <Center width = "100%">
                <Box width="80%">
                    <div className="font-face-sfpb">
                        <>
                        {xp_req !== null && num_xp !== null && xp_req > 0 && num_xp < xp_req &&
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> {invalid_shop_text[user_num_keys.current]} Come back when you have {xp_req} XP</Text>
                        }
                        {xp_req === -2 &&
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Welcome Adventurer!  If you're here looking for keys i'm afraid you're a bit late! There's been a rush of adventurers like you over the past days and i'm all sold out.</Text>
                        }
                        </>
                        
                    </div>
                </Box>
            </Center>
        );
  
    }

    const ShopItems = () => {

        if (customer_status === CustomerStatus.prepaid) {
            return(
                <HStack alignItems="center">          
                    <Box width="15%"> <img style={{"imageRendering":"pixelated"}} src={key} width="100" alt={""}/></Box>
                    
                    <Button variant='link' size='lg' onClick={Mint}>
                        <div className="font-face-sfpb">
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Buy Key (1 Shiny Trinket) </Text>      
                        </div> 
                    </Button>                
            </HStack>
            );
        }

        if (customer_status === CustomerStatus.xp_whitelist || (xp_req !== null && num_xp !== null && xp_req > 0 && num_xp >= xp_req)) {
            return (
                <HStack alignItems="center">
                
                    <>
                        
                        <Box width="15%"> <img style={{"imageRendering":"pixelated"}} src={key} width="100" alt={""}/></Box>
                        
                        <Button variant='link' size='lg' onClick={Mint}>
                            <div className="font-face-sfpb">
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Buy Key (1.5 SOL) </Text>      
                            </div> 
                        </Button>  

                    </>
                    
                                    
                </HStack>
            );
        }

        return(<></>);
  
    }

    return(
        <VStack alignItems="center" mb = "5rem">
            <Box width="100%">
                <HStack>
                    <Box width="65%"></Box>  
                    <Box width="10%">
                        <div className="font-face-sfpb">
                                
                                <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">XP {num_xp}</Text>
                                
                        </div>
                    </Box>
                    <Box width="25%"></Box>  
                </HStack>
            </Box>

            <Box width="100%">       
                <Center width="100%">
                
                    <VStack width="100%" alignItems="center" spacing="2%">

                    

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
                                    <Box width="15%"> <DisplayChest visible = {true}/></Box>  
                                    
                                    
                                    <Box width="5%"></Box> 
                                    <Box width="15%" pb = "10%"><DisplayChest visible = {false}/> </Box>  
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
                            
                            <ShopText/>
                            <ShopItems/>
                        </>
                        }

                        {which_key !== null && key_image !== null && current_mint !== null &&
                            <>
                            <VStack spacing="3%" alignItems="center">
                                <HStack alignItems="center">
                                    <Box width="15%">
                                        <img style={{"imageRendering":"pixelated"}} src={key_image} width="100" alt={""}/>
                                    </Box>
                                                
                                        <div className="font-face-sfpb">
                                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">You have found {which_key?.slice(0,17)}! </Text>
                                        </div>
                                </HStack>
                                <Center>
                                    <Box width = "100%">
                                        <div className="font-face-sfpb">
                                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">{key_description}  View it <a className="one" target="_blank" rel="noreferrer" href={"https://explorer.solana.com/address/"+current_mint.toString()}>here</a></Text>
                                        </div>
                                    </Box>
                                </Center>
                            </VStack>
                            </>            
                        }


                    </VStack>
                </Center>
            </Box>
        </VStack>
    );
}

