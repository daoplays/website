import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {ChakraProvider, theme, Box, HStack, Button, Text, VStack, Center,
    FormControl, Input, Tooltip, Tabs, TabList, Tab, TabPanels, TabPanel, Spinner} from '@chakra-ui/react';
 import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
  } from '@chakra-ui/react'
import { serialize, deserialize } from 'borsh';
import {Figure} from 'react-bootstrap';

import { PublicKey, Transaction, TransactionInstruction, Keypair, clusterApiUrl } from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  } from "@solana/spl-token";
import {
    ConnectionProvider,
    useConnection,
    WalletProvider,
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

require('@solana/wallet-adapter-react-ui/styles.css');


const IceCreamInstruction = {
    init : 0,
    create_team : 1,
    create_team_lookup : 2,
    eat : 3
}

class Assignable {
    constructor(properties) {
      Object.keys(properties).map((key) => {
        return (this[key] = properties[key]);
      });
    }
  }

class TeamData extends Assignable { }
class TeamLookupData extends Assignable { }
class TeamMeta extends Assignable { }
class ScoreMeta extends Assignable { }
class MyU64 extends Assignable { }



/* implements
pub struct TeamMeta {
    pub team_name : [u8 ; 256],
    pub name_len : u64,
    // the mint address of this team
    pub mint_address : Pubkey,
    // the teams score
    pub score : u64,
    // the teams index
    pub index : u64
}

, 
        
        ['score', 'u64'], 
        ['mint_address', [32]], 
        ['score', 'u64'], 
        ['index', 'u64']
*/

const team_data_schema = new Map([
  [TeamData, { kind: 'struct', 
  fields: [
        ['team_name', [256]], 
        ['name_len', 'u64'], 
        ['mint_address', [32]],
        ['score', 'u64'], 
        ['index', 'u64']],
    }]
]);


const team_lookup_schema = new Map([
    [TeamLookupData, { kind: 'struct', 
    fields: [
          ['team_account', [32]]],
      }]
  ]);

/* implements
pub struct ScoreMeta {
    // the total number of teams registered
    pub num_teams : u64,
    // the indices of the top ten teams
    pub top_ten_teams : [u64; 10],
    // the scores of the top ten teams
    pub top_ten_scores : [u64; 10],
}
*/

const score_schema = new Map([
    [ScoreMeta, { kind: 'struct', 
    fields: [
          ['num_teams', 'u64'], 
          ['top_ten_teams', [80]], 
          ['top_ten_scores', [80]]],
      }]
  ]);

const team_meta_schema = new Map([
    [TeamMeta, { kind: 'struct', 
    fields: [
          ['instruction', 'u8'], 
          ['team_name', 'string']
        ],
      }]
  ]);

const myu64_schema = new Map([
    [MyU64, { kind: 'struct', 
    fields: [
          ['number', 'u64']
        ],
      }]
  ]);

export function WalletNotConnected() 
{
    return (
        <Box marginBottom  = "10px">
            <HStack spacing='24px'>
                <Box>
                    <WalletMultiButton />
                </Box>
            </HStack>
        </Box>
    );
}

export function WalletConnected() 
{

    return (
        <Box marginBottom  = "10px">
            <HStack spacing='24px'>
                <Box>
                    <WalletDisconnectButton />
                </Box>
            </HStack>
        </Box>
    );
}

let intervalId;
let current_team = ""
function useDataAccount() 
{

    const { connection } = useConnection();

    const [n_teams, setNTeams] = useState(0);
    const [top_team_indices, setTopTeamIndices] = useState([]);
    const [top_team_scores, setTopTeamScores] = useState([]);

    const init = useCallback(async () => 
    {       
        const program_key = new PublicKey(program_pubkey_string);   
        let data_key = (await PublicKey.findProgramAddress(["data_account"], program_key))[0];
        let data_account = await connection.getAccountInfo(data_key);


        const score_data = deserialize(score_schema, ScoreMeta, data_account.data);

        //console.log(score_data);
        //console.log("nteams ", score_data["num_teams"].toNumber());

        let top_team_indices = [];
        let top_team_scores = [];

        for  (let i = 0; i < 10; i++) {
            let team_buffer = score_data["top_ten_teams"].slice(i * 8, (i+1) * 8);
            let score_buffer = score_data["top_ten_scores"].slice(i * 8, (i+1) * 8);

            let team_num = deserialize(myu64_schema, MyU64, team_buffer);
            let score = deserialize(myu64_schema, MyU64, score_buffer);

            if (team_num["number"].toNumber() > 0) {
                //console.log("team: ", i, team_num["number"].toNumber());
                let team_lookup_key = (await PublicKey.findProgramAddress([team_buffer], program_key))[0];
                //console.log("key ", team_lookup_key.toString());
                let team_lookup_account = await connection.getAccountInfo(team_lookup_key);
                const team_lookup_data = deserialize(team_lookup_schema, TeamLookupData, team_lookup_account.data);
                //console.log(team_lookup_data);

                let team_data_key = new PublicKey(team_lookup_data["team_account"]);
                let team_data_account = await connection.getAccountInfo(team_data_key);
                const team_data = deserialize(team_data_schema, TeamData, team_data_account.data);

                //console.log(team_data)
                let name_len = team_data["name_len"].toNumber();
                //let score = team_data["score"].toNumber();
                //let mint_key = new PublicKey(team_data["mint_address"]);

                //console.log("name len ", name_len, "score", score, "mint", mint_key.toString());

                let team_name = new TextDecoder().decode(team_data["team_name"].slice(0,name_len)); 

                top_team_indices.push(team_name);
                top_team_scores.push(score["number"].toNumber());
            }
            else {
                top_team_indices.push("-");
                top_team_scores.push(0);
            }

            //console.log("team num ", team_num["number"].toNumber(), " score ", score["number"].toNumber());

            
        }

        // now sort them by score
        let sorted_top_team_names = [];
        let sorted_top_team_scores = [];

        for  (let i = 0; i < 10; i++) {
            let high_score = -1;
            let team = "";
            let team_index = -1;
            for  (let j = 0; j < 10; j++) {
                if (top_team_scores[j] > high_score) {
                    high_score = top_team_scores[j];
                    team = top_team_indices[j];
                    team_index = j;
                }
            }
            sorted_top_team_names.push(team);
            sorted_top_team_scores.push(high_score);

            top_team_scores[team_index] = -1;

        }
        
        //console.log(top_team_indices);
        //console.log(top_team_scores);
        setTopTeamIndices(sorted_top_team_names);
        setTopTeamScores(sorted_top_team_scores);
        setNTeams(score_data["num_teams"].toNumber());

    }, [connection]);

    useEffect(() => 
    {
        if (!intervalId) {
                intervalId = setInterval(init, 5000);
        }
        else{
            clearInterval(intervalId);
            intervalId = null;
        }
    }, [init]);

    return {n_teams, top_team_indices, top_team_scores};
}

let currentTeamIntervalId;
function useCurrentTeamAccount() 
{

    const { connection } = useConnection();
    const [current_team_score, setCurrentTeamScore] = useState(null);


    const init = useCallback(async () => 
    {       
        const program_key = new PublicKey(program_pubkey_string);   
        
        if (current_team !== "") {

            
            let team_data_key = (await PublicKey.findProgramAddress([current_team], program_key))[0];
            let team_data_account = await connection.getAccountInfo(team_data_key);
            const team_data = deserialize(team_data_schema, TeamData, team_data_account.data);
            let score = team_data["score"].toNumber();
            console.log("current team: ", current_team, score);
            setCurrentTeamScore(score);
        }
        else {
            setCurrentTeamScore(null);
        }


    }, [connection]);

    useEffect(() => 
    {
        if (!currentTeamIntervalId) {
            currentTeamIntervalId = setInterval(init, 5000);
        }
        else{
            clearInterval(currentTeamIntervalId);
            currentTeamIntervalId = null;
        }
    }, [init]);

    return {current_team_score};
}

function sleep(time){
    return new Promise((resolve)=>setTimeout(resolve,time))
}

const program_pubkey_string = "EWGpDRyDoPJ25WNM6UToKsEHcRaraGuPmUXsAQnJxYrc";

function GetTopTen() 
{
    const {n_teams, top_team_indices, top_team_scores}  = useDataAccount();

    return (
        <Center>
        <Box borderWidth='2px' borderRadius="2rem" p='1rem' width='50%' mr="1%" ml="1%" mt = "1rem">  
            <Text mt="2rem" mb="1rem" textAlign="center" fontSize="1.5rem"> Top Ten Teams</Text>
            {n_teams === 0 &&
                <Spinner size='xl' />
            }    
            {n_teams > 0 &&
                <TableContainer>
                    <Table variant='simple'>
                        <Thead>
                            <Tr>
                            <Th>Team Name</Th>
                            <Th>Score</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            <Tr>
                                <Td>{top_team_indices[0]}</Td>
                                <Td>{top_team_scores[0]}</Td>
                            </Tr>
                            <Tr>
                                <Td>{top_team_indices[1]}</Td>
                                <Td>{top_team_scores[1]}</Td>
                            </Tr>
                            <Tr>
                                <Td>{top_team_indices[2]}</Td>
                                <Td>{top_team_scores[2]}</Td>
                            </Tr>
                            <Tr>
                                <Td>{top_team_indices[3]}</Td>
                                <Td>{top_team_scores[3]}</Td>
                            </Tr>
                            <Tr>
                                <Td>{top_team_indices[4]}</Td>
                                <Td>{top_team_scores[4]}</Td>
                            </Tr>
                            <Tr>
                                <Td>{top_team_indices[5]}</Td>
                                <Td>{top_team_scores[5]}</Td>
                            </Tr>
                            <Tr>
                                <Td>{top_team_indices[6]}</Td>
                                <Td>{top_team_scores[6]}</Td>
                            </Tr>
                            <Tr>
                                <Td>{top_team_indices[7]}</Td>
                                <Td>{top_team_scores[7]}</Td>
                            </Tr>
                            <Tr>
                                <Td>{top_team_indices[8]}</Td>
                                <Td>{top_team_scores[8]}</Td>
                            </Tr>
                            <Tr>
                                <Td>{top_team_indices[9]}</Td>
                                <Td>{top_team_scores[9]}</Td>
                            </Tr>
                        </Tbody>
                    </Table>
                </TableContainer>
            }
        </Box>
        </Center>
    );

}

let have_picture = false;
let picture_interval;
function usePicture()
{
    const [picture, setPicture] = useState("");
    const [artist, setArtist] = useState("");
    const [user, setUser] = useState("");


    const init = useCallback(async () => 
    { 
        if (!have_picture) {
//            const image_url = `/.netlify/functions/unsplash`;
  //          let image_result = await fetch(image_url).then((res) => res.json());

            //console.log(image_result["urls"]["regular"]);
    //        setPicture(image_result["urls"]["regular"]);
            setPicture("https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80");
            setArtist("Ian Dooley");
            setUser("https://unsplash.com/@sadswim?utm_source=ice_cream_battle&utm_medium=referral");
            have_picture = true;
        }
    }, []);

    useEffect(() => 
    {
        if (!picture_interval) {
            picture_interval = setInterval(init, 1000);
        }
        else{
            clearInterval(picture_interval);
            picture_interval = null;
        }
    }, [init]);

    return {picture, artist, user};
}



export function IceCreamApp() 
{
    const wallet = useWallet();
    const { connection } = useConnection();

    const {picture, artist, user} = usePicture();
    const {current_team_score}  = useCurrentTeamAccount();

    
    const [check_team_name, setCheckTeamName] = React.useState("")
    const [desired_team_name, setDesiredTeamName] = React.useState("")
    const [existing_mint, setExistingMint] = React.useState("")

    const [team_token, setTeamToken] = React.useState(0)
    const [team_name, setTeamName] = React.useState("")

    const [createProcessing, setCreateProcessing] = useState(false);


    const handleTeamNameChange = (e) => setCheckTeamName(e.target.value)
    const handleDesiredTeamNameChange = (e) => setDesiredTeamName(e.target.value)
    const handleMintChange = (e) => setExistingMint(e.target.value)


    const Create = useCallback( async () => 
    {
            //console.log("team name: ", desired_team_name);
            //console.log("min: ", existing_mint);
            if (desired_team_name === ""){
                return;
            }

            setCreateProcessing(true);

            var team_token_mint_pubkey;
            const team_token_mint_keypair = Keypair.generate();
            var token_is_signer;
            if (existing_mint !== "") {
                team_token_mint_pubkey = new PublicKey(existing_mint);
                token_is_signer = false;
            }
            else {
                //console.log("no mint provided, generating");
                team_token_mint_pubkey = team_token_mint_keypair.publicKey;
                token_is_signer = true;
            }
       
            const program_key = new PublicKey(program_pubkey_string);   
 
            let program_data_key = (await PublicKey.findProgramAddress(["data_account"], program_key))[0];
            let team_data_key = (await PublicKey.findProgramAddress([desired_team_name], program_key))[0];

            let user_token_key = await getAssociatedTokenAddress(
                team_token_mint_pubkey, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );

            const create_team_meta = new TeamMeta({ instruction: IceCreamInstruction.create_team, team_name: desired_team_name.toString() });
            const create_team_data = serialize(team_meta_schema, create_team_meta);


            //console.log(create_team_data);
            //console.log("mint ", team_token_mint_pubkey.toString());
            //console.log("user token ", user_token_key.toString());
            //console.log("program data ", program_data_key.toString());
            //console.log("team data ", team_data_key.toString());

            let system_key = new PublicKey("11111111111111111111111111111111");
            

            const create_team_instruction = new TransactionInstruction({
                keys: [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},

                    {pubkey: team_token_mint_pubkey, isSigner: token_is_signer, isWritable: token_is_signer},
                    {pubkey: user_token_key, isSigner: false, isWritable: token_is_signer},

                    {pubkey: program_data_key, isSigner: false, isWritable: true},
                    {pubkey: team_data_key, isSigner: false, isWritable: true},

                    
                    {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                    {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                    {pubkey: system_key, isSigner: false, isWritable: true}
                ],
                programId: program_key,
                data: create_team_data
            });

            let blockhash_result = await connection.getLatestBlockhash();
            let txArgs = { blockhash: blockhash_result.blockhash, lastValidBlockHeight: blockhash_result.lastValidBlockHeight};

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;
            
            transaction.add(create_team_instruction);

            if (token_is_signer) {
                //console.log("signing with ", team_token_mint_keypair.publicKey.toString());
                transaction.partialSign(team_token_mint_keypair);
            }

            try {

                await wallet.sendTransaction(
                    transaction,
                    connection
                );
               

            } catch(error) {
                console.log(error);
            }

            // we just wait 20 seconds which should be long enough for the transaction to be finalized 
            await sleep(20000);

            let team_data_account = await connection.getAccountInfo(team_data_key);
            const team_data = deserialize(team_data_schema, TeamData, team_data_account.data);

            let index = team_data["index"];

            const team_lookup_index = new MyU64({ number: index});
            const team_lookup_index_data = serialize(myu64_schema, team_lookup_index);

            let team_lookup_key = (await PublicKey.findProgramAddress([team_lookup_index_data], program_key))[0];

            //console.log("team lookup key: ", team_lookup_key.toString());

            const create_team_lookup_meta = new TeamMeta({ instruction: IceCreamInstruction.create_team_lookup, team_name: desired_team_name.toString() });
            const create_team_lookup_data = serialize(team_meta_schema, create_team_lookup_meta);

            const create_team_meta_instruction = new TransactionInstruction({
                keys: [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},

                    {pubkey: team_lookup_key, isSigner: false, isWritable: true},

                    {pubkey: team_data_key, isSigner: false, isWritable: true},

                    {pubkey: system_key, isSigner: false, isWritable: true}

                ],
                programId: program_key,
                data: create_team_lookup_data
            });



            try {
               
                await wallet.sendTransaction(
                    new Transaction().add(create_team_meta_instruction),
                    connection
                );

                
                //console.log(result);

            } catch(error) {
                console.log(error);
            }

            setCreateProcessing(false);

           
            return;
        

    },[wallet, desired_team_name, existing_mint, connection]);

    const Login = useCallback( async () => 
    {

        //console.log("team name: ", check_team_name);

        if (check_team_name !== "") {

            const program_key = new PublicKey(program_pubkey_string);   
 
            let team_data_key = (await PublicKey.findProgramAddress([check_team_name], program_key))[0];
            //console.log("team key: ", team_data_key.toString());

            let team_data_account = await connection.getAccountInfo(team_data_key);
            const team_data = deserialize(team_data_schema, TeamData, team_data_account.data);

            //console.log("team data: ", team_data);
            let name_len = team_data["name_len"].toNumber();
            let mint_key = new PublicKey(team_data["mint_address"]);

            //console.log("name len ", name_len, "score", score, "mint", mint_key.toString());

            let saved_team_name = new TextDecoder().decode(team_data["team_name"].slice(0,name_len)); 
            //console.log(saved_team_name);

            let token_key = await getAssociatedTokenAddress(
                mint_key, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );
            //console.log("token account", token_key.toString());

            let token_balance = await connection.getTokenAccountBalance(
                token_key
            );

            let token_amount = token_balance.value.amount;
            //let decimals = token_balance.value.decimals;
            //console.log("token amount:", token_amount, decimals);

            if (token_amount > 0) {
                setTeamName(saved_team_name);
                setTeamToken(mint_key.toString());
                current_team = saved_team_name;
            }
           
            return;
        }

    },[wallet, check_team_name, connection]);

    const Logout = useCallback( async () => 
    {

        setTeamName("");
        setTeamToken("");   
        
        current_team = "";
           
        return;
        

    },[]);
 


    const Eat = useCallback( async () => 
    {



            const program_key = new PublicKey(program_pubkey_string);   
 
            let program_data_key = (await PublicKey.findProgramAddress(["data_account"], program_key))[0];
            let team_data_key = (await PublicKey.findProgramAddress([team_name], program_key))[0];
            let team_token_key = new PublicKey(team_token);
            let user_token_key = await getAssociatedTokenAddress(
                team_token_key, // mint
                wallet.publicKey, // owner
                true // allow owner off curve
            );

            const eat_meta = new TeamMeta({ instruction: IceCreamInstruction.eat, team_name: team_name.toString() });
            const eat_data = serialize(team_meta_schema, eat_meta);


            //console.log(eat_data);
            //console.log("mint ", team_token_key.toString());
            //console.log("user token ", user_token_key.toString());
            //console.log("program data ", program_data_key.toString());
           // console.log("team data ", team_data_key.toString());
            

            const eat_instruction = new TransactionInstruction({
                keys: [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},

                    {pubkey: team_token_key, isSigner: false, isWritable: false},
                    {pubkey: user_token_key, isSigner: false, isWritable: false},

                    {pubkey: program_data_key, isSigner: false, isWritable: true},
                    {pubkey: team_data_key, isSigner: false, isWritable: true},

                    
                    {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false}

                ],
                programId: program_key,
                data: eat_data
            });


            try {
                await wallet.sendTransaction(
                    new Transaction().add(eat_instruction),
                    connection
                );

            } catch(error) {
                console.log(error);
            }

            have_picture = false;
           
            return;
        

    },[wallet, team_name, team_token, connection]);

    return (
        <Box textAlign="center" fontSize="l">
            {!wallet.publicKey && <Center mb = "2rem"><WalletNotConnected /></Center>}
            {wallet.publicKey &&  <Center mb = "2rem"><WalletConnected /></Center>}
            
            <Tabs isFitted variant='enclosed'>
            <TabList mb='1em'>
                <Tab>Play!</Tab>
                <Tab>Leaderboard</Tab>
            </TabList>
            <TabPanels>
                <TabPanel>
                {!wallet.publicKey &&
                    <Text mt="2rem" mb="1rem" textAlign="center" fontSize="1.5rem">
                        Connect a wallet to get started!
                    </Text>
                }
                {wallet.publicKey && 
                <>

                    <Text mt="2rem" mb="1rem" textAlign="center" fontSize="1.5rem">Step 1: Log in or create a new team</Text>

                    <HStack>
                        <Box borderWidth='2px' borderRadius="2rem" p='1rem' height='17rem' width='50%' mr="1%" ml="1%"  >  

                            {team_name !== "" &&
                            <>
                                <Text mt="2rem" mb="1rem" textAlign="center" fontSize="1.5rem"> {team_name}</Text>
                                <HStack marginBottom  = "10px" >
                                    <VStack alignItems="start">
                                        <Box height="40px">
                                            <Tooltip hasArrow label='Desired Team Name.  Must be unique amongst all existing teams.'> 
                                            <Text mt="7px">
                                                Team Score
                                            </Text>                 
                                            </Tooltip>
                                        </Box>
                                        <Box height="40px">
                                            <Tooltip hasArrow label='Desired Team Name.  Must be unique amongst all existing teams.'> 
                                            <Text mt="7px">
                                            Team Token
                                            </Text>                 
                                            </Tooltip>
                                        </Box>
                                    </VStack>

                                    <VStack>
                                        <Box height="40px" width='450px'>  
                                            {current_team_score != null &&
                                                <FormControl id="check_team_name" maxWidth={"450px"} >
                                                    <Input
                                                        type="text"
                                                        value={current_team_score}
                                                        readOnly
                                                    />
                                                </FormControl>
                                            }
                                            {current_team_score == null &&
                                                <FormControl id="check_team_name" maxWidth={"450px"} >
                                                    <Input
                                                        type="text"
                                                        value="loading.."
                                                        readOnly
                                                    />
                                                </FormControl>
                                            }
                                        </Box>
                                        <Box height="40px" width='450px'>  

                                        <a style={{textDecoration: "underline"}}  href = {'https://solscan.io/account/'+team_token}>
                                            <FormControl id="check_team_name" maxWidth={"450px"} >
                                                <Input
                                                    type="text"
                                                    value={team_token}
                                                    readOnly
                                                />
                                            </FormControl>
                                        </a>
                                        </Box>
                                    </VStack>
                                </HStack>

                                <Button size='md' onClick={Logout}>
                                        Logout
                                </Button>    
                            </>
                            }
                            {team_name === "" &&
                            <>

                                <Text mt="2rem" mb="1rem" textAlign="center" fontSize="1.5rem">Log in</Text>

                                <HStack marginBottom  = "10px" >
                                    <VStack>
                                        <Box height="40px">
                                            <Tooltip hasArrow label='Valid Team Name.  You will need to own the correct token for the team.'> 
                                            <Text mt="7px">
                                                Team Name
                                            </Text>                 
                                            </Tooltip>
                                        </Box>
                                        <Box height="40px"></Box>
                                    </VStack>
                                    <VStack>
                                        <Box height="40px" width='350px'>  
                                            <FormControl id="check_team_name" maxWidth={"350px"} >
                                                <Input
                                                    type="text"
                                                    value={check_team_name}
                                                    onChange={handleTeamNameChange}
                                                />
                                            </FormControl>
                                        </Box>
                                        <Box height="40px" width='350px'>  </Box>
                                    </VStack>
                                </HStack>
                                <Button size='md' onClick={Login}>
                                        Login
                                </Button>
                                </>
                            }
                        </Box>

                        <Box borderWidth='2px' borderRadius="2rem" p='1rem' height='17rem'  width='50%' mr="1%" ml="1%">  
                            <Text mt="2rem" mb="1rem" textAlign="center" fontSize="1.5rem">Create Team</Text>

                            <HStack marginBottom  = "10px" >
                                <VStack>
                                <Box height="40px">
                                    <Tooltip hasArrow label='Desired Team Name.  Must be unique amongst all existing teams.'> 
                                    <Text mt="7px">
                                        Team Name
                                    </Text>                 
                                    </Tooltip>
                                </Box>
                                <Box height="40px">
                                    <Tooltip hasArrow label='(Optional) Pass an existing token mint address to create a team using that token.  It must have zero decimal places, and you must be the mint authority.)'> 
                                    <Text mt="7px">
                                        Token Mint
                                    </Text>                 
                                    </Tooltip>
                                </Box>

                                </VStack>

                                <VStack>
                                <Box height="40px" width='350px'>  
                                    <FormControl id="desired_team_name" maxWidth={"350px"} >
                                        <Input
                                            type="text"
                                            value={desired_team_name}
                                            onChange={handleDesiredTeamNameChange}
                                        />
                                    </FormControl>
                                </Box>
                                <Box height="40px" width='350px'>  
                                    <FormControl id="existing_mint" maxWidth={"350px"} >
                                        <Input
                                            type="text"
                                            value={existing_mint}
                                            onChange={handleMintChange}
                                        />
                                    </FormControl>
                                </Box>
                                </VStack>
                            </HStack>

                            <Button size='md' onClick={Create} isLoading={createProcessing}>
                                    Create
                            </Button>
                        </Box>
                        
                        </HStack>
                        {team_name !== "" &&
                            <>
                                <Text mt="2rem" mb="1rem" textAlign="center" fontSize="1.5rem">Step 2: Eat (Click) the food to score points for your team!</Text>
                                <Center>
                                    <Box width="20%" height="20%" mt="2rem" mb="2rem">
                                        
                                            <Figure>
                                                
                                                <a href='#!'><Figure.Image fluid={true} src={picture} onClick={Eat}/></a>
                                                <Figure.Caption>
                                                    Photo by <a style={{textDecoration: "underline"}}  href = {user}>{artist}</a> on <a style={{textDecoration: "underline"}}  href = {'https://unsplash.com/?utm_source=ice_cream_battle&utm_medium=referral'}>Unsplash</a>
                                                </Figure.Caption>
                                            </Figure>
                                        
                                    </Box>
                                </Center>
                            </>
                        }

                        
                    </>
                    }
                </TabPanel>
                <TabPanel>
                    <GetTopTen/>
                </TabPanel>
            </TabPanels>
            </Tabs>

            
            

        </Box>
    );
}

export function IceCream() {
    const network = 'devnet';
    const endpoint = clusterApiUrl(network);
    const wallets = useMemo(() => 
    [
        getPhantomWallet(),
        getSolflareWallet(),
        getSolletWallet({ network }),
        getSolletExtensionWallet({ network }),
    ],
    [network]
  );

    return (
        <ChakraProvider theme={theme}>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <IceCreamApp />
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </ChakraProvider>
    );
}