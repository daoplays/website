import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {ChakraProvider, theme, Box, HStack, Flex, Button, Text, VStack, Center,
    FormLabel,  FormControl, Input, Select, Divider, Alert, AlertDescription
 } from '@chakra-ui/react';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { deserialize, serialize } from 'borsh';
import { isMobile } from "react-device-detect";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {Card} from 'react-bootstrap';

import * as web3 from '@solana/web3.js';

import {
    ConnectionProvider,
    WalletProvider,
    useConnection,
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

const PROGRAM_KEY = new PublicKey('4xTTRRsDAjme4JoZxQ87czQvmstZ6onJJdNAQXpPw9PA');   
const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111'); 


const VerifyInstruction = {
    submit_program : 0,
    verify_program : 1
}


class Assignable {
    constructor(properties) {
      Object.keys(properties).map((key) => {
        return (this[key] = properties[key]);
      });
    }
  }
  
class SubmitMeta extends Assignable { }
class ProgramMeta extends Assignable { }

class my_u8 extends Assignable { }
class my_u8_array extends Assignable { }

const program_meta_schema = new Map([
    [ProgramMeta, { kind: 'struct', 
    fields: [
        ['test_address', [32]],
        ['last_verified_slot', 'u64'],
        ['verified_code', 'u8'],
        ['data_hash', [32]]
    ] 
    }]
]);

const submit_schema = new Map([
    [SubmitMeta, { kind: 'struct', 
    fields: [
        ['instruction', 'u8'],
        ['address', [32]],
        ['git_repo', 'string'],
        ['git_commit', 'string'],
        ['directory', 'string'],
        ['docker_version', 'string']
    ] 
    }]
]);

const u8_scheme = new Map([
    [my_u8, { kind: 'struct', 
    fields: [
    ['value', 'u8']] }]
]);

const u8_array_scheme = new Map([
    [my_u8_array, { kind: 'struct', 
    fields: [
    ['value', [255]]] }]
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



let intervalId;
function useSolanaAccount() 
{
    const [account, setAccount] = useState(null);

    const { connection } = useConnection();
    const wallet = useWallet();
  
    const init = useCallback(async () => 
    {       
        if (wallet.publicKey) {

            let acc = await connection.getAccountInfo(wallet.publicKey);
            setAccount(acc); 
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

    return { account };
}

let logintervalId;
function useMetaData() 
{
    const [log_message, setLogMessage] = useState(null);
    const [status_code, setStatusCode] = useState(null);
    const [verified_code, setVerifiedCode] = useState(null);


    const { connection } = useConnection();
    const wallet = useWallet();
  


    const init = useCallback(async () => 
    {       
        if (wallet.publicKey) {

            let user_meta_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

            let user_data_account = await connection.getAccountInfo(user_meta_key);

            if (user_data_account != null) {

                const status_code_struct = deserialize(u8_scheme, my_u8, user_data_account.data.slice(0,1));
                const log_len_struct = deserialize(u8_scheme, my_u8, user_data_account.data.slice(1,2));
                const log_array_struct = deserialize(u8_array_scheme, my_u8_array, user_data_account.data.slice(2,257));
                const uint8array = log_array_struct.value.slice(0,log_len_struct.value);

                //console.log("status code ", status_code_struct.value);
                //console.log("log len ", log_len_struct.value);

                var string = new TextDecoder().decode(uint8array);
                //console.log("string ", string.split(/\s+/)[1]);

                setStatusCode(status_code_struct.value);
                setLogMessage(string);

                const programs_address = string.split(/\s+/)[1];

                let test_program_key = new web3.PublicKey(programs_address)
                let program_meta_key = (await PublicKey.findProgramAddress([test_program_key.toBytes()], PROGRAM_KEY))[0];


                let program_data_account = await connection.getAccountInfo(program_meta_key);

                const program_data = deserialize(program_meta_schema, ProgramMeta, program_data_account.data);

                setVerifiedCode(program_data.verified_code);

            }
        }
    }, [wallet, connection]);

    useEffect(() => 
    {
        if (wallet.publicKey && !logintervalId) {
            logintervalId = setInterval(init, 1000);
        }
        else{
            clearInterval(logintervalId);
            logintervalId = null;
        }
    }, [init, wallet]);

    return { log_message, status_code, verified_code };
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

  const { account } = useSolanaAccount();  
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

                      </VStack>
                  </Box>
              </HStack>
        </Box>
        </VStack>
        </>
    );
}


function DockerInfoBlock({which_docker})
{
    return(
        <Flex>
            {which_docker === "solana_1.14.2" && 
                <Card className="text-left" style={{flexDirection: "row"}} >
                    <Card.Body>
                        <Card.Text
                        className="text-body mb-4"
                        style={{ fontSize: "1rem" }}
                        >
                        <br/>
                        <SyntaxHighlighter language="text" style={docco}>
            {
`FROM rust:1.63

RUN sh -c "$(curl -sSfL https://release.solana.com/v1.14.2/install)"
ENV PATH="\${PATH}:/root/.local/share/solana/install/active_release/bin"

RUN solana config set --url https://api.devnet.solana.com`
}
                        </SyntaxHighlighter>
                        Find out more <a href="https://hub.docker.com/repository/docker/daoplays/solana_v1.14.2">here</a>.

                        </Card.Text>
                    </Card.Body>
                </Card>
            }
            
        </Flex>
    );
}
  
function MainFunction()
{
   
    const [program_address, setAddress] = React.useState("")
    const [git_repo, setGitRepo] = React.useState("")
    const [git_commit, setGitCommit] = React.useState("")
    const [directory, setDirectory] = React.useState("")
    const [which_docker, setWhichDocker] = React.useState(null)



    const wallet = useWallet();
    const { connection }  = useConnection();

    const handleAddressChange = (e) => setAddress(e.target.value);
    const handleGitRepoChange = (e) => setGitRepo(e.target.value);
    const handleGitCommitChange = (e) => setGitCommit(e.target.value);
    const handleDirectoryChange = (e) => setDirectory(e.target.value);     
    const handleWhichDocker = (e) => setWhichDocker(e.target.value);
      
    const { status_code, log_message, verified_code } = useMetaData();  




    const register_user = useCallback( async () => 
    {
        
        //let program_address = "7EGMFCt38NyXZHsR7G3JeBgMkNPhGF3z8g1pVLEXPA8Y";
        //let git_repo = "https://github.com/daoplays/solana_examples.git";
        //let git_commit = "f3dd81928e49299f04070dfc58dd5cd3dd48a682";
        //let directory = "charity_auction/program";
        //let which_docker = "solana_v1.14.2";
        
        let program_key = new web3.PublicKey(program_address);
        let program_meta_account = (await PublicKey.findProgramAddress([program_key.toBytes()], PROGRAM_KEY))[0];
        let user_meta_account = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

        
        const instruction_data = new SubmitMeta(
            { 
                instruction: VerifyInstruction.submit_program,
                address: program_key.toBytes(),
                git_repo: git_repo,
                git_commit: git_commit,
                directory: directory,
                docker_version: which_docker
            }
        );

        const data = serialize(submit_schema, instruction_data);

        const submit_instruction = new TransactionInstruction({
            keys: [
                {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                {pubkey: program_meta_account, isSigner: false, isWritable: true},
                {pubkey: user_meta_account, isSigner: false, isWritable: true},

                
                {pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false}

            ],
            programId: PROGRAM_KEY,
            data: data
        });

        let transaction = new Transaction();
      
        transaction.add(submit_instruction);

            try {
                await wallet.sendTransaction(
                transaction,
                connection
                );

        } catch(error) {
            console.log(error);
        }


    },
    [connection, wallet, program_address, git_repo, git_commit, directory, which_docker]
    );

    return(

        <Center>
        <Flex w="100%" mt="2rem" flexDirection="row">

        <Box w="60%" ml="1rem" borderWidth='2px' borderRadius="2rem" p='1rem'>
            {wallet.publicKey &&   
            <>
                <>
                <Text  fontSize="2rem"  textAlign="center">Register</Text>

                <Text  fontSize="1rem"  textAlign="left"><br/>To verify, enter the required data below and click Verify.  It may take up to 5 minutes for verification to complete.  </Text>
                </>
                

                
               

                   
                    <VStack align="left" spacing="1rem">
                    <HStack>
                        <FormControl  mb = "1rem" mt = "1rem" id="program_address" maxWidth={"250px"}>
                            <FormLabel>Program Address</FormLabel>
                            <Input
                                type="text"
                                value={program_address}
                                onChange={handleAddressChange}
                                
                            />
                    
                        </FormControl>

                        
                        </HStack>

                        <VStack>
                        <Select placeholder='Select Docker' onChange={handleWhichDocker}>
                            <option value='solana_1.14.2'>solana v1.14.2</option>
                        </Select>
                        <DockerInfoBlock which_docker = {which_docker}/>
                        </VStack>

                        <HStack>
                        <FormControl  mb = "1rem" mt = "1rem" id="git_repo" maxWidth={"250px"}>
                            <FormLabel>Git Repo</FormLabel>
                            <Input
                                type="text"
                                value={git_repo}
                                onChange={handleGitRepoChange}
                                
                            />
                    
                        </FormControl>
                        <FormControl  mb = "1rem" mt = "1rem" id="git_commit" maxWidth={"250px"}>
                            <FormLabel>Git Commit</FormLabel>
                            <Input
                                type="text"
                                value={git_commit}
                                onChange={handleGitCommitChange}
                                
                            />
                    
                        </FormControl>
                        <FormControl  mb = "1rem" mt = "1rem" id="directory" maxWidth={"250px"}>
                            <FormLabel>Directory</FormLabel>
                            <Input
                                type="text"
                                value={directory}
                                onChange={handleDirectoryChange}
                                
                            />
                    
                        </FormControl>
                        </HStack>
                    
                    {(directory === "" || git_commit === "" || git_repo === "" || which_docker === "" || program_address === "") ?
                    <Button  disabled onClick={register_user} mb = "2rem"  mr = "1rem" width='150px' colorScheme='green' variant='solid'>
                        Verify
                    </Button>

                    :
                    <Button onClick={register_user} mb = "2rem"  mr = "1rem" width='150px' colorScheme='green' variant='solid'>
                        Verify
                    </Button>

                    }

                    </VStack>


                    <Divider mb="1rem" mt = "1rem"/>




                    {verified_code === 0 || verified_code == null?
                    <></>

                    :

                    verified_code === 1 ?

                    <>
                        <Alert status='error'>
                            <AlertDescription>Verification process has not produced a match</AlertDescription>
                        </Alert>
                        <Divider mb="1rem" mt = "1rem"/>

                    </>

                    :

                    verified_code === 2 ?

                    <>
                        <Alert status='warning'>
                            <AlertDescription>Verification was successful, however the program is updatable</AlertDescription>
                        </Alert>
                        <Divider mb="1rem" mt = "1rem"/>

                    </>

                    :

                    <>
                        <Alert status='success'>
                            <AlertDescription>Program verified and immutable!</AlertDescription>
                        </Alert>
                        <Divider mb="1rem" mt = "1rem"/>

                    </>

                    }


                    

                    <Box mt = "2rem">
                        {log_message == null ?
                            <span id="log_span"> Waiting to start verification.  Progress will be updated here. <br /><br /><br /><br /><br /></span>
                        :

                        status_code > 1 ? 
                            <span id="log_span"> 
                                    status code: {status_code} <br/><br/>
                                    {log_message} <br /><br /><br /><br /><br />
                            </span>
                        :

                        <span id="log_span"> 
                            {log_message} <br /><br /><br /><br /><br />
                        </span>

                        }

                    </Box>
                
            </>
            
            }
            {!wallet.publicKey &&   <Text  fontSize="2rem"  textAlign="center"><br/><br/>Connect A Solana Wallet To Verify</Text>}
        </Box>  
        
    
        <Box w="30%" ml="1rem" borderWidth='2px' borderRadius="2rem" p='1rem'>
            <AccountInfo/>
        </Box>
        
        
        </Flex>
        </Center>
    );
}

function Verified()
{
    const network = 'devnet';
    const endpoint = web3.clusterApiUrl(network);
    const wallets = useMemo(() => 
    [
        getPhantomWallet(),
        getSolflareWallet(),
        getSolletWallet({ network }),
        getSolletExtensionWallet({ network }),
    ],
    [network]
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

export default Verified;