import { useCallback, useEffect, useState, useRef } from 'react';
import {
    Box,
    HStack,
    Center,
    Text,
    Input,
    FormControl,
    NumberInput,
    NumberInputField,
    VStack,
    Divider
} from '@chakra-ui/react';

import { PublicKey, Keypair, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  } from "@solana/spl-token";

import { Metadata } from '@metaplex-foundation/mpl-token-metadata';

import { DUNGEON_FONT_SIZE, network_string, PROD ,
    PYTH_BTC_DEV, PYTH_BTC_PROD, PYTH_ETH_DEV, PYTH_ETH_PROD, PYTH_SOL_DEV, PYTH_SOL_PROD,
    METAPLEX_META, SYSTEM_KEY, FOUNDER_1_KEY, FOUNDER_2_KEY, DM_PROGRAM, SHOP_PROGRAM, KeyType} from './constants';

import bs58 from "bs58";

import { request_raw_account_data, bignum_to_num, request_token_amount, check_json, request_DM_Manager_data, request_DM_data, serialise_DM_Mint_instruction, serialise_basic_instruction, request_DM_User_data, run_keyData_GPA} from './utils';


import {
    useWallet,
} from '@solana/wallet-adapter-react';


import './css/style.css';
import './css/fonts.css';
import './css/wallet.css';
import { bignum } from '@metaplex-foundation/beet';

const WHITELIST_TOKEN =  new PublicKey("FZKeUtJYChwL6E45n6aqheyafuNUgCeUkckSkqjWgRC6");

const COLLECTION_MASTER = new PublicKey('Dgiym4UcVJyCrNKptMTHtvYKqXy54w4UekfWwqzcaZ4d');
const COLLECTION_META = new PublicKey('7C92J99mh1PFRdJEpo9wV5nKqRQVn4eUU2HEHxxJPmU');
const COLLECTION_MINT = new PublicKey('4rMSZrUxP5HAANmx6mSXZSkcrf8ZVgcaUkzu8JFsQL9M');
const KEY_COLLECTION_META = new PublicKey('AD1eii4mdMejHB5PpJu8mCqTEydMY82dDLFdeLVEf5uV');

const DM_KEY_COST : number = 10;

const enum DMInstruction {
    init = 0,
    create_collection = 1,
    burn_token = 2,
    create_dm = 3,
    claim_fees = 4
    
}

const enum MemberStatus {
    unknown = 0,
    member = 1,
    applicant = 2,
    whitelisted = 3
    
}

