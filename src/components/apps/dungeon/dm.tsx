import { useCallback, useEffect, useState, useRef } from 'react';
import {
    Box,
    Button,
    HStack,
    Center,
    Text,
    Input,
    FormControl
} from '@chakra-ui/react';

import { PublicKey, Keypair, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  } from "@solana/spl-token";

import { DUNGEON_FONT_SIZE, network_string, PROD ,
    PYTH_BTC_DEV, PYTH_BTC_PROD, PYTH_ETH_DEV, PYTH_ETH_PROD, PYTH_SOL_DEV, PYTH_SOL_PROD,
    METAPLEX_META, SYSTEM_KEY, FOUNDER_1_KEY, FOUNDER_2_KEY, DM_PROGRAM} from './constants';

import bs58 from "bs58";

import { bignum_to_num, request_token_amount, check_json, request_DM_Manager_data, request_DM_data, serialise_DM_Mint_instruction, serialise_basic_instruction} from './utils';


import {
    useWallet,
} from '@solana/wallet-adapter-react';


import './css/style.css';
import './css/fonts.css';
import './css/wallet.css';
import { bignum } from '@metaplex-foundation/beet';

const WHITELIST_TOKEN =  new PublicKey("CisHceikLeKxYiUqgDVduw2py2GEK71FTRykXGdwf22h");

const COLLECTION_MASTER = new PublicKey('4rFN8xBkiyp5wkz1D2EbYTN9uKFZLYiQ1PJCpYnLTQuk');
const COLLECTION_META = new PublicKey('tGyAAng2H7oi6fp2Ym3eSoZUa14ixYREYpURe7eRJdN');
const COLLECTION_MINT = new PublicKey('651BUDQz6k3jzBf21UxGGJxsjcjypBpujKXjfYGj3TBR');


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

    const [last_fees, setLastFees] = useState<number | null>(null);
    const [current_fees, setCurrentFees] = useState<number | null>(null);
    const [founder_fees, setFounderFees] = useState<bignum[] | null>(null);
    const [dm_fees, setDMFees] = useState<bignum[] | null>(null);

    // saving DM name
    const [dm_name, setDMName] = useState<string>("");

    const [member_status, setMemberStatus] = useState<MemberStatus>(MemberStatus.unknown);
    const [dm_mint, setDMMint] = useState<PublicKey | null>(null);
    const [dm_index, setDMIndex] = useState<number | null>(null);
    const [dm_error, setDMError] = useState<string | null>(null);



    const check_dm_state = useCallback(async() => 
    {
        

        if (!wallet.publicKey)
            return;

        if (check_state.current === false)
            return;


        let program_data_key = (PublicKey.findProgramAddressSync([Buffer.from("data_account")], DM_PROGRAM))[0];

        let dm_data = await request_DM_Manager_data(program_data_key);

        // if the shop hasn't been set up yet just return
        if (dm_data === null){
            return;
        }

        let current_fees = bignum_to_num(dm_data.total_fees);

        let last_fees = bignum_to_num(dm_data.last_fees);

        console.log(current_fees);
        console.log(last_fees);

        setCurrentFees(current_fees / LAMPORTS_PER_SOL);
        setLastFees(last_fees / LAMPORTS_PER_SOL);


        setFounderFees(dm_data.founders_fees);
        setDMFees(dm_data.dm_fees);

  
        check_state.current = false;

    }, [wallet]);

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
        setMemberStatus(MemberStatus.member);


    },[wallet, dm_name, ]);

    function Dialogue()
    {

        

        if (wallet.publicKey === null || current_fees === null || last_fees === null || founder_fees === null || dm_fees === null) {
            return(<></>);
        }

        let fee_diff = current_fees - last_fees;
        let excess_founder_fees = 2 * fee_diff / 3;
        let excess_dm_fees = fee_diff / 3;

        let excess_fee_per_founder = excess_founder_fees / 2;
        let excess_fee_per_dm = excess_dm_fees / 250;

 

        console.log(wallet.publicKey.toString());
        console.log(FOUNDER_1_KEY.toString());
        console.log(FOUNDER_2_KEY.toString());
        console.log((wallet.publicKey.toString() === FOUNDER_1_KEY.toString() || wallet.publicKey.toString() === FOUNDER_2_KEY.toString()));


        if (wallet.publicKey.toString() === FOUNDER_1_KEY.toString() || wallet.publicKey.toString() === FOUNDER_2_KEY.toString()) {

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
                <div className="font-face-sfpb">
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Welcome Founder!  Please help yourself to our records and your share of the guilds proceeds</Text>
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Current Fees: {current_fees}</Text>
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">  Last Fees: {last_fees}</Text>
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Founders Fees: {bignum_to_num(founder_fees[0]) / LAMPORTS_PER_SOL}  {bignum_to_num(founder_fees[1]) / LAMPORTS_PER_SOL}</Text>
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> To Claim: {founder_excess}</Text>

                <Button variant='link' size='lg' onClick={GetFees}>
                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Get Fees </Text>      
                </Button>  
                </div>
            );
        }

        if (member_status === MemberStatus.unknown) {
            return(
                <div className="font-face-sfpb">
                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> If you are member you need only speak your name. If you are an applicant stay silent.</Text>
                    <HStack>
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">I am DM</Text>
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
                        {dm_name !== "" &&
                            <Box as='button' onClick={CheckMemberStatus} borderColor="white" borderWidth='2px' height={"30px"}>
                                <div className="font-face-sfpb">
                                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Speak </Text>      
                                </div> 
                            </Box>  
                        }
                        {dm_name === "" &&
                            <Box height={"30px"} borderColor="black" borderWidth='2px'>
                                <div className="font-face-sfpb">
                                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Speak </Text>      
                                </div> 
                            </Box>  
                        }
                        
                    </HStack>
                    <Box as='button' onClick={() => setMemberStatus(MemberStatus.applicant)} borderColor="white" borderWidth='2px' height={"30px"}>
                        <div className="font-face-sfpb">
                            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Stay Silent </Text>      
                        </div> 
                    </Box>  
                    {dm_error != null &&
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="red"> {dm_error} </Text>    
                    }

                </div>
            );
        }

        if (member_status === MemberStatus.member) {

            if (dm_index === null)  {
                return(<></>);
            }
            let this_member_fees = bignum_to_num(dm_fees[dm_index]) / LAMPORTS_PER_SOL;
            let this_member_excess = this_member_fees + excess_fee_per_dm;
            return(
                <div className="font-face-sfpb">
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Welcome Founder!  Please help yourself to our records and your share of the guilds proceeds</Text>
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Current Fees: {current_fees}</Text>
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Last Fees: {last_fees}</Text>
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> To Claim: {this_member_excess}</Text>

                <Button variant='link' size='lg' onClick={GetFees}>
                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white"> Get Fees </Text>      
                </Button>  
                </div>
            );
        }

        if (member_status === MemberStatus.applicant) {
            
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

