import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {Card} from 'react-bootstrap';
import {ChakraProvider, theme, Box, HStack, Flex, Button, Text, VStack, Center,
    FormControl, Input, NumberInput, Slider, NumberInputField, SliderTrack, SliderFilledTrack, SliderThumb, Tooltip, Select, Stat, StatLabel, StatNumber
 } from '@chakra-ui/react';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { struct, u64, u8 } from "@project-serum/borsh";
import BN from "bn.js";
import Plot from 'react-plotly.js';
import { deserialize } from 'borsh';
import { Divider, Alert, AlertIcon } from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used
import { MdFiberManualRecord } from "react-icons/md";

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
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

import {
    WalletModalProvider,
    WalletMultiButton,
    WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';

import UkraineERF_img from "../posts/4_CharityICO/ukraine_logo.jpg"
import WaterOrg_img from "../posts/4_CharityICO/waterorg_logo.jpeg"
import EvidenceAction_img from "../posts/4_CharityICO/evidenceaction_logo.jpeg"
import GWC_img from "../posts/4_CharityICO/girlswhocode_logo.jpeg"
import LifeYouCanSave_img from "../posts/4_CharityICO/thelifeyoucansave_logo.jpeg"
import OneTreePlanted_img from "../posts/4_CharityICO/onetreeplanted_logo.jpg"
import Outright_img from "../posts/4_CharityICO/outrightaction_logo.jpg"


require('@solana/wallet-adapter-react-ui/styles.css');




function WalletNotConnected() 
{
    return (
        <Box mb  = "10px"  mt = "3rem">
            <Center mb="4rem">
                <Text fontSize="2rem">Account Info</Text>
            </Center>
            <Center>
            <HStack spacing='24px'>
                <Box>
                    <WalletMultiButton />
                </Box>
            </HStack>
            </Center>

        </Box>
    );
}

function WalletConnected({publicKey, tokenKey, account, token_amount, supporter_key, supporter_amount}) 
{

    return (
        <Box mb  = "10px"  mt = "3rem">
             <Center mb="3rem">
                <Text fontSize="2rem">Account Info</Text>
            </Center>
            <Center>
            <HStack spacing='24px'>
                <Box>
                    <WalletDisconnectButton />
                </Box>
                <Box>
                    
                </Box>
                <HStack>
                    <Box fontSize="17" textAlign = "left" >
                        <VStack alignItems="start">

                            <Text >
                                {"SOL Balance"}
                            </Text>
                            <Box ></Box>
                            <Box></Box>
                            <Text  >
                                {"Play Tokens"}
                            </Text>
                            <Box></Box>
                            <Box></Box>
                            <Text>
                                {"Supporters Tokens"}
                            </Text>
                           
                        </VStack>
                    </Box>
                    <Box fontSize="17">
                        <VStack>
                            
                            <FormControl id="balance" maxWidth={"250px"}>
                                <Input
                                    type="text"
                                    value={
                                        account
                                        ? account.lamports / web3.LAMPORTS_PER_SOL + ' SOL'
                                        : "Loading.."
                                    }
                                    readOnly
                            />
                            </FormControl>
                            <FormControl  id="tokenbalance" maxWidth={"250px"}>
                                <Input
                                    type="text"
                                    value={
                                    token_amount
                                        ? token_amount + ' DPTT'
                                        : '0 DPTT'
                                    }
                                    readOnly
                                />
                            </FormControl>
                            <FormControl  id="supporterbalance" maxWidth={"250px"}>
                                <Input
                                    type="text"
                                    value={
                                        supporter_amount
                                        ? supporter_amount + ' DPTST'
                                        : '0 DPTST'
                                    }
                                    readOnly
                                />
                            </FormControl>
                        </VStack>
                    </Box>
                </HStack>
            </HStack>
            </Center>
        </Box>
    );
}


const AuctionInstruction = {
    create_data_account : 0,
    place_bid : 1,
    select_winners : 2,
    send_tokens : 3
}

const Charity = {
    UkraineERF : 0,
    WaterOrg : 1,
    OneTreePlanted : 2,
    EvidenceAction : 3,
    GirlsWhoCode : 4,
    OutrightActionInt : 5,
    TheLifeYouCanSave : 6
}

const SelectData = struct([
    u8("instruction")
]);

const BidData = struct([
    u8("instruction"),
    u64("amount_charity"),
    u64("amount_daoplays"),
    u8("charity"),
]);

class Assignable {
    constructor(properties) {
      Object.keys(properties).map((key) => {
        return (this[key] = properties[key]);
      });
    }
  }
  
  class Test extends Assignable { }
  class my_u8 extends Assignable { }
  class my_u16 extends Assignable { }
  class my_u64 extends Assignable { }
  class my_pubkey extends Assignable { }



const schema = new Map([
    [Test, { kind: 'struct', 
    fields: [
    ['charity_0_total', 'u64'], 
    ['charity_1_total', 'u64'], 
    ['charity_2_total', 'u64'], 
    ['charity_3_total', 'u64'], 
    ['charity_4_total', 'u64'], 
    ['charity_5_total', 'u64'], 
    ['charity_6_total', 'u64'], 

    ['donated_total', 'u64'], 
    ['paid_total', 'u64'], 
    ['n_donations', 'u64']] }]
]);

const u8_scheme = new Map([
    [my_u8, { kind: 'struct', 
    fields: [
    ['value', 'u8']] }]
]);

const u16_scheme = new Map([
    [my_u16, { kind: 'struct', 
    fields: [
    ['value', 'u16']] }]
]);

const u64_scheme = new Map([
    [my_u64, { kind: 'struct', 
    fields: [
    ['value', 'u64']] }]
]);

const pubkey_scheme = new Map([
    [my_pubkey, { kind: 'struct', 
    fields: [
    ['value', [32]]] }]
]);

function GetBidderStats() 
{
    const [current_bid, setCurrentBid] = useState(null);
    const [n_bidders, setNBidders] = useState(null);
    const [bid_index, setBidIndex] = useState(null);
    const [total_bid, setTotalBid] = useState(null);
    const [is_winner, setIsWinner] = useState(false);
    const [tokens_remaining, setTokensRemaining] = useState(null);
    const [time_selected, setTimeSelected] = useState(null);


    const wallet = useWallet();
    const { connection } = useConnection();

    const init = useCallback(async () => 
    {       
        const program_key = new PublicKey('EzigyiBDJy7Srq8xn6SK6Nx7BpenbSE3YbBSaBpPSN1q');
        const daoplays_key = new web3.PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");
        const token_mint_key = new web3.PublicKey("CisHceikLeKxYiUqgDVduw2py2GEK71FTRykXGdwf22h");

        try {
            if (wallet.publicKey) {
                let program_data_key = (await PublicKey.createWithSeed(daoplays_key, "data_account", program_key));
                let program_data_account = await connection.getAccountInfo(program_data_key);
                let program_pda_key = (await PublicKey.findProgramAddress(["token_account"], program_key))[0];

                let bidder_pda_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], program_key))[0];
                let bidder_data_account = await connection.getAccountInfo(bidder_pda_key);

               

                let bidder_token_key = await getAssociatedTokenAddress(
                    token_mint_key, // mint
                    wallet.publicKey, // owner
                    false // allow owner off curve
                );

                let program_token_key = await getAssociatedTokenAddress(
                    token_mint_key, // mint
                    program_pda_key, // owner
                    true // allow owner off curve
                );

                let aWalletMyTokenBalance = await connection.getTokenAccountBalance(
                    program_token_key
                );

                const n_bidders_struct = deserialize(u16_scheme, my_u16, program_data_account.data.slice(8,10));
                const total_bid_amount_struct = deserialize(u64_scheme, my_u64, program_data_account.data.slice(10,18));
                const n_winners_struct = deserialize(u8_scheme, my_u8, program_data_account.data.slice(49170,49171));
                const last_selected_struct = deserialize(u64_scheme, my_u64, program_data_account.data.slice(0,8));

                setTokensRemaining(aWalletMyTokenBalance.value.amount);
                setTotalBid(total_bid_amount_struct.value.toNumber() / web3.LAMPORTS_PER_SOL);
                setNBidders(n_bidders_struct.value);
                setTimeSelected(last_selected_struct.value.toNumber());

                if (bidder_data_account) {
                    const bidder_data_struct = deserialize(u16_scheme, my_u16, bidder_data_account.data);        
                    let key_start_index = 18 + bidder_data_struct.value * 32;
                    const bid_key = new PublicKey(deserialize(pubkey_scheme, my_pubkey, program_data_account.data.slice(key_start_index, key_start_index + 32)).value);

                    let bid_start_index = 32786 + bidder_data_struct.value * 8;
                    const bid_amount = deserialize(u64_scheme, my_u64, program_data_account.data.slice(bid_start_index, bid_start_index + 8));


                    let time_start_index = 40978 + bidder_data_struct.value * 8;
                    const bid_time = deserialize(u64_scheme, my_u64, program_data_account.data.slice(time_start_index, time_start_index + 8)).value.toNumber();

                    if (bid_key.toString() === bidder_token_key.toString()) {
                        setCurrentBid(bid_amount.value.toNumber() / web3.LAMPORTS_PER_SOL);
                        //console.log("bidder position", bidder_data_struct.value, "bid amount", bid_amount.value.toNumber() / web3.LAMPORTS_PER_SOL);

                        let age_count = 0;
                        for (let i = 0; i < 1024; i++) {
                            let time_start_index = 40978 + i * 8;
                            const one_time = deserialize(u64_scheme, my_u64, program_data_account.data.slice(time_start_index, time_start_index + 8)).value.toNumber();
                            //console.log(i, one_time, bid_time, age_count);
                            if (one_time < bid_time) {
                                age_count += 1;
                            }
                        }

                        setBidIndex(age_count);
                        
                    }
                    else {
                        setCurrentBid(0);
                        //console.log("no bid ", bid_amount.value.toNumber() / web3.LAMPORTS_PER_SOL);

                    }

                    let is_winner = false;
                    for (let i = 0; i < n_winners_struct.value; i++) {
                        let key_start_index = 49171 + i * 32;
                        const winner_key = new PublicKey(deserialize(pubkey_scheme, my_pubkey, program_data_account.data.slice(key_start_index, key_start_index + 32)).value);

                        if (winner_key.toString() === bidder_token_key.toString()) {
                            is_winner = true;
                            break;
                        }
                    }
                    setIsWinner(is_winner);
                }
                else{
                    setCurrentBid(0);
                }
                

            }
        }
        catch(error) {
          console.log(error);
      }   


    }, [connection, wallet]);

    useEffect(() => {
          setInterval(init, 1000);
        
      }, [init]);

    return {current_bid, n_bidders, bid_index, total_bid, is_winner, tokens_remaining, time_selected};
}



