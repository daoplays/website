import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { Link } from "react-router-dom";
import {Card, Image} from 'react-bootstrap';
import {IconButton, ChakraProvider, theme, Box, HStack, Flex, Button, Text, VStack, Center, Alert, AlertIcon, Divider,
    FormControl, Input, NumberInput, Slider, NumberInputField, SliderTrack, SliderFilledTrack, SliderThumb, Tooltip, Select, Stat, StatLabel, StatNumber
 } from '@chakra-ui/react';
import { TwitchEmbed, TwitchChat} from 'react-twitch-embed';
import { struct, u64, u8 } from "@project-serum/borsh";
import BN from "bn.js";
import { deserialize } from 'borsh';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used
import { MdFiberManualRecord } from "react-icons/md";
import Plot from 'react-plotly.js';
import bs58 from "bs58";

import badge_1 from "./badge_1_boulder.png"
import badge_2 from "./badge_2_cascade.png"
import badge_3 from "./badge_3_thunder.png"
import badge_4 from "./badge_4_rainbow.png"
import badge_5 from "./badge_5_soul.png"
import badge_6 from "./badge_6_marsh.png"
import badge_7 from "./badge_7_volcano.png"
import badge_8 from "./badge_8_earth.png"

import UkraineERF_img from "../blog/posts/4_CharityICO/ukraine_logo.jpg"
import WaterOrg_img from "../blog/posts/4_CharityICO/waterorg_logo.jpeg"
import EvidenceAction_img from "../blog/posts/4_CharityICO/evidenceaction_logo.jpeg"
import GWC_img from "../blog/posts/4_CharityICO/girlswhocode_logo.jpeg"
import LifeYouCanSave_img from "../blog/posts/4_CharityICO/thelifeyoucansave_logo.jpeg"
import OneTreePlanted_img from "../blog/posts/4_CharityICO/onetreeplanted_logo.jpg"
import Outright_img from "../blog/posts/4_CharityICO/outrightaction_logo.jpg"

import { LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

import {
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  } from "@solana/spl-token";
  
import {
    WalletProvider,
    useWallet,
} from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from "@solana/wallet-adapter-wallets";

import {
    WalletModalProvider,
    WalletMultiButton,
    WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css');



let have_token_amounts = false;
let have_charity_stats = false;
let have_bidder_stats = false;
function WalletNotConnected() 
{
    have_token_amounts = false;
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

function Badges() {
    return (
        <Box ml="15%" mr="1rem" mb="1rem">
            <HStack>
                <Box width="10%" height="10%">
                    <Image style = {{opacity: 0.2}} fluid={true} src={badge_1}/>
                </Box>
                <Box width="10%" height="10%">
                    <Image style = {{opacity: 0.2}} fluid={true} src={badge_2}/>
                </Box>
                <Box width="10%" height="10%">
                    <Image style = {{opacity: 0.2}} fluid={true} src={badge_3}/>
                </Box>
                <Box width="10%" height="10%">
                    <Image style = {{opacity: 0.2}} fluid={true} src={badge_4}/>
                </Box>
                <Box width="10%" height="10%">
                    <Image style = {{opacity: 0.2}} fluid={true} src={badge_5}/>
                </Box>
                <Box width="10%" height="10%">
                    <Image style = {{opacity: 0.2}} fluid={true} src={badge_6}/>
                </Box>
                <Box width="10%" height="10%">
                    <Image style = {{opacity: 0.2}} fluid={true} src={badge_7}/>
                </Box>
                <Box width="10%" height="10%">
                    <Image style = {{opacity: 0.2}} fluid={true} src={badge_8}/>
                </Box>
            </HStack>
        </Box>
    );
}


const ButtonTypes = {
    A : 0,
    B : 1,
    Up : 2,
    Down : 3,
    Left : 4,
    Right : 5,
    Start : 6,
    Select : 7
}

const ButtonData = struct([
    u8("instruction"),
    u8("button"),
    u64("amount"),
]);


const AuctionInstruction = {
    create_data_account : 0,
    push_button : 1,
    place_bid : 2,
    select_winners : 3,
    send_tokens : 4
}

const Charity = {
    EvidenceAction : 0,
    GirlsWhoCode : 1,
    OneTreePlanted : 2,
    OutrightActionInt : 3,
    TheLifeYouCanSave : 4,
    UkraineERF : 5,
    WaterOrg : 6
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



function GetCharityStats() 
{
    const [total_donated, setTotalDonated] = useState(null);
    const [donation_array, setDonationArray] = useState([]);
    const [n_donations, setNDonations] = useState(null);
    const check_interval = useRef<number | null>(null);


    const init = useCallback(async () => 
    {       
        const launch_program_key = new PublicKey('GwsxvpsHURySgnLrkMcnYuSH2Sbd4v9eZwB5ruiVxgjE');
        const auction_program_data_key = new PublicKey('77k4yGn6V8gDszdKMTvjwBSLiJAUHbNB493wEXMEiqfP');

        let launch_program_data_key = await PublicKey.findProgramAddress([Buffer.from("launch_account")], launch_program_key);

        if (!have_charity_stats) {
            try {
                
                const auction_account_url = `/.netlify/functions/solana_main?function_name=getAccountInfo&p1=`+auction_program_data_key.toString()+`&p2=base64`;
                const auction_account_result = await fetch(auction_account_url).then((res) => res.json());

                let auction_account_encoded_data = auction_account_result["result"]["value"]["data"];
                let auction_account_data = Buffer.from(auction_account_encoded_data[0], "base64");
               
                
                const launch_account_url = `/.netlify/functions/solana_main?function_name=getAccountInfo&p1=`+launch_program_data_key[0].toString()+`&p2=base64`;;
                const launch_account_result = await fetch(launch_account_url).then((res) => res.json());

                let launch_account_encoded_data = launch_account_result["result"]["value"]["data"];
                let launch_account_data = Buffer.from(launch_account_encoded_data[0], "base64");

                const launch_data = deserialize(schema, Test, launch_account_data);
                const auction_data = deserialize(schema, Test, auction_account_data.slice(49299, 49379));

                let total_donated = (launch_data["donated_total"].toNumber() + auction_data["donated_total"].toNumber()) / LAMPORTS_PER_SOL;

                setTotalDonated(total_donated);

                let n_donations = launch_data["n_donations"].toNumber() + auction_data["n_donations"].toNumber();

                setNDonations(n_donations);


                let donation_array = [
                    (launch_data["charity_0_total"].toNumber() + auction_data["charity_0_total"].toNumber()) / LAMPORTS_PER_SOL,
                    (launch_data["charity_1_total"].toNumber() + auction_data["charity_1_total"].toNumber()) / LAMPORTS_PER_SOL,
                    (launch_data["charity_2_total"].toNumber() + auction_data["charity_2_total"].toNumber()) / LAMPORTS_PER_SOL,
                    (launch_data["charity_3_total"].toNumber() + auction_data["charity_3_total"].toNumber()) / LAMPORTS_PER_SOL,
                    (launch_data["charity_4_total"].toNumber() + auction_data["charity_4_total"].toNumber()) / LAMPORTS_PER_SOL,
                    (launch_data["charity_5_total"].toNumber() + auction_data["charity_5_total"].toNumber()) / LAMPORTS_PER_SOL,
                    (launch_data["charity_6_total"].toNumber() + auction_data["charity_6_total"].toNumber()) / LAMPORTS_PER_SOL]

                setDonationArray(donation_array);
                have_charity_stats = true;
                
            }
            catch(error) {
                console.log(error);
                have_charity_stats = false;
            }   
        }

    }, []);

    useEffect(() => {
        if (check_interval.current === null) {
            check_interval.current = window.setInterval(init, 1000000);
        } else {
            window.clearInterval(check_interval.current);
            check_interval.current = null;
        }
        // here's the cleanup function
        return () => {
            if (check_interval.current !== null) {
                window.clearInterval(check_interval.current);
                check_interval.current = null;
            }
        };
    }, [init]);

    return { total_donated, donation_array, n_donations };
}

function GetBidderStats() 
{
    const [current_bid, setCurrentBid] = useState(null);
    const [n_bidders, setNBidders] = useState(null);
    const [bid_index, setBidIndex] = useState(null);
    const [total_bid, setTotalBid] = useState(null);
    const [is_winner, setIsWinner] = useState(false);
    const [tokens_remaining, setTokensRemaining] = useState(null);
    const [time_selected, setTimeSelected] = useState(null);
    const check_interval = useRef<number | null>(null);


    const wallet = useWallet();

    const init = useCallback(async () => 
    {       
        const program_key = new PublicKey('GRxdexptfCKuXfGpTGREEjtwTrZPTwZSfdSXiWDC11me');
        const daoplays_key = new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD");
        const token_mint_key = new PublicKey("6PRgpKnwT9xgGF7cgS7ZMkPBeQmd5mdS97eg26ir8Kki");
        //console.log("in biddata");
        try {
            if (!have_bidder_stats) {
                let program_data_key = (await PublicKey.createWithSeed(daoplays_key, "data_account", program_key));
                const program_account_url = `/.netlify/functions/solana_main?function_name=getAccountInfo&p1=`+program_data_key.toString()+`&p2=base64`;
                const program_account_result = await fetch(program_account_url).then((res) => res.json());
                let program_account_encoded_data = program_account_result["result"]["value"]["data"];
                let program_account_data = Buffer.from(program_account_encoded_data[0], "base64");


                let program_pda_key = (await PublicKey.findProgramAddress(["token_account"], program_key))[0];

                

                let program_token_key = await getAssociatedTokenAddress(
                    token_mint_key, // mint
                    program_pda_key, // owner
                    true // allow owner off curve
                );


                const token_url = `/.netlify/functions/solana_main?function_name=getTokenAccountBalance&p1=`+program_token_key.toString();
                const token_data_result = await fetch(token_url).then((res) => res.json());
                try {
                    setTokensRemaining(token_data_result["result"]["value"]["amount"]);
                }
                catch(error) {
                    console.log(token_data_result);
                    console.log(error);
                }   
            

                const n_bidders_struct = deserialize(u16_scheme, my_u16, program_account_data.slice(8,10));
                const total_bid_amount_struct = deserialize(u64_scheme, my_u64, program_account_data.slice(10,18));
                const n_winners_struct = deserialize(u8_scheme, my_u8, program_account_data.slice(49170,49171));
                const last_selected_struct = deserialize(u64_scheme, my_u64, program_account_data.slice(0,8));

                
                setTotalBid(total_bid_amount_struct.value.toNumber() / LAMPORTS_PER_SOL);
                setNBidders(n_bidders_struct.value);

                let ts = last_selected_struct.value.toNumber();
                let time_remaining = Math.max(300.0 / n_bidders_struct.value + 2 - (Math.floor(Date.now() / 1000) - ts), 0);
                setTimeSelected(time_remaining);

                if (wallet.publicKey) {

                    let bidder_pda_key = (await PublicKey.findProgramAddress([wallet.publicKey.toBytes()], program_key))[0];
                    const bidder_account_url = `/.netlify/functions/solana_main?function_name=getAccountInfo&p1=`+bidder_pda_key.toString()+`&p2=base64`;
                    const bidder_account_result = await fetch(bidder_account_url).then((res) => res.json());
                    
                
                
                    let bidder_token_key = await getAssociatedTokenAddress(
                        token_mint_key, // mint
                        wallet.publicKey, // owner
                        false // allow owner off curve
                    );

                    try {
                        let bidder_account_encoded_data = bidder_account_result["result"]["value"]["data"];
                        let bidder_account_data = Buffer.from(bidder_account_encoded_data[0], "base64");

                        //console.log(bidder_account_encoded_data);
                        //console.log(bidder_account_data);

                        const bidder_data_struct = deserialize(u16_scheme, my_u16, bidder_account_data);        
                        let key_start_index = 18 + bidder_data_struct.value * 32;
                        const bid_key = new PublicKey(deserialize(pubkey_scheme, my_pubkey, program_account_data.slice(key_start_index, key_start_index + 32)).value);

                        let bid_start_index = 32786 + bidder_data_struct.value * 8;
                        const bid_amount = deserialize(u64_scheme, my_u64, program_account_data.slice(bid_start_index, bid_start_index + 8));


                        let time_start_index = 40978 + bidder_data_struct.value * 8;
                        const bid_time = deserialize(u64_scheme, my_u64, program_account_data.slice(time_start_index, time_start_index + 8)).value.toNumber();

                        if (bid_key.toString() === bidder_token_key.toString()) {
                            setCurrentBid(bid_amount.value.toNumber() / LAMPORTS_PER_SOL);
                            //console.log("bidder position", bidder_data_struct.value, "bid amount", bid_amount.value.toNumber() / LAMPORTS_PER_SOL);

                            let age_count = 0;
                            for (let i = 0; i < 1024; i++) {
                                let time_start_index = 40978 + i * 8;
                                const one_time = deserialize(u64_scheme, my_u64, program_account_data.slice(time_start_index, time_start_index + 8)).value.toNumber();
                                //console.log(i, one_time, bid_time, age_count);
                                if (one_time < bid_time) {
                                    age_count += 1;
                                }
                            }

                            setBidIndex(age_count);
                            
                        }
                        else {
                            setCurrentBid(0);
                            //console.log("no bid ", bid_amount.value.toNumber() / LAMPORTS_PER_SOL);

                        }

                        let is_winner = false;
                        for (let i = 0; i < n_winners_struct.value; i++) {
                            let key_start_index = 49171 + i * 32;
                            const winner_key = new PublicKey(deserialize(pubkey_scheme, my_pubkey, program_account_data.slice(key_start_index, key_start_index + 32)).value);

                            if (winner_key.toString() === bidder_token_key.toString()) {
                                is_winner = true;
                                break;
                            }
                        }
                        setIsWinner(is_winner);
                    }
                    catch(error) {
                        console.log(bidder_account_result);
                        console.log(error);
                        setCurrentBid(0);
                    }
                }
                

            }
            have_bidder_stats = true;
        }
        catch(error) {
          console.log(error);
          have_bidder_stats = false;
      }   


    }, [wallet]);

    useEffect(() => {
        if (check_interval.current === null) {
            check_interval.current = window.setInterval(init, 1000000);
        } else {
            window.clearInterval(check_interval.current);
            check_interval.current = null;
        }
        // here's the cleanup function
        return () => {
            if (check_interval.current !== null) {
                window.clearInterval(check_interval.current);
                check_interval.current = null;
            }
        };
    }, [init]);

    return {current_bid, n_bidders, bid_index, total_bid, is_winner, tokens_remaining, time_selected};
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
                        
                        Humanitarian Relief Organizations and International Nonprofits participating in this emergency response fund will receive an equal distribution of the fund. These organizations' missions include providing urgent medical care and humanitarian aid to children, individuals, families, and animals.  Find out more <a  style={{textDecoration: "underline"}} href="https://thegivingblock.com/campaigns/ukraine-emergency-response-fund/">here</a>.
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
                        
                        Water.org is an international nonprofit organization that has positively transformed millions of lives around the world with access to safe water and sanitation through affordable financing. Founded by Gary White and Matt Damon, Water.org pioneers market-driven financial solutions to the global water crisis. For 30 years, they've been providing women hope, children health, and families a future. Find out more <a  style={{textDecoration: "underline"}} href="https://water.org/">here</a>.
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
                        
                        Evidence Action is a global nonprofit organization with an approach distinctive in international development - they exclusively scale interventions that are backed by strong evidence and can be delivered with exceptional cost-effectiveness. Their programs have grown since their founding in 2013 to reach over 280 million people annually. They take a data-driven approach to identifying, scaling, and continuously improving programs which deliver immense impact, ensuring these solutions measurably improve the lives of millions. Find out more <a  style={{textDecoration: "underline"}} href="https://www.evidenceaction.org/">here</a>.
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
                        
                        The Life You Can Save is an advocacy nonprofit that makes “smart giving simple” by identifying and recommending some of the world's most effective charities. They currently recommend over 20 outstanding charities whose evidence-based, cost-effective interventions have been proven to save and transform the lives of people living in extreme global poverty (defined as less than US$1.90 per day).

                        They provide free tools and resources that make it easy to learn about and support these wonderful organizations so that you can give where it matters most and ensure that you get the most “bang for your buck.” Over the past three years, they've raised an average of $17 for their recommended charities for each dollar they have spent on their own operations.
                        Find out more <a  style={{textDecoration: "underline"}} href="https://www.thelifeyoucansave.org/">here</a>.
                        </Card.Text>
                    </Card.Body>
                </Card>
            }
        </Flex>
    );
}

function StatsBlock()
{
    const { total_donated, donation_array, n_donations } = GetCharityStats();

  return(
    <>
    <Text  mb="2rem" fontSize="2rem" textAlign="center">Donation Summary</Text>

    <Center>
      <Flex flexDirection="row">
          
          <Box mt="1rem"   mr="1rem">
              <HStack>
                  <Box  borderWidth='5px' borderColor="darkblue">
                      <FontAwesomeIcon icon={solid('hand-holding-heart')} size="4x" />
                  </Box>
                  <Box flex='1'  pl="1rem" pr="1rem" maxW='sm' mt="1rem"  borderWidth='1px' borderRadius='lg' overflow='hidden'>
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
          <Box mt="1rem"  >
              <HStack>
                  <Box  borderWidth='5px' borderColor="darkblue">
                      <FontAwesomeIcon icon={solid('people-group')} size="4x" />
                  </Box>
                  <Box flex='1' pl="1rem" pr="1rem" maxW='sm' mt="1rem" borderWidth='1px' borderRadius='lg' overflow='hidden'>
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
      </Center>
    <Box  width="100%">
    <Plot
        data={[
            {
                type: 'bar', 
                x: ["Evidence Action", "Girls Who Code", "One Tree Planted", "Outright Action Int.","The Life You Can Save", "Ukraine ERF", "Water.Org"], 
                y: donation_array,
                marker:{
                    color: ["rgb(205, 120, 139)", "rgb(13, 156, 144)", "rgb(49,53,56)", "rgb(222,185,104)", "rgb(221,81,57,255)", "rgb(255, 215, 0)", "rgb(98, 161, 192)"]
                }
            },
        ]}
        layout={{
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
    </>
  );
}

function GetTokens() {
    const wallet = useWallet();
    
    const [slide_value, setSlideValue] = React.useState(90)
    const [which_charity, setWhichCharity] = React.useState("")

    const handleWhichCharity = (event) => {
      setWhichCharity(event.target.value);
    };

    const {current_bid, n_bidders, bid_index, total_bid, is_winner, tokens_remaining, time_selected} = GetBidderStats();

    let time_string = JSON.stringify(time_selected);
    //console.log("time remaining", time_selected, time_string);

    const format = (sol_value) => sol_value+` SOL`
    const parse = (sol_value) => sol_value.replace(/^ SOL/, '')
    const [sol_value, setSOLValue] = React.useState(0.1)

    const handleSlideChange = (slide_value) => setSlideValue(slide_value)
  
    const join_ico = useCallback( async () => 
    {
            //console.log("Sol value:", sol_value);
            //console.log("Slide value:", slide_value);

            const token_mint_key = new PublicKey("6PRgpKnwT9xgGF7cgS7ZMkPBeQmd5mdS97eg26ir8Kki");      
            const daoplays_key = new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD");
            const pyth_btc = new PublicKey("GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU");
            const pyth_eth = new PublicKey("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB");
            const pyth_sol = new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");
            const program_key = new PublicKey('GRxdexptfCKuXfGpTGREEjtwTrZPTwZSfdSXiWDC11me');   
            const SYSTEM_PROGRAM_ID = new PublicKey(
                '11111111111111111111111111111111',
            );          
        
            let program_data_key = (await PublicKey.createWithSeed(daoplays_key, "data_account", program_key));
            const program_account_url = `/.netlify/functions/solana_main?function_name=getAccountInfo&p1=`+program_data_key.toString()+`&p2=base64`;
            const program_account_result = await fetch(program_account_url).then((res) => res.json());
            let program_account_encoded_data = program_account_result["result"]["value"]["data"];
            let program_account_data = Buffer.from(program_account_encoded_data[0], "base64");

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

            let charity_key = new PublicKey('E6TPLh77cx9b5aWsmxM8geit2PBLVEBVAvF6ye9Qe4ZQ');
            let chosen_charity = Charity.UkraineERF;
            if(which_charity === "UkraineERF") {
                chosen_charity = Charity.UkraineERF;
                charity_key = new PublicKey('E6TPLh77cx9b5aWsmxM8geit2PBLVEBVAvF6ye9Qe4ZQ');
            }
            else if(which_charity === "WaterOrg"){
                chosen_charity = Charity.WaterOrg;
                charity_key = new PublicKey('5UNSVwtiSdfsCbJokL4fHtzV28mVNi8fQkMjPQw6v7Xd');
            }
            else if(which_charity === "OneTreePlanted"){
                chosen_charity = Charity.OneTreePlanted;
                charity_key = new PublicKey('GeCaNYhRswBFoTxtNaf9wKYJEBZoxHa9Fao6aQKzDDo2');
            }
            else if(which_charity === "EvidenceAction"){
                chosen_charity = Charity.EvidenceAction;
                charity_key = new PublicKey('9fF5EQV6FVy7V5SaHBXfAaTUBvuyimQ9X3jarc2mRHzi');
            }
            else if(which_charity === "GirlsWhoCode"){
                chosen_charity = Charity.GirlsWhoCode;
                charity_key = new PublicKey('5qrmDeRFhBTnEkqJsRKJAkTJzrZnyC9bWmRhL6RZqWt1');
            }
            else if(which_charity === "OutrightActionInt"){
                chosen_charity = Charity.OutrightActionInt;
                charity_key = new PublicKey('AiY4t79umvBqGvR43f5rL8jR8F2JZwG87mB55adAF2cf');
            }
            else if(which_charity === "TheLifeYouCanSave"){
                chosen_charity = Charity.TheLifeYouCanSave;
                charity_key = new PublicKey('8qQpHYjLkNiKvLtFzrjzgFZfveNJZ9AnQuBUoQj1t3DB');
            }

            let charity_amount = parseFloat((slide_value * sol_value * 0.01).toFixed(4));
            let dao_amount = parseFloat(((100-slide_value) * sol_value * 0.01).toFixed(4));

            const data = Buffer.alloc(BidData.span);
            let ch_bn = new BN(charity_amount* LAMPORTS_PER_SOL, 10);
            let dao_bn = new BN(dao_amount* LAMPORTS_PER_SOL, 10);

            //console.log("charity : ", charity_amount, charity_amount * LAMPORTS_PER_SOL, ch_bn.toNumber());
            //console.log("dao : ", dao_amount,  dao_amount * LAMPORTS_PER_SOL, dao_bn.toNumber());


            BidData.encode(
                {
                    instruction: AuctionInstruction.place_bid,
                    amount_charity: ch_bn,
                    amount_daoplays: dao_bn,
                    charity: chosen_charity
                },
                data
            );

              


            /*console.log("wallet: ",  wallet.publicKey.toString());
            console.log("joiner token: ", joiner_token_key.toString());
            console.log("bidder pda: ", bidder_pda_key.toString());
            console.log("daoplays: ", daoplays_key.toString());
            console.log("charity: ", charity_key.toString());
            console.log("program data: ", program_data_key.toString());
            console.log("program token: ", program_token_key.toString());
            console.log("token mint: ", token_mint_key.toString());*/


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

            const blockhash_url = `/.netlify/functions/solana_main?function_name=getLatestBlockhash&p1=`;
            const blockhash_data_result = await fetch(blockhash_url).then((res) => res.json());
            let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
            let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];
            const txArgs = { blockhash: blockhash, lastValidBlockHeight: last_valid};

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;

        
            // check if we should add a send_tokens instruction
            // this may not end up doing anything if they have already been sent
            let n_winners = deserialize(u8_scheme, my_u8, program_account_data.slice(49170,49171)).value;
            //console.log("have ", n_winners, " winners");
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

                /*console.log("wallet ",  wallet.publicKey.toString());
                console.log("program_pda_key ",  program_pda_key.toString());
                console.log("program_token_key ",  program_token_key.toString());
                console.log("program_data_key ",  program_data_key.toString());
                console.log("TOKEN_PROGRAM_ID ",  TOKEN_PROGRAM_ID.toString());*/


                for (let i = 0; i < n_winners; i++) {
                    let key_start_index = 49171 + i * 32;
                    const key = new PublicKey(deserialize(pubkey_scheme, my_pubkey, program_account_data.slice(key_start_index, key_start_index + 32)).value);
                    key_vector.push({pubkey: key, isSigner: false, isWritable: true});
                    //console.log("winner ",  key.toString());
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
                    let signed_transaction = await wallet.signTransaction(transaction);
                    const encoded_transaction = bs58.encode(signed_transaction.serialize());

                    const send_url = `/.netlify/functions/solana_main?function_name=sendTransaction&p1=`+encoded_transaction;
                    await fetch(send_url).then((res) => res.json());

            } catch(error) {
                console.log(error);
            }
      

    },
    [wallet, sol_value, slide_value, which_charity]
    );

    const select_winners = useCallback( async () => 
    {

            const token_mint_key = new PublicKey("6PRgpKnwT9xgGF7cgS7ZMkPBeQmd5mdS97eg26ir8Kki");
            const daoplays_key = new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD");
            const pyth_btc = new PublicKey("GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU");
            const pyth_eth = new PublicKey("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB");
            const pyth_sol = new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");
            const program_key = new PublicKey('GRxdexptfCKuXfGpTGREEjtwTrZPTwZSfdSXiWDC11me');   

        
            let program_data_key = (await PublicKey.createWithSeed(daoplays_key, "data_account", program_key));

            const program_account_url = `/.netlify/functions/solana_main?function_name=getAccountInfo&p1=`+program_data_key.toString()+`&p2=base64`;
            const program_account_result = await fetch(program_account_url).then((res) => res.json());
            let program_account_encoded_data = program_account_result["result"]["value"]["data"];
            let program_account_data = Buffer.from(program_account_encoded_data[0], "base64");


            let program_pda_key = (await PublicKey.findProgramAddress(["token_account"], program_key))[0];

            let program_token_key = await getAssociatedTokenAddress(
                token_mint_key, // mint
                program_pda_key, // owner
                true // allow owner off curve
            );

            const blockhash_url = `/.netlify/functions/solana_main?function_name=getLatestBlockhash&p1=`;
            const blockhash_data_result = await fetch(blockhash_url).then((res) => res.json());
            let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
            let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];
            const txArgs = { blockhash: blockhash, lastValidBlockHeight: last_valid};

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;

            // just check the winners struct to see if we have already select winners, as we can skip
            // the first step if so
            let n_winners = deserialize(u8_scheme, my_u8, program_account_data.slice(49170,49171)).value;

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

              /*console.log("wallet ",  wallet.publicKey.toString());
              console.log("program_pda_key ",  program_pda_key.toString());
              console.log("program_token_key ",  program_token_key.toString());
              console.log("program_data_key ",  program_data_key.toString());
              console.log("TOKEN_PROGRAM_ID ",  TOKEN_PROGRAM_ID.toString());*/


              for (let i = 0; i < n_winners; i++) {
                  let key_start_index = 49171 + i * 32;
                  const key = new PublicKey(deserialize(pubkey_scheme, my_pubkey, program_account_data.slice(key_start_index, key_start_index + 32)).value);
                  key_vector.push({pubkey: key, isSigner: false, isWritable: true});
                  //console.log("winner ",  key.toString());
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
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                const send_url = `/.netlify/functions/solana_main?function_name=sendTransaction&p1=`+encoded_transaction;
                await fetch(send_url).then((res) => res.json());
      
              
          }catch(error) {
              console.log(error);
          }
    },
    [wallet]
    );

    return(
        <>

        <Text fontSize="2rem"  textAlign="center" mb="2rem" >Get Play Tokens</Text>
        <Alert status='info'  mb="1rem">
                    <AlertIcon />
                        <Text  textAlign="center">The greater your bid, the higher your chance of winning. New auctions take place every few seconds to minutes, and your bid can remain active for multiple auctions. For more information check out our blog post <Link style={{textDecoration: "underline"}} to="/blog/pokemon_guide">here</Link>. </Text>
                    
                </Alert>
        <HStack alignItems="top">

            <Box borderWidth='2px' borderRadius="2rem" p='1rem' width='50%' mr="1%" ml="12.5%">                
            
            

                <Text mt="2rem" mb="1rem" textAlign="center" fontSize="1.5rem">Step 1: What do you want to bid for 100 tokens?</Text>

                

                <Center>
                    <HStack>                        
                        <Tooltip hasArrow label='Total amount in SOL you want to bid for 100 Play Tokens.  The greater your bid, the higher your chance of winning.  The SOL will be sent to your chosen destinations when your bid is submitted.'>
                        <Text>
                            Amount to Bid:
                        </Text>
                        </Tooltip>
                        <NumberInput 
                            onChange={(valueString) => setSOLValue(parse(valueString))}
                            value={format(sol_value)}
                            defaultValue={0.1} precision={4}  maxW='200px' mr='2rem' ml='2rem'>
                            <NumberInputField/>
                        </NumberInput>
                
                    </HStack>
                </Center>       
                

                <Divider mt="2rem" mb="2rem"/>

            
                <Box>
                    <Text mt="2rem" mb="1rem" textAlign="center" fontSize="1.5rem">Step 2: How should we split your bid?</Text>
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
                </Box>    

                <Divider mt="2rem" mb="2rem"/>    

                <Text mt="2rem" mb="1rem" textAlign="center" fontSize="1.5rem">Step 3: Select a Charity</Text>

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

                <Center>
                    <Box mt="2rem">
                        {!wallet.publicKey ?

                            <Tooltip hasArrow label='Connect a wallet to bid' bg='red.600'>
                            <Button width='100px' colorScheme='red' variant='solid'>
                                Place Bid!
                            </Button>
                            </Tooltip>
                        :                        
                        which_charity==="" ?
                        
                            <Tooltip hasArrow label='Choose a charity to bid' bg='red.600'>
                                <Button width='100px' colorScheme='red' variant='solid'>
                                    Place Bid!
                                </Button>
                            </Tooltip>
                        :

                        sol_value < 0.0001 ?

                            <Tooltip hasArrow label='Minimum bid is 0.0001 SOL' bg='red.600'>
                                <Button width='100px' colorScheme='red' variant='solid'>
                                    Place Bid!
                                </Button>
                            </Tooltip>
                        :
                        

                            <Button onClick={join_ico}  width='100px' colorScheme='green' variant='solid'>
                                Place Bid!
                            </Button>
                        
                        
                            
                        }
                    </Box>
                </Center>
            </Box>
        
            <Box width="24%">    
                <VStack  borderWidth='2px' borderRadius="2rem" p='1rem' spacing="2rem">
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
                                <Text fontSize="17">Number Active Bids</Text>
                            </Tooltip>
                            </Box>
                            <Box></Box>
                            <Box></Box>
                            <Box flex='1'><Text fontSize="17">Current Average Bid </Text></Box>
                            <Box></Box>
                            <Box></Box>
                            <Tooltip hasArrow label='Play Tokens remaining in the auction pool. Using the tokens to vote for moves in the game replenishes the pool. New winners can only be selected if there are more than 100 tokens remaining.'>
                            <Box flex='1'><Text fontSize="17">Tokens Available </Text></Box>
                            </Tooltip>
                            
                        </VStack>
                        <VStack>
                            <FormControl id="n_bidders" maxWidth={"120px"} >
                                <Input
                                    type="text"
                                    value = {n_bidders != null ? n_bidders : "Loading.."}
                                    readOnly
                                />
                            </FormControl>
                            <FormControl id="total_bid" maxWidth={"120px"} >
                                <Input
                                    type="text"
                                    value = {total_bid != null ? total_bid  ===  0 ? 0 : (total_bid / n_bidders).toFixed(4) : "Loading.."}
                                    readOnly
                                />
                            </FormControl>
                            <FormControl id="tokens_available" maxWidth={"120px"} >
                                <Input
                                    type="text"
                                    value = {tokens_remaining ? tokens_remaining : "Loading.."}
                                    readOnly
                                />
                            </FormControl>
                        </VStack>
                    </HStack>
                </VStack>

                <Divider/>

                <VStack alignItems="center" mt="2rem" ml="2rem">
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
                        <Tooltip hasArrow label='Bidding multiple times will cause your active bid to accumulate, increasing your chance of winning the next auction'>
                            <Box flex='1'><Text fontSize="17">Your Active Bid</Text></Box>
                            </Tooltip>
                            <Box></Box>
                            <Box></Box>
                            <Tooltip hasArrow label='Your chance of winning the next auction given the size of your active bid, and the total amount bid by other users'>
                            <Box flex='1'><Text fontSize="17">Your Chance of Winning</Text></Box>
                            </Tooltip>
                            <Box></Box>
                            <Box></Box>
                            <Tooltip hasArrow label="When all 1024 bid slots are in use, new bids remove the oldest ones in the auction.  When this counter reaches zero, you will have the oldest bid in the auction, and will be in danger of losing your bid.  Bid again to refresh this value to the maximum.">
                            <Box flex='1'><Text fontSize="17">Bids until removal</Text></Box>   
                            </Tooltip>                        

                        </VStack>
                        

                        <VStack> 
                            <FormControl id="current_bid" maxWidth={"120px"} >
                                <Input
                                    type="text"
                                    value = {current_bid != null ? (current_bid).toFixed(4) : "Loading.."}
                                    readOnly
                                />
                            </FormControl>
                            <FormControl id="win_chance" maxWidth={"120px"} >
                                <Input
                                    type="text"
                                    value = {total_bid && current_bid ? (current_bid / total_bid).toFixed(4) : 0}
                                    readOnly
                                />
                            </FormControl>
                            <FormControl id="bid_time" maxWidth={"120px"} >
                                <Input
                                    type="text"
                                    value = {current_bid && bid_index != null ? bid_index : 0}
                                    readOnly
                                />
                            </FormControl>
                        </VStack>

                        
                
                    </HStack>
                </VStack>

                <Divider mt="3rem" mb="2rem"/>

                <Alert status='info'  mb="1rem">
                    <AlertIcon />
                    {
                        <Text> The program will send tokens and select new winners whenever anyone bids or plays the game.  If there are only a few people playing right now you can click the button below to do this yourself.</Text>
                        
                    }
                </Alert>

                { !wallet.publicKey ?
                
                <>
                    
                    <Tooltip hasArrow label='Connect a wallet to be able to send tokens.' bg='red.600'>
                    <Button width='150px' colorScheme='red' variant='solid'>
                        Send Tokens!
                    </Button>
                    </Tooltip>
                </>

                :
                tokens_remaining != null && tokens_remaining < 100 ?
                        
                
                <>
                    
                    <Tooltip hasArrow label='Fewer than 100 Play Tokens remaining.  Cannot select winners until more are available.' bg='red.600'>
                    <Button width='150px' colorScheme='red' variant='solid'>
                        Send Tokens!
                    </Button>
                    </Tooltip>
                </>
                
                
                :
                is_winner != null && !is_winner && n_bidders != null && n_bidders === 0 ?
                <>
                
                    <Tooltip hasArrow label='No bids found in the system.  Cannot select winners until a bid has been made.' bg='red.600'>
                    <Button width='150px' colorScheme='red' variant='solid'>
                        Send Tokens!
                    </Button>
                    </Tooltip>
                </>
                :
                is_winner ? 
                <>
                    
                    <Alert status='success'  mb="1rem">
                        <AlertIcon />
                        {
                            <Text>You have won! Click the button to get your tokens.</Text>
                        }
                    </Alert>
                    <Button onClick={select_winners}  width='150px' colorScheme='green' variant='solid'>
                        Send Tokens!
                    </Button>

                
                </>
                :
                
                time_selected > 0 ?
                    <>

                    <Tooltip hasArrow label={"Approximate time until next winners can be chosen:"+time_string} bg='red.600'>
                            <Button width='150px' colorScheme='red' variant='solid'>
                                Send Tokens!
                            </Button>
                            </Tooltip>
                    </>
                    :        
                    <>
                    
                        <Button onClick={select_winners}  width='150px' colorScheme='green' variant='solid'>
                            Send Tokens!
                        </Button>
                    </>
                    
                
                }
            </VStack>
            </Box>

        </HStack>
               
        </>
    );
}


function GameBoy() {

    const wallet = useWallet();
    const [button_bid_value, setButtonBidValue] = React.useState(1)
    const [team_name, setTeamName] = React.useState("")

    const handleTeamNameChange = (e) => setTeamName(e.target.value)
    

    const press_button_wrapper = useCallback( async ({button_type, button_bid}) => 
    {
        let user_pubkey = wallet.publicKey;

        console.log("team name: ", team_name, " button: ", button_type, " bid: ", button_bid_value);

        if (team_name !== "") {

            console.log("have a team name\n");

            const button_url = `/.netlify/functions/post_db?team_name=`+team_name+"&button=" + button_type + "&bid="+ button_bid_value;
            const button_result = await fetch(button_url).then((res) => res.json());

            console.log(button_result);
            
            return;
        }

        const token_mint_key = new PublicKey("6PRgpKnwT9xgGF7cgS7ZMkPBeQmd5mdS97eg26ir8Kki");
        const program_key = new PublicKey("GRxdexptfCKuXfGpTGREEjtwTrZPTwZSfdSXiWDC11me");
        const daoplays_key = new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD");
    
        const pyth_btc = new PublicKey("GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU");
        const pyth_eth = new PublicKey("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB");
        const pyth_sol = new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");
    
    
        if (wallet  && button_bid_value > 0) {
            //console.log("button value", button_bid_value);

            let program_data_key = (await PublicKey.createWithSeed(daoplays_key, "data_account", program_key));
            const program_account_url = `/.netlify/functions/solana_main?function_name=getAccountInfo&p1=`+program_data_key.toString()+`&p2=base64`;
            const program_account_result = await fetch(program_account_url).then((res) => res.json());
            let program_account_encoded_data = program_account_result["result"]["value"]["data"];
            let program_account_data = Buffer.from(program_account_encoded_data[0], "base64");



            let program_pda_key = (await PublicKey.findProgramAddress(["token_account"], program_key))[0];

            let program_token_key = await getAssociatedTokenAddress(
                token_mint_key, // mint
                program_pda_key, // owner
                true // allow owner off curve
            );

            let player_token_key = await getAssociatedTokenAddress(
                token_mint_key, // mint
                user_pubkey, // owner
                true // allow owner off curve
            );


            let token_amount = 0;
            const token_url = `/.netlify/functions/solana_main?function_name=getTokenAccountBalance&p1=`+player_token_key.toString();
            const token_data_result = await fetch(token_url).then((res) => res.json());
            
            //console.log(token_data_result);
            try {
                token_amount = token_data_result["result"]["value"]["amount"];
            }
            catch(error) {
                console.log(token_data_result);
                console.log(error);
            }

            //console.log("token amount:", token_amount);
            if (token_amount > 0) {
                    
                const bid_quantity = new BN(button_bid_value, 10);
                const data = Buffer.alloc(ButtonData.span);
                ButtonData.encode(
                    {
                        instruction: AuctionInstruction.push_button,
                        button: button_type,
                        amount: bid_quantity
                    },
                    data
                );

                /*console.log("button:", button_type, "bid", bid_quantity.toNumber())
                console.log("user_pubkey ", user_pubkey.toString());
                console.log("player_token_key ", player_token_key.toString());
                console.log("program_token_key ", program_token_key.toString());
                console.log("token_mint_key ", token_mint_key.toString());
                console.log("TOKEN_PROGRAM_ID ", TOKEN_PROGRAM_ID.toString());*/

                const button_instruction = new TransactionInstruction({
                    keys: [
                        {pubkey: user_pubkey, isSigner: true, isWritable: false},
                        {pubkey: player_token_key, isSigner: false, isWritable: true},
                        {pubkey: program_token_key, isSigner: false, isWritable: true},
                        {pubkey: token_mint_key, isSigner: false, isWritable: false},
                        {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false}

                    ],
                    programId: program_key,
                    data: data
                });

                // make the instruction for selcting winners
                const select_data = Buffer.alloc(SelectData.span);
                SelectData.encode(
                    {
                        instruction: AuctionInstruction.select_winners
                    },
                    select_data
                );


            
                const select_instruction = new TransactionInstruction({
                    keys: [
                        {pubkey: user_pubkey, isSigner: true, isWritable: true},
        
                        {pubkey: pyth_btc, isSigner: false, isWritable: true},
                        {pubkey: pyth_eth, isSigner: false, isWritable: true},
                        {pubkey: pyth_sol, isSigner: false, isWritable: true},
        
                        {pubkey: program_data_key, isSigner: false, isWritable: true},
                        {pubkey: program_token_key, isSigner: false, isWritable: true}
        
                    ],
                    programId: program_key,
                    data: select_data
                });

            
                const blockhash_url = `/.netlify/functions/solana_main?function_name=getLatestBlockhash&p1=`;
                const blockhash_data_result = await fetch(blockhash_url).then((res) => res.json());
                let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
                let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];
                const txArgs = { blockhash: blockhash, lastValidBlockHeight: last_valid};

                let transaction = new Transaction(txArgs);
                transaction.feePayer = user_pubkey;

                // check if we should add a send_tokens instruction
                // this may not end up doing anything if they have already been sent
                let n_winners = deserialize(u8_scheme, my_u8, program_account_data.slice(49170,49171)).value;
                //console.log("have ", n_winners, " winners");
                if (n_winners > 0) {

                    const send_data = Buffer.alloc(SelectData.span);
                    SelectData.encode(
                        {
                            instruction: AuctionInstruction.send_tokens
                        },
                        send_data
                    );

                    var key_vector  = [
                        {pubkey: user_pubkey, isSigner: true, isWritable: true},

                        {pubkey: program_pda_key, isSigner: false, isWritable: true},
                        {pubkey: program_token_key, isSigner: false, isWritable: true},
                        {pubkey: program_data_key, isSigner: false, isWritable: true},

                        {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},


                    ];

                    /*console.log("send tokens instruction:");
                    console.log("user_pubkey ",  user_pubkey.toString());
                    console.log("program_pda_key ",  program_pda_key.toString());
                    console.log("program_token_key ",  program_token_key.toString());
                    console.log("program_data_key ",  program_data_key.toString());
                    console.log("TOKEN_PROGRAM_ID ",  TOKEN_PROGRAM_ID.toString());*/


                    for (let i = 0; i < n_winners; i++) {
                        let key_start_index = 49171 + i * 32;
                        const key = new PublicKey(deserialize(pubkey_scheme, my_pubkey, program_account_data.slice(key_start_index, key_start_index + 32)).value);
                        key_vector.push({pubkey: key, isSigner: false, isWritable: true});
                        //console.log("winner ",  key.toString());
                    }


                    const send_instruction = new TransactionInstruction({
                        keys: key_vector,
                        programId: program_key,
                        data: send_data
                    });

                    transaction.add(send_instruction);
                }


                transaction.add(select_instruction);
                transaction.add(button_instruction);

    
                try {


                        let signed_transaction = await wallet.signTransaction(transaction);
                        const encoded_transaction = bs58.encode(signed_transaction.serialize());

                        const send_url = `/.netlify/functions/solana_main?function_name=sendTransaction&p1=`+encoded_transaction;
                        await fetch(send_url).then((res) => res.json());
                }
                
                catch(error) {
                    console.log(error);
                }
            }
        }
    },[button_bid_value, wallet, team_name]);

    const press_up_button = useCallback( async () => 
    {
        press_button_wrapper({button_type: ButtonTypes.Up, button_bid: button_bid_value});
    
    },
    [button_bid_value, press_button_wrapper]
    );

    const press_down_button = useCallback( async () => 
    {
        press_button_wrapper({button_type: ButtonTypes.Down, button_bid: button_bid_value});
    
    },
    [button_bid_value, press_button_wrapper]
    );

    const press_left_button = useCallback( async () => 
    {
        press_button_wrapper({button_type: ButtonTypes.Left, button_bid: button_bid_value});
    
    },
    [button_bid_value, press_button_wrapper]
    );

    const press_right_button = useCallback( async () => 
    {
        press_button_wrapper({button_type: ButtonTypes.Right, button_bid: button_bid_value});
    
    },
    [button_bid_value, press_button_wrapper]
    );

    const press_A_button = useCallback( async () => 
    {
        press_button_wrapper({button_type: ButtonTypes.A, button_bid: button_bid_value});
    
    },
    [button_bid_value, press_button_wrapper]
    );

    const press_B_button = useCallback( async () => 
    {
        press_button_wrapper({button_type: ButtonTypes.B, button_bid: button_bid_value});
    
    },
    [button_bid_value, press_button_wrapper]
    );

    const press_start_button = useCallback( async () => 
    {
        press_button_wrapper({button_type: ButtonTypes.Start, button_bid: button_bid_value});
    
    },
    [button_bid_value, press_button_wrapper]
    );

    const press_select_button = useCallback( async () => 
    {
        press_button_wrapper({button_type: ButtonTypes.Select, button_bid: button_bid_value});
    
    },
    [button_bid_value, press_button_wrapper]
    );

    return(
<>     
            <Center>
                <VStack>
                <HStack>                        
                        <Tooltip hasArrow label='The number of Play Tokens to use to vote for your move.  A move is made every time a block is produced, and the more tokens you vote with the higher the chance that your move is chosen.'>
                            
                        
                        <Text>
                            No. of Play Tokens to vote for your move:
                        </Text>
                        </Tooltip>
                        <NumberInput 
                            onChange={(valueString) => setButtonBidValue(valueString)}
                            value={button_bid_value}
                            defaultValue={1} precision={0}  maxW='100px' min={1} >
                            <NumberInputField/>
                        </NumberInput>
                
                    </HStack>
                    <HStack>      
                        <Tooltip hasArrow label='Valid Team Name.  You will share the token resources owned by the team when playing.'> 
                        <Text>
                            (Optional) Team Name
                        </Text>                 
                        </Tooltip>

                        <FormControl id="team_name" maxWidth={"150px"} >
                            <Input
                                type="text"
                                value={team_name}
                                onChange={handleTeamNameChange}
                            />
                        </FormControl>
                        
                
                    </HStack>
                    </VStack>
                </Center>       
                

            <Center>
            <HStack spacing="25px" mt="1rem">
                <VStack spacing="10px">
                    
                    <IconButton onClick={press_up_button} aria-label='press up' 
                        icon={<FontAwesomeIcon icon={solid('square-caret-up')} size="4x" />} 
                    />
                    <HStack spacing='55px'>
                        <IconButton onClick={press_left_button} aria-label='press left' 
                            icon={<FontAwesomeIcon icon={solid('square-caret-left')} size="4x" />} 
                        />
                        <IconButton onClick={press_right_button} aria-label='press right' 
                            icon={<FontAwesomeIcon icon={solid('square-caret-right')} size="4x" />} 
                        />
                    </HStack>
                    <IconButton onClick={press_down_button} aria-label='press down' 
                            icon={<FontAwesomeIcon icon={solid('square-caret-down')} size="4x" />} 
                        />
                </VStack>

                <Box width="30%" ml="2rem" mr="2rem"></Box>

                <Button onClick={press_A_button} width='80px' colorScheme='red' variant='solid'>
                            A
                </Button>
                <Button onClick={press_B_button} width='80px' colorScheme='red' variant='solid'>
                            B
                </Button>
            </HStack>
        </Center>
        
        <br/>
        <Center>
            <HStack spacing="25px">
                <Box width="5%"></Box>
                <Button onClick={press_start_button} width='80px' colorScheme='gray' variant='solid'>
                    Start
                </Button>
                <Button onClick={press_select_button} width='80px' colorScheme='gray' variant='solid'>
                    Select
                </Button>
                        
                        
            </HStack>
        </Center>
        </>  
    );
  }


  let intervalId;
  function useSolanaAccount() 
  {
      const [lamports, setLamports] = useState(null);
      const [token_amount, setTokenAmount] = useState(null);
      const [supporter_amount, setSupporterAmount] = useState(null);

      const wallet = useWallet();
    
      const init = useCallback(async () => 
      {       
          if (!have_token_amounts && wallet.publicKey) {

                const wallet_url = `/.netlify/functions/solana_main?function_name=getAccountInfo&p1=`+wallet.publicKey.toString();
                const program_data_result = await fetch(wallet_url).then((res) => res.json());
                let lamports_amount = program_data_result["result"]["value"]["lamports"];
                setLamports(lamports_amount);

                const mintAccount = new PublicKey("6PRgpKnwT9xgGF7cgS7ZMkPBeQmd5mdS97eg26ir8Kki");
                
                let token_pubkey = await getAssociatedTokenAddress(
                    mintAccount, // mint
                    wallet.publicKey, // owner
                    false // allow owner off curve
                );
                try {

                    const token_url = `/.netlify/functions/solana_main?function_name=getTokenAccountBalance&p1=`+token_pubkey.toString();
                    const token_data_result = await fetch(token_url).then((res) => res.json());

                    let token_amount = token_data_result["result"]["value"]["amount"];
                    let decimals = token_data_result["result"]["value"]["decimals"];

                    let token_decs = token_amount / 10.0**decimals;
                    setTokenAmount(token_decs)
                    have_token_amounts = true;
                }
                catch(error) {
                    console.log(error);
                    setTokenAmount(null)
                    have_token_amounts = false;
                }   

                const supporter_mintAccount = new PublicKey("7B1yoU3EsbABt1kNXcJLeJRT8jwPy9rZfhrhWzuCA9Fq");
                
                let supporter_pubkey = await getAssociatedTokenAddress(
                    supporter_mintAccount, // mint
                    wallet.publicKey, // owner
                    false // allow owner off curve
                );
                try {
                    const token_url = `/.netlify/functions/solana_main?function_name=getTokenAccountBalance&p1=`+supporter_pubkey.toString();
                    const token_data_result = await fetch(token_url).then((res) => res.json());

                    let token_amount = token_data_result["result"]["value"]["amount"];
                    let decimals = token_data_result["result"]["value"]["decimals"];
                    let token_decs = token_amount / 10.0**decimals;
                    setSupporterAmount(token_decs)
                    have_token_amounts = true;
                }
                catch(error) {
                    console.log(error);
                    setSupporterAmount(null)
                    have_token_amounts = false;
                }   
          }

 
  
      }, [wallet]);
  
      useEffect(() => 
      {
          if (wallet.publicKey && !intervalId) {
              intervalId = setInterval(init, 3000);
          }
          else{
              clearInterval(intervalId);
              intervalId = null;
          }
      }, [init, wallet]);
  
      return { lamports, token_amount, supporter_amount };
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

    const { lamports, token_amount, supporter_amount} = useSolanaAccount();  
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
                            <Box ></Box>
                            <Box></Box>
                            <Tooltip hasArrow label='Use these tokens to vote for moves in the game.  You can get Play Tokens by taking part in the token auction at the bottom of this page'>

                            <Text  >
                                {"Play Tokens"}
                            </Text>
                            </Tooltip>
                            <Box></Box>
                            <Box></Box>
                            <Tooltip hasArrow label='Supporter Tokens will only be made available on limited occasions, such as the token launch for this app. For more information see the DaoPlays Pokemon launch post on the blog!'>
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
                                        lamports
                                        ? lamports / LAMPORTS_PER_SOL
                                        : "Loading.."
                                    }
                                    readOnly
                            />
                            </FormControl>
                            <FormControl  id="tokenbalance" maxWidth={"175px"}>
                                <Input
                                    type="text"
                                    value={
                                    token_amount
                                        ? token_amount
                                        : '0'
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
    
    const wallet = useWallet();
    return(
        <>
        <br/>
        <Alert status='info'  mb="1rem">
        <AlertIcon />
        {
            <Text textAlign="center">Take part in the DaoPlays Pokemon token launch to pay what you want for an initial block of Play Tokens <Link style={{textDecoration: "underline"}} to="/pokemon/token_launch"> here</Link>!</Text>
        }
        </Alert>
        <br/><br/>
        <StatsBlock />

        <Divider mt="2rem" mb="2rem"/>
        <Text  mb="2rem" fontSize="2rem" textAlign="center">Join the Game</Text>

        < Badges/>

        <Center>

        <Flex flexDirection="row">
            <VStack align="center" borderWidth='2px' borderRadius="2rem" p='1rem' spacing="1rem">

                <TwitchEmbed
                    channel="daoplays_"
                    id="daoplays_"
                    theme="dark"
                    withChat = {false}
                    muted
                    onVideoPause={() => console.log(':(')}
            />

            <Divider mt="3rem"/>

            {wallet.publicKey &&   <GameBoy/>}
            {!wallet.publicKey &&   <Text  fontSize="2rem"  textAlign="center"><br/><br/>Connect A Solana Wallet To Play</Text>}
               
            
            </VStack>
            <Box ml="1rem" borderWidth='2px' borderRadius="2rem" p='1rem'>
                <TwitchChat
                    channel="daoplays_"
                    id="daoplays_"
                    theme="dark"
                    height="480"
                />
                <Divider mt="1rem"/>
                <AccountInfo/>
            </Box>
            
            
        </Flex>
        </Center>

        <Divider mt="2rem" mb="2rem"/>

        

        
        <GetTokens/>
            
    </>
    );
}

function Pokemon()
{
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()], []);


    return(
        <ChakraProvider theme={theme}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>

                    <MainFunction/>
    
                </WalletModalProvider>
            </WalletProvider>
        </ChakraProvider>

    );
}

export default Pokemon;