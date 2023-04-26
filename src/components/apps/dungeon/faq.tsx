import {
    Box,
    Center
} from '@chakra-ui/react';

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE } from './constants';


export function FAQScreen()
{
    return(
        <>
        <Center mb = "5rem">
        <Box width = "80%">
        <div className="font-face-sfp" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>

        <h2 className="mt-5 font-face-sfpb" style={{fontSize: DEFAULT_FONT_SIZE}}>What is Dungeons & Degens</h2><br />
        
        
        DUNGEONS & DEGENS is a Web3 gaming site inspired by retro dungeon crawlers and RPGs. It combines elements of wagering and RPG progression to create an exciting and immersive entertainment experience.

        The XP System grants Players XP points as they progress through the dungeon. XP points can be spent on a variety of rewards such as free raffle entries and Solana Loot NFTs.

        The Solana Loot System is similar to Loot NFTs on Ethereum but intended to be interoperable within the Solana network instead.

        Our first game available, DUNGEON, puts a fresh spin on the tired coin-flip games, combining 'push your luck' game-play with permanent character progression.

        
        <h2 className="mt-5  font-face-sfpb" style={{fontSize: DEFAULT_FONT_SIZE}}>Is there a cost to play</h2><br />
        
        
        There is a 3% Dungeon Fee applied to Player winnings when exiting the dungeon alive. No fee is taken on losses.

        Coming Soon: The Dungeon Fee can be reduced by entering a Key Code from our Dungeon Key NFTs. A set of 10 Keys can also be burned for a Dungeon Master NFT.

        To find out more about our NFT collections please visit our Discord channel.
        
        <h2 className="mt-5  font-face-sfpb" style={{fontSize: DEFAULT_FONT_SIZE}}>How does Dungeon work</h2><br />

        <ul>
            <li>Connect your Phantom Wallet. A dedicated burner wallet is recommended</li>
            <li>Select your Hero (Cosmetic only - No gameplay impact)</li>
            <li>Click "Enter Dungeon" and accept the wager transaction.   The first time you play this will create a data account to track your progress</li>
            <li>Wait for the Room to spawn a Peril and resolve it</li>
            <li>Exit the dungeon or Continue to the next Room</li>
            <li>After earning 100XP, visit the Merchant to redeem a Whitelist Token to our Dungeon Key Mint (Coming Soon) </li>
            <li>If you need any further help please submit a support ticket in our Discord channel  </li>
        </ul>

        <h2 className="mt-5  font-face-sfpb" style={{fontSize: DEFAULT_FONT_SIZE}}>What are Dungeon Keys</h2><br />

        Dungeon Keys grant holders between 25% and 75% fee discounts depending on the quality of the key.  Simply click the key icon and enter the key number, e.g. for Dungeon Key #0035 you would enter 35 and click Apply.  The first time a key is used it will create a small lookup account to make using the key faster in the future.  
        
        <h2 className="mt-5  font-face-sfpb" style={{fontSize: DEFAULT_FONT_SIZE}}>How does the Arena work</h2><br />

        The Arena is a Player vs. Player mode where individuals can create or join games to compete against each other.  Right now we have an implementation of Rock Paper Scissors using the characters from Dungeons & Degens.  Each of these characters have their own 'move set' that maps to the traditional Rock Paper and Scissor moves.

        <br/><br/>

        When each participant joins the game their wagers will be transferred to an escrow account where it will be held until the end of the game at which point the total deposited will be sent to the winner.  No matter who wins the cost of creating the data account for the game (around 0.003 SOL) will be returned to the player that set up the game when it finishes.

        <br/><br/>

        To ensure that no-one can cause another players wager to be locked up indefinitely within the escrow account we have included a timeout for all Arena games.  This can be set to 'Fast' or to 'Slow' when creating the game and the option chosen will be shown in the game browser.  A Fast game will time out 2 minutes after the last player made a move while a Slow game will time out 24 hours after the last player made a move.  At that stage the player that went last will be given the option to Execute their opponent which will immediately end the game and award them the victory thus letting them claim the spoils.

        </div>
        </Box>
        </Center>
        </>
    );
}