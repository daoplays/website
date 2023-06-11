import React, { useRef, useCallback, useEffect, useState, useMemo } from "react";
import {
    ChakraProvider,
    theme,
    Box,
    HStack,
    Flex,
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
} from "@chakra-ui/react";
import BN from "bn.js";
import PlotlyChart from "react-plotlyjs-ts";
import { Divider, Alert, AlertIcon } from "@chakra-ui/react";
import { MdFiberManualRecord } from "react-icons/md";
import bs58 from "bs58";
import { LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";

import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import {
    CharityInfoBlock,
    WalletConnected,
    WalletNotConnected,
    CharityData,
    bignum_to_num,
    StatsBlock,
    Join_ICO_Instruction,
} from "../blog/apps/charity";

require("@solana/wallet-adapter-react-ui/styles.css");

let have_token_amounts = false;
let have_charity_stats = false;

const ICOInstruction = {
    init_ico: 0,
    join_ico: 1,
    end_ico: 2,
};

const Charity = {
    EvidenceAction: 0,
    GirlsWhoCode: 1,
    OneTreePlanted: 2,
    OutrightActionInt: 3,
    TheLifeYouCanSave: 4,
    UkraineERF: 5,
    WaterOrg: 6,
};

function GetCharityStats() {
    const [total_donated, setTotalDonated] = useState<number>(0);
    const [average_price, setAveragePrice] = useState<number>(0);
    const [donation_array, setDonationArray] = useState<number[]>([]);
    const [n_donations, setNDonations] = useState<number>(0);
    const check_interval = useRef<number | null>(null);

    const init = useCallback(async () => {
        const program_key = new PublicKey("GwsxvpsHURySgnLrkMcnYuSH2Sbd4v9eZwB5ruiVxgjE");
        if (!have_charity_stats) {
            try {
                let program_data_key = await PublicKey.findProgramAddressSync([Buffer.from("launch_account")], program_key);

                const url = `/.netlify/functions/solana_main?function_name=getAccountInfo&p1=` + program_data_key[0].toString();
                const program_data_result = await fetch(url).then((res) => res.json());

                let program_data = program_data_result["result"]["value"]["data"];

                const [charity_data] = CharityData.struct.deserialize(program_data);

                setTotalDonated(bignum_to_num(charity_data.donated_total) / LAMPORTS_PER_SOL);

                let total_paid = bignum_to_num(charity_data.paid_total) / LAMPORTS_PER_SOL;
                let n_donations = bignum_to_num(charity_data.n_donations);

                setNDonations(bignum_to_num(charity_data.n_donations));

                setAveragePrice(total_paid / n_donations);

                let donation_array = [
                    bignum_to_num(charity_data.charity_totals[0]) / LAMPORTS_PER_SOL,
                    bignum_to_num(charity_data.charity_totals[1]) / LAMPORTS_PER_SOL,
                    bignum_to_num(charity_data.charity_totals[2]) / LAMPORTS_PER_SOL,
                    bignum_to_num(charity_data.charity_totals[3]) / LAMPORTS_PER_SOL,
                    bignum_to_num(charity_data.charity_totals[4]) / LAMPORTS_PER_SOL,
                    bignum_to_num(charity_data.charity_totals[5]) / LAMPORTS_PER_SOL,
                    bignum_to_num(charity_data.charity_totals[6]) / LAMPORTS_PER_SOL,
                ];

                setDonationArray(donation_array);
                have_charity_stats = true;
            } catch (error) {
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

    return { total_donated, donation_array, average_price, n_donations };
}

function useSolanaAccount() {
    const [lamports, setLamports] = useState<number>(0);
    const [token_amount, setTokenAmount] = useState<number>(0);
    const [supporter_amount, setSupporterAmount] = useState<number>(0);
    const check_interval = useRef<number | null>(null);

    const wallet = useWallet();

    const init = useCallback(async () => {
        if (!have_token_amounts && wallet.publicKey) {
            const url = `/.netlify/functions/solana_main?function_name=getAccountInfo&p1=` + wallet.publicKey.toString();
            const program_data_result = await fetch(url).then((res) => res.json());
            let lamports_amount = program_data_result["result"]["value"]["lamports"];
            setLamports(lamports_amount);

            const mintAccount = new PublicKey("6PRgpKnwT9xgGF7cgS7ZMkPBeQmd5mdS97eg26ir8Kki");

            let token_pubkey = await getAssociatedTokenAddress(
                mintAccount, // mint
                wallet.publicKey, // owner
                false, // allow owner off curve
            );
            try {
                const url = `/.netlify/functions/solana_main?function_name=getTokenAccountBalance&p1=` + token_pubkey.toString();
                const token_data_result = await fetch(url).then((res) => res.json());

                let token_amount = token_data_result["result"]["value"]["amount"];
                let decimals = token_data_result["result"]["value"]["decimals"];

                let token_decs = token_amount / 10.0 ** decimals;
                setTokenAmount(token_decs);
                have_token_amounts = true;
            } catch (error) {
                console.log(error);
                setTokenAmount(0);
                have_token_amounts = false;
            }

            const supporter_mintAccount = new PublicKey("7B1yoU3EsbABt1kNXcJLeJRT8jwPy9rZfhrhWzuCA9Fq");

            let supporter_pubkey = await getAssociatedTokenAddress(
                supporter_mintAccount, // mint
                wallet.publicKey, // owner
                false, // allow owner off curve
            );
            try {
                const url = `/.netlify/functions/solana_main?function_name=getTokenAccountBalance&p1=` + supporter_pubkey.toString();
                const token_data_result = await fetch(url).then((res) => res.json());

                let token_amount = token_data_result["result"]["value"]["amount"];
                let decimals = token_data_result["result"]["value"]["decimals"];

                let token_decs = token_amount / 10.0 ** decimals;
                setSupporterAmount(token_decs);
                have_token_amounts = true;
            } catch (error) {
                console.log(error);
                setSupporterAmount(0);
                have_token_amounts = false;
            }
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

    return { lamports, token_amount, supporter_amount };
}

export function AirDropApp() {
    const wallet = useWallet();
    const { total_donated, donation_array, average_price, n_donations } = GetCharityStats();

    const { lamports, token_amount, supporter_amount } = useSolanaAccount();

    const [slide_value, setSlideValue] = React.useState(90);
    const [which_charity, setWhichCharity] = React.useState("");

    const handleWhichCharity = (event: any) => {
        setWhichCharity(event.target.value);
    };

    const format = (sol_value: string) => sol_value + ` SOL`;
    const parse = (sol_value: string) => sol_value.replace(/^ SOL/, "");
    const [sol_value, setSOLValue] = useState<number>(0.1);

    const handleSlideChange = (slide_value: number) => setSlideValue(slide_value);

    const join_ico = useCallback(async () => {
        if (!wallet.publicKey || wallet.signTransaction === undefined) return;

        console.log("Sol value:", sol_value);
        console.log("Slide value:", slide_value);

        let charity_amount = parseFloat((slide_value * sol_value * 0.01).toFixed(4));
        let dao_amount = parseFloat(((100 - slide_value) * sol_value * 0.01).toFixed(4));

        let ch_bn = new BN(charity_amount * LAMPORTS_PER_SOL, 10);
        let dao_bn = new BN(dao_amount * LAMPORTS_PER_SOL, 10);

        console.log("charity : ", charity_amount, charity_amount * LAMPORTS_PER_SOL, ch_bn.toNumber());
        console.log("dao : ", dao_amount, dao_amount * LAMPORTS_PER_SOL, dao_bn.toNumber());

        let charity_key = new PublicKey("E6TPLh77cx9b5aWsmxM8geit2PBLVEBVAvF6ye9Qe4ZQ");
        let chosen_charity = Charity.UkraineERF;
        if (which_charity === "UkraineERF") {
            chosen_charity = Charity.UkraineERF;
            charity_key = new PublicKey("E6TPLh77cx9b5aWsmxM8geit2PBLVEBVAvF6ye9Qe4ZQ");
        } else if (which_charity === "WaterOrg") {
            chosen_charity = Charity.WaterOrg;
            charity_key = new PublicKey("5UNSVwtiSdfsCbJokL4fHtzV28mVNi8fQkMjPQw6v7Xd");
        } else if (which_charity === "OneTreePlanted") {
            chosen_charity = Charity.OneTreePlanted;
            charity_key = new PublicKey("GeCaNYhRswBFoTxtNaf9wKYJEBZoxHa9Fao6aQKzDDo2");
        } else if (which_charity === "EvidenceAction") {
            chosen_charity = Charity.EvidenceAction;
            charity_key = new PublicKey("9fF5EQV6FVy7V5SaHBXfAaTUBvuyimQ9X3jarc2mRHzi");
        } else if (which_charity === "GirlsWhoCode") {
            chosen_charity = Charity.GirlsWhoCode;
            charity_key = new PublicKey("5qrmDeRFhBTnEkqJsRKJAkTJzrZnyC9bWmRhL6RZqWt1");
        } else if (which_charity === "OutrightActionInt") {
            chosen_charity = Charity.OutrightActionInt;
            charity_key = new PublicKey("AiY4t79umvBqGvR43f5rL8jR8F2JZwG87mB55adAF2cf");
        } else if (which_charity === "TheLifeYouCanSave") {
            chosen_charity = Charity.TheLifeYouCanSave;
            charity_key = new PublicKey("8qQpHYjLkNiKvLtFzrjzgFZfveNJZ9AnQuBUoQj1t3DB");
        }

        const data = new Join_ICO_Instruction(ICOInstruction.join_ico, ch_bn, dao_bn, chosen_charity);
        const [buf] = Join_ICO_Instruction.struct.serialize(data);

        const token_mint_key = new PublicKey("6PRgpKnwT9xgGF7cgS7ZMkPBeQmd5mdS97eg26ir8Kki");
        const supporters_token_mint_key = new PublicKey("7B1yoU3EsbABt1kNXcJLeJRT8jwPy9rZfhrhWzuCA9Fq");

        const daoplays_key = new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD");
        const program_key = new PublicKey("GwsxvpsHURySgnLrkMcnYuSH2Sbd4v9eZwB5ruiVxgjE");
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

        let program_data_key = (await PublicKey.findProgramAddress([Buffer.from("launch_account")], program_key))[0];
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
            const url = `/.netlify/functions/solana_main?function_name=getLatestBlockhash&p1=`;
            const blockhash_data_result = await fetch(url).then((res) => res.json());
            let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
            let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];
            const txArgs = { blockhash: blockhash, lastValidBlockHeight: last_valid };

            let transaction = new Transaction(txArgs).add(ico_instruction);
            transaction.feePayer = wallet.publicKey;

            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            const send_url = `/.netlify/functions/solana_main?function_name=sendTransaction&p1=` + encoded_transaction;
            await fetch(send_url).then((res) => res.json());
        } catch (error) {
            console.log(error);
        }
    }, [wallet, sol_value, slide_value, which_charity]);

    var data = [
        {
            type: "bar",
            x: [
                "Evidence Action",
                "Girls Who Code",
                "One Tree Planted",
                "Outright Action Int.",
                "The Life You Can Save",
                "Ukraine ERF",
                "Water.Org",
            ],
            y: donation_array,
            marker: {
                color: [
                    "rgb(205, 120, 139)",
                    "rgb(13, 156, 144)",
                    "rgb(49,53,56)",
                    "rgb(222,185,104)",
                    "rgb(221,81,57,255)",
                    "rgb(255, 215, 0)",
                    "rgb(98, 161, 192)",
                ],
            },
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
                    tokenKey={""}
                    balance={lamports}
                    token_amount={token_amount}
                    supporter_key={""}
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
                            {average_price != null && (
                                <Text>
                                    To get double the tokens, and a DaoPlays Supporter Token, pay more than the average price of{" "}
                                    {average_price.toFixed(4)} SOL!
                                </Text>
                            )}
                        </Alert>

                        <HStack>
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
                                Join!
                            </Box>
                        )}
                        {!token_amount && sol_value < 0.0001 && (
                            <Tooltip hasArrow label="Minimum is 0.0001 SOL" bg="red.600">
                                <Box as="button" borderWidth={"1px"} borderColor="darkred" backgroundColor={"red"}>
                                    Join!
                                </Box>
                            </Tooltip>
                        )}
                        {token_amount > 0 && (
                            <Alert status="success">
                                <AlertIcon />
                                Thank you for taking part in the Dao Plays Token Launch!
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

export function PokeTokenLaunch() {
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()], []);

    return (
        <ChakraProvider theme={theme}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <AirDropApp />
                </WalletModalProvider>
            </WalletProvider>
        </ChakraProvider>
    );
}
