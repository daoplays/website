import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {Card} from 'react-bootstrap';
import {ChakraProvider, theme, Box, HStack, Flex, Button, Spacer, Text, VStack, Center,
    FormControl, Input, NumberInput, Slider, NumberInputField, SliderTrack, SliderFilledTrack, SliderThumb, Tooltip, Select, Stat, StatLabel, StatNumber
 } from '@chakra-ui/react';
import { struct, u64, u8 } from "@project-serum/borsh";
import BN from "bn.js";
import Plot from 'react-plotly.js';
import { deserialize } from 'borsh';
import { Divider, Alert, AlertIcon } from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used
import { MdFiberManualRecord } from "react-icons/md";
import bs58 from "bs58";
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

import UkraineERF_img from "../blog/posts/4_CharityICO/ukraine_logo.jpg"
import WaterOrg_img from "../blog/posts/4_CharityICO/waterorg_logo.jpeg"
import EvidenceAction_img from "../blog/posts/4_CharityICO/evidenceaction_logo.jpeg"
import GWC_img from "../blog/posts/4_CharityICO/girlswhocode_logo.jpeg"
import LifeYouCanSave_img from "../blog/posts/4_CharityICO/thelifeyoucansave_logo.jpeg"
import OneTreePlanted_img from "../blog/posts/4_CharityICO/onetreeplanted_logo.jpg"
import Outright_img from "../blog/posts/4_CharityICO/outrightaction_logo.jpg"


require('@solana/wallet-adapter-react-ui/styles.css');



let have_token_amounts = false;
let have_charity_stats = false;
function WalletNotConnected() 
{
    have_token_amounts = false;
    return (
        <>
                <Center mb="1rem">
                <WalletMultiButton />
                
                </Center>
          
               <Text mb="1rem" textAlign="center" fontSize="2rem">Account Info</Text>
               </>
           
    );
}

function WalletConnected({lamports, token_amount, supporter_amount}) 
{

    return (
        <>
        <Center mb="1rem"><WalletDisconnectButton /></Center>
        <VStack alignItems="center">
            <Box textAlign="center" fontSize="l">
             
                
                
                <Box textAlign="center" fontSize="l">
                <Text mb="1rem" textAlign="center" fontSize="2rem">Account Info</Text>
                <HStack spacing='24px'>
                
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
                            <Tooltip hasArrow label='Play Tokens are used to vote for moves in the game.'>

                            <Text  >
                                {"Play Tokens"}
                            </Text>
                            </Tooltip>
                            <Box></Box>
                            <Box></Box>
                            <Tooltip hasArrow label='Supporter Tokens will only be made available on limited occasions such as this token launch. For more information see the DaoPlays Pokemon launch post on the blog!'>
                            <Text>
                                {"Supporter Tokens"}
                            </Text>
                            </Tooltip>
                            </VStack>
                        </Box>
                        <Box fontSize="17">
                            <VStack>
                                
                                <FormControl id="balance" maxWidth={"250px"}>
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
                                <FormControl  id="tokenbalance" maxWidth={"250px"}>
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
                                <FormControl  id="supporterbalance" maxWidth={"250px"}>
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
                </HStack>
                </Box>
            </Box>
        </VStack>
        </>
    );
}


