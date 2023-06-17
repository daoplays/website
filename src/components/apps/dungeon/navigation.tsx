import React, { useCallback, useState, useEffect, useRef } from "react";
import { SetStateAction } from "react";

import { Box, Button, Flex, HStack, Text, VStack } from "@chakra-ui/react";

import { useDisclosure, Drawer, DrawerBody, DrawerOverlay, DrawerContent, DrawerCloseButton } from "@chakra-ui/react";

import { useWallet } from "@solana/wallet-adapter-react";

import { isMobile } from "react-device-detect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { brands, solid } from "@fortawesome/fontawesome-svg-core/import.macro"; // <-- import styles to be used
import { Screen } from "./constants";

import { MuteButton } from "./mute";

import large_door from "./images/Large_Door.gif";
import delvingDeeper from "./sounds/Delving_Deeper.mp3";
import hackNSlash from "./sounds/Hack_n_Slash.mp3";
import enterTheDungeon from "./sounds/Enter_the_Dungeon.mp3";
import dungeonCrawling from "./sounds/Dungeon_Crawling.mp3";
import orcsAndGoblins from "./sounds/Orcs_n_Goblins.mp3";
import glimmerGreen from "./sounds/Glimmer-Green_Spire.mp3";
import MusicPlayer from "./musicPlayer";
import { useMediaQuery } from 'react-responsive'
// dungeon utils
import { WalletConnected, request_current_balance } from "./utils";

import "./css/style.css";
import "./css/fonts.css";
import "./css/wallet.css";
import "./css/navigation.css";

require("@solana/wallet-adapter-react-ui/styles.css");