export function DMScreen()
{
    const wallet = useWallet();

    // interval for updating state
    const state_interval = useRef<number | null>(null);
    const check_state = useRef<boolean>(true);
    const check_dm_data = useRef<boolean>(false);
    const check_user_data = useRef<boolean>(true);


    const [last_fees, setLastFees] = useState<number | null>(null);
    const [current_fees, setCurrentFees] = useState<number | null>(null);
    const [founder_fees, setFounderFees] = useState<bignum[] | null>(null);
    const [dm_fees, setDMFees] = useState<bignum[] | null>(null);
    const [keys_burnt, setKeysBurnt] = useState<number | null>(null);

    // saving DM name
    const [dm_name, setDMName] = useState<string>("");

    const [member_status, setMemberStatus] = useState<MemberStatus>(MemberStatus.unknown);
    const [dm_mint, setDMMint] = useState<PublicKey | null>(null);
    const [dm_index, setDMIndex] = useState<number | null>(null);
    const [dm_fees_raised, setDMFeesRaised] = useState<number | null>(null);
    const [dm_error, setDMError] = useState<string | null>(null);

    // key burning
    const [burn_key_index, setBurnKeyIndex] = useState<string>("")
    const [burn_key_type, setBurnKeyType] = useState<KeyType>(KeyType.Unknown)
    const [burn_error, setBurnError] = useState<string | null>(null);

    // displaying new DM token
    const dm_interval = useRef<number | null>(null);
    const [current_dm_image, setCurrentDMImage] = useState<string | null>(null);
    const [current_dm_mint, setCurrentDMMint] = useState<PublicKey | null>(null);
    const current_dm_nft_meta = useRef<PublicKey | null>(null);


    const check_dm_nft = useCallback(async() =>
    {
        
        if (current_dm_nft_meta.current  === null)
            return;

        try {

            //console.log("request meta data");
            let raw_meta_data = await request_raw_account_data(current_dm_nft_meta.current);

            if (raw_meta_data === null) {
                return;
            }

            //console.log("deserialize meta data");
            let meta_data = Metadata.deserialize(raw_meta_data);

            //console.log(meta_data);
            let uri_json = await fetch(meta_data[0].data.uri).then(res => res.json());

            setCurrentDMImage(uri_json["image"]);
            setCurrentDMMint(meta_data[0].mint);

            current_dm_nft_meta.current = null;
        
        } catch(error) {
            console.log(error);
            return;
        }
            

    }, []);

    // interval for checking new DM NFT
    useEffect(() => {

        if (dm_interval.current === null) {
            dm_interval.current = window.setInterval(check_dm_nft, 1000);
        }
        else{
            window.clearInterval(dm_interval.current);
            dm_interval.current = null;
            
        }
        // here's the cleanup function
        return () => {
            if (dm_interval.current !== null) {
            window.clearInterval(dm_interval.current);
            dm_interval.current = null;
            }
        };
    }, [check_dm_nft]);

    const check_dm_state = useCallback(async() => 
    {
        

        if (!wallet.publicKey)
            return;

        if (check_state.current === true) {
            

            console.log("checking DM manager state");
            let program_data_key = (PublicKey.findProgramAddressSync([Buffer.from("data_account")], DM_PROGRAM))[0];

            let dm_data = await request_DM_Manager_data(program_data_key);

            // if the shop hasn't been set up yet just return
            if (dm_data === null){
                return;
            }

            let this_current_fees = bignum_to_num(dm_data.total_fees);
            let this_last_fees = bignum_to_num(dm_data.last_fees);

            console.log(this_current_fees);
            console.log(this_last_fees);

            // if we don't have a dm index, or this is the first time we are here then just set check_state to false
            if (dm_index === null || current_fees === null) 
                check_state.current = false;

            // otherwise we check if their fees have been updated
            if (dm_index !== null && bignum_to_num(dm_data.dm_fees[dm_index]) === 0) {
                check_state.current = false;
            }

            setCurrentFees(this_current_fees / LAMPORTS_PER_SOL);
            setLastFees(this_last_fees / LAMPORTS_PER_SOL);


            setFounderFees(dm_data.founders_fees);
            setDMFees(dm_data.dm_fees);

        }


        if (check_user_data.current) {

            let dm_user_account = (PublicKey.findProgramAddressSync([wallet.publicKey.toBuffer()], DM_PROGRAM))[0];

            let user_data = await request_DM_User_data(dm_user_account);

            if (user_data !== null) {

                if (keys_burnt === null || user_data.keys_burnt === 0) {
                    setKeysBurnt(user_data.keys_burnt);   
                    check_user_data.current = false;
                }

                if (keys_burnt !== null && user_data.keys_burnt > keys_burnt) {
                    setKeysBurnt(user_data.keys_burnt);   
                    check_user_data.current = false;
                }

            }
            else {
                setKeysBurnt(0);
                check_user_data.current = false;
            }
    
            
        }

        if (check_dm_data.current === true) {

            let dm_data_account = (PublicKey.findProgramAddressSync([Buffer.from("dm_data"), Buffer.from(dm_name)], DM_PROGRAM))[0];

            let data = await request_DM_data(dm_data_account);

            if (data === null) {
                check_dm_data.current = false;
                return;
            }


            let dm_sol = bignum_to_num(data.total_fees_raised) / LAMPORTS_PER_SOL;

            if (dm_fees_raised === null || dm_sol > dm_fees_raised) {

                setDMFeesRaised(dm_sol);
                check_dm_data.current = false; 
            }           
        }

    }, [wallet, dm_fees_raised, dm_name, dm_index, current_fees, keys_burnt]);

    // interval for checking state
    useEffect(() => {

        if (state_interval.current === null) {
            state_interval.current = window.setInterval(check_dm_state, 1000);
        }
        else{
            window.clearInterval(state_interval.current);
            state_interval.current = null;
            
        }
        // here's the cleanup function
        return () => {
            if (state_interval.current !== null) {
            window.clearInterval(state_interval.current);
            state_interval.current = null;
            }
        };
    }, [check_dm_state]);
    


    useEffect(() => 
    {
       
        
    }, [wallet]);


    const Burn = useCallback( async () => 
    {

        if (wallet.publicKey === null || wallet.signTransaction === undefined)
            return;

        let parsed_key_index = parseInt(burn_key_index);
        //console.log("key index", discount_key_index, parsed_key_index, isNaN(parsed_key_index));

        if (isNaN(parsed_key_index))
            return;

        // get the mint of the key index
        let key_meta_data = await run_keyData_GPA(parsed_key_index);


        if (key_meta_data === null) {
            setBurnError("Key " + parsed_key_index + " has not been minted");
            return;
        }

        setBurnKeyType(key_meta_data.key_type);

        let nft_mint_pubkey = key_meta_data.key_mint;

        let dm_user_account = (PublicKey.findProgramAddressSync([wallet.publicKey.toBuffer()], DM_PROGRAM))[0];
        let dungeon_key_data_account = (PublicKey.findProgramAddressSync([Buffer.from("key_meta"), nft_mint_pubkey.toBuffer()], SHOP_PROGRAM))[0];

        let nft_meta_key = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
        METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer()], METAPLEX_META))[0];

        let nft_master_key = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
        METAPLEX_META.toBuffer(), nft_mint_pubkey.toBuffer(), Buffer.from("edition")], METAPLEX_META))[0];

        let nft_account_key = await getAssociatedTokenAddress(
            nft_mint_pubkey, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        // check the user actually owns the token
        let token_amount = await request_token_amount(nft_account_key);

        if (token_amount === 0) {
            setBurnError("Applicant does not own Key " + parsed_key_index);
            return;
        }

        const burn_token_data = serialise_basic_instruction(DMInstruction.burn_token);

        var account_vector  = [
            {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
            {pubkey: dm_user_account, isSigner: false, isWritable: true},

            {pubkey: nft_mint_pubkey, isSigner: false, isWritable: true},
            {pubkey: nft_account_key, isSigner: false, isWritable: true},
            {pubkey: nft_meta_key, isSigner: false, isWritable: true},
            {pubkey: nft_master_key, isSigner: false, isWritable: true},

            {pubkey: dungeon_key_data_account, isSigner: false, isWritable: true},



        ];

        account_vector.push({pubkey: KEY_COLLECTION_META, isSigner: false, isWritable: true});            
        account_vector.push({pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false});
        account_vector.push({pubkey: SYSTEM_KEY, isSigner: false, isWritable: true});
        account_vector.push({pubkey: METAPLEX_META, isSigner: false, isWritable: false});



        const burn_token_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: DM_PROGRAM,
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

        check_user_data.current = true;

        return;
        

    },[wallet, burn_key_index]);
   

    const Mint = useCallback( async () => 
    {

            if (wallet.publicKey === null || wallet.signTransaction === undefined)
                return;

            if (dm_name === "")
                return;

            
            const nft_mint_keypair = Keypair.generate();
            var nft_mint_pubkey = nft_mint_keypair.publicKey;
            
            let program_data_key = (PublicKey.findProgramAddressSync([Buffer.from("data_account")], DM_PROGRAM))[0];
            let user_data_account = (PublicKey.findProgramAddressSync([wallet.publicKey.toBuffer()], DM_PROGRAM))[0];
            let dm_data_account = (PublicKey.findProgramAddressSync([Buffer.from("dm_data"), Buffer.from(dm_name)], DM_PROGRAM))[0];


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


            const create_dm_data = serialise_DM_Mint_instruction(DMInstruction.create_dm, dm_name);
            const init_data = serialise_basic_instruction(DMInstruction.init);

            var account_vector  = [
                {pubkey: wallet.publicKey, isSigner: true, isWritable: true},

                {pubkey: nft_mint_pubkey, isSigner: true, isWritable: true},
                {pubkey: nft_account_key, isSigner: false, isWritable: true},
                {pubkey: nft_meta_key, isSigner: false, isWritable: true},
                {pubkey: nft_master_key, isSigner: false, isWritable: true},

                {pubkey: user_data_account, isSigner: false, isWritable: true},
                {pubkey: dm_data_account, isSigner: false, isWritable: true},
                {pubkey: program_data_key, isSigner: false, isWritable: true}

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



            const create_dm_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: DM_PROGRAM,
                data: create_dm_data
            });

            const init_instruction = new TransactionInstruction({
                keys: [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                    {pubkey: program_data_key, isSigner: false, isWritable: true},
                    {pubkey: SYSTEM_KEY, isSigner: false, isWritable: true}
                ],
                programId: DM_PROGRAM,
                data: init_data
            });

            const blockhash_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getLatestBlockhash&p1=`;
            const blockhash_data_result = await fetch(blockhash_url).then((res) => res.json());
            let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
            let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];
            const txArgs = { blockhash: blockhash, lastValidBlockHeight: last_valid};

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;


            transaction.add(create_dm_instruction);
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

            current_dm_nft_meta.current = nft_meta_key;
            
            return;
        

    },[wallet, dm_name]);

    const GetFees = useCallback( async () => 
    {

        if (wallet.publicKey === null || wallet.signTransaction === undefined)
            return;


        let program_data_key = (PublicKey.findProgramAddressSync([Buffer.from("data_account")], DM_PROGRAM))[0];

        const fees_data = serialise_DM_Mint_instruction(DMInstruction.claim_fees, dm_name);

        var account_vector  = [
            {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
            {pubkey: program_data_key, isSigner: false, isWritable: true},

            {pubkey: COLLECTION_MINT, isSigner: false, isWritable: false},

            {pubkey: SYSTEM_KEY, isSigner: false, isWritable: true},
            {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
            {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
            {pubkey: METAPLEX_META, isSigner: false, isWritable: false}
        ];

        // if this isn't a founder we will need the mint data

        if (wallet.publicKey.toString() !== FOUNDER_1_KEY.toString() && wallet.publicKey.toString() !== FOUNDER_2_KEY.toString()) {

            if (dm_name === "" || dm_mint === null)
                return;

            let dm_data_account = (PublicKey.findProgramAddressSync([Buffer.from("dm_data"), Buffer.from(dm_name)], DM_PROGRAM))[0];

            let dm_token_account_key = await getAssociatedTokenAddress(
                dm_mint, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );

            account_vector.push({pubkey: dm_mint, isSigner: false, isWritable: false});
            account_vector.push({pubkey: dm_token_account_key, isSigner: false, isWritable: false});
            account_vector.push({pubkey: dm_data_account, isSigner: false, isWritable: true});
        }

        const fees_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: DM_PROGRAM,
            data: fees_data
        });


        const blockhash_url = `/.netlify/functions/solana?network=`+network_string+`&function_name=getLatestBlockhash&p1=`;
        const blockhash_data_result = await fetch(blockhash_url).then((res) => res.json());
        let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
        let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];
        const txArgs = { blockhash: blockhash, lastValidBlockHeight: last_valid};

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;


        transaction.add(fees_instruction);

    
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
        
        check_state.current = true;
        check_dm_data.current = true;
        return;
        

    },[wallet, dm_name, dm_mint]);

    const CheckMemberStatus = useCallback( async () => 
    {
        setDMError(null);

        if (wallet.publicKey === null)
            return;

        console.log("dm name", dm_name);
        if (dm_name === "")
            return;

        let dm_data_account = (PublicKey.findProgramAddressSync([Buffer.from("dm_data"), Buffer.from(dm_name)], DM_PROGRAM))[0];

        let dm_data = await request_DM_data(dm_data_account);

        if (dm_data === null) {
            setDMError("There is no DM by this name on our records");
            console.log("token does not exist");
            return;
        }

        // before we go on lets check they actually own the nft
        let dm_token_account = await getAssociatedTokenAddress(
            dm_data.dm_mint, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        let token_amount = await request_token_amount(dm_token_account);

        if (token_amount !== 1) {
            setDMError("I know DM " + dm_name + " well, and you are not them");

            console.log("user does not own this token");
            return;
        }

        setDMMint(dm_data.dm_mint);
        setDMIndex(dm_data.dm_index);

        let dm_sol = bignum_to_num(dm_data.total_fees_raised) / LAMPORTS_PER_SOL;
        setDMFeesRaised(dm_sol);

        setMemberStatus(MemberStatus.member);


    },[wallet, dm_name]);

    const CheckApplicantStatus = useCallback( async () => 
    {

        if (wallet.publicKey === null)
            return;

       
        let whitelist_account_key = await getAssociatedTokenAddress(
            WHITELIST_TOKEN, // mint
            wallet.publicKey, // owner
            true // allow owner off curve
        );

        let token_amount = await request_token_amount(whitelist_account_key);

        if (token_amount > 0) {
            setMemberStatus(MemberStatus.whitelisted);
            return;
        }

        setMemberStatus(MemberStatus.applicant);


    },[wallet]);

    function FoundersDialogue()
    {

        if (wallet.publicKey === null || current_fees === null || last_fees === null || founder_fees === null) {
            return(<></>);
        }

        let fee_diff = current_fees - last_fees;
        let excess_founder_fees = 2 * fee_diff / 3;
        let excess_fee_per_founder = excess_founder_fees / 2;

        let founder_excess;
        if (wallet.publicKey.toString() === FOUNDER_1_KEY.toString()) {
            let founder_sol = bignum_to_num(founder_fees[0]) / LAMPORTS_PER_SOL
            founder_excess = founder_sol + excess_fee_per_founder;
        }

        if (wallet.publicKey.toString() === FOUNDER_2_KEY.toString()) {
            let founder_sol = bignum_to_num(founder_fees[1]) / LAMPORTS_PER_SOL
            founder_excess = founder_sol + excess_fee_per_founder; 
        }

        if (founder_excess === undefined)
            return(<></>);

        return(
            <Box width="80%">
                <Center>
                    <div className="font-face-sfpb">
                        <Text mb="2rem" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Welcome Founder!  Please help yourself to our records and your share of the guilds proceeds</Text>
                        <Divider/>
                        <Text mt="2rem" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Total Fees: {current_fees}</Text>
                        <Text mb = "2rem" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> To Claim: {founder_excess.toFixed(5)}</Text>
                        <Center>
                            <Box as='button' onClick={GetFees} borderColor="white" borderWidth='2px' height={"30px"}>
                                <div className="font-face-sfpb">
                                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Claim Fees</Text>      
                                </div> 
                            </Box>  
                        </Center>
                    </div>
                </Center>
            </Box>
        );
    }

    function GetKeyName({key_type} : {key_type : KeyType}) : string
    {
        if (key_type === KeyType.Bronze)
            return "A Bronze Key"

        if (key_type === KeyType.Silver)
            return "A Silver Key"

        if (key_type === KeyType.Gold)
            return "A Gold Key"

        return "An Unknown Key"
    }

    const ApplicantsJourneyFlavourTextArray : string[] = [
        "The path to becoming a member of the Dungeon Masters Guild is not an easy one to tread. We require great sacrifice from our applicants in order to demonstrate their zeal and commitment. Be warned, once started there is no going back.",

        "Ha, do not look so proud after taking only your first step along the path.  A single sacrifice means little to those who have cast aside as much as we in order to sit at the great table of the Dungeon Masters guild hall. Believe me, the hardest steps are still to come.",

        "I can see it now, the doubt creeping upon your face as you cast aside your worldly possessions. Is it worth it? Hmph, it is far too late for such questions.",

        "This Guild has existed for thousands of years, seeking to understand the worlds that exist alongside the one you have known. Some members have been driven mad from the knowledge they have gained here.  I hope for your sake you are not one of them.",

        "There are those that refer to such books as the Necronomicon as 'most terrible', purporting that the knowledge within might usher in the end of times... Ha! Within the guild you will find books such as these are merely the opening notes to a symphony no-one outside has ever heard.",

        "Over half way.. I must admit some small surprise to find you have trodden so far along the path without giving in.. Perhaps you will make it after all.",

        "What ever it was that drove you here, that brought you to our shores, know that none within the guild will ever question you of it or judge you on your past.  We all have our secrets, some no doubt darker than your most fervent nightmares.  They are burnt along with the sacrifices you make here today.",

        "With every sacrifice made I can see the determination within you grow.  Do not let overconfidence be your downfall at this stage, others have made it this far only to fall at the final hurdle.",

        "People believe that we are the figures that hide in the shadows and pull the strings of the worlds leaders.. Let me rid you of this notion now.  We are not the figures in the shadows, we are the shadows themselves.",

        "Your journey along the path is almost complete. One more sacrifice to shed the final chattels of your old life. One more sacrifice to be reborn as a member of the Dungeon Masters guild."
    ]

    function ApplicantsJourneyFlavourText({keys_burnt} : {keys_burnt : number | null})
    {

        if (keys_burnt === null) {
            return(
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> </Text> 
            );
        }
       
        return(
            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> {ApplicantsJourneyFlavourTextArray[keys_burnt]}</Text> 
        );
        
    }

    function ApplicantsJourneyDialogue()
    {
        let key_type = GetKeyName({key_type : burn_key_type});

        return(
            <Box width =  "80%">
                <Center>
                    <VStack spacing="1rem">
                        <div className="font-face-sfpb">   
                            <ApplicantsJourneyFlavourText keys_burnt={keys_burnt}/>
                        </div>
                        <div className="font-face-sfpb">   
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Choose your sacrifice </Text> 
                        </div>
                        <HStack>
                            <Box width="50%">
                                <div className="font-face-sfpb">   
                                    <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Key No. </Text> 
                                </div>
                            </Box>
                            <div className="font-face-sfpb">                                           
                                <NumberInput 
                                    fontSize={DUNGEON_FONT_SIZE} 
                                    color="white"
                                    size="lg"
                                    onChange={(valueString) => setBurnKeyIndex(valueString)}
                                    value={burn_key_index}
                                    precision={0}
                                    borderColor="white"
                                    min={1} max={3500}>
                                    
                                    
                                    <NumberInputField
                                    height={DUNGEON_FONT_SIZE} 
                                    paddingTop="1rem"
                                    paddingBottom="1rem"
                                    borderColor="white"
                                    />
                                </NumberInput>
                            </div>

                           
                        </HStack>

                        {burn_key_index !== "" &&
                            <Box as='button' onClick={Burn} borderColor="white" borderWidth='2px' height={"30px"}>
                                <div className="font-face-sfpb">
                                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Burn</Text>      
                                </div> 
                            </Box>  
                        }
                        {burn_key_index === "" &&
                            <Box borderColor="black" borderWidth='2px' height={"30px"}>
                                <div className="font-face-sfpb">
                                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Burn</Text>      
                                </div> 
                            </Box>  
                        }

                        {burn_error !== null &&
                        <Box width="100%">
                            <div className="font-face-sfpb">   
                                <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> {burn_error} </Text> 
                            </div>
                        </Box>
                        }

                        {burn_key_type !== null && burn_key_type !== KeyType.Unknown &&
                            <Box width="100%">
                                <div className="font-face-sfpb">   
                                    <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> You Have Burnt: {key_type} </Text> 
                                </div>
                            </Box>
                        }


                    </VStack>
                </Center>
            </Box>
        );
    }

    function Dialogue()
    {

  
        if (wallet.publicKey === null || current_fees === null || last_fees === null || founder_fees === null || dm_fees === null) {
            return(<></>);
        }

        let fee_diff = current_fees - last_fees;
        let excess_dm_fees = fee_diff / 3;      
        let excess_fee_per_dm = excess_dm_fees / 250;

 

        console.log(wallet.publicKey.toString());
        console.log("Founder? ", (wallet.publicKey.toString() === FOUNDER_1_KEY.toString() || wallet.publicKey.toString() === FOUNDER_2_KEY.toString()));
        

        if (wallet.publicKey.toString() === FOUNDER_1_KEY.toString() || wallet.publicKey.toString() === FOUNDER_2_KEY.toString()) {
            return(<FoundersDialogue/>);
        }

        console.log("Member Status: ", member_status)

        if (member_status === MemberStatus.unknown) {
            return(
                <Box width = "100%">
                    <Center>
                    <div className="font-face-sfpb">
                        <Text mt = "2rem" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> If you are member you need only speak your name.</Text>
                        <Text mb = "2rem" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> If you are an applicant stay silent.</Text>
                        <Center>
                        <HStack mb = "1rem" alignItems="center">
                            <Box width="50%">
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">I am DM</Text>
                            </Box>
                            <FormControl id="check_dm_name" maxWidth={"300px"} >
                                <Input
                                    height={DUNGEON_FONT_SIZE} 
                                    color="white"
                                    paddingTop="1rem"
                                    paddingBottom="1rem"
                                    borderColor="white"
                                    type="text"
                                    value={dm_name}
                                    onChange={(event : React.ChangeEvent<HTMLInputElement>) => setDMName(event.target.value)}
                                    autoFocus
                                />
                            </FormControl>
                        
                            
                        </HStack>
                        </Center>
                        <Center>
                        <VStack>
                            {dm_name !== "" &&
                                <Box as='button' onClick={CheckMemberStatus} borderColor="white" borderWidth='2px' height={"30px"}>
                                    <div className="font-face-sfpb">
                                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Speak </Text>      
                                    </div> 
                                </Box>  
                            }
                            {dm_name === "" &&
                               <Box as='button' onClick={CheckApplicantStatus} borderColor="white" borderWidth='2px' height={"30px"}>
                                    <div className="font-face-sfpb">
                                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Stay Silent </Text>      
                                    </div> 
                                </Box>  
                            }
                            
                            {dm_error != null &&
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="red"> {dm_error} </Text>    
                            }
                        </VStack>
                        </Center>

                    </div>
                </Center>
                </Box>
            );
        }

        if (member_status === MemberStatus.member) {

            if (dm_index === null || dm_fees_raised === null || current_fees === null)  {
                return(<></>);
            }
            let this_member_fees = bignum_to_num(dm_fees[dm_index]) / LAMPORTS_PER_SOL;
            let this_member_excess = this_member_fees + excess_fee_per_dm;

            if (this_member_excess === undefined)
                return(<></>);

            return(
                <Box width = "100%">
                    <Center>
                        <div className="font-face-sfpb">
                            <VStack>
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Welcome DM {dm_name}. </Text>
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Please help yourself to our records and your share of the guilds proceeds</Text>
                                <Divider/>
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Total Guild Fees Raised: {current_fees.toFixed(5)}</Text>
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Your Total Fees Withdrawn: {dm_fees_raised.toFixed(5)}</Text>

                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Your Outstanding Share: {this_member_excess.toFixed(5)}</Text>

                                <Box as='button' onClick={GetFees} borderColor="white" borderWidth='2px' height={"30px"}>
                                    <div className="font-face-sfpb">
                                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Claim Fees</Text>      
                                    </div> 
                                </Box>   
                            </VStack>
                        </div>
                    </Center>
                </Box>
            );
        }

        console.log("Applicant: ", keys_burnt);
        if (member_status === MemberStatus.applicant && keys_burnt !== null && keys_burnt < DM_KEY_COST) {

            return(<ApplicantsJourneyDialogue/>);
            
        }
        return(
            <>
            <Box width="100%">
                {member_status === MemberStatus.whitelisted &&
                
                    <Box width = "100%" mb = "2rem">
                        <Center>
                            <Box width="100%">
                                <div className="font-face-sfpb">
                                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> It seems you have friends in high places.  Very well.  Proceed. </Text>
                                </div>
                            </Box>
                        </Center>
                    </Box>
                }
                {(member_status === MemberStatus.whitelisted  || (keys_burnt !== null && keys_burnt >= DM_KEY_COST)) &&

                <>

                {member_status !== MemberStatus.whitelisted &&
                    
                    <Box width = "100%" mb = "2rem">
                        <Center>
                            <Box width="100%">
                                <div className="font-face-sfpb">
                                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Your journey is complete.  The life you have known is now over, and a new one begins as a member of the Dungeon Masters guild. </Text>
                                </div>
                            </Box>
                        </Center>
                    </Box>
                }
                <Center mb ="1rem">
                    <VStack>
                        <div className="font-face-sfpb">
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Tell me, what should we call you? </Text> 
                        </div>
                        <HStack>
                            <div className="font-face-sfpb">
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> DM </Text> 
                            </div>
                            <div className="font-face-sfpb">
                            <FormControl id="check_dm_name" maxWidth={"300px"} >
                                <Input
                                    height={DUNGEON_FONT_SIZE} 
                                    color="white"
                                    paddingTop="1rem"
                                    paddingBottom="1rem"
                                    borderColor="white"
                                    type="text"
                                    value={dm_name}
                                    onChange={(event : React.ChangeEvent<HTMLInputElement>) => setDMName(event.target.value)}
                                    autoFocus
                                />
                            </FormControl>
                            </div>
                        
                        
                        </HStack>
                    </VStack>
                </Center>
                <Center mb = "2rem">
                    {dm_name !== "" &&
                        <Box as='button' onClick={Mint} borderColor="white" borderWidth='2px' height={"30px"}>
                            <div className="font-face-sfpb">
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Join </Text>      
                            </div> 
                        </Box>  
                    }
                    {dm_name === "" &&
                        <Box height={"30px"} borderColor="black" borderWidth='2px'>
                            <div className="font-face-sfpb">
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Join </Text>      
                            </div> 
                        </Box>  
                    }
                </Center>
                </>
                }
                <Center mb = "2rem">      
                    {current_dm_image !== null && current_dm_mint !== null &&
                        <>
                        <VStack spacing="3%">
                        <HStack alignItems="center">
                            <Box width="15%">
                                <img style={{"imageRendering":"pixelated"}} src={current_dm_image} width="100" alt={""}/>
                            </Box>
                                        
                                <div className="font-face-sfpb">
                                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Your membership has been completed. </Text>
                                </div>
                        </HStack>
                        <Center>
                        <Box width = "100%">
                        <div className="font-face-sfpb">
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">View it <a className="one" target="_blank" rel="noreferrer" href={"https://explorer.solana.com/address/"+current_dm_mint.toString()+"?cluster=devnet"}>here</a></Text>
                        </div>
                        </Box>
                        </Center>
                        </VStack>
                    
                        </>            
                    }
                </Center>  
            </Box>
            </>
        );
    }

    return(
        <Box width="100%">
            <Center>
                
                <Dialogue/>
            </Center>
        </Box>
       
    );
}