const ICOInstruction = {
    init_ico : 0,
    join_ico : 1,
    end_ico : 2
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

const ICOData = struct([
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


function GetCharityStats() 
{
    const [total_donated, setTotalDonated] = useState(null);
    const [average_price, setAveragePrice] = useState(null);
    const [donation_array, setDonationArray] = useState([]);
    const [n_donations, setNDonations] = useState(null);

    const init = useCallback(async () => 
    {       
        const program_key = new PublicKey('GwsxvpsHURySgnLrkMcnYuSH2Sbd4v9eZwB5ruiVxgjE');
        if(!have_charity_stats) {
            try {
                let program_data_key = await PublicKey.findProgramAddress([Buffer.from("launch_account")], program_key);

                const url = `/.netlify/functions/solana_main?function_name=getAccountInfo&p1=`+program_data_key[0].toString();
                const program_data_result = await fetch(url).then((res) => res.json());

                let program_data = program_data_result["result"]["value"]["data"];
                let b58_data = bs58.decode(program_data);

                const newValue = deserialize(schema, Test, b58_data);
                
                setTotalDonated(newValue["donated_total"].toNumber() / LAMPORTS_PER_SOL);

                let total_paid = newValue["paid_total"].toNumber() / LAMPORTS_PER_SOL;
                let n_donations = newValue["n_donations"].toNumber();

                setNDonations(n_donations);

                let average = 0;
                if (n_donations >  0) {
                    average = total_paid / n_donations;
                }
                setAveragePrice(average);

                let donation_array = [
                newValue["charity_0_total"].toNumber() / LAMPORTS_PER_SOL,
                newValue["charity_1_total"].toNumber() / LAMPORTS_PER_SOL,
                newValue["charity_2_total"].toNumber() / LAMPORTS_PER_SOL,
                newValue["charity_3_total"].toNumber() / LAMPORTS_PER_SOL,
                newValue["charity_4_total"].toNumber() / LAMPORTS_PER_SOL,
                newValue["charity_5_total"].toNumber() / LAMPORTS_PER_SOL,
                newValue["charity_6_total"].toNumber() / LAMPORTS_PER_SOL]

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
          setInterval(init, 2000);
        
      }, [init]);

    return { total_donated, donation_array, average_price, n_donations };
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

                const url = `/.netlify/functions/solana_main?function_name=getAccountInfo&p1=`+wallet.publicKey.toString();
                const program_data_result = await fetch(url).then((res) => res.json());
                let lamports_amount = program_data_result["result"]["value"]["lamports"];
                setLamports(lamports_amount);

                const mintAccount = new PublicKey("6PRgpKnwT9xgGF7cgS7ZMkPBeQmd5mdS97eg26ir8Kki");
                
                let token_pubkey = await getAssociatedTokenAddress(
                    mintAccount, // mint
                    wallet.publicKey, // owner
                    false // allow owner off curve
                );
                try {

                    const url = `/.netlify/functions/solana_main?function_name=getTokenAccountBalance&p1=`+token_pubkey.toString();
                    const token_data_result = await fetch(url).then((res) => res.json());

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

                    const url = `/.netlify/functions/solana_main?function_name=getTokenAccountBalance&p1=`+supporter_pubkey.toString();
                    const token_data_result = await fetch(url).then((res) => res.json());

                    let token_amount = token_data_result["result"]["value"]["amount"];
                    let decimals = token_data_result["result"]["value"]["decimals"];

                    let token_decs = token_amount / 10.0**decimals;
                    setSupporterAmount(token_decs)
                    have_token_amounts = true;
                }
                catch(error) {
                    console.log(error);
                    setSupporterAmount(null);
                    have_token_amounts = false;
                }   
          }
        
 
  
      }, [wallet]);
  
      useEffect(() => 
      {
          if (wallet.publicKey && !intervalId) {
            
              intervalId = setInterval(init, 2000);
          }
          else{
              clearInterval(intervalId);
              intervalId = null;
          }
      }, [init, wallet]);
  
      return { lamports, token_amount, supporter_amount };
  }


  function StatsBlock({total_donated, n_donations, average_price})
  {
    return(
        <Flex flexDirection="column">
            
            <Box mt="1rem"  mb="1rem">
                <HStack>
                    <Box  borderWidth='5px' borderColor="darkblue">
                        <FontAwesomeIcon icon={solid('hand-holding-heart')} size="4x" />
                    </Box>
                    <Box flex='1'  pl="1rem" pr="1rem" maxW='sm' mt="1rem"  mb="1rem" borderWidth='1px' borderRadius='lg' overflow='hidden'>
                        <Stat>
                            <StatLabel style={{fontSize: 25}}>Total Donated</StatLabel>
                            <StatNumber style={{fontSize: 25}}>
                            {
                                total_donated != null
                                ? total_donated.toFixed(4) + ' SOL'
                                : 'Loading..'
                            }
                            </StatNumber>
                        </Stat>
                    </Box>
                </HStack>
            </Box>
            <Spacer/>
            <Box mt="1rem"  mb="1rem">
                <HStack>
                    <Box  borderWidth='5px' borderColor="darkblue">
                        <FontAwesomeIcon icon={solid('people-group')} size="4x" />
                    </Box>
                    <Box flex='1' pl="1rem" pr="1rem" maxW='sm' mt="1rem" mb="1rem" borderWidth='1px' borderRadius='lg' overflow='hidden'>
                        <Stat>
                            <StatLabel style={{fontSize: 25}}>Number Participating</StatLabel>
                            <StatNumber style={{fontSize: 25}}>
                                {
                                    n_donations != null
                                    ? n_donations 
                                    : 'Loading..'
                                            
                            }
                            </StatNumber>
                        </Stat>
                    </Box>
                </HStack>
            </Box>
            <Spacer/>
            <Box mt="1rem"  mb="1rem">
                <HStack>
                    <Box  borderWidth='5px' borderColor="darkblue">
                        <FontAwesomeIcon icon={solid('money-bill-transfer')} size="4x" />
                    </Box>
                    <Box flex='1'  pl="1rem" pr="1rem" maxW='sm' mt="1rem" mb="1rem" borderWidth='1px' borderRadius='lg' overflow='hidden'>
                        <Stat>
                            <StatLabel style={{fontSize: 25}}>Average Paid</StatLabel>
                            <StatNumber style={{fontSize: 25}}>
                            {
                                average_price != null
                                ? average_price.toFixed(4) + ' SOL'
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
  
  export function AirDropApp() 
  {
      const wallet = useWallet();
      const { total_donated, donation_array, average_price, n_donations } = GetCharityStats();

      const { lamports, token_amount, supporter_amount} = useSolanaAccount();

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

            let charity_amount = parseFloat((slide_value * sol_value * 0.01).toFixed(4));
            let dao_amount = parseFloat(((100-slide_value) * sol_value * 0.01).toFixed(4));

            const data = Buffer.alloc(ICOData.span);
            let ch_bn = new BN(charity_amount* LAMPORTS_PER_SOL, 10);
            let dao_bn = new BN(dao_amount* LAMPORTS_PER_SOL, 10);

            console.log("charity : ", charity_amount, charity_amount * LAMPORTS_PER_SOL, ch_bn.toNumber());
            console.log("dao : ", dao_amount,  dao_amount * LAMPORTS_PER_SOL, dao_bn.toNumber());


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

            ICOData.encode(
                {
                    instruction: ICOInstruction.join_ico,
                    amount_charity: ch_bn,
                    amount_daoplays: dao_bn,
                    charity: chosen_charity
                },
                data
            );

            const token_mint_key = new PublicKey("6PRgpKnwT9xgGF7cgS7ZMkPBeQmd5mdS97eg26ir8Kki");
            const supporters_token_mint_key = new PublicKey("7B1yoU3EsbABt1kNXcJLeJRT8jwPy9rZfhrhWzuCA9Fq");

            const daoplays_key = new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD");
            const program_key = new PublicKey('GwsxvpsHURySgnLrkMcnYuSH2Sbd4v9eZwB5ruiVxgjE');
            const SYSTEM_PROGRAM_ID = new PublicKey(
                '11111111111111111111111111111111',
            );        
                
            let joiner_token_key = await getAssociatedTokenAddress(
                token_mint_key, // mint
                wallet.publicKey, // owner
                false // allow owner off curve
            );

            let joiner_supporters_token_key = await getAssociatedTokenAddress(
                supporters_token_mint_key, // mint
                wallet.publicKey, // owner
                false // allow owner off curve
            );

            let program_data_key = (await PublicKey.findProgramAddress([Buffer.from("launch_account")], program_key))[0];
            let program_token_key = await getAssociatedTokenAddress(
                token_mint_key, // mint
                program_data_key, // owner
                true // allow owner off curve
            );
            let program_supporters_token_key = await getAssociatedTokenAddress(
                supporters_token_mint_key, // mint
                program_data_key, // owner
                true // allow owner off curve
            );

            console.log("program token: ", program_token_key.toString(), program_token_key);
            console.log("joiner token: ", joiner_token_key.toString(), joiner_token_key);

            const ico_instruction = new TransactionInstruction({
                keys: [
                    {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
                    {pubkey: joiner_token_key, isSigner: false, isWritable: true},
                    {pubkey: joiner_supporters_token_key, isSigner: false, isWritable: true},
   
                    {pubkey: program_data_key, isSigner: false, isWritable: true},
                    {pubkey: program_token_key, isSigner: false, isWritable: true},
                    {pubkey: program_supporters_token_key, isSigner: false, isWritable: true},

                    {pubkey: charity_key, isSigner: false, isWritable: true},
                    {pubkey: daoplays_key, isSigner: false, isWritable: true},

                    {pubkey: token_mint_key, isSigner: false, isWritable: false},
                    {pubkey: supporters_token_mint_key, isSigner: false, isWritable: false},

                    {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                    {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                    {pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false}

                ],
                programId: program_key,
                data: data
            });
    
            try {


                const url = `/.netlify/functions/solana_main?function_name=getLatestBlockhash&p1=`;
                const blockhash_data_result = await fetch(url).then((res) => res.json());
                let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
                let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];
                const txArgs = { blockhash: blockhash, lastValidBlockHeight: last_valid};

                let transaction = new Transaction(txArgs).add(ico_instruction);
                transaction.feePayer = wallet.publicKey;

                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                const send_url = `/.netlify/functions/solana_main?function_name=sendTransaction&p1=`+encoded_transaction;
                await fetch(send_url).then((res) => res.json());
                
            }catch(error) {
                console.log(error);
            }
        

      },
      [wallet, sol_value, slide_value, which_charity]
      );
  
      return (
          <Box textAlign="center" fontSize="l">
            <Divider mt="2rem" mb="2rem"/>

            <Center mb="4rem">
                <Text fontSize="2rem">Overview</Text>
            </Center>
            <Flex flexDirection="row">
           
                <StatsBlock total_donated={total_donated} n_donations={n_donations} average_price={average_price}/>
                
                

                <Box flex='1' pl="2rem">
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

            </Flex>
            <Divider mt="2rem" mb="2rem"/>

            {wallet.publicKey &&  <WalletConnected lamports={lamports} token_amount={token_amount} supporter_amount={supporter_amount}/>}

            {wallet.publicKey && 

                  <Box>
                        <Divider mt="2rem" mb="2rem"/>

                        <Center mb="3rem">
                            <Text fontSize="2rem">Join Token Launch</Text>
                        </Center>


                        <Text mt="2rem" mb="1rem" textAlign="left" fontSize="1.5rem">Step 1: Decide what you want to pay for 1000 tokens</Text>

                        <VStack alignItems="start" mt="2rem" mb="2rem">
                            <Alert status='info'>
                                <AlertIcon />
                                {average_price != null &&
                                    <Text>To get double the tokens, and a DaoPlays Supporter Token, pay more than the average price of {average_price.toFixed(4)} SOL!</Text>
                                }
                            </Alert>

                            <HStack>                        
                           
                                <Text>
                                    Amount to Pay:
                                </Text>
                                <NumberInput 
                                    onChange={(valueString) => setSOLValue(parse(valueString))}
                                    value={format(sol_value)}
                                    defaultValue={average_price} precision={4}  maxW='200px' mr='2rem' ml='2rem'>
                                    <NumberInputField/>
                                </NumberInput>
                        
                            </HStack>
                        </VStack>

                        <Text mt="2rem" mb="1rem" textAlign="left" fontSize="1.5rem">Step 2: Decide how we should split your payment</Text>

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
                                which_charity === "" && !token_amount &&

                                <Tooltip hasArrow label='Please select a charity to join' bg='red.600'>
                                    <Button width='100px' colorScheme='red' variant='solid'>
                                        Join!
                                    </Button>
                                </Tooltip>
                            }
                            {
                                which_charity !== "" && !token_amount && sol_value >= 0.0001 &&

                                <Button onClick={join_ico}  width='100px' colorScheme='green' variant='solid'>
                                    Join!
                                </Button>
                            }
                            {
                                which_charity !== "" && !token_amount && sol_value < 0.0001 &&

                                <Tooltip hasArrow label='Minimum is 0.0001 SOL' bg='red.600'>
                                    <Button width='100px' colorScheme='red' variant='solid'>
                                        Join!
                                    </Button>
                                </Tooltip>
                            }
                            {
                                token_amount > 0 &&
                                <>
                                <Alert status='success'>
                                    <AlertIcon />
                                    Thank you for taking part in the DaoPlays Token Launch!
                                </Alert>
                                <Button onClick={join_ico}  width='100px' colorScheme='green' variant='solid'>
                                Join!
                                </Button>
                                </>
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

export function PokeTokenLaunch()
{

    const network = 'mainnet-beta';
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
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <AirDropApp/>
                    </WalletModalProvider>
                </WalletProvider>
        </ChakraProvider>

    );
}
