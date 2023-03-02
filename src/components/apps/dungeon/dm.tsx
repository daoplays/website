import { useCallback, useEffect, useState, useRef } from 'react';
import {
    Box,
    Button,
    HStack,
    Center,
    Text,
    Input,
    FormControl,
    NumberInput,
    NumberInputField,
    VStack
} from '@chakra-ui/react';

import { PublicKey, Keypair, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  } from "@solana/spl-token";

import { DUNGEON_FONT_SIZE, network_string, PROD ,
    PYTH_BTC_DEV, PYTH_BTC_PROD, PYTH_ETH_DEV, PYTH_ETH_PROD, PYTH_SOL_DEV, PYTH_SOL_PROD,
    METAPLEX_META, SYSTEM_KEY, FOUNDER_1_KEY, FOUNDER_2_KEY, DM_PROGRAM, SHOP_PROGRAM, KeyType} from './constants';

import bs58 from "bs58";

import { bignum_to_num, request_token_amount, check_json, request_DM_Manager_data, request_DM_data, serialise_DM_Mint_instruction, serialise_basic_instruction, request_DM_User_data, run_keyData_GPA} from './utils';


import {
    useWallet,
} from '@solana/wallet-adapter-react';


import './css/style.css';
import './css/fonts.css';
import './css/wallet.css';
import { bignum } from '@metaplex-foundation/beet';

const WHITELIST_TOKEN =  new PublicKey("CisHceikLeKxYiUqgDVduw2py2GEK71FTRykXGdwf22h");

const COLLECTION_MASTER = new PublicKey('6LZUp9pMC9pCQGUJe4J74noXg7QU6ecqoYp3NQjCTjuM');
const COLLECTION_META = new PublicKey('Hmtp5iKCciBCYDPdFBhkk74Rg5Y7tCddfKsD89Xv12B2');
const COLLECTION_MINT = new PublicKey('7HGwBBXvpvPjgSCvj3FSiy2CemAd1mXSH51eJA7T45mA');
const KEY_COLLECTION_META = new PublicKey('AD1eii4mdMejHB5PpJu8mCqTEydMY82dDLFdeLVEf5uV');


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
    applicant = 2
    
}

export function DMScreen()
{
    const wallet = useWallet();

    // interval for updating state
    const state_interval = useRef<number | null>(null);
    const check_state = useRef<boolean>(true);
    const check_dm_data = useRef<boolean>(false);


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

            if (last_fees === null || this_last_fees > last_fees) {
                check_state.current = false;
            }

            setCurrentFees(this_current_fees / LAMPORTS_PER_SOL);
            setLastFees(this_last_fees / LAMPORTS_PER_SOL);


            setFounderFees(dm_data.founders_fees);
            setDMFees(dm_data.dm_fees);

 
            // get the user data also
            let dm_user_account = (PublicKey.findProgramAddressSync([wallet.publicKey.toBuffer()], DM_PROGRAM))[0];

            let user_data = await request_DM_User_data(dm_user_account);
            if (user_data !== null) {
                setKeysBurnt(user_data.keys_burnt);
            }
            else {
                setKeysBurnt(0);
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

    }, [wallet, dm_fees_raised, last_fees, dm_name]);

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
            account_vector.push({pubkey: dm_data_account, isSigner: false, isWritable: false});
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

        return(
            <Box width="80%">
                <Center>
                    <div className="font-face-sfpb">
                        <Text mb="2rem" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Welcome Founder!  Please help yourself to our records and your share of the guilds proceeds</Text>
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Total Fees: {current_fees}</Text>
                        <Text mb = "2rem" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> To Claim: {founder_excess}</Text>
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

    function ApplicantsJourneyDialogue()
    {
        let key_type = GetKeyName({key_type : burn_key_type});

        return(
            <Box width =  "80%">
                <Center>
                    <VStack>
                        <div className="font-face-sfpb">   
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Keys Burnt {keys_burnt} </Text> 
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
                        <HStack>
                            {dm_name !== "" &&
                                <Box as='button' onClick={CheckMemberStatus} borderColor="white" borderWidth='2px' height={"30px"}>
                                    <div className="font-face-sfpb">
                                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Speak </Text>      
                                    </div> 
                                </Box>  
                            }
                            {dm_name === "" &&
                               <Box as='button' onClick={() => setMemberStatus(MemberStatus.applicant)} borderColor="white" borderWidth='2px' height={"30px"}>
                                    <div className="font-face-sfpb">
                                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Stay Silent </Text>      
                                    </div> 
                                </Box>  
                            }
                            
                            {dm_error != null &&
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="red"> {dm_error} </Text>    
                            }
                        </HStack>
                        </Center>

                    </div>
                </Center>
                </Box>
            );
        }

        if (member_status === MemberStatus.member) {

            if (dm_index === null)  {
                return(<></>);
            }
            let this_member_fees = bignum_to_num(dm_fees[dm_index]) / LAMPORTS_PER_SOL;
            let this_member_excess = this_member_fees + excess_fee_per_dm;
            return(
                <Box width = "80%">
                    <Center>
                        <div className="font-face-sfpb">
                            <VStack>
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Welcome DM {dm_name}. </Text>
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Please help yourself to our records and your share of the guilds proceeds</Text>
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Total Fees Raised: {current_fees}</Text>
                                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Your Outstanding Share: {this_member_excess}</Text>

                                <Button variant='link' size='lg' onClick={GetFees}>
                                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Get Fees </Text>      
                                </Button>  
                            </VStack>
                        </div>
                    </Center>
                </Box>
            );
        }

        console.log("Applicant: ", keys_burnt);
        if (member_status === MemberStatus.applicant && keys_burnt !== null) {

            if (keys_burnt < 10) {
                return(
                    <ApplicantsJourneyDialogue/>
                );
            }
            else {
                return(
                    <HStack>
                        <div className="font-face-sfpb">
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Desired Name: DM </Text> 
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
                    
                        {dm_name !== "" &&
                            <Box as='button' onClick={Mint} borderColor="white" borderWidth='2px' height={"30px"}>
                                <div className="font-face-sfpb">
                                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Mint DM </Text>      
                                </div> 
                            </Box>  
                        }
                        {dm_name === "" &&
                            <Box height={"30px"} borderColor="black" borderWidth='2px'>
                                <div className="font-face-sfpb">
                                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Mint DM </Text>      
                                </div> 
                            </Box>  
                        }
                    </HStack>
                );
            }
        }

        console.log("Nothing");
        return(<></>);

    }

    return(
        <Box width="100%">
            <Center>
                
                <Dialogue/>
            </Center>
        </Box>
       
    );
}