export function Navigation({
    setScreen,
    check_sol_balance,
    bearer_token,
}: {
    setScreen: React.Dispatch<SetStateAction<number>>;
    check_sol_balance: React.MutableRefObject<boolean>;
    bearer_token: string;
}) {
    const wallet = useWallet();

    const [balance, setBalance] = useState(0);

    //MusicList
    const MusicList = [
        { src: delvingDeeper, name: "Delving Deeper" },
        { src: hackNSlash, name: "Hack N Slash" },
        { src: enterTheDungeon, name: "Enter the Dungeon" },
        { src: dungeonCrawling, name: "Dungeon Crawling" },
        { src: orcsAndGoblins, name: "Orcs and Goblins" },
        { src: glimmerGreen, name: "Glimmer Green" },
    ];

    // This will be used to store the interval
    const intervalref = useRef<number | null>(null);

    const checkBalance = useCallback(async () => {
        //console.log("in increase", balance, check_sol_balance.current);

        if (wallet.publicKey === null) return;

        if (check_sol_balance.current === false) return;

        let current_balance = await request_current_balance(bearer_token, wallet.publicKey);

        //console.log("balance ", current_balance);
        if (current_balance !== balance) {
            check_sol_balance.current = false;
        }

        setBalance(current_balance);
    }, [wallet, balance, check_sol_balance, bearer_token]);

    // Use the useEffect hook to cleanup the interval when the component unmounts
    useEffect(() => {
        if (intervalref.current === null) {
            intervalref.current = window.setInterval(checkBalance, 1000);
        } else {
            window.clearInterval(intervalref.current);
            intervalref.current = null;
        }
        // here's the cleanup function
        return () => {
            if (intervalref.current !== null) {
                window.clearInterval(intervalref.current);
                intervalref.current = null;
            }
        };
    }, [checkBalance]);

    useEffect(() => {
        setBalance(0);
    }, [wallet]);

    const ShowFAQ = useCallback(async () => {
        setScreen(Screen.FAQ_SCREEN);
        return;
    }, [setScreen]);

    const ShowOdds = useCallback(async () => {
        setScreen(Screen.ODDS_SCREEN);
        return;
    }, [setScreen]);

    const ShowHelp = useCallback(async () => {
        setScreen(Screen.HELP_SCREEN);
        return;
    }, [setScreen]);

    const ShowHome = useCallback(async () => {
        setScreen(Screen.HOME_SCREEN);
        return;
    }, [setScreen]);

    const ShowShop = useCallback(async () => {
        setScreen(Screen.SHOP_SCREEN);
        return;
    }, [setScreen]);

    const ShowDM = useCallback(async () => {
        setScreen(Screen.DM_SCREEN);
        return;
    }, [setScreen]);

    const ShowAchievements = useCallback(async () => {
        setScreen(Screen.ACHIEVEMENT_SCREEN);
        return;
    }, [setScreen]);

    const ShowStats = useCallback(async () => {
        setScreen(Screen.STATS_SCREEN);
        return;
    }, [setScreen]);

    const ShowArena = useCallback(async () => {
        setScreen(Screen.ARENA_SCREEN);
        return;
    }, [setScreen]);

    const addMargin = (index: number) => {
        if (index === 0) {
            return { marginTop: "1rem", _focus: { boxShadow: "none" } };
        } else if (index === NavBar.length - 1) {
            return { marginBottom: "1rem" };
        } else {
            return {};
        }
    };

    const NavBar = [
        { text: "Home", onClick: ShowHome },
        { text: "Arena", onClick: ShowArena },
        { text: "DM", onClick: ShowDM },
        { text: "Shop", onClick: ShowShop },
        { text: "Achievements", onClick: ShowAchievements },
        { text: "Stats", onClick: ShowStats },
        { text: "Odds", onClick: ShowOdds },
        { text: "FAQ", onClick: ShowFAQ },
        { text: "Help", onClick: ShowHelp },
    ];
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 900px)' })
    function DesktopNavigation() {
        const { isOpen, onOpen, onClose } = useDisclosure();

        return (
            <>
                <Box width="100%" ml="1%" mt="1%" mb="1%" mr="1%">
                    <Flex justifyContent="space-between" alignItems="center">
                        <Box width="30%" display="flex" alignItems="center">
                            {wallet.publicKey !== null && <WalletConnected />}
                            <div className="font-face-sfpb">
                                <Text fontSize="16px" color="white">
                                    {balance ? "Balance: " + balance.toFixed(3) + " SOL" : "                                 "}
                                </Text>
                            </div>
                        </Box>
                        <Box display="flex" mr="9.5%" justifyContent="flex-end">
                            <HStack spacing="29%">
                                <img
                                    src={large_door}
                                    onClick={() => setScreen(Screen.HOME_SCREEN)}
                                    style={{ maxWidth: "none", cursor: "pointer" }}
                                    width={24}
                                    alt={"generic"}
                                />

                                <a href="https://twitter.com/sol_dungeon">
                                    <FontAwesomeIcon color="white" icon={brands("twitter")} size="lg" />
                                </a>
                                <a href="https://discord.gg/soldungeon">
                                    <FontAwesomeIcon color="white" icon={brands("discord")} size="lg" />
                                </a>
                                <MuteButton />

                                <FontAwesomeIcon color="white" icon={solid("bars")} size="lg" onClick={onOpen} />
                            </HStack>
                        </Box>
                    </Flex>
                    <Drawer isOpen={isOpen} placement="right" onClose={onClose} closeOnOverlayClick={true}>
                        <DrawerOverlay />
                        <DrawerContent maxWidth={"25%"} maxHeight="fit-content" borderColor="white" borderWidth="2px">
                            <DrawerBody bg="black" backgroundColor="#171923">
                                <VStack spacing="24px">
                                    {NavBar.map((button, index) => (
                                        <Button
                                            variant="link"
                                            key={index}
                                            size="md"
                                            style={addMargin(index)}
                                            onClick={button.onClick}
                                            sx={{ outline: "none !important" }}
                                            textTransform={"uppercase"}
                                        >
                                            <div className="font-face-sfpb">
                                                <Text fontSize="16px" color="white" _hover={{ textDecoration: "underline" }}>
                                                    {button.text}
                                                </Text>
                                            </div>
                                        </Button>
                                    ))}
                                </VStack>
                            </DrawerBody>
                        </DrawerContent>
                    </Drawer>
                </Box>
            </>
        );
    }

    function MobileNavigation() {
        const { isOpen, onOpen, onClose } = useDisclosure();
        //const btnRef = React.useRef()

        return (
            <Box className="navigationMobileBody" >
                    {wallet.publicKey && (
                        <Box width="70%">
                            <HStack>
                                <WalletConnected />
                            </HStack>
                        </Box>
                    )}
                    {!wallet.publicKey && <Box width="75%"></Box>}

                  
                            {/* <a href="https://twitter.com/sol_dungeon">
                                <FontAwesomeIcon color="white" icon={brands("twitter")} size="lg" />
                            </a>

                            <a href="https://discord.gg/HeKJZZEaPn">
                                <FontAwesomeIcon color="white" icon={brands("discord")} size="lg" />
                            </a> */}
                            <div className="navigationBtns"  >
                            <MuteButton  />

                            <FontAwesomeIcon  color="white" icon={solid("bars")} size="lg" onClick={onOpen} />
                            <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
                                <DrawerOverlay />
                                <DrawerContent>
                                    <DrawerCloseButton color="white" />

                                    <DrawerBody bg="black">
                                        <VStack spacing="24px">
                                            {NavBar.map((button, index) => (
                                                <Button variant="link" key={index} size="md" onClick={button.onClick}>
                                                    <div className="font-face-sfpb">
                                                        <Text fontSize="16px" color="white">
                                                            {button.text}
                                                        </Text>
                                                    </div>
                                                </Button>
                                            ))}
                                        </VStack>
                                    </DrawerBody>
                                </DrawerContent>
                            </Drawer>
                            </div>

                           
            </Box>
        );
    }

    return (
        <>
            {!isTabletOrMobile && (
                <>
                    <DesktopNavigation />
                    <MusicPlayer tracks={MusicList} />
                </>
            )}

            {isTabletOrMobile && (
                <>
                    <MobileNavigation />
                    <MusicPlayer tracks={MusicList} />
                </>
            )}
        </>
    );
}
