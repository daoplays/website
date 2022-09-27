import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {ChakraProvider, theme, Box, HStack, Flex, Button, Text, VStack, Center,
    FormLabel,  FormControl, Input, Select, Divider, Alert, AlertDescription, AlertIcon,
    RadioGroup, Radio, Stack
 } from '@chakra-ui/react';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { deserialize, serialize } from 'borsh';
import { isMobile } from "react-device-detect";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

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

const PROGRAM_KEY = new PublicKey('5iYtT98ucBf5oVC2PicVTHLqFWgCw2CeBQePn9Zg9PWQ');   
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
        ['docker_version', 'string'],
        ['rust_version', 'string'],
        ['solana_version', 'string'],
        ['anchor_version', 'string']
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
            {which_docker === "solana_v1.10.39" && 
                
                        <VStack>
                        <SyntaxHighlighter language="text" style={docco}>
{
`FROM rust:1.63

RUN sh -c "$(curl -sSL https://release.solana.com/v1.10.39/install)"
ENV PATH="\${PATH}:/root/.local/share/solana/install/active_release/bin"
RUN cargo install --git https://github.com/project-serum/anchor --tag v0.25.0 anchor-cli --locked

RUN solana config set --url https://api.devnet.solana.com`
}
                        </SyntaxHighlighter>
                        <Text>
                        Find out more <a href="https://hub.docker.com/repository/docker/daoplays/solana_v1.10.39">here</a>.
                        </Text>
                        </VStack>
                
            }
            
        </Flex>
    );
}

