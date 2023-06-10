import React, { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { Card } from "react-bootstrap";
import {
    ChakraProvider,
    theme,
    Box,
    HStack,
    Flex,
    Spacer,
    Text,
    VStack,
    Center,
    NumberInput,
    Slider,
    NumberInputField,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Tooltip,
    Select,
    Stat,
    StatLabel,
    StatNumber,
} from "@chakra-ui/react";
import { BeetStruct, uniformFixedSizeArray, u8, u64, bignum } from "@metaplex-foundation/beet";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import PlotlyChart from "react-plotlyjs-ts";
import { Divider, Alert, AlertIcon } from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro"; // <-- import styles to be used
import { MdFiberManualRecord } from "react-icons/md";

import * as web3 from "@solana/web3.js";

import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { ConnectionProvider, WalletProvider, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider, WalletMultiButton, WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";

import UkraineERF_img from "../posts/4_CharityICO/ukraine_logo.jpg";
import WaterOrg_img from "../posts/4_CharityICO/waterorg_logo.jpeg";
import EvidenceAction_img from "../posts/4_CharityICO/evidenceaction_logo.jpeg";
import GWC_img from "../posts/4_CharityICO/girlswhocode_logo.jpeg";
import LifeYouCanSave_img from "../posts/4_CharityICO/thelifeyoucansave_logo.jpeg";
import OneTreePlanted_img from "../posts/4_CharityICO/onetreeplanted_logo.jpg";
import Outright_img from "../posts/4_CharityICO/outrightaction_logo.jpg";

require("@solana/wallet-adapter-react-ui/styles.css");

function WalletNotConnected() {
    return (
        <Box mb="10px" mt="3rem">
            <Center mb="4rem">
                <Text fontSize="2rem">Account Info</Text>
            </Center>
            <HStack spacing="24px">
                <Box>
                    <WalletMultiButton />
                </Box>
            </HStack>
        </Box>
    );
}

function WalletConnected({
    publicKey,
    tokenKey,
    balance,
    token_amount,
    supporter_key,
    supporter_amount,
}: {
    publicKey: String;
    tokenKey: String;
    balance: number;
    token_amount: number;
    supporter_key: String;
    supporter_amount: number;
}) {
    return (
        <Box mb="10px" mt="3rem">
            <Center mb="3rem">
                <Text fontSize="2rem">Account Info</Text>
            </Center>
            <HStack spacing="24px">
                <Box>
                    <WalletDisconnectButton />
                </Box>
                <Box></Box>
                <HStack>
                    <Box fontSize="17">
                        <VStack alignItems={"left"}>
                            <Text mb="0">{publicKey}</Text>

                            <Text mb="0">{tokenKey}</Text>

                            <Text mb="0">{supporter_key}</Text>
                        </VStack>
                    </Box>
                    <Box fontSize="17">
                        <VStack alignItems="left">
                            <Text mb="0">{balance ? balance + " SOL" : "Loading.."}</Text>
                            <Text mb="0">{token_amount ? token_amount + " DPTT" : "0 DPTT"}</Text>
                            <Text mb="0">{supporter_amount ? supporter_amount + " DPTST" : "0 DPTST"}</Text>
                        </VStack>
                    </Box>
                </HStack>
            </HStack>
        </Box>
    );
}

const ICOInstruction = {
    init_ico: 0,
    join_ico: 1,
    end_ico: 2,
};

const Charity = {
    UkraineERF: 0,
    WaterOrg: 1,
    OneTreePlanted: 2,
    EvidenceAction: 3,
    GirlsWhoCode: 4,
    OutrightActionInt: 5,
    TheLifeYouCanSave: 6,
};

class Join_ICO_Instruction {
    constructor(
        readonly instruction: number,
        readonly amount_charity: bignum,
        readonly amount_daoplays: bignum,
        readonly charity: number,
    ) {}

    static readonly struct = new BeetStruct<Join_ICO_Instruction>(
        [
            ["instruction", u8],
            ["amount_charity", u64],
            ["amount_daoplays", u64],
            ["charity", u8],
        ],
        (args) => new Join_ICO_Instruction(args.instruction!, args.amount_charity!, args.amount_daoplays!, args.charity!),
        "Join_ICO_Instruction",
    );
}

class CharityData {
    constructor(
        readonly charity_totals: bignum[],
        readonly donated_total: bignum,
        readonly paid_total: bignum,
        readonly n_donations: bignum,
    ) {}

    static readonly struct = new BeetStruct<CharityData>(
        [
            ["charity_totals", uniformFixedSizeArray(u64, 7)],
            ["donated_total", u64],
            ["paid_total", u64],
            ["n_donations", u64],
        ],
        (args) => new CharityData(args.charity_totals!, args.donated_total!, args.paid_total!, args.n_donations!),
        "CharityData",
    );
}

function bignum_to_num(bn: bignum): number {
    let value = new BN(bn).toNumber();

    return value;
}

function GetCharityStats() {
    const [total_donated, setTotalDonated] = useState<number>(0);
    const [average_price, setAveragePrice] = useState<number>(0);
    const [donation_array, setDonationArray] = useState<number[]>([]);
    const [n_donations, setNDonations] = useState<number>(0);

    const { connection } = useConnection();

    const init = useCallback(async () => {
        const program_key = new PublicKey("BHJ8pK9WFHad1dEds631tFE6qWQgX48VbwWTSqiwR54Y");

        try {
            let program_data_key = await PublicKey.findProgramAddress([Buffer.from("token_account")], program_key);

            let program_data_account = await connection.getAccountInfo(program_data_key[0]);

            if (program_data_account === null) return;

            const [charity_data] = CharityData.struct.deserialize(program_data_account.data);

            setTotalDonated(bignum_to_num(charity_data.donated_total) / web3.LAMPORTS_PER_SOL);

            let total_paid = bignum_to_num(charity_data.paid_total) / web3.LAMPORTS_PER_SOL;
            let n_donations = bignum_to_num(charity_data.n_donations);

            setNDonations(bignum_to_num(charity_data.n_donations));

            setAveragePrice(total_paid / n_donations);

            let donation_array = [
                bignum_to_num(charity_data.charity_totals[0]) / web3.LAMPORTS_PER_SOL,
                bignum_to_num(charity_data.charity_totals[1]) / web3.LAMPORTS_PER_SOL,
                bignum_to_num(charity_data.charity_totals[2]) / web3.LAMPORTS_PER_SOL,
                bignum_to_num(charity_data.charity_totals[3]) / web3.LAMPORTS_PER_SOL,
                bignum_to_num(charity_data.charity_totals[4]) / web3.LAMPORTS_PER_SOL,
                bignum_to_num(charity_data.charity_totals[5]) / web3.LAMPORTS_PER_SOL,
                bignum_to_num(charity_data.charity_totals[6]) / web3.LAMPORTS_PER_SOL,
            ];

            setDonationArray(donation_array);
        } catch (error) {
            console.log(error);
        }
    }, [connection]);

    useEffect(() => {
        setInterval(init, 1000);
    }, [init]);

    return { total_donated, donation_array, average_price, n_donations };
}

function useSolanaAccount() {
    const [balance, setBalance] = useState<number>(0);
    const [token_pubkey, setTokenAccount] = useState<PublicKey | null>(null);
    const [token_amount, setTokenAmount] = useState<number>(0);
    const [supporter_pubkey, setSupporterAccount] = useState<PublicKey | null>(null);
    const [supporter_amount, setSupporterAmount] = useState<number>(0);

    const { connection } = useConnection();
    const wallet = useWallet();
    const check_interval = useRef<number | null>(null);

    const init = useCallback(async () => {
        if (wallet.publicKey) {
            let acc = await connection.getAccountInfo(wallet.publicKey);
            if (acc === null) return;

            setBalance(acc?.lamports / web3.LAMPORTS_PER_SOL);

            const mintAccount = new web3.PublicKey("CisHceikLeKxYiUqgDVduw2py2GEK71FTRykXGdwf22h");

            let token_pubkey = await getAssociatedTokenAddress(
                mintAccount, // mint
                wallet.publicKey, // owner
                false, // allow owner off curve
            );
            setTokenAccount(token_pubkey);
            try {
                let aWalletMyTokenBalance = await connection.getTokenAccountBalance(token_pubkey);
                let token_amount = parseInt(aWalletMyTokenBalance["value"].amount);
                let decimals = aWalletMyTokenBalance["value"].decimals;
                let token_decs = token_amount / 10.0 ** decimals;
                setTokenAmount(token_decs);
            } catch (error) {
                console.log(error);
                setTokenAmount(0);
            }

            const supporter_mintAccount = new web3.PublicKey("6tnMgdJsWobrWYfPTa1j8pniYL9YR5M6UVbWrxGcvhkK");

            let supporter_pubkey = await getAssociatedTokenAddress(
                supporter_mintAccount, // mint
                wallet.publicKey, // owner
                false, // allow owner off curve
            );
            setSupporterAccount(supporter_pubkey);
            try {
                let aWalletMyTokenBalance = await connection.getTokenAccountBalance(supporter_pubkey);
                let token_amount = parseInt(aWalletMyTokenBalance["value"].amount);
                let decimals = aWalletMyTokenBalance["value"].decimals;
                let token_decs = token_amount / 10.0 ** decimals;
                setSupporterAmount(token_decs);
            } catch (error) {
                console.log(error);
                setSupporterAmount(0);
            }
        }
    }, [wallet, connection]);

    useEffect(() => {
        if (check_interval.current === null) {
            check_interval.current = window.setInterval(init, 1000);
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

    return { balance, token_pubkey, token_amount, supporter_pubkey, supporter_amount };
}

function StatsBlock({ total_donated, n_donations, average_price }: { total_donated: number; n_donations: number; average_price: number }) {
    return (
        <Flex flexDirection="column">
            <Box mt="1rem" mb="1rem">
                <HStack>
                    <Box borderWidth="5px" borderColor="darkblue">
                        <FontAwesomeIcon icon={solid("hand-holding-heart")} size="4x" />
                    </Box>
                    <Box flex="1" pl="1rem" pr="1rem" maxW="sm" mt="1rem" mb="1rem" borderWidth="1px" borderRadius="lg" overflow="hidden">
                        <Stat>
                            <StatLabel style={{ fontSize: 25 }}>Total Donated</StatLabel>
                            <StatNumber style={{ fontSize: 25 }}>
                                {total_donated ? total_donated.toFixed(4) + " SOL" : "Loading.."}
                            </StatNumber>
                        </Stat>
                    </Box>
                </HStack>
            </Box>
            <Spacer />
            <Box mt="1rem" mb="1rem">
                <HStack>
                    <Box borderWidth="5px" borderColor="darkblue">
                        <FontAwesomeIcon icon={solid("people-group")} size="4x" />
                    </Box>
                    <Box flex="1" pl="1rem" pr="1rem" maxW="sm" mt="1rem" mb="1rem" borderWidth="1px" borderRadius="lg" overflow="hidden">
                        <Stat>
                            <StatLabel style={{ fontSize: 25 }}>Number Participating</StatLabel>
                            <StatNumber style={{ fontSize: 25 }}>{n_donations ? n_donations : "Loading.."}</StatNumber>
                        </Stat>
                    </Box>
                </HStack>
            </Box>
            <Spacer />
            <Box mt="1rem" mb="1rem">
                <HStack>
                    <Box borderWidth="5px" borderColor="darkblue">
                        <FontAwesomeIcon icon={solid("money-bill-transfer")} size="4x" />
                    </Box>
                    <Box flex="1" pl="1rem" pr="1rem" maxW="sm" mt="1rem" mb="1rem" borderWidth="1px" borderRadius="lg" overflow="hidden">
                        <Stat>
                            <StatLabel style={{ fontSize: 25 }}>Average Paid</StatLabel>
                            <StatNumber style={{ fontSize: 25 }}>
                                {average_price ? average_price.toFixed(4) + " SOL" : "Loading.."}
                            </StatNumber>
                        </Stat>
                    </Box>
                </HStack>
            </Box>
        </Flex>
    );
}

function CharityInfoBlock({ which_charity }: { which_charity: string }) {
    return (
        <Flex>
            {which_charity === "UkraineERF" && (
                <Card className="text-left" style={{ flexDirection: "row" }}>
                    <Card.Img style={{ width: "25%" }} src={UkraineERF_img} alt="banner" />
                    <Card.Body>
                        <Card.Text className="text-body mb-4" style={{ fontSize: "1rem" }}>
                            <br />
                            Humanitarian Relief Organizations and International Nonprofits participating in this emergency response fund
                            will receive an equal distribution of the fund. These organizations' missions include providing urgent medical
                            care and humanitarian aid to children, individuals, families, and animals. Find out more{" "}
                            <a href="https://thegivingblock.com/campaigns/ukraine-emergency-response-fund/">here</a>.
                        </Card.Text>
                    </Card.Body>
                </Card>
            )}
            {which_charity === "WaterOrg" && (
                <Card className="text-left" style={{ flexDirection: "row" }}>
                    <Card.Img style={{ width: "25%" }} src={WaterOrg_img} alt="banner" />
                    <Card.Body>
                        <Card.Text className="text-body mb-4" style={{ fontSize: "1rem" }}>
                            <br />
                            Water.org is an international nonprofit organization that has positively transformed millions of lives around
                            the world with access to safe water and sanitation through affordable financing. Founded by Gary White and Matt
                            Damon, Water.org pioneers market-driven financial solutions to the global water crisis. For 30 years, we've been
                            providing women hope, children health, and families a future. Find out more{" "}
                            <a style={{ textDecoration: "underline" }} href="https://water.org/">
                                here
                            </a>
                            .
                        </Card.Text>
                    </Card.Body>
                </Card>
            )}
            {which_charity === "OneTreePlanted" && (
                <Card className="text-left" style={{ flexDirection: "row" }}>
                    <Card.Img style={{ width: "25%" }} src={OneTreePlanted_img} alt="banner" />
                    <Card.Body>
                        <Card.Text className="text-body mb-4" style={{ fontSize: "1rem" }}>
                            <br />
                            One Tree Planted is a 501(c)(3) nonprofit on a mission to make it simple for anyone to help the environment by
                            planting trees. Their projects span the globe and are done in partnership with local communities and
                            knowledgeable experts to create an impact for nature, people, and wildlife. Reforestation helps to rebuild
                            forests after fires and floods, provide jobs for social impact, and restore biodiversity. Many projects have
                            overlapping objectives, creating a combination of benefits that contribute to the UN's Sustainable Development
                            Goals. Find out more{" "}
                            <a style={{ textDecoration: "underline" }} href="https://onetreeplanted.org/">
                                here
                            </a>
                            .
                        </Card.Text>
                    </Card.Body>
                </Card>
            )}
            {which_charity === "EvidenceAction" && (
                <Card className="text-left" style={{ flexDirection: "row" }}>
                    <Card.Img style={{ width: "25%" }} src={EvidenceAction_img} alt="banner" />
                    <Card.Body>
                        <Card.Text className="text-body mb-4" style={{ fontSize: "1rem" }}>
                            <br />
                            Evidence Action is a global nonprofit organization with an approach distinctive in international development -
                            we exclusively scale interventions that are backed by strong evidence and can be delivered with exceptional
                            cost-effectiveness. Our programs have grown since our founding in 2013 to reach over 280 million people
                            annually. We take a data-driven approach to identifying, scaling, and continuously improving programs which
                            deliver immense impact, ensuring these solutions measurably improve the lives of millions. Find out more{" "}
                            <a style={{ textDecoration: "underline" }} href="https://www.evidenceaction.org/">
                                here
                            </a>
                            .
                        </Card.Text>
                    </Card.Body>
                </Card>
            )}
            {which_charity === "GirlsWhoCode" && (
                <Card className="text-left" style={{ flexDirection: "row" }}>
                    <Card.Img style={{ width: "25%" }} src={GWC_img} alt="banner" />
                    <Card.Body>
                        <Card.Text className="text-body mb-4" style={{ fontSize: "1rem" }}>
                            <br />
                            Girls Who Code is on a mission to close the gender gap in technology and to change the image of what a
                            programmer looks like and does. Girls Who Code equips girls with the skills they need to pursue careers in
                            technology, and the confidence they need to break barriers and thrive in a male-dominated industry. Find out
                            more{" "}
                            <a style={{ textDecoration: "underline" }} href="https://www.girlswhocode.com/">
                                here
                            </a>
                            .
                        </Card.Text>
                    </Card.Body>
                </Card>
            )}
            {which_charity === "OutrightActionInt" && (
                <Card className="text-left" style={{ flexDirection: "row" }}>
                    <Card.Img style={{ width: "25%" }} src={Outright_img} alt="banner" />
                    <Card.Body>
                        <Card.Text className="text-body mb-4" style={{ fontSize: "1rem" }}>
                            <br />
                            OutRight Action International fights for human rights and equality for lesbian, gay, bisexual, transgender,
                            intersex and queer (LGBTIQ) people everywhere and to eliminate the systemic violence, persecution and
                            discrimination LGBTIQ people face around the world. OutRight conducts vital and original research, advocates
                            with governments at the United Nations and beyond, and supports grassroots LGBTIQ activists and organizations in
                            dozens of countries each year. Find out more{" "}
                            <a style={{ textDecoration: "underline" }} href="https://www.outrightinternational.org/">
                                here
                            </a>
                            .
                        </Card.Text>
                    </Card.Body>
                </Card>
            )}
            {which_charity === "TheLifeYouCanSave" && (
                <Card className="text-left" style={{ flexDirection: "row" }}>
                    <Card.Img style={{ width: "25%" }} src={LifeYouCanSave_img} alt="banner" />
                    <Card.Body>
                        <Card.Text className="text-body mb-4" style={{ fontSize: "1rem" }}>
                            <br />
                            The Life You Can Save is an advocacy nonprofit that makes “smart giving simple” by identifying and recommending
                            some of the world's most effective charities. We currently recommend over 20 outstanding charities whose
                            evidence-based, cost-effective interventions have been proven to save and transform the lives of people living
                            in extreme global poverty (defined as less than US$1.90 per day). We provide free tools and resources that make
                            it easy to learn about and support these wonderful organizations so that you can give where it matters most and
                            ensure that you get the most “bang for your buck.” Over the past three years, we've raised an average of $17 for
                            our recommended charities for each dollar we have spent on our own operations. Find out more{" "}
                            <a style={{ textDecoration: "underline" }} href="https://www.thelifeyoucansave.org/">
                                here
                            </a>
                            .
                        </Card.Text>
                    </Card.Body>
                </Card>
            )}
        </Flex>
    );
}

export function AirDropApp() {
    const wallet = useWallet();
    const { connection } = useConnection();
    const { total_donated, donation_array, average_price, n_donations } = GetCharityStats();

    const { balance, token_pubkey, token_amount, supporter_pubkey, supporter_amount } = useSolanaAccount();

    const [slide_value, setSlideValue] = useState<number>(90);
    const [which_charity, setWhichCharity] = useState("");

    const handleWhichCharity = (event: any) => {
        setWhichCharity(event.target.value);
    };

    const format = (sol_value: string) => sol_value + ` SOL`;
    const parse = (sol_value: string) => sol_value.replace(/^ SOL/, "");
    const [sol_value, setSOLValue] = useState<number>(0.1);

    const handleSlideChange = (slide_value: number) => setSlideValue(slide_value);

    const join_ico = useCallback(async () => {
        if (!wallet.publicKey) return;

        console.log("Sol value:", sol_value);
        console.log("Slide value:", slide_value);

        let charity_amount = parseFloat((slide_value * sol_value * 0.01).toFixed(4));
        let dao_amount = parseFloat(((100 - slide_value) * sol_value * 0.01).toFixed(4));

        let ch_bn = new BN(charity_amount * web3.LAMPORTS_PER_SOL, 10);
        let dao_bn = new BN(dao_amount * web3.LAMPORTS_PER_SOL, 10);

        console.log("charity : ", charity_amount, charity_amount * web3.LAMPORTS_PER_SOL, ch_bn.toNumber());
        console.log("dao : ", dao_amount, dao_amount * web3.LAMPORTS_PER_SOL, dao_bn.toNumber());

        let charity_key = new PublicKey("8bmmLYH2fJTUcLSz99Q1tP4xte9K41v3CeFJ6Qouogig");
        let chosen_charity = Charity.UkraineERF;
        if (which_charity === "UkraineERF") {
            chosen_charity = Charity.UkraineERF;
            charity_key = new PublicKey("8bmmLYH2fJTUcLSz99Q1tP4xte9K41v3CeFJ6Qouogig");
        } else if (which_charity === "WaterOrg") {
            chosen_charity = Charity.WaterOrg;
            charity_key = new PublicKey("3aNSq2fKBypiiuPy4SgrBeU7dDCvDrSqRmq3VBeYY56H");
        } else if (which_charity === "OneTreePlanted") {
            chosen_charity = Charity.OneTreePlanted;
            charity_key = new PublicKey("Eq3eFm5ixRL73WDVw13AU6mzA9bkRHGyhwqBmRMJ6DZT");
        } else if (which_charity === "EvidenceAction") {
            chosen_charity = Charity.EvidenceAction;
            charity_key = new PublicKey("HSpwMSrQKq8Zn3vJ6weNTuPtgNyEucTPpb8CtLXBZ6pQ");
        } else if (which_charity === "GirlsWhoCode") {
            chosen_charity = Charity.GirlsWhoCode;
            charity_key = new PublicKey("GfhUjLFe6hewxqeV3SabB6jEARJw52gK8xuXecKCHA8U");
        } else if (which_charity === "OutrightActionInt") {
            chosen_charity = Charity.OutrightActionInt;
            charity_key = new PublicKey("4BMqPdMjtiCPGJ8G2ysKaU9zk55P7ANJNJ7T6XqzW6ns");
        } else if (which_charity === "TheLifeYouCanSave") {
            chosen_charity = Charity.TheLifeYouCanSave;
            charity_key = new PublicKey("7LjZQ1UTgnsGUSnqBeiz3E4EofGA4e861wTBEixXFB6G");
        }

        const data = new Join_ICO_Instruction(ICOInstruction.join_ico, ch_bn, dao_bn, chosen_charity);
        const [buf] = Join_ICO_Instruction.struct.serialize(data);

        const token_mint_key = new web3.PublicKey("CisHceikLeKxYiUqgDVduw2py2GEK71FTRykXGdwf22h");
        const supporters_token_mint_key = new web3.PublicKey("6tnMgdJsWobrWYfPTa1j8pniYL9YR5M6UVbWrxGcvhkK");

        const daoplays_key = new web3.PublicKey("2BLkynLAWGwW58SLDAnhwsoiAuVtzqyfHKA3W3MJFwEF");
        const program_key = new PublicKey("BHJ8pK9WFHad1dEds631tFE6qWQgX48VbwWTSqiwR54Y");
        const SYSTEM_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");

        let joiner_token_key = await getAssociatedTokenAddress(
            token_mint_key, // mint
            wallet.publicKey, // owner
            false, // allow owner off curve
        );

        let joiner_supporters_token_key = await getAssociatedTokenAddress(
            supporters_token_mint_key, // mint
            wallet.publicKey, // owner
            false, // allow owner off curve
        );

        let program_data_key = (await PublicKey.findProgramAddress([Buffer.from("token_account")], program_key))[0];
        let program_token_key = await getAssociatedTokenAddress(
            token_mint_key, // mint
            program_data_key, // owner
            true, // allow owner off curve
        );
        let program_supporters_token_key = await getAssociatedTokenAddress(
            supporters_token_mint_key, // mint
            program_data_key, // owner
            true, // allow owner off curve
        );

        console.log("program token: ", program_token_key.toString(), program_token_key);
        console.log("joiner token: ", joiner_token_key.toString(), joiner_token_key);

        const ico_instruction = new TransactionInstruction({
            keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: joiner_token_key, isSigner: false, isWritable: true },
                { pubkey: joiner_supporters_token_key, isSigner: false, isWritable: true },

                { pubkey: program_data_key, isSigner: false, isWritable: true },
                { pubkey: program_token_key, isSigner: false, isWritable: true },
                { pubkey: program_supporters_token_key, isSigner: false, isWritable: true },

                { pubkey: charity_key, isSigner: false, isWritable: true },
                { pubkey: daoplays_key, isSigner: false, isWritable: true },

                { pubkey: token_mint_key, isSigner: false, isWritable: false },
                { pubkey: supporters_token_mint_key, isSigner: false, isWritable: false },

                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            ],
            programId: program_key,
            data: buf,
        });

        try {
            let signature = await wallet.sendTransaction(new Transaction().add(ico_instruction), connection);

            await connection.confirmTransaction(signature, "processed");

            var response = null;
            while (response == null) {
                response = await connection.getTransaction(signature);
            }

            console.log("result: ", response);
        } catch (error) {
            console.log(error);
        }
    }, [connection, wallet, sol_value, slide_value, which_charity]);

    var data = [
        {
            type: "bar",
            x: ["UkraineERF", "Water.Org", "OneTreePlanted", "EvidenceAction", "GirlsWhoCode", "OutrightAction", "TheLifeYouCanSave"],
            y: donation_array,
        },
    ];
    var layout = {
        title: "Charity Breakdown",
        xaxis: {
            tickangle: -45,
            automargin: true,
        },
        yaxis: {
            title: {
                text: "SOL",
            },
        },
        autosize: true,

        font: {
            size: 20,
        },
    };

    console.log("sol value", sol_value, token_amount);
    return (
        <Box textAlign="center" fontSize="l">
            <Divider mt="2rem" mb="2rem" />

            <Center mb="4rem">
                <Text fontSize="2rem">Overview</Text>
            </Center>
            <Flex flexDirection="row">
                <StatsBlock total_donated={total_donated} n_donations={n_donations} average_price={average_price} />

                <Box flex="1" pl="2rem">
                    <PlotlyChart data={data} layout={layout} />;
                </Box>
            </Flex>
            <Divider mt="2rem" mb="2rem" />

            {wallet.publicKey && (
                <WalletConnected
                    publicKey={wallet.publicKey.toString()}
                    tokenKey={token_pubkey !== null ? token_pubkey.toString() : ""}
                    balance={balance}
                    token_amount={token_amount}
                    supporter_key={supporter_pubkey !== null ? supporter_pubkey.toString() : ""}
                    supporter_amount={supporter_amount}
                />
            )}

            {wallet.publicKey && (
                <Box>
                    <Divider mt="2rem" mb="2rem" />

                    <Center mb="3rem">
                        <Text fontSize="2rem">Join Token Launch</Text>
                    </Center>

                    <Text mt="2rem" mb="1rem" textAlign="left" fontSize="1.5rem">
                        Step 1: Decide what you want to pay for 1000 tokens
                    </Text>

                    <VStack alignItems="start" mt="2rem" mb="2rem">
                        <Alert status="info">
                            <AlertIcon />
                            {average_price && (
                                <Text>
                                    To get double the tokens, and a daoplays supporter test token, pay more than the average price of
                                    {average_price.toFixed(4)} SOL!
                                </Text>
                            )}
                        </Alert>

                        <HStack alignItems={"center"}>
                            <Text mb="0">Amount to Pay:</Text>
                            <NumberInput
                                onChange={(valueString) =>
                                    setSOLValue(!isNaN(parseFloat(parse(valueString))) ? parseFloat(parse(valueString)) : 0)
                                }
                                value={format(sol_value.toString())}
                                defaultValue={average_price}
                                precision={4}
                                maxW="200px"
                                mr="2rem"
                                ml="2rem"
                            >
                                <NumberInputField height={"24px"} />
                            </NumberInput>
                        </HStack>
                    </VStack>

                    <Text mt="2rem" mb="1rem" textAlign="left" fontSize="1.5rem">
                        Step 2: Decide how we should split your payment
                    </Text>

                    <HStack width="100%">
                        <Text width="10%" mb="0" textAlign="left" fontSize="1rem">
                            Charity
                        </Text>

                        <Slider
                            width="70%"
                            aria-label="slider-ex-1"
                            focusThumbOnChange={false}
                            value={slide_value}
                            onChange={handleSlideChange}
                        >
                            <SliderTrack bg="black" height="10px">
                                <SliderFilledTrack height="10px" bg="tomato" />
                            </SliderTrack>
                            <SliderThumb boxSize={18}>
                                <Box color="blue" as={MdFiberManualRecord} />
                            </SliderThumb>
                        </Slider>
                        <Text width="15%" mb="0" borderWidth={"1px"} borderColor={"black"}>
                            {(slide_value * sol_value * 0.01).toFixed(4)}
                        </Text>
                    </HStack>

                    <HStack width="100%">
                        <Text width="10%" mb="0" textAlign="left" fontSize="1rem">
                            DaoPlays
                        </Text>

                        <Slider
                            width="70%"
                            aria-label="slider-ex-2"
                            focusThumbOnChange={false}
                            value={100 - slide_value}
                            onChange={handleSlideChange}
                        >
                            <SliderTrack bg="black" height="10px">
                                <SliderFilledTrack height="10px" bg="tomato" />
                            </SliderTrack>
                            <SliderThumb boxSize={18}>
                                <Box color="blue" as={MdFiberManualRecord} />
                            </SliderThumb>
                        </Slider>

                        <Text width="15%" mb="0" borderWidth={"1px"} borderColor={"black"}>
                            {((100 - slide_value) * sol_value * 0.01).toFixed(4)}
                        </Text>
                    </HStack>

                    <Text mt="2rem" mb="1rem" textAlign="left" fontSize="1.5rem">
                        Step 3: Select which charity
                    </Text>

                    <Select height={"24px"} placeholder="Select Charity" onChange={handleWhichCharity}>
                        <option value="UkraineERF">Ukraine Emergency Response Fund</option>
                        <option value="WaterOrg">Water.Org</option>
                        <option value="OneTreePlanted">One Tree Planted</option>
                        <option value="EvidenceAction">Evidence Action</option>
                        <option value="GirlsWhoCode">Girls Who Code</option>
                        <option value="OutrightActionInt">Outright Action International</option>
                        <option value="TheLifeYouCanSave">The Life You Can Save</option>
                    </Select>

                    <CharityInfoBlock which_charity={which_charity} />

                    <Box mt="2rem">
                        {!token_amount && sol_value >= 0.0001 && (
                            <Box as="button" borderWidth={"1px"} borderColor="green" backgroundColor={"lightgreen"} onClick={join_ico}>
                                Join ICO!
                            </Box>
                        )}
                        {!token_amount && sol_value < 0.0001 && (
                            <Tooltip hasArrow label="Minimum is 0.0001 SOL" bg="red.600">
                                <Box as="button" borderWidth={"1px"} borderColor="darkred" backgroundColor={"red"}>
                                    Join ICO!
                                </Box>
                            </Tooltip>
                        )}
                        {token_amount > 0 && (
                            <Alert status="success">
                                <AlertIcon />
                                Thank you for taking part in the Dao Plays Test Token Launch!
                            </Alert>
                        )}
                    </Box>
                </Box>
            )}
            {!wallet.publicKey && <WalletNotConnected />}
            <br />
            <br />
            <Divider mt="2rem" mb="2rem" />
        </Box>
    );
}

export function CharityDapp() {
    const network = "devnet";
    const endpoint = web3.clusterApiUrl(network);
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()], []);

    return (
        <ChakraProvider theme={theme}>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <AirDropApp />
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </ChakraProvider>
    );
}
