import {
    Box,
    Center
} from '@chakra-ui/react';

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE } from './constants';


export function FAQScreen()
{
    return(
        <>
        <Center>
        <Box width = "80%">
        <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>

        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>What is Dungeons & Degens</h2><br />
        
        
        DUNGEONS & DEGENS is a Web3 gaming site inspired by retro dungeon crawlers and RPGs. It combines elements of wagering and RPG progression to create an exciting and immersive entertainment experience.

        The XP System grants Players XP points as they progress through the dungeon. XP points can be spent on a variety of rewards such as free raffle entries and Solana Loot NFTs.

        The Solana Loot System is similar to Loot NFTs on Ethereum but intended to be interoperable within the Solana network instead.

        Our first game available, DUNGEON, puts a fresh spin on the tired coin-flip games, combining 'push your luck' game-play with permanent character progression.

        
        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Is there a cost to play</h2><br />
        
        
        There is a 3% Dungeon Fee applied to Player winnings when exiting the dungeon alive. No fee is taken on losses.

        Coming Soon: The Dungeon Fee can be reduced by entering a Key Code from our Dungeon Key NFTs. A set of 10 Keys can also be burned for a Dungeon Master NFT.

        To find out more about our NFT collections please visit our Discord channel.
        
        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>How does Dungeon work</h2><br />

        <ul>
            <li>Connect your Phantom Wallet. A dedicated burner wallet is recommended</li>
            <li>Select your Hero (Cosmetic only - No gameplay impact)</li>
            <li>Click "Enter Dungeon" and accept the wager transaction.   The first time you play this will create a data account to track your progress</li>
            <li>Wait for the Room to spawn a Peril and resolve it</li>
            <li>Exit the dungeon or Continue to the next Room</li>
            <li>After earning 100XP, visit the Merchant to redeem a Whitelist Token to our Dungeon Key Mint (Coming Soon) </li>
            <li>If you need any further help please submit a support ticket in our Discord channel  </li>
        </ul>

        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>What are Dungeon Keys</h2><br />

        Dungeon Keys grant holders between 25% and 75% fee discounts depending on the quality of the key.  Simply click the key icon and enter the key number, e.g. for Dungeon Key #0035 you would enter 35 and click Apply.  The first time a key is used it will create a small lookup account to make using the key faster in the future.  
        
        </div>
        </Box>
        </Center>
        </>
    );
}