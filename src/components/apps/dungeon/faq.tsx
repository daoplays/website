import { Box, Center } from "@chakra-ui/react";

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE } from "./constants";

export function FAQScreen() {
    return (
        <>
            <Center mb="5rem">
                <Box width="80%">
                    <div className="font-face-sfp" style={{ color: "white", fontSize: DUNGEON_FONT_SIZE }}>

                        <h2 className="mt-5 font-face-sfpb" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            WHAT IS THIS?
                        </h2>

                        <br />
                        DUNGEONS & DEGENS is a retro RPG designed specifically for Web3 degens.
                        Explore the Dungeon to earn XP and find $LOOT, then spend it on Consumables to boost your progress or Limited Edition Collectibles!
                        The game is constantly updated with more content and new uses for $LOOT.

                        <h2 className="mt-5  font-face-sfpb" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            WHAT BLOCKCHAIN IS THE GAME ON?
                        </h2>

                        <br />
                        DUNGEONS & DEGENS runs entirely on the Solana blockchain. It is the only network that can settle transactions fast enough to handle all the game logic entirely on-chain.
                        <br/><br/>
                        The program address is: FUjAo5wevsyS2jpe2XnkYN3SyQVbxAjoy8fuWrw3wjUk
                        <br/><br/>
                        $LOOT is an SPL token. The token address is: FGXnWVQuc35M8XLG4egciVhZXqhy3XawbY2V8TpfHHag


                        <h2 className="mt-5  font-face-sfpb" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            HOW DOES IT WORK?
                        </h2>
                        <br />
                        <ul>
                            <li>Step 1: Connect with a Solana wallet. We recommend Solflare.</li>
                            <li>Step 2: Select a Hero then Enter the Dungeon. A 0.002 SOL entry fee is required. The first time you play a little bit more will be required to create your game data account.</li>
                            <li>
                            Step 3: On Room 1, one of many possible Perils will spawn. Wait for your Die Roll to resolve on-chain.
                            </li>
                            <li>Step 4: If successful, you may choose to Escape with the $LOOT you have found or to Explore the next Room. Deeper Rooms contain bigger $LOOT rewards but also have more dangerous Perils.</li>
                            <li>Step 5: If unsuccessful, your Hero dies and the $LOOT accumulated during that run is lost.</li>
                            <li>
                            Step 6: Spend $LOOT at the Shop on upgrades, boosts, and collectibles.
                            </li>
                        </ul>
                        <h2 className="mt-5  font-face-sfpb" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            DUNGEON KEYS
                        </h2>
                        <br />
                            Dungeon Key NFTs grant a number of Free Entries to the Dungeon every day. They can be purchased in the SHOP for 2 SOL each, while supplies last.
                            <br/><br/>
                            Free Entries per Day:
                            <ul>
                                <li>Bronze - 10</li>
                                <li>Silver - 20</li>
                                <li>Gold - 30</li>
                            </ul>
                            <br/>
                            To use the Free Plays, connect with a wallet holding a Dungeon Key, click the key symbol, enter its Key Number, then click Apply.
                        <h2 className="mt-5  font-face-sfpb" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            WHAT GAMES INSPIRED DUNGEONS & DEGENS?
                        </h2>
                        
                        <br />
                        
                        Too many to list but some of the most influential ones are:
                        <br/><br/>
                        <ul>
                            <li> Dungeons & Dragons 5th ed. </li>
                            <li> Ultima 2</li>
                            <li> Oregon Trail</li>
                            <li> Dragon's Lair</li>
                            <li> Old School Runescape</li>
                            <li> DeFi Kingdoms</li>
                            <li> Degen Coin Flip</li>
                        </ul>
                        <br/>
                        These games provide lessons not just in lore, art, and gameplay, but also in UX and good governance.

                        <h2 className="mt-5  font-face-sfpb" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            HOW DOES THE ARENA WORK
                        </h2>
                        <br />
                        The Arena is a Player vs. Player mode where individuals can create or join games to compete against each other.
                        Right now we have an implementation of Rock Paper Scissors using the characters from Dungeons & Degens. Each of
                        these characters have their own 'move set' that maps to the traditional Rock Paper and Scissor moves.
                        <br />
                        <br />
                        When each participant joins the game their wagers will be transferred to an escrow account where it will be held
                        until the end of the game at which point the total deposited will be sent to the winner. No matter who wins the cost
                        of creating the data account for the game (around 0.003 SOL) will be returned to the player that set up the game
                        when it finishes.
                        <br />
                        <br />
                        To ensure that no-one can cause another players wager to be locked up indefinitely within the escrow account we have
                        included a timeout for all Arena games. This can be set to 'Fast' or to 'Slow' when creating the game and the option
                        chosen will be shown in the game browser. A Fast game will time out 2 minutes after the last player made a move
                        while a Slow game will time out 24 hours after the last player made a move. At that stage the player that went last
                        will be given the option to Execute their opponent which will immediately end the game and award them the victory
                        thus letting them claim the spoils.
                    </div>
                </Box>
            </Center>
        </>
    );
}