function GetCharityStats() 
{
    const [total_donated, setTotalDonated] = useState(null);
    const [average_price, setAveragePrice] = useState(null);
    const [donation_array, setDonationArray] = useState([]);
    const [n_donations, setNDonations] = useState(null);



    const { connection } = useConnection();

    const init = useCallback(async () => 
    {       
        const launch_program_key = new PublicKey('BHJ8pK9WFHad1dEds631tFE6qWQgX48VbwWTSqiwR54Y');
        const auction_program_key = new PublicKey('EzigyiBDJy7Srq8xn6SK6Nx7BpenbSE3YbBSaBpPSN1q');
        const daoplays_key = new web3.PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");

        try {

            let auction_data_key = (await PublicKey.createWithSeed(daoplays_key, "data_account", auction_program_key));
            let auction_data_account = await connection.getAccountInfo(auction_data_key);

            let launch_program_data_key = await PublicKey.findProgramAddress([Buffer.from("token_account")], launch_program_key);
            let launch_program_data_account = await connection.getAccountInfo(launch_program_data_key[0]);

            const launch_data = deserialize(schema, Test, launch_program_data_account.data);
            const auction_data = deserialize(schema, Test, auction_data_account.data.slice(49299, 49379));

            let total_donated = (launch_data["donated_total"].toNumber() + auction_data["donated_total"].toNumber()) / web3.LAMPORTS_PER_SOL;

            setTotalDonated(total_donated);

            let n_donations = launch_data["n_donations"].toNumber() + auction_data["n_donations"].toNumber();

            setNDonations(n_donations);

            setAveragePrice(total_donated / n_donations);

          let donation_array = [
            (launch_data["charity_0_total"].toNumber() + auction_data["charity_0_total"].toNumber()) / web3.LAMPORTS_PER_SOL,
            (launch_data["charity_1_total"].toNumber() + auction_data["charity_1_total"].toNumber()) / web3.LAMPORTS_PER_SOL,
            (launch_data["charity_2_total"].toNumber() + auction_data["charity_2_total"].toNumber()) / web3.LAMPORTS_PER_SOL,
            (launch_data["charity_3_total"].toNumber() + auction_data["charity_3_total"].toNumber()) / web3.LAMPORTS_PER_SOL,
            (launch_data["charity_4_total"].toNumber() + auction_data["charity_4_total"].toNumber()) / web3.LAMPORTS_PER_SOL,
            (launch_data["charity_5_total"].toNumber() + auction_data["charity_5_total"].toNumber()) / web3.LAMPORTS_PER_SOL,
            (launch_data["charity_6_total"].toNumber() + auction_data["charity_6_total"].toNumber()) / web3.LAMPORTS_PER_SOL]

          setDonationArray(donation_array);
        }
        catch(error) {
          console.log(error);
      }   


    }, [connection]);

    useEffect(() => {
          setInterval(init, 1000);
        
      }, [init]);

    return { total_donated, donation_array, average_price, n_donations };
}


  let intervalId;
  function useSolanaAccount() 
  {
      const [account, setAccount] = useState(null);
      const [token_pubkey, setTokenAccount] = useState(null);
      const [token_amount, setTokenAmount] = useState(null);
      const [supporter_pubkey, setSupporterAccount] = useState(null);
      const [supporter_amount, setSupporterAmount] = useState(null);


      const { connection } = useConnection();
      const wallet = useWallet();
  
      const init = useCallback(async () => 
      {       
          if (wallet.publicKey) {
              let acc = await connection.getAccountInfo(wallet.publicKey);
              setAccount(acc);

                const mintAccount = new web3.PublicKey("CisHceikLeKxYiUqgDVduw2py2GEK71FTRykXGdwf22h");
                
                let token_pubkey = await getAssociatedTokenAddress(
                    mintAccount, // mint
                    wallet.publicKey, // owner
                    false // allow owner off curve
                );
                setTokenAccount(token_pubkey);
                try {
                    let aWalletMyTokenBalance = await connection.getTokenAccountBalance(
                        token_pubkey
                    );
                    let token_amount = aWalletMyTokenBalance["value"].amount;
                    let decimals = aWalletMyTokenBalance["value"].decimals;
                    let token_decs = token_amount / 10.0**decimals;
                    setTokenAmount(token_decs)
                }
                catch(error) {
                    console.log(error);
                    setTokenAmount(null)
                }   

                const supporter_mintAccount = new web3.PublicKey("6tnMgdJsWobrWYfPTa1j8pniYL9YR5M6UVbWrxGcvhkK");
                
                let supporter_pubkey = await getAssociatedTokenAddress(
                    supporter_mintAccount, // mint
                    wallet.publicKey, // owner
                    false // allow owner off curve
                );
                setSupporterAccount(supporter_pubkey);
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
  
      return { account, token_pubkey, token_amount, supporter_pubkey, supporter_amount };
  }

  function StatsBlock({total_donated, n_donations, average_price})
  {
    return(
        <Flex flexDirection="row">
            
            <Box mt="1rem"  mb="1rem" mr="1rem">
                <HStack>
                    <Box  borderWidth='5px' borderColor="darkblue">
                        <FontAwesomeIcon icon={solid('hand-holding-heart')} size="4x" />
                    </Box>
                    <Box flex='1'  pl="1rem" pr="1rem" maxW='sm' mt="1rem"  mb="1rem" borderWidth='1px' borderRadius='lg' overflow='hidden'>
                        <Stat>
                            <StatLabel style={{fontSize: 25}}>Total Donated</StatLabel>
                            <StatNumber style={{fontSize: 25}}>
                            {
                                total_donated
                                ? total_donated.toFixed(4) + ' SOL'
                                : 'Loading..'
                            }
                            </StatNumber>
                        </Stat>
                    </Box>
                </HStack>
            </Box>
            <Box mt="1rem"  mb="1rem">
                <HStack>
                    <Box  borderWidth='5px' borderColor="darkblue">
                        <FontAwesomeIcon icon={solid('people-group')} size="4x" />
                    </Box>
                    <Box flex='1' pl="1rem" pr="1rem" maxW='sm' mt="1rem" mb="1rem" borderWidth='1px' borderRadius='lg' overflow='hidden'>
                        <Stat>
                            <StatLabel style={{fontSize: 25}}>Number Donations</StatLabel>
                            <StatNumber style={{fontSize: 25}}>
                                {
                                    n_donations
                                    ? n_donations 
                                    : 'Loading..'
                                            
                            }
                            </StatNumber>
                        </Stat>
                    </Box>
                </HStack>
            </Box>
        </Flex>
    );
  }

function CharityInfoBlock({which_charity})
{
    return(
        <Flex>
            {which_charity === "UkraineERF" && 
                <Card className="text-left" style={{flexDirection: "row"}} >
                    <Card.Img style={{width: "25%"}}  src={UkraineERF_img} alt="banner" />
                    <Card.Body>
                        <Card.Text
                        className="text-body mb-4"
                        style={{ fontSize: "1rem" }}
                        >
                        <br/>
                        
                        Humanitarian Relief Organizations and International Nonprofits participating in this emergency response fund will receive an equal distribution of the fund. These organizations' missions include providing urgent medical care and humanitarian aid to children, individuals, families, and animals.  Find out more <a href="https://thegivingblock.com/campaigns/ukraine-emergency-response-fund/">here</a>.
                        </Card.Text>
                    </Card.Body>
                </Card>
            }
            {which_charity === "WaterOrg" && 
                <Card className="text-left" style={{flexDirection: "row"}} >
                    <Card.Img style={{width: "25%"}}  src={WaterOrg_img} alt="banner" />
                    <Card.Body>
                        <Card.Text
                        className="text-body mb-4"
                        style={{ fontSize: "1rem" }}
                        >
                        <br/>
                        
                        Water.org is an international nonprofit organization that has positively transformed millions of lives around the world with access to safe water and sanitation through affordable financing. Founded by Gary White and Matt Damon, Water.org pioneers market-driven financial solutions to the global water crisis. For 30 years, we've been providing women hope, children health, and families a future. Find out more <a  style={{textDecoration: "underline"}} href="https://water.org/">here</a>.
                        </Card.Text>
                    </Card.Body>
                </Card>
            }
            {which_charity === "OneTreePlanted" && 
                <Card className="text-left" style={{flexDirection: "row"}} >
                    <Card.Img style={{width: "25%"}}  src={OneTreePlanted_img} alt="banner" />
                    <Card.Body>
                        <Card.Text
                        className="text-body mb-4"
                        style={{ fontSize: "1rem" }}
                        >
                        <br/>
                        
                        One Tree Planted is a 501(c)(3) nonprofit on a mission to make it simple for anyone to help the environment by planting trees. Their projects span the globe and are done in partnership with local communities and knowledgeable experts to create an impact for nature, people, and wildlife. Reforestation helps to rebuild forests after fires and floods, provide jobs for social impact, and restore biodiversity. Many projects have overlapping objectives, creating a combination of benefits that contribute to the UN's Sustainable Development Goals. Find out more <a  style={{textDecoration: "underline"}} href="https://onetreeplanted.org/">here</a>.
                        </Card.Text>
                    </Card.Body>
                </Card>
            }
            {which_charity === "EvidenceAction" && 
                <Card className="text-left" style={{flexDirection: "row"}} >
                    <Card.Img style={{width: "25%"}}  src={EvidenceAction_img} alt="banner" />
                    <Card.Body>
                        <Card.Text
                        className="text-body mb-4"
                        style={{ fontSize: "1rem" }}
                        >
                        <br/>
                        
                        Evidence Action is a global nonprofit organization with an approach distinctive in international development - we exclusively scale interventions that are backed by strong evidence and can be delivered with exceptional cost-effectiveness. Our programs have grown since our founding in 2013 to reach over 280 million people annually. We take a data-driven approach to identifying, scaling, and continuously improving programs which deliver immense impact, ensuring these solutions measurably improve the lives of millions. Find out more <a  style={{textDecoration: "underline"}} href="https://www.evidenceaction.org/">here</a>.
                        </Card.Text>
                    </Card.Body>
                </Card>
            }
            {which_charity === "GirlsWhoCode" && 
                <Card className="text-left"  style={{flexDirection: "row"}} >
                    <Card.Img style={{width: "25%"}}  src={GWC_img} alt="banner" />
                    <Card.Body>
                        <Card.Text
                        className="text-body mb-4"
                        style={{ fontSize: "1rem" }}
                        >
                        <br/>
                        
                        Girls Who Code is on a mission to close the gender gap in technology and to change the image of what a programmer looks like and does. Girls Who Code equips girls with the skills they need to pursue careers in technology, and the confidence they need to break barriers and thrive in a male-dominated industry.  Find out more <a  style={{textDecoration: "underline"}} href="https://www.girlswhocode.com/">here</a>.
                        </Card.Text>
                    </Card.Body>
                </Card>
            }
            {which_charity === "OutrightActionInt" && 
                <Card className="text-left" style={{flexDirection: "row"}} >
                    <Card.Img style={{width: "25%"}}  src={Outright_img} alt="banner" />
                    <Card.Body>
                        <Card.Text
                        className="text-body mb-4"
                        style={{ fontSize: "1rem" }}
                        >
                        <br/>
                        
                        OutRight Action International fights for human rights and equality for lesbian, gay, bisexual, transgender, intersex and queer (LGBTIQ) people everywhere and to eliminate the systemic violence, persecution and discrimination LGBTIQ people face around the world. OutRight conducts vital and original research, advocates with governments at the United Nations and beyond, and supports grassroots LGBTIQ activists and organizations in dozens of countries each year. Find out more <a  style={{textDecoration: "underline"}} href="https://www.outrightinternational.org/">here</a>.
                        </Card.Text>
                    </Card.Body>
                </Card>
            }
            {which_charity === "TheLifeYouCanSave" && 
                <Card className="text-left" style={{flexDirection: "row"}} >
                    <Card.Img style={{width: "25%"}}  src={LifeYouCanSave_img} alt="banner" />
                    <Card.Body>
                        <Card.Text
                        className="text-body mb-4"
                        style={{ fontSize: "1rem" }}
                        >
                        <br/>
                        
                        The Life You Can Save is an advocacy nonprofit that makes “smart giving simple” by identifying and recommending some of the world's most effective charities. We currently recommend over 20 outstanding charities whose evidence-based, cost-effective interventions have been proven to save and transform the lives of people living in extreme global poverty (defined as less than US$1.90 per day).

                        We provide free tools and resources that make it easy to learn about and support these wonderful organizations so that you can give where it matters most and ensure that you get the most “bang for your buck.” Over the past three years, we've raised an average of $17 for our recommended charities for each dollar we have spent on our own operations.
                        Find out more <a  style={{textDecoration: "underline"}} href="https://www.thelifeyoucansave.org/">here</a>.
                        </Card.Text>
                    </Card.Body>
                </Card>
            }
        </Flex>
    );
}
  
  export function AirDropApp() 
  {
      const wallet = useWallet();
      const { connection } = useConnection();
      const { total_donated, donation_array, average_price, n_donations } = GetCharityStats();
      const {current_bid, n_bidders, bid_index, total_bid, is_winner, tokens_remaining, time_selected} = GetBidderStats();


      const { account, token_pubkey, token_amount, supporter_pubkey, supporter_amount} = useSolanaAccount();

      const [slide_value, setSlideValue] = React.useState(90)
      const [which_charity, setWhichCharity] = React.useState("")

      const handleWhichCharity = (event) => {
        setWhichCharity(event.target.value);
      };

      const format = (sol_value) => sol_value+` SOL`
      const parse = (sol_value) => sol_value.replace(/^ SOL/, '')
      const [sol_value, setSOLValue] = React.useState(0.1)

      const handleSlideChange = (slide_value) => setSlideValue(slide_value)
    
      const join_ico = useCallback( async () => 
      {
            console.log("Sol value:", sol_value);
            console.log("Slide value:", slide_value);

            const token_mint_key = new web3.PublicKey("CisHceikLeKxYiUqgDVduw2py2GEK71FTRykXGdwf22h");      
            const daoplays_key = new web3.PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");
            const pyth_btc = new web3.PublicKey("HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J");
            const pyth_eth = new web3.PublicKey("EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw");
            const pyth_sol = new web3.PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");
            const program_key = new PublicKey('EzigyiBDJy7Srq8xn6SK6Nx7BpenbSE3YbBSaBpPSN1q');   
            const SYSTEM_PROGRAM_ID = new PublicKey(
                '11111111111111111111111111111111',
            );          
        
            let program_data_key = (await PublicKey.createWithSeed(daoplays_key, "data_account", program_key));
            let program_data_account = await connection.getAccountInfo(program_data_key);
            let program_pda_key = (await PublicKey.findProgramAddress(["token_account"], program_key))[0];

            let program_token_key = await getAssociatedTokenAddress(
                token_mint_key, // mint
                program_pda_key, // owner
                true // allow owner off curve
            );

            let joiner_token_key = await getAssociatedTokenAddress(
                token_mint_key, // mint
                wallet.publicKey, // owner
                false // allow owner off curve
            );
        
            let bidder_pda_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], program_key))[0];

            let charity_key = new PublicKey('8bmmLYH2fJTUcLSz99Q1tP4xte9K41v3CeFJ6Qouogig');
            let chosen_charity = Charity.UkraineERF;
            if(which_charity === "UkraineERF") {
                chosen_charity = Charity.UkraineERF;
                charity_key = new PublicKey('8bmmLYH2fJTUcLSz99Q1tP4xte9K41v3CeFJ6Qouogig');
            }
            else if(which_charity === "WaterOrg"){
                chosen_charity = Charity.WaterOrg;
                charity_key = new PublicKey('3aNSq2fKBypiiuPy4SgrBeU7dDCvDrSqRmq3VBeYY56H');
            }
            else if(which_charity === "OneTreePlanted"){
                chosen_charity = Charity.OneTreePlanted;
                charity_key = new PublicKey('Eq3eFm5ixRL73WDVw13AU6mzA9bkRHGyhwqBmRMJ6DZT');
            }
            else if(which_charity === "EvidenceAction"){
                chosen_charity = Charity.EvidenceAction;
                charity_key = new PublicKey('HSpwMSrQKq8Zn3vJ6weNTuPtgNyEucTPpb8CtLXBZ6pQ');
            }
            else if(which_charity === "GirlsWhoCode"){
                chosen_charity = Charity.GirlsWhoCode;
                charity_key = new PublicKey('GfhUjLFe6hewxqeV3SabB6jEARJw52gK8xuXecKCHA8U');
            }
            else if(which_charity === "OutrightActionInt"){
                chosen_charity = Charity.OutrightActionInt;
                charity_key = new PublicKey('4BMqPdMjtiCPGJ8G2ysKaU9zk55P7ANJNJ7T6XqzW6ns');
            }
            else if(which_charity === "TheLifeYouCanSave"){
                chosen_charity = Charity.TheLifeYouCanSave;
                charity_key = new PublicKey('7LjZQ1UTgnsGUSnqBeiz3E4EofGA4e861wTBEixXFB6G');
            }

            let charity_amount = parseFloat((slide_value * sol_value * 0.01).toFixed(4));
            let dao_amount = parseFloat(((100-slide_value) * sol_value * 0.01).toFixed(4));

            const data = Buffer.alloc(BidData.span);
            let ch_bn = new BN(charity_amount* web3.LAMPORTS_PER_SOL, 10);
            let dao_bn = new BN(dao_amount* web3.LAMPORTS_PER_SOL, 10);

            console.log("charity : ", charity_amount, charity_amount * web3.LAMPORTS_PER_SOL, ch_bn.toNumber());
            console.log("dao : ", dao_amount,  dao_amount * web3.LAMPORTS_PER_SOL, dao_bn.toNumber());


            BidData.encode(
                {
                    instruction: AuctionInstruction.place_bid,
                    amount_charity: ch_bn,
                    amount_daoplays: dao_bn,
                    charity: chosen_charity
                },
                data
            );

                


            console.log("wallet: ",  wallet.publicKey.toString());
            console.log("joiner token: ", joiner_token_key.toString());
            console.log("bidder pda: ", bidder_pda_key.toString());
            console.log("daoplays: ", daoplays_key.toString());
            console.log("charity: ", charity_key.toString());
            console.log("program data: ", program_data_key.toString());
            console.log("program token: ", program_token_key.toString());
            console.log("token mint: ", token_mint_key.toString());


            const bid_instruction = new TransactionInstruction({
                keys: [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                    {pubkey: joiner_token_key, isSigner: false, isWritable: true},
                    {pubkey: bidder_pda_key, isSigner: false, isWritable: true},
   
                    {pubkey: daoplays_key, isSigner: false, isWritable: true},
                    {pubkey: charity_key, isSigner: false, isWritable: true},

                    {pubkey: program_data_key, isSigner: false, isWritable: true},
                    {pubkey: program_token_key, isSigner: false, isWritable: true},

                    {pubkey: token_mint_key, isSigner: false, isWritable: false},

                    {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                    {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                    {pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false}

                ],
                programId: program_key,
                data: data
            });


            const select_data = Buffer.alloc(SelectData.span);
            SelectData.encode(
                {
                    instruction: AuctionInstruction.select_winners
                },
                select_data
            );


            
            const select_instruction = new TransactionInstruction({
                keys: [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
    
                    {pubkey: pyth_btc, isSigner: false, isWritable: true},
                    {pubkey: pyth_eth, isSigner: false, isWritable: true},
                    {pubkey: pyth_sol, isSigner: false, isWritable: true},
    
                    {pubkey: program_data_key, isSigner: false, isWritable: true},
                    {pubkey: program_token_key, isSigner: false, isWritable: true}
    
                ],
                programId: program_key,
                data: select_data
            });

            let transaction = new Transaction();
            

            // check if we should add a send_tokens instruction
            // this may not end up doing anything if they have already been sent
            let n_winners = deserialize(u8_scheme, my_u8, program_data_account.data.slice(49170,49171)).value;
            console.log("have ", n_winners, " winners");
            if (n_winners > 0) {

                const send_data = Buffer.alloc(SelectData.span);
                SelectData.encode(
                    {
                        instruction: AuctionInstruction.send_tokens
                    },
                    send_data
                );

                var key_vector  = [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},

                    {pubkey: program_pda_key, isSigner: false, isWritable: true},
                    {pubkey: program_token_key, isSigner: false, isWritable: true},
                    {pubkey: program_data_key, isSigner: false, isWritable: true},

                    {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},


                ];

                console.log("wallet ",  wallet.publicKey.toString());
                console.log("program_pda_key ",  program_pda_key.toString());
                console.log("program_token_key ",  program_token_key.toString());
                console.log("program_data_key ",  program_data_key.toString());
                console.log("TOKEN_PROGRAM_ID ",  TOKEN_PROGRAM_ID.toString());


                for (let i = 0; i < n_winners; i++) {
                    let key_start_index = 49171 + i * 32;
                    const key = new PublicKey(deserialize(pubkey_scheme, my_pubkey, program_data_account.data.slice(key_start_index, key_start_index + 32)).value);
                    key_vector.push({pubkey: key, isSigner: false, isWritable: true});
                    console.log("winner ",  key.toString());
                }


                const send_instruction = new TransactionInstruction({
                    keys: key_vector,
                    programId: program_key,
                    data: send_data
                });

                transaction.add(send_instruction);
            }

            transaction.add(bid_instruction);
            transaction.add(select_instruction);
    
            try {
                let signature = await wallet.sendTransaction(
                    transaction,
                    connection
                );
        
                await connection.confirmTransaction(signature, 'processed');
        
                var response = null;
                while (response == null) {
                    response = await connection.getTransaction(signature);
                }   
        
                console.log("result: ", response);
            }catch(error) {
                console.log(error);
            }
        

      },
      [connection, wallet, sol_value, slide_value, which_charity]
      );

      const select_winners = useCallback( async () => 
      {

            const token_mint_key = new web3.PublicKey("CisHceikLeKxYiUqgDVduw2py2GEK71FTRykXGdwf22h");
            const daoplays_key = new web3.PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");
            const pyth_btc = new web3.PublicKey("HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J");
            const pyth_eth = new web3.PublicKey("EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw");
            const pyth_sol = new web3.PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");
            const program_key = new PublicKey('EzigyiBDJy7Srq8xn6SK6Nx7BpenbSE3YbBSaBpPSN1q');   
 
        
            let program_data_key = (await PublicKey.createWithSeed(daoplays_key, "data_account", program_key));
            let program_data_account = await connection.getAccountInfo(program_data_key);
            let program_pda_key = (await PublicKey.findProgramAddress(["token_account"], program_key))[0];

            let program_token_key = await getAssociatedTokenAddress(
                token_mint_key, // mint
                program_pda_key, // owner
                true // allow owner off curve
            );

            let transaction = new Transaction();

            // just check the winners struct to see if we have already select winners, as we can skip
            // the first step if so
            let n_winners = deserialize(u8_scheme, my_u8, program_data_account.data.slice(49170,49171)).value;

            if (n_winners > 0) {

                const send_data = Buffer.alloc(SelectData.span);
                SelectData.encode(
                    {
                        instruction: AuctionInstruction.send_tokens
                    },
                    send_data
                );

                var key_vector  = [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},

                    {pubkey: program_pda_key, isSigner: false, isWritable: true},
                    {pubkey: program_token_key, isSigner: false, isWritable: true},
                    {pubkey: program_data_key, isSigner: false, isWritable: true},

                    {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},


                ];

                console.log("wallet ",  wallet.publicKey.toString());
                console.log("program_pda_key ",  program_pda_key.toString());
                console.log("program_token_key ",  program_token_key.toString());
                console.log("program_data_key ",  program_data_key.toString());
                console.log("TOKEN_PROGRAM_ID ",  TOKEN_PROGRAM_ID.toString());


                for (let i = 0; i < n_winners; i++) {
                    let key_start_index = 49171 + i * 32;
                    const key = new PublicKey(deserialize(pubkey_scheme, my_pubkey, program_data_account.data.slice(key_start_index, key_start_index + 32)).value);
                    key_vector.push({pubkey: key, isSigner: false, isWritable: true});
                    console.log("winner ",  key.toString());
                }


                const send_instruction = new TransactionInstruction({
                    keys: key_vector,
                    programId: program_key,
                    data: send_data
                });

                transaction.add(send_instruction);
            }           
                
        
         
            const select_data = Buffer.alloc(SelectData.span);
            SelectData.encode(
                {
                    instruction: AuctionInstruction.select_winners
                },
                select_data
            );


            
            const select_instruction = new TransactionInstruction({
                keys: [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
    
                    {pubkey: pyth_btc, isSigner: false, isWritable: true},
                    {pubkey: pyth_eth, isSigner: false, isWritable: true},
                    {pubkey: pyth_sol, isSigner: false, isWritable: true},
    
                    {pubkey: program_data_key, isSigner: false, isWritable: true},
                    {pubkey: program_token_key, isSigner: false, isWritable: true}
    
                ],
                programId: program_key,
                data: select_data
            });

            transaction.add(select_instruction);
    
            try {
                let signature = await wallet.sendTransaction(
                    transaction,
                    connection
                );
        
                await connection.confirmTransaction(signature, 'processed');
        
                var response = null;
                while (response == null) {
                    response = await connection.getTransaction(signature);
                }   
        
                console.log("result: ", response);
            }catch(error) {
                console.log(error);
            }
      },
      [connection, wallet]
      );
  
      return (
          <Box textAlign="center" fontSize="l">
            <Divider mt="2rem" mb="2rem"/>

            <Center mb="4rem">
                <Text fontSize="2rem">Overview</Text>
            </Center>
            <VStack>
           
                <StatsBlock total_donated={total_donated} n_donations={n_donations} average_price={average_price}/>
                

                <Box  width="100%">
                <Plot
                    data={[
                        {
                            type: 'bar', 
                            x: ["UkraineERF", "Water.Org", "OneTreePlanted", "EvidenceAction", "GirlsWhoCode", "OutrightAction","TheLifeYouCanSave"], 
                            y: donation_array
                        },
                    ]}
                    layout={{
                        title: 'Charity Breakdown', 
                        xaxis: {
                            tickangle: -45,
                            automargin: true
                        },
                        yaxis: {
                            title: {
                                text: 'SOL'
                            }
                        },
                        autosize:true,
                        
                        font: {
                            size: 20                              
                        }
                        
                    }}
                    style={{
                        width:"100%"
                    }} 
                />

                </Box>

            </VStack>
            <Divider mt="2rem" mb="2rem"/>

            {wallet.publicKey &&  <WalletConnected publicKey={wallet.publicKey} tokenKey={token_pubkey} account={account} token_amount={token_amount} supporter_key={supporter_pubkey} supporter_amount={supporter_amount}/>}

            {wallet.publicKey && 

                <Box>
                    <Divider mt="2rem" mb="2rem"/>

                    <Center mb="3rem">
                        <Text fontSize="2rem">Get Tokens!</Text>
                    </Center>
                    <Center>
                            <Flex flexDirection="row">
                                <VStack alignItems="start">
                                    <Box mt="1rem"  mb="1rem" mr="1rem">
                                        <HStack>
                                            <Box  borderWidth='5px' borderColor="darkblue">
                                                <FontAwesomeIcon icon={solid('users')} size="4x" />
                                            </Box>
                                            <Box flex='1'  pl="1rem" pr="1rem" maxW='sm' mt="1rem"  mb="1rem" borderWidth='1px' borderRadius='lg' overflow='hidden'>
                                                <Text style={{fontSize: 25}}>Auction Stats</Text>
                                                    
                                            </Box>
                                        </HStack>
                                    </Box>   
                                    <HStack>    
                                        <VStack alignItems="start">
                                                                    
                                            <Box mb = "1px" flex='1'>
                                            <Tooltip hasArrow label='The auction supports a maximum of 1024 concurrent bids'>
                                                <Text>Number Active Bids:</Text>
                                            </Tooltip>
                                            </Box>
                                            <Box></Box>
                                            <Box></Box>
                                            <Box flex='1'><Text>Current Average Bid: </Text></Box>
                                            <Box></Box>
                                            <Box></Box>
                                            <Tooltip hasArrow label='Play tokens remaining in the auction pool. Spending the tokens in the game replenishes the pool.'>
                                            <Box flex='1'><Text>Tokens Available: </Text></Box>
                                            </Tooltip>
                                           
                                        </VStack>
                                        <VStack>
                                            <FormControl id="n_bidders" maxWidth={"100px"} >
                                                <Input
                                                    type="text"
                                                    value = {n_bidders != null ? n_bidders : "Loading.."}
                                                    readOnly
                                                />
                                            </FormControl>
                                            <FormControl id="total_bid" maxWidth={"100px"} >
                                                <Input
                                                    type="text"
                                                    value = {total_bid != null ? total_bid  ===  0 ? 0 : (total_bid / n_bidders).toFixed(4) : "Loading.."}
                                                    readOnly
                                                />
                                            </FormControl>
                                            <FormControl id="tokens_available" maxWidth={"100px"} >
                                                <Input
                                                    type="text"
                                                    value = {tokens_remaining ? tokens_remaining : "Loading.."}
                                                    readOnly
                                                />
                                            </FormControl>
                                        </VStack>
                                    </HStack>
                                </VStack>

                                <VStack alignItems="center" ml="2rem">
                                    <Box mt="1rem"  mb="1rem" mr="1rem">
                                        <HStack>
                                            <Box  borderWidth='5px' borderColor="darkblue">
                                                <FontAwesomeIcon icon={solid('user')} size="4x" />
                                            </Box>
                                            <Box flex='1'  pl="1rem" pr="1rem" maxW='sm' mt="1rem"  mb="1rem" borderWidth='1px' borderRadius='lg' overflow='hidden'>
                                                <Text style={{fontSize: 25}}>Your Stats</Text>
                                                    
                                            </Box>
                                        </HStack>
                                    </Box> 
                                    <HStack>
                                        
                                        <VStack alignItems="start"> 
                                        <Tooltip hasArrow label='Bidding multiple times will cause your total bid to accumulate, until you win.'>
                                            <Box flex='1'><Text>Your Active Bid:</Text></Box>
                                            </Tooltip>
                                            <Box></Box>
                                            <Box></Box>
                                            <Box flex='1'><Text>Your Chance of Winning:</Text></Box>
                                            <Box></Box>
                                            <Box></Box>
                                            <Tooltip hasArrow label="When all the bid slots are in use, new bids will remove the oldest ones in the auction.  When this counter reaches zero, you will have the oldest bid in the auction, and will be in danger of losing your bid.  Bid again to refresh this value to the maximum, or select winners to free up slots.">
                                            <Box flex='1'><Text>Bids till removal:</Text></Box>   
                                            </Tooltip>                        
      
                                        </VStack>
                                        

                                        <VStack> 
                                            <FormControl id="current_bid" maxWidth={"100px"} >
                                                <Input
                                                    type="text"
                                                    value = {current_bid != null ? (current_bid).toFixed(4) : "Loading.."}
                                                    readOnly
                                                />
                                            </FormControl>
                                            <FormControl id="win_chance" maxWidth={"100px"} >
                                                <Input
                                                    type="text"
                                                    value = {total_bid && current_bid ? (current_bid / total_bid).toFixed(4) : 0}
                                                    readOnly
                                                />
                                            </FormControl>
                                            <FormControl id="bid_time" maxWidth={"100px"} >
                                                <Input
                                                    type="text"
                                                    value = {current_bid && bid_index != null ? bid_index : 0}
                                                    readOnly
                                                />
                                            </FormControl>
                                        </VStack>

                                        
                                
                                    </HStack>
                                </VStack>

                            </Flex>
                            </Center>

                        <VStack alignItems="center" mt="2rem" mb="2rem">
                            {tokens_remaining != null && tokens_remaining < 100 ?
                            
                            
                            <>
                                <Alert status='error'  mb="1rem">
                                    <AlertIcon />
                                    {
                                        <Text>Less than one hundred tokens remaining.  Cannot select winners until more are available</Text>
                                    }
                                </Alert>

                                <Button width='150px' colorScheme='red' variant='solid'>
                                    Send Tokens!
                                </Button>
                            </>
                            
                            
                            :
                            n_bidders != null && n_bidders === 0 ?
                            <>
                                <Alert status='error'  mb="1rem">
                                    <AlertIcon />
                                    {
                                        <Text>No bids found in the system.  Cannot select winners until a bid has been made</Text>
                                    }
                                </Alert>

                                <Button width='150px' colorScheme='red' variant='solid'>
                                    Send Tokens!
                                </Button>
                            </>
                            :
                            is_winner ? 
                            <>
                                <Alert status='success'  mb="1rem">
                                    <AlertIcon />
                                    {
                                        <Text>You have been selected! Click the button to get your tokens</Text>
                                    }
                                </Alert>

                                <Button onClick={select_winners}  width='150px' colorScheme='green' variant='solid'>
                                    Send Tokens!
                                </Button>
                            </>
                            :
                            
                                Math.max(300.0 / n_bidders + 2 - (Math.floor(Date.now() / 1000) - time_selected), 0) > 0 ?
                                <>
                                <Alert status='info'  mb="1rem">
                                    <AlertIcon />
                                    {
                                        <Text> Approximate time until next winners can be chosen: {Math.max(300.0 / n_bidders + 2 - (Math.floor(Date.now() / 1000) - time_selected), 0)} </Text>
                                        
                                    }
                                </Alert>

                                        <Button width='150px' colorScheme='red' variant='solid'>
                                            Send Tokens!
                                        </Button>
                                </>
                                :        
                                <>
                                <Alert status='info'  mb="1rem">
                                <AlertIcon />
                                {
                                    <Text> The program will send tokens and select new winners whenever anyone bids or plays the game.  If there aren't many people playing right now you can click the button below to do this yourself.</Text>
                                    
                                }
                                 </Alert>
                                    <Button onClick={select_winners}  width='150px' colorScheme='green' variant='solid'>
                                        Send Tokens!
                                    </Button>
                                </>
                                
                            
                            }
                                

                        </VStack>

                        <Divider mt="2rem" mb="2rem"/>


                        <Text mt="2rem" mb="1rem" textAlign="left" fontSize="1.5rem">Step 1: Decide what you want to bid for 100 tokens</Text>

                        <VStack alignItems="start" mt="2rem" mb="2rem">
                            <Alert status='info'  mb="1rem">
                                <AlertIcon />
                                {total_bid !=  null &&
                                    <Text>Your chance of winning is proportional to the amount you bid.  If you bid the current average of {total_bid === 0 ? 0 : (total_bid / n_bidders).toFixed(4)} SOL you will have a one in {current_bid ? n_bidders : n_bidders + 1} chance of winning in the next draw</Text>
                                }
                            </Alert>

                            <HStack>                        
                           
                                <Text>
                                    Amount to Bid:
                                </Text>
                                <NumberInput 
                                    onChange={(valueString) => setSOLValue(parse(valueString))}
                                    value={format(sol_value)}
                                    defaultValue={average_price} precision={4}  maxW='200px' mr='2rem' ml='2rem'>
                                    <NumberInputField/>
                                </NumberInput>
                        
                            </HStack>
                        </VStack>

                        <Text mt="2rem" mb="1rem" textAlign="left" fontSize="1.5rem">Step 2: Decide how we should split your bid</Text>

                            <HStack>
                            <Box width="100%">
                            <Text textAlign="left" fontSize="1rem">Charity</Text>

                                <Slider
                                    aria-label='slider-ex-1' 
                                    focusThumbOnChange={false}
                                    value={slide_value}
                                    onChange={handleSlideChange}
                                    width="100%"
                                >
                                    <SliderTrack>
                                          <SliderFilledTrack />
                                    </SliderTrack>
                                    <SliderThumb boxSize={6}>
                                        <Box color='blue' as={MdFiberManualRecord} />
                                    </SliderThumb>
                                </Slider>
                                </Box>
                                <FormControl id="charity_amount" maxWidth={"150px"} >
                                    <Input
                                        type="text"
                                        value={(slide_value * sol_value * 0.01).toFixed(4)}
                                        readOnly
                                    />
                                </FormControl>
                                </HStack>

                                <HStack>
                                    <Box width="100%">
                                    <Text textAlign="left" fontSize="1rem">DaoPlays</Text>

                                <Slider
                                    aria-label='slider-ex-2' 
                                    focusThumbOnChange={false}
                                    value={100-slide_value}
                                    onChange={handleSlideChange}
                                >
                                    <SliderTrack>
                                          <SliderFilledTrack />
                                    </SliderTrack>
                                    <SliderThumb boxSize={6}>
                                        <Box color='blue' as={MdFiberManualRecord} />
                                    </SliderThumb>
                                </Slider>
                                </Box>
                                

                           
                                <FormControl id="dao_amount" maxWidth={"150px"}  ml="2rem">
                                    <Input
                                    type="text"
                                    value={((100-slide_value) * sol_value * 0.01).toFixed(4)}
                                    readOnly
                                    />
                                </FormControl>
                                </HStack>


                        <Text mt="2rem" mb="1rem" textAlign="left" fontSize="1.5rem">Step 3: Select which charity</Text>

                        <Select placeholder='Select Charity' onChange={handleWhichCharity}>
                            <option value='EvidenceAction'>Evidence Action</option>
                            <option value='GirlsWhoCode'>Girls Who Code</option>
                            <option value='OneTreePlanted'>One Tree Planted</option>
                            <option value='OutrightActionInt'>Outright Action International</option>
                            <option value='TheLifeYouCanSave'>The Life You Can Save</option>
                            <option value='UkraineERF'>Ukraine Emergency Response Fund</option>
                            <option value='WaterOrg'>Water.Org</option>
                        </Select>

                        <CharityInfoBlock which_charity = {which_charity}/>


                        <Box mt="2rem">
                            {
                                sol_value >= 0.0001 &&

                                <Button onClick={join_ico}  width='100px' colorScheme='green' variant='solid'>
                                    Place Bid!
                                </Button>
                            }
                            {
                                sol_value < 0.0001 &&

                                <Tooltip hasArrow label='Minimum is 0.0001 SOL' bg='red.600'>
                                    <Button width='100px' colorScheme='red' variant='solid'>
                                        Place Bid!
                                    </Button>
                                </Tooltip>
                            }
                        </Box>
                        

                     

                </Box>
              }
              {!wallet.publicKey && <WalletNotConnected />}
              <br/><br/>
              <Divider mt="2rem" mb="2rem"/>

          </Box>


          
      );
  }

export function CharityAuctionDapp()
{
    const network = 'devnet';
    const endpoint = web3.clusterApiUrl(network);
    const wallets = useMemo(() => 
    [
        new PhantomWalletAdapter(),
    ],
    []
  );

    return(
        <ChakraProvider theme={theme}>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>

                        <AirDropApp/>

                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </ChakraProvider>

    );
}