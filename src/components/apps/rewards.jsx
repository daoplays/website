import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {ChakraProvider, theme, Box, HStack, Flex, Button, Text, VStack, Center, Alert, AlertIcon, Divider, AlertTitle, AlertDescription, RadioGroup, Radio, Stack,
    FormLabel,  FormControl, Input,  Tooltip, Select
 } from '@chakra-ui/react';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { struct, u64, u8 } from "@project-serum/borsh";
import BN from "bn.js";
import { deserialize, serialize } from 'borsh';
import { isMobile } from "react-device-detect";

import * as web3 from '@solana/web3.js';

import {
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  } from "@solana/spl-token";
  
import {
    ConnectionProvider,
    WalletProvider,
    useConnection,
    useWallet,
} from '@solana/wallet-adapter-react';
import {
    WalletModalProvider,
    WalletMultiButton,
    WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css');

const MINT_ACCOUNT = new web3.PublicKey("ESxUiMdmrZzJBk1JryJyVpD2ok9cheTV43H1HXEy8n5x");
const DAOPLAYS_KEY = new web3.PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD");
const PROGRAM_KEY = new PublicKey('4jvaAM7NpyXxFHjELkkEAMQ7jUPe9FuA6kUqj2FSMuHS');   
const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111'); 


const TwitterInstruction = {
    init_program : 0,
    register : 1,
    create_user_account : 2,
    new_follower : 3,
    set_error : 4,
    check_follower : 5,
    check_hashtag : 6,
    send_tokens : 7,
    check_retweet : 8,
    set_user_id : 9
}

const RegisterData = struct([
    u8("instruction"),
    u64("tweet_id")
]);

const CreateAccountData = struct([
    u8("instruction")
]);

class Assignable {
    constructor(properties) {
      Object.keys(properties).map((key) => {
        return (this[key] = properties[key]);
      });
    }
  }
  
class IDMap extends Assignable { }
class HashTagMeta extends Assignable { }
class UserData extends Assignable { }


const id_map_schema = new Map([
    [IDMap, { kind: 'struct', 
    fields: [
        ['twitter_id', 'u64'], 
        ['error_code', 'u8']
    ] 
    }]
]);

const user_data_schema = new Map([
    [UserData, { kind: 'struct', 
    fields: [
        ['account_key', [32]], 
        ['last_time', 'u64'],
        ['follow', 'u8']
    ] 
    }]
]);

const hashtag_meta_schema = new Map([
    [HashTagMeta, { kind: 'struct', 
    fields: [
        ['instruction', 'u8'],
        ['tweet_id', 'u64'], 
        ['hashtag', 'string']
    ] 
    }]
]);


function WalletNotConnected() 
{
    return (
        <Box mb  = "10px"  mt = "1rem">
            
            <Center>
                    <WalletMultiButton />
            </Center>

        </Box>
    );
}

function WalletConnected() 
{

    return (
        <Box mb  = "10px"  mt = "1rem">
             
            <Center>
                    <WalletDisconnectButton />
               
            </Center>
        </Box>
    );
}


let dataId;
function useIDMap() 
{
    const [error_code, setErrorCode] = useState(null);
    const [twitter_id, setTwitterID] = useState(null);
    const [follow, setFollow] = useState(-1);
    

    const { connection } = useConnection();
    const wallet = useWallet();
  
    console.log("in use id map");
    const init = useCallback(async () => 
    {       
        if (wallet.publicKey) {

            let user_id_map_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

            try {
                let user_id_map_data_account = await connection.getAccountInfo(user_id_map_key);

                if (user_id_map_data_account != null) {
                    const id_map = deserialize(id_map_schema, IDMap, user_id_map_data_account.data);

                    console.log("error code ", id_map.error_code);
                    console.log("id: ", id_map.twitter_id.toString());

                    setErrorCode(id_map.error_code);
                    setTwitterID(id_map.twitter_id);

                    if (id_map.twitter_id > 0) {

                        console.log("get data account");
                        let id_buffer = id_map.twitter_id.toArrayLike(Buffer, 'le', 8);
                        let user_data_key = (await PublicKey.findProgramAddress([id_buffer], PROGRAM_KEY))[0];
        
                        console.log(user_data_key.toString());

                        let user_data_account = await connection.getAccountInfo(user_data_key);

                        if (user_data_account != null) {
                            const user_data = deserialize(user_data_schema, UserData, user_data_account.data);
                            setFollow(user_data.follow);
                        }
                        else {
                            setFollow(null);
                        }

                    }
                    else {
                        setFollow(null);
                    }
                }
                else {
                    setErrorCode(null);
                    setTwitterID(null);
                    setFollow(null);
                }

            }
            catch(error) {
                console.log(error);
                setErrorCode(null);
                setTwitterID(null);
                setFollow(null);
            } 
        }

    }, [wallet, connection]);

    useEffect(() => 
    {
        console.log("in use effect");
        if (wallet.publicKey && !dataId) {
            dataId = setInterval(init, 1000);
        }
        else{
            clearInterval(dataId);
            dataId = null;
        }
    }, [init, wallet]);

    return { error_code, twitter_id, follow };
}


let intervalId;
function useSolanaAccount() 
{
    const [account, setAccount] = useState(null);
    const [supporter_amount, setSupporterAmount] = useState(null);

    const { connection } = useConnection();
    const wallet = useWallet();
  
    const init = useCallback(async () => 
    {       
        if (wallet.publicKey) {

            let acc = await connection.getAccountInfo(wallet.publicKey);
            setAccount(acc);
          
              
              let supporter_pubkey = await getAssociatedTokenAddress(
                    MINT_ACCOUNT, // mint
                    wallet.publicKey, // owner
                    false // allow owner off curve
              );

              try {
                  let aWalletMyTokenBalance = await connection.getTokenAccountBalance(
                      supporter_pubkey
                  );
                  let token_amount = aWalletMyTokenBalance["value"].amount;
                  let decimals = aWalletMyTokenBalance["value"].decimals;
                  let token_decs = token_amount / 10.0**decimals;
                  setSupporterAmount(token_decs)
              }
              catch(error) {
                  console.log(error);
                  setSupporterAmount(null)
              }   
        }



    }, [wallet, connection]);

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

    return { account, supporter_amount };
}


export function AirDropApp() 
{
  const wallet = useWallet();
    return (
  
        <Box textAlign="center" fontSize="l">
          {wallet.publicKey &&  
          
              <WalletConnected/>
          
          }


            {!wallet.publicKey && <WalletNotConnected />}

        </Box>

      
    );
}


export function AccountInfo() 
{

  const { account, supporter_amount} = useSolanaAccount();  
    return (
      <>
      <VStack>
      <AirDropApp/>
        <Box textAlign="center" fontSize="l">
        <Text fontSize="17" mt="1rem" mb = "1rem">
              {"Your Account Details"}
          </Text>
          <HStack>
          
                  <Box fontSize="17" textAlign = "left" >
                      
                      <VStack alignItems="start">

                          <Text >
                              {"SOL Balance"}
                          </Text>

                          <Box></Box>
                          <Box></Box>

                          <Tooltip hasArrow label='Supporter Tokens will be sent as a thank you for following/using our hashtags!'>
                          <Text>
                              {"Supporter Tokens"}
                          </Text>
                          </Tooltip>
                      </VStack>
                  </Box>
                  <Box fontSize="17">
                      <VStack>
                          
                          <FormControl id="balance" maxWidth={"175px"}>
                              <Input
                                  type="text"
                                  value={
                                      account
                                      ? account.lamports / web3.LAMPORTS_PER_SOL
                                      : "Loading.."
                                  }
                                  readOnly
                          />
                          </FormControl>

                          <FormControl  id="supporterbalance" maxWidth={"175px"}>
                              <Input
                                  type="text"
                                  value={
                                      supporter_amount
                                      ? supporter_amount
                                      : '0'
                                  }
                                  readOnly
                              />
                          </FormControl>
                      </VStack>
                  </Box>
              </HStack>
        </Box>
        </VStack>
        </>
    );
}

function MainFunction()
{
    const [radio, setRadio] = useState('Follow')
    const [tweet_id, setTweetID] = React.useState('')
    const [hashtag, setHashtag] = React.useState('')

      const handleWhichHashtag = (event) => {
        setHashtag(event.target.value);
      };

    const handleTweetIDChange = (e) => setTweetID(e.target.value)


    const wallet = useWallet();
    const { connection }  = useConnection();
    const { error_code, twitter_id, follow} = useIDMap();  

    const register_user = useCallback( async () => 
    {
          console.log("tweet_id:", tweet_id);

          let user_token_key = await getAssociatedTokenAddress(
              MINT_ACCOUNT, // mint
              wallet.publicKey, // owner
              false // allow owner off curve
          );
      
          let user_id_map_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];


          const data = Buffer.alloc(RegisterData.span);
          let tweet_bn = new BN(tweet_id, 10);      

          RegisterData.encode(
              {
                  instruction: TwitterInstruction.register,
                  tweet_id: tweet_bn
              },
              data
          );

          console.log("wallet: ",  wallet.publicKey.toString());
          console.log("user_token_key: ", user_token_key.toString());
          console.log("user_id_map_key: ", user_id_map_key.toString());
          console.log("daoplays: ", DAOPLAYS_KEY.toString());
          console.log("token mint: ", MINT_ACCOUNT.toString());


          const register_instruction = new TransactionInstruction({
              keys: [
                  {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                  {pubkey: user_token_key, isSigner: false, isWritable: true},
                  {pubkey: user_id_map_key, isSigner: false, isWritable: true},
 
                  {pubkey: DAOPLAYS_KEY, isSigner: false, isWritable: true},
                  {pubkey: MINT_ACCOUNT, isSigner: false, isWritable: false},

                  {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                  {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                  {pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false}

              ],
              programId: PROGRAM_KEY,
              data: data
          });


          let transaction = new Transaction();
          
          transaction.add(register_instruction);
  
            try {
                await wallet.sendTransaction(
                  transaction,
                  connection
                );

          } catch(error) {
              console.log(error);
          }

    },
    [connection, wallet, tweet_id]
    );


    const create_data_account = useCallback( async () => 
    {
          


          let user_id_map_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

          let transaction = new Transaction();
          

          const create_account_data = Buffer.alloc(CreateAccountData.span);
          CreateAccountData.encode(
            {
                instruction: TwitterInstruction.create_user_account
            },
            create_account_data
        );

        let id_buffer = twitter_id.toArrayLike(Buffer, 'le', 8);

        let user_data_key = (await PublicKey.findProgramAddress([id_buffer], PROGRAM_KEY))[0];

        const create_account_instruction = new TransactionInstruction({
            keys: [
                {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                {pubkey: user_data_key, isSigner: false, isWritable: true},
                {pubkey: user_id_map_key, isSigner: false, isWritable: true},


                {pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false}

            ],
            programId: PROGRAM_KEY,
            data: create_account_data
        });
          
        transaction.add(create_account_instruction);
  
            try {
                await wallet.sendTransaction(
                transaction,
                connection
                );

        } catch(error) {
            console.log(error);
        }

    },
    [connection, wallet, twitter_id]
    );


    const submit_follow = useCallback( async () => 
    {
          


          let transaction = new Transaction();
          

          const check_follower_data = Buffer.alloc(CreateAccountData.span);
          CreateAccountData.encode(
            {
                instruction: TwitterInstruction.check_follower
            },
            check_follower_data
        );

        const check_follower_instruction = new TransactionInstruction({
            keys: [
                {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                {pubkey: DAOPLAYS_KEY, isSigner: false, isWritable: true},

                {pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false}

            ],
            programId: PROGRAM_KEY,
            data: check_follower_data
        });
          
        transaction.add(check_follower_instruction);
  
            try {
                await wallet.sendTransaction(
                transaction,
                connection
                );

        } catch(error) {
            console.log(error);
        }

    },
    [connection, wallet]
    );



    const submit_hashtag = useCallback( async () => 
    {
        console.log("tweet_id:", tweet_id);

        let user_id_map_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

        try {

            let tweet_bn = new BN(tweet_id, 10);  
            let tweet_buffer = tweet_bn.toArrayLike(Buffer, 'le', 8);
            let id_buffer = twitter_id.toArrayLike(Buffer, 'le', 8);

            let hashtag_bytes = Buffer.from(hashtag); 
            console.log("key1: ", hashtag, hashtag_bytes);
            console.log("key2: ", tweet_id, tweet_buffer);
            console.log("key3: ", id_buffer);



            let hashtag_data_key = (await PublicKey.findProgramAddress([hashtag_bytes, tweet_buffer, id_buffer], PROGRAM_KEY))[0];

            console.log("data key: ", hashtag_data_key.toString());


            const instruction_data = new HashTagMeta(
                { 
                    instruction: TwitterInstruction.check_hashtag, 
                    tweet_id: tweet_bn,
                    hashtag: hashtag
                    
                }
            );

            const data = serialize(hashtag_meta_schema, instruction_data);
            console.log(data); 
            
            const hashtag_instruction = new TransactionInstruction({
                keys: [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                    {pubkey: user_id_map_key, isSigner: false, isWritable: false},
                    {pubkey: hashtag_data_key, isSigner: false, isWritable: true},
   
                    {pubkey: DAOPLAYS_KEY, isSigner: false, isWritable: true},
  
                    {pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false}
  
                ],
                programId: PROGRAM_KEY,
                data: data
            });

            let transaction = new Transaction();
          
            transaction.add(hashtag_instruction);
    
                try {
                    await wallet.sendTransaction(
                    transaction,
                    connection
                    );

            } catch(error) {
                console.log(error);
            }
            

        } catch(error) {
            console.log(error);
        }

    },
    [connection, wallet, hashtag, tweet_id, twitter_id]
    );

    const submit_retweet = useCallback( async () => 
    {
        console.log("tweet_id:", tweet_id);

        let user_id_map_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

        try {

            let hashtag = "retweet";
            let tweet_bn = new BN(tweet_id, 10);  
            let tweet_buffer = tweet_bn.toArrayLike(Buffer, 'le', 8);
            let id_buffer = twitter_id.toArrayLike(Buffer, 'le', 8);

            let hashtag_bytes = Buffer.from(hashtag); 
            console.log("key1: ", hashtag, hashtag_bytes);
            console.log("key2: ", tweet_id, tweet_buffer);
            console.log("key3: ", id_buffer);



            let hashtag_data_key = (await PublicKey.findProgramAddress([hashtag_bytes, tweet_buffer, id_buffer], PROGRAM_KEY))[0];

            console.log("data key: ", hashtag_data_key.toString());


            const instruction_data = new HashTagMeta(
                { 
                    instruction: TwitterInstruction.check_retweet, 
                    tweet_id: tweet_bn,
                    hashtag: hashtag
                    
                }
            );

            const data = serialize(hashtag_meta_schema, instruction_data);
            console.log(data); 
            
            const hashtag_instruction = new TransactionInstruction({
                keys: [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                    {pubkey: user_id_map_key, isSigner: false, isWritable: false},
                    {pubkey: hashtag_data_key, isSigner: false, isWritable: true},
   
                    {pubkey: DAOPLAYS_KEY, isSigner: false, isWritable: true},
  
                    {pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false}
  
                ],
                programId: PROGRAM_KEY,
                data: data
            });

            let transaction = new Transaction();
          
            transaction.add(hashtag_instruction);
    
                try {
                    await wallet.sendTransaction(
                    transaction,
                    connection
                    );

            } catch(error) {
                console.log(error);
            }
            

        } catch(error) {
            console.log(error);
        }

    },
    [connection, wallet, tweet_id, twitter_id]
    );

    return(

        <Center>
        <Flex w="100%" mt="2rem" flexDirection="row">

        <Box w="60%" ml="1rem" borderWidth='2px' borderRadius="2rem" p='1rem'>
            {wallet.publicKey &&   
            <>
                {follow == null || error_code === 100  || error_code === 101 ?
                <>
                <Text  fontSize="2rem"  textAlign="center">Register</Text>

                <Text  fontSize="1.5rem"  textAlign="left">Step 1</Text>

                <Text  fontSize="1rem"  textAlign="left"><br/>To register, first enter the id of the tweet that contains the public key of your SOL account and click Register to associate your key with your twitter id.  </Text>
                </>
                :

                follow === -1 ?

                <Text mb="2rem" fontSize="1rem"  textAlign="center"><br/></Text>

                :

                <Text  mb="2rem" fontSize="2rem"  textAlign="center">Claim Rewards</Text>

                }
               

                    { follow === -1 ?

                        <Box></Box>
                    :   


                    error_code === 101 ?

                    <VStack align="left" spacing="1rem">
                        <FormControl  mb = "1rem" mt = "1rem" id="tweet_id" maxWidth={"250px"}>
                            <FormLabel>Tweet ID</FormLabel>
                            <Input
                                type="text"
                                value={tweet_id}
                                onChange={handleTweetIDChange}
                                readOnly
                            />
                    
                        </FormControl>


                    <Button disabled onClick={register_user} mb = "2rem"  mr = "1rem" width='150px' colorScheme='green' variant='solid'>
                        Register
                    </Button>

                    <Divider />

                    <Text  mt = "1rem" fontSize="1.5rem"  textAlign="left">Step 2</Text>

                    <Text  fontSize="1rem"  textAlign="left"><br/>Click the button below to create the data account required by the program </Text>

                    <Button onClick={create_data_account} mt = "1rem" mb = "1rem"  mr = "1rem" width='200px' colorScheme='green' variant='solid'>
                        Create Data Account
                    </Button>
                    </VStack>

                    :
                    
                    
                    follow == null || error_code === 100  ?

                    <>
                    <VStack align="left" spacing="1rem">
                        <FormControl  mb = "1rem" mt = "1rem" id="tweet_id" maxWidth={"250px"}>
                            <FormLabel>Tweet ID</FormLabel>
                            <Input
                                type="text"
                                value={tweet_id}
                                onChange={handleTweetIDChange}
                            />
                    
                        </FormControl>


                    <Button onClick={register_user} mb = "2rem"  mr = "1rem" width='150px' colorScheme='green' variant='solid'>
                        Register
                    </Button>

                    <Divider />

                    <Text  mt = "1rem" fontSize="1.5rem"  textAlign="left">Step 2</Text>

                    <Text  fontSize="1rem"  textAlign="left"><br/>Click the button below to create the data account required by the program </Text>

                    <Button disabled onClick={create_data_account} mt = "1rem" mb = "1rem"  mr = "1rem" width='200px' colorScheme='green' variant='solid'>
                        Create Data Account
                    </Button>
                    </VStack>
                    </>

                    :

                        <>
                    <Box>
                        <RadioGroup onChange={setRadio} value={radio}>
                            <Stack direction='row'>
                                <Box><Radio value='Follow'>Follow DaoPlays</Radio></Box>
                                <Box><Radio value='Hashtag'>Hashtag Used</Radio></Box>
                                <Box><Radio value='Retweet'>Retweet</Radio></Box>
                            </Stack>
                        </RadioGroup>
                    </Box>

                    <Box mt = "1rem" mb = "1rem">

                    {radio === 'Follow' ?
                        <>
                        {follow === 0 ?
                        <>
                        <Text  fontSize="1rem"  mb="1rem" textAlign="left"><br/>Follow DaoPlays and receive ten supporter tokens as a reward by clicking the button below! </Text>

                        <Button onClick={submit_follow}  mb = "1rem" mr = "1rem" width='150px' colorScheme='green' variant='solid'>
                            Submit Follow
                        </Button>
                        </>
                        :
                        <Alert status='success'>
                            <AlertIcon />
                            <AlertDescription>Thank you for following DaoPlays!</AlertDescription>
                        </Alert>
                        }
                        </>
                        :
                        radio === 'Hashtag' ?
                        <>
                        <Text  fontSize="1rem"  mb="1rem" textAlign="left"><br/>Use one of the valid hashtags in a tweet to get one supporters token per day as a reward.  Just add the tweet's id, select the relevant hashtag, and click submit </Text>
                        <HStack mb = "1rem" >
                            <FormControl   id="tweet_id" maxWidth={"250px"}>
                                <FormLabel>Tweet ID</FormLabel>
                                <Input
                                    type="text"
                                    value={tweet_id}
                                    onChange={handleTweetIDChange}
                                />
                        
                            </FormControl>

                            <VStack>
                                <Box mb="1.5rem"></Box>
                            <Select placeholder='Select Hashtag' onChange={handleWhichHashtag} maxWidth={"250px"}>
                                <option value='DaoPlaysPokemon'>#DaoPlaysPokemon</option>
                                <option value='DaoPlaysRewards'>#DaoPlaysRewards</option>
                            </Select>
                            </VStack>

                        </HStack>

                        <Button onClick={submit_hashtag}  mb = "1rem" mr = "1rem" width='150px' colorScheme='green' variant='solid'>
                            Submit Hashtag
                        </Button>
                        </>
                        :

                        <>
                        <Text  fontSize="1rem"  mb="1rem" textAlign="left"><br/>Retweet one of DaoPlays' tweets to get one supporter token as a reward.  Just enter the original tweet's id and click submit.  </Text>

                        <HStack mb = "1rem" justify="">
                            <FormControl  id="tweet_id" maxWidth={"250px"}>
                                <FormLabel>Tweet ID</FormLabel>
                                <Input
                                    type="text"
                                    value={tweet_id}
                                    onChange={handleTweetIDChange}
                                />
                    
                            </FormControl>
                        </HStack>

                        <Button onClick={submit_retweet}  mb = "1rem" mr = "1rem" width='150px' colorScheme='green' variant='solid'>
                            Submit Retweet
                        </Button>

                        </>
                    }

                    </Box>
                    </>
                }

                

                <Box mt = "1rem">

                    {error_code == null ?
                        <></>

                    :

                    error_code === 0 ?
                        <></>

                    :
                    

                    error_code === 1 ?
                    <>
                    <Divider mb="1rem"/>
                        <Alert status='error'>
                            <AlertTitle>Error detected!</AlertTitle>
                            <AlertDescription>Your wallet doesn't match the registered key.</AlertDescription>
                        </Alert>
                    </>

                    :

                    error_code === 2 ?
                    <>
                    <Divider mb="1rem"/>
                        <Alert status='error'>
                            <AlertTitle>Error detected!</AlertTitle>
                            <AlertDescription>Submitted Hashtag doesn't match any allowed values</AlertDescription>
                        </Alert>
                        </>
                    :

                    error_code === 3 ?
                    <>
                    <Divider mb="1rem"/>
                        <Alert status='error'>
                            <AlertTitle>Error detected!</AlertTitle>
                            <AlertDescription>Twitter ID of tweet doesn't match user</AlertDescription>
                        </Alert>
                        </>
                    :


                    error_code === 4 ?
                    <>
                    <Divider mb="1rem"/>
                        <Alert status='error'>
                            <AlertTitle>Error detected!</AlertTitle>
                            <AlertDescription>Invalid Hashtag</AlertDescription>
                        </Alert>
                        </>
                    :

                    error_code === 5 ?
                    <>
                    <Divider mb="1rem"/>
                        <Alert status='error'>
                            <AlertTitle>Error detected!</AlertTitle>
                            <AlertDescription>User not following DaoPlays</AlertDescription>
                        </Alert>
                        </>
                    :

                    error_code === 6 ?
                    <>
                    <Divider mb="1rem"/>
                        <Alert status='error'>
                            <AlertTitle>Error detected!</AlertTitle>
                            <AlertDescription>Reward for retweet already sent out</AlertDescription>
                        </Alert>
                        </>
                    :

                    error_code === 100 ?
                    <>
                    <Divider mb="1rem"/>
                        <Alert status='info'>
                            <AlertIcon />
                            <AlertTitle>Registration Submitted:</AlertTitle>
                            <AlertDescription>Waiting for it to be confirmed</AlertDescription>
                        </Alert>
                        </>
                    :

                    <>
                    <Divider mb="1rem"/>
                        <Alert status='info'>
                            <AlertIcon />
                            <AlertTitle>Registration Confirmed:</AlertTitle>
                            <AlertDescription>Click the button above to create data accounts</AlertDescription>
                        </Alert>
                        </>
                    }

                </Box>
                    
                
            </>
            
            }
            {!wallet.publicKey &&   <Text  fontSize="2rem"  textAlign="center"><br/><br/>Connect A Solana Wallet To Take Part</Text>}
        </Box>  
        
    
        <Box w="30%" ml="1rem" borderWidth='2px' borderRadius="2rem" p='1rem'>
            <AccountInfo/>
        </Box>
        
        
        </Flex>
        </Center>
    );
}

function Rewards()
{
    const network = 'devnet';
    const endpoint = web3.clusterApiUrl(network);
    const wallets = useMemo(() => 
    [
    ],
    []
    );


    return(
        <ChakraProvider theme={theme}>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>

                    {!isMobile &&
                    <MainFunction/>
                    }
                    {isMobile &&
                    <Text  fontSize="1rem"  textAlign="left"><br/>Rewards Program currently doesn't support mobile use </Text>
                    }
       
        </WalletModalProvider>
        </WalletProvider>
        </ConnectionProvider>
        </ChakraProvider>

    );
}

export default Rewards;