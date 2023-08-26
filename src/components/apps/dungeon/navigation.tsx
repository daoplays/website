import { Box, Flex, HStack } from "@chakra-ui/react";

import { useWallet } from "@solana/wallet-adapter-react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { brands } from "@fortawesome/fontawesome-svg-core/import.macro"; // <-- import styles to be used

// dungeon utils
import { WalletConnected } from "./utils";

import "./css/style.css";
import "./css/fonts.css";
import "./css/wallet.css";
import "./css/navigation.css";

require("@solana/wallet-adapter-react-ui/styles.css");

export function Navigation() {
    const wallet = useWallet();

    function DesktopNavigation() {
        return (
            <>
                <Box width="100%" ml="1%" mt="1%" mb="1%" mr="1%">
                    <Flex justifyContent="space-between" alignItems="center">
                        <Box width="90%" display="flex" alignItems="center">
                            {wallet.publicKey !== null && <WalletConnected />}
                        </Box>
                        <Box width="10%" mr="1rem">
                            <HStack spacing="20%">
                                <a href="https://twitter.com/sol_dungeon">
                                    <FontAwesomeIcon color="white" icon={brands("twitter")} size="lg" />
                                </a>
                                <a href="https://discord.gg/soldungeon">
                                    <FontAwesomeIcon color="white" icon={brands("discord")} size="lg" />
                                </a>
                            </HStack>
                        </Box>
                    </Flex>
                </Box>
            </>
        );
    }

    return <DesktopNavigation />;
}