function CustomEnvBlock({rust_version, solana_version, anchor_version})
{

    let anchor_string = `RUN cargo install --git https://github.com/project-serum/anchor --tag v`  + anchor_version + ` anchor-cli --locked`;
    if (anchor_version === "") {
        anchor_string = "";
    }
    return(
        <Flex>
                
            <VStack>
            <SyntaxHighlighter language="text" style={docco}>
{
`FROM rust:`+rust_version+`

RUN sh -c "$(curl -sSL https://release.solana.com/v`+solana_version+`/install)"
ENV PATH="\${PATH}:/root/.local/share/solana/install/active_release/bin"
`
+
anchor_string
+
`
RUN solana config set --url https://api.devnet.solana.com`
}
            </SyntaxHighlighter>
            </VStack>
                
            
            
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
    const [dev_radio, setDevRadio] = React.useState('DockerImage')

    const [rust_version, setRustVersion] = React.useState("1.63")
    const [solana_version, setSolanaVersion] = React.useState("1.10.39")
    const [anchor_version, setAnchorVersion] = React.useState("0.25.0")

    const wallet = useWallet();
    const { connection }  = useConnection();

    const handleAddressChange = (e) => setAddress(e.target.value);
    const handleGitRepoChange = (e) => setGitRepo(e.target.value);
    const handleGitCommitChange = (e) => setGitCommit(e.target.value);
    const handleDirectoryChange = (e) => setDirectory(e.target.value);     
    const handleWhichDocker = (e) => setWhichDocker(e.target.value);

    const handleRustVersionChange = (e) => setRustVersion(e.target.value);
    const handleSolanaVersionChange = (e) => setSolanaVersion(e.target.value);
    const handleAnchorVersionChange = (e) => setAnchorVersion(e.target.value);

     
    const { status_code, log_message, verified_code } = useMetaData();  




    const register_user = useCallback( async () => 
    {
        

        let program_key = new web3.PublicKey(program_address);
        let program_meta_account = (await PublicKey.findProgramAddress([program_key.toBytes()], PROGRAM_KEY))[0];
        let user_meta_account = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], PROGRAM_KEY))[0];

        console.log(which_docker, rust_version, solana_version, anchor_version);
        const instruction_data = new SubmitMeta(
            { 
                instruction: VerifyInstruction.submit_program,
                address: program_key.toBytes(),
                git_repo: git_repo,
                git_commit: git_commit,
                directory: directory,
                docker_version: dev_radio === "DockerImage" ? which_docker : "",
                rust_version: dev_radio === "Custom" ? rust_version : "",
                solana_version: dev_radio === "Custom" ? solana_version : "",
                anchor_version: dev_radio === "Custom" ? anchor_version : ""
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
    [connection, wallet, program_address, git_repo, git_commit, directory, which_docker, rust_version, solana_version, anchor_version, dev_radio]
    );

    return(

        <Center>
        <Flex w="100%" mt="2rem" flexDirection="row">

        <Box w="60%" ml="1rem" borderWidth='2px' borderRadius="2rem" p='1rem'>
            {wallet.publicKey &&   
            <>
                <>
                <Text  fontSize="2rem"  textAlign="center">SolVerified</Text>

                <Text  fontSize="1rem"  textAlign="left"><br/>To verify, enter the required data below and click Verify.  It may take up to 15 minutes for verification to complete.  </Text>
                </>
                
 
                    <VStack align="left" spacing="1rem">

                        <Text  fontSize="1rem"  textAlign="left"><br/>1) Enter the address of the program to verify.  Currently we only support programs on the Solana devnet.  </Text>

                        <HStack>
                            <FormControl  mb = "1rem" mt = "1rem" id="program_address" maxWidth={"450px"}>
                                <FormLabel>Program Address</FormLabel>
                                <Input
                                    type="text"
                                    value={program_address}
                                    onChange={handleAddressChange}
                                    
                                />
                        
                            </FormControl>

                        
                        </HStack>

                        <Divider/>

                        <Text  fontSize="1rem"  textAlign="left"><br/>2) Define your dev environment.  Either select a prebuilt docker image that was used to build/deploy your program, or specify the components individually.  </Text>

                        <Box>
                            <RadioGroup onChange={setDevRadio} value={dev_radio}>
                                <Stack direction='row'>
                                    <Box><Radio value='DockerImage'>Docker Image</Radio></Box>
                                    <Box><Radio value='Custom'>Custom</Radio></Box>
                                </Stack>
                            </RadioGroup>
                        </Box>

                        { dev_radio === "DockerImage" &&
                            <VStack>
                                <Select placeholder='Select Docker' onChange={handleWhichDocker}>
                                    <option value='solana_v1.10.39'>solana v1.10.39</option>
                                </Select>
                                <DockerInfoBlock which_docker = {which_docker}/>
                            </VStack>
                        }

                        { dev_radio === "Custom" &&
                        <VStack align="left">
                        <HStack>
                            <FormControl  mb = "1rem" mt = "1rem" id="rust_version" maxWidth={"200px"}>
                                <FormLabel>Rust version</FormLabel>
                                <Input
                                    type="text"
                                    value={rust_version}
                                    onChange={handleRustVersionChange}
                                    
                                />
                        
                            </FormControl>
                            <FormControl  mb = "1rem" mt = "1rem" id="solana_version" maxWidth={"200px"}>
                                <FormLabel>Solana Version</FormLabel>
                                <Input
                                    type="text"
                                    value={solana_version}
                                    onChange={handleSolanaVersionChange}
                                    
                                />
                        
                            </FormControl>
                            <FormControl  mb = "1rem" mt = "1rem" id="anchor_version" maxWidth={"200px"}>
                                <FormLabel>Anchor Version</FormLabel>
                                <Input
                                    type="text"
                                    value={anchor_version}
                                    onChange={handleAnchorVersionChange}
                                    
                                />
                        
                            </FormControl>
                        </HStack>
                        <CustomEnvBlock rust_version={rust_version}  solana_version={solana_version} anchor_version={anchor_version}/>
                        </VStack>
                        }


                        <Divider/>

                        <Text  fontSize="1rem"  textAlign="left"><br/>3) Define how to access the code.  We currently only support git repositories.  The directory is the location within the git repo where the build and deploy occurs, if this is the root directory just enter / </Text>

                        <HStack>
                            <FormControl  mb = "1rem" mt = "1rem" id="git_repo" maxWidth={"300px"}>
                                <FormLabel>Git Repo</FormLabel>
                                <Input
                                    type="text"
                                    value={git_repo}
                                    onChange={handleGitRepoChange}
                                    
                                />
                        
                            </FormControl>
                            <FormControl  mb = "1rem" mt = "1rem" id="git_commit" maxWidth={"300px"}>
                                <FormLabel>Git Commit</FormLabel>
                                <Input
                                    type="text"
                                    value={git_commit}
                                    onChange={handleGitCommitChange}
                                    
                                />
                        
                            </FormControl>
                            <FormControl  mb = "1rem" mt = "1rem" id="directory" maxWidth={"300px"}>
                                <FormLabel>Directory</FormLabel>
                                <Input
                                    type="text"
                                    value={directory}
                                    onChange={handleDirectoryChange}
                                    
                                />
                        
                            </FormControl>
                        </HStack>
                    
                    {(directory === "" || git_commit === "" || git_repo === "" ||  program_address === "" || (which_docker === "" && rust_version === "" && solana_version === "")) ?
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
                            <AlertIcon />
                            <AlertDescription>Verification process has not produced a match</AlertDescription>
                        </Alert>
                        <Divider mb="1rem" mt = "1rem"/>

                    </>

                    :

                    verified_code === 2 ?

                    <>
                        <Alert status='warning'>
                            <AlertIcon />
                            <AlertDescription>Verification was successful, however the program is updatable</AlertDescription>
                        </Alert>
                        <Divider mb="1rem" mt = "1rem"/>

                    </>

                    :

                    <>
                        <Alert status='success'>
                            <AlertIcon />
                            <AlertDescription>Program verified and immutable!</AlertDescription>
                        </Alert>
                        <Divider mb="1rem" mt = "1rem"/>

                    </>

                    }


                    

                    <Box mt = "2rem">
                        {log_message == null ?
                            <span id="log_span"> Waiting to start verification.  Progress will be updated here. <br /><br /><br /><br /><br /></span>
                        :

                        status_code >= 100 ?
                            <Alert status='error'>
                                <AlertIcon />
                                <AlertDescription>{log_message}</AlertDescription> 
                            </Alert>

                          
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