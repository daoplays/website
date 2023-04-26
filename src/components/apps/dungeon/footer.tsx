import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    Box,
    HStack,
    Center,
    Text,
    VStack
} from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used

import { isMobile } from "react-device-detect";

import assassin_emoji from "./emojis/Assassin.gif"
import blue_slime_emoji from "./emojis/BlueSlime.gif"
import boulder_emoji from "./emojis/Boulder.png"
import carnivine_emoji from "./emojis/Carnivine.gif"
import dungeon_master_emoji from "./emojis/DungeonMaster.gif"
import elves_emoji from "./emojis/Elves.gif"
import giant_blue_slime_emoji from "./emojis/GiantBlueSlime.gif"
import giant_green_slime_emoji from "./emojis/GiantGreenSlime.gif"
import giant_rat_emoji from "./emojis/GiantRat.gif"
import giant_spider_emoji from "./emojis/GiantSpider.gif"
import goblins_emoji from "./emojis/Goblin.gif"
import green_slime_emoji from "./emojis/GreenSlime.gif"
import mimic_emoji from "./emojis/Mimic.gif"
import orc_emoji from "./emojis/Orc.gif"
import shade_emoji from "./emojis/Shade.gif"
import skeleton_knight_emoji from "./emojis/SkellyKnight.gif"
import skeletons_emoji from "./emojis/Skellies.gif"
import skeleton_wizard_emoji from "./emojis/SkellyWiz.gif"
import floor_spikes_emoji from "./emojis/Spikes.png"
import werewolf_emoji from "./emojis/Werewolf.gif"

import knight_emoji from "./emojis/Knight.gif"
import ranger_emoji from "./emojis/Ranger.gif"
import wizard_emoji from "./emojis/Wizard.gif"

import gold_emoji from "./emojis/Gold.gif"


import { get_discord_messages, DiscordMessage } from './utils';

//  dungeon constants
import { EMOJI_SIZE} from './constants';

interface DefeatedEnemyInterface {
    characterEmoji: string | undefined;
    enemyEmoji: string | undefined;
    level: string | undefined;
    display_distance: string | null;
}

const emoji_map = new Map([
    // enemies
    ["<a:Assassin:1082340379204014170>", assassin_emoji],
    ["<a:BlueSlime:1082339378573086821>", blue_slime_emoji],
    ["<:Boulder:1070460848155410432>", boulder_emoji],
    ["<a:Carnivine:1080810978347855952>", carnivine_emoji],
    ["<a:DM:1082380987465465968>", dungeon_master_emoji],
    ["<a:Elves:1070460851317907466>", elves_emoji],
    ["<a:GiantSlimeBlue:1082339381060313098>", giant_blue_slime_emoji],
    ["<a:GiantSlimeGreen:1082339382624780370>", giant_green_slime_emoji],
    ["<a:GiantRat:1082339379445502023>", giant_rat_emoji],
    ["<a:GiantSpider:1082339383740473406>", giant_spider_emoji],
    ["<a:Goblins:1070460853436030997>", goblins_emoji],
    ["<a:GreenSlime:1082339385502093402>", green_slime_emoji],
    ["<a:Mimic:1086994090543022131>", mimic_emoji],
    ["<a:Orc:1070471402496462858>", orc_emoji],
    ["<a:Shade:1082342760947925072>", shade_emoji],
    ["<a:SkellyKnight:1070471408523677747>", skeleton_knight_emoji],
    ["<a:Skellies:1070471406887907338>", skeletons_emoji],
    ["<a:SkellyWiz:1070471409622585394>", skeleton_wizard_emoji],
    ["<:Spikes:1070471412084654080>", floor_spikes_emoji],
    ["<a:Werewolf:1082339387557289994>", werewolf_emoji],

    // characters
    ["<a:Knight:1070460855575126116>", knight_emoji],
    ["<a:Ranger:1070471404425842688>", ranger_emoji],
    ["<a:Wizard:1070471413829472287>", wizard_emoji]
  ]);

let FOOTER_TIME_FONT_SIZE = "8px"
let FOOTER_FONT_MAIN = "12px"
let FOOTER_WIDTH: string = "420px"
if (isMobile) {
    FOOTER_TIME_FONT_SIZE = "8px"
    FOOTER_WIDTH = "350px"
    // FOOTER_FONT_SIZE = "10px"

}

export function Footer() {

    const [discord_messages, setDiscordMessages] = useState<DiscordMessage[]>([])
    const state_interval = useRef<number | null>(null);
    const has_initial_state = useRef<boolean>(false);

    const [show_live, setShowLive] = useState<boolean>(false);



    const check_discord_state = useCallback(async () => 
    {
        //console.log("in check discord state");

        let messages = await get_discord_messages();

        if (messages !== null) {
            has_initial_state.current = true;
            setDiscordMessages(messages);
        }

    }, []);

    // interval for checking state
    useEffect(() => {

        if (state_interval.current === null) {
            state_interval.current = window.setInterval(check_discord_state, 60000);
        }
        else{
            window.clearInterval(state_interval.current);
            state_interval.current = null;
            
        }
        // here's the cleanup function
        return () => {
            if (state_interval.current !== null) {
            window.clearInterval(state_interval.current);
            state_interval.current = null;
            }
        };
    }, [check_discord_state]);

    useEffect(() => {

            if (has_initial_state.current === false)
                check_discord_state();

    }, [check_discord_state]);

    const EnemyDefeated = ({ characterEmoji, enemyEmoji, level, display_distance }: DefeatedEnemyInterface) => {
        return (
            <HStack>
                <Box width="80%">
                    <HStack>
                        <img
                            src={characterEmoji}
                            width="auto"
                            alt=""
                            style={{ maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE }}
                        />
                        <Text fontSize={FOOTER_FONT_MAIN} color="white">
                            defeated
                        </Text>
                        <img
                            src={enemyEmoji}
                            width="auto"
                            alt=""
                            style={{ maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE }}
                        />
                        <Text fontSize={FOOTER_FONT_MAIN} color="white">
                            in level {level}
                        </Text>
                    </HStack>
                </Box>
                <Box width="20%">
                    <Text fontSize={FOOTER_TIME_FONT_SIZE} color="grey">
                        {display_distance} ago
                    </Text>
                </Box>
            </HStack>
        );
    };

    const ParseDiscordMessage: React.FC<DiscordMessage> = ({message,time}) => {

        // let message= message?.message;
        const newTime = Date.parse(time);
        const now = new Date().getTime();
        const distance_seconds = (now - newTime) / 1000;
        const distance_minutes = distance_seconds / 60;
        // console.log(distance_seconds, distance_minutes);
        const display_distance =
            distance_seconds > 60
                ? `${distance_minutes.toFixed(0)} min`
                : `${distance_seconds.toFixed(0)} secs`;

        // console.log('display_distance', display_distance);


        const split_message = message.split(" ") || [];

        const character_emoji = emoji_map.get(split_message && split_message[0]);

        // earned an achievement
        if (split_message && (split_message[1] === "earned")) {
            const string_bit = split_message?.slice(1, split_message.length).join(" ");

            return (
                <HStack >
                    <Box width="80%">
                        <HStack>
                              <img
                                  src={character_emoji}
                                  width="auto"
                                  alt=""
                                  style={{ maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE }}
                              />
                              <Text fontSize={FOOTER_FONT_MAIN} color="white">
                                  {string_bit}
                              </Text>
                        </HStack>
                    </Box>
                    <Box width="20%">
                          <Text fontSize={FOOTER_TIME_FONT_SIZE} marginEnd="1em" color="grey">
                              {display_distance} ago
                          </Text>
                    </Box>
                </HStack>
            );
        }

        if (split_message[5] === "arena") {
            let string_bit = split_message.slice(1,6).join(" ");
            return(
                <HStack>
                    <Box width="80%">
                        <HStack>
                            <img src={character_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/>
                            <Text fontSize={FOOTER_FONT_MAIN} color="white">{string_bit}</Text>
                            <img src={gold_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/>
                        </HStack>
                    </Box>
                    <Box width="20%">
                    <Text fontSize={FOOTER_TIME_FONT_SIZE} color="grey">{display_distance} ago</Text>
                    </Box>

                </HStack>
            );
        }

        // defeated enemy
        if (split_message?.length === 6) {
            const enemy_emoji = emoji_map.get(split_message && split_message[2]);
            const level = split_message && split_message[5];

            return (
                <EnemyDefeated

                      characterEmoji={character_emoji}
                      enemyEmoji={enemy_emoji}
                      level={level}
                      display_distance={display_distance}
                  />
            );
        }

        // died
        if (split_message?.length === 8) {
            let enemy_emoji = emoji_map.get(split_message && split_message[4]);
            return (
                <HStack>
                    <Box width="80%">
                        <HStack>
                            <img
                                src={character_emoji}
                                width="auto"
                                alt={""}
                                style={{ maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE }}
                            />
                            <Text fontSize={FOOTER_FONT_MAIN} color="white">
                                was killed by
                            </Text>
                            <img
                                src={enemy_emoji}
                                width="auto"
                                alt={""}
                                style={{ maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE }}
                            />
                            <Text fontSize={FOOTER_FONT_MAIN} color="white">
                                in level {split_message[7]}
                            </Text>
                        </HStack>
                    </Box>
                    <Box width="20%">
                        <Text fontSize={FOOTER_TIME_FONT_SIZE} color="grey">
                            {display_distance} ago
                        </Text>
                    </Box>
                </HStack>
            );
        }

        // all other cases
        let string_bit = Array.isArray(split_message) ? split_message?.slice(1, 7)?.join(" ") : '';


        return (
            <HStack>
                <Box width="80%">
                    <HStack>
                        <img
                            src={character_emoji}
                            width="auto"
                            alt={""}
                            style={{ maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE }}
                        />
                        <Text fontSize={FOOTER_FONT_MAIN} color="white">
                            {string_bit}
                        </Text>
                        <img
                            src={gold_emoji}
                            width="auto"
                            alt={""}
                            style={{ maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE }}
                        />
                    </HStack>
                </Box>
                <Box width="20%">
                    <Text fontSize={FOOTER_TIME_FONT_SIZE} color="grey">
                        {display_distance} ago
                    </Text>
                </Box>
            </HStack>
        );
    }

    if (isMobile)  {
        return (
            <div className="font-face-sfpb">
                    <div className="fixed-bottom ">
                    <Box width="100%" >
                        <Center width="100%">
                                <Box mb = "1rem"  width="100%" borderWidth='2px' borderColor="white" borderLeft="hidden" borderRight="hidden" borderBottom="hidden" backgroundColor="#171923" >
    
                                    {show_live && 
                                    <>
                                        <VStack align="left" mt="8px" ml="4px" mr="4px">
                                        {discord_messages.slice(0, 9).map((message, index) => (
                        
                                            
                                            <ParseDiscordMessage key={index} message={message.message} time={message.time} />
                                        ))}
                                        </VStack>


                                    <Center>
                                        <Box as='button' onClick={() => setShowLive(false)} width={"60px"}>
                                            <FontAwesomeIcon color="white" icon={solid('chevron-down')} size="lg"/>
                                        </Box>
                                    </Center>
                                    </>
                                    }
                                    {!show_live && 
                                    <>
                                    <VStack align="left" mt="8px" ml="4px" mr="4px">
                                        {discord_messages.slice(0, 1).map((message, index) => (
                        
                                            
                                            <ParseDiscordMessage key={index} message={message.message} time={message.time} />
                                        ))}
                                        </VStack>
                                    <Center>
                                        <Box as='button' onClick={() => setShowLive(true)} width={"60px"}>
                                            <FontAwesomeIcon color="white" icon={solid('chevron-up')} size="lg"/>
                                        </Box>
                                    </Center>
                                    </>
                                    }
                                </Box>
                            </Center>
                            </Box>
                    </div>
                </div>
        );

    }

    return (
        <div className="font-face-sfpb">
            <div className="fixed-bottom" style={{ width: "400px" }}>
                            <Box ml="2rem" mr="2rem" width={FOOTER_WIDTH} borderWidth='2px' borderColor="white" borderBottomColor="black" backgroundColor="#171923">

                                {show_live && 
                                <>
                                    <VStack align="left" mt="8px" ml="4px" mr="4px">
                                        {discord_messages.slice(0, 9).map((message, index) => (
                        
                                            
                                            <ParseDiscordMessage key={index} message={message.message} time={message.time} />
                                        ))}
                                        </VStack>
                                <Center>
                                    <Box as='button' onClick={() => setShowLive(false)} width={"60px"}>
                                        <FontAwesomeIcon color="white" icon={solid('chevron-down')} size="lg"/>
                                    </Box>
                                </Center>
                                </>
                                }
                                {!show_live && 
                                <>
                                <VStack align="left" mt="8px" ml="4px" mr="4px">
                                        {discord_messages.slice(0, 1).map((message, index) => (
                        
                                            
                                            <ParseDiscordMessage key={index} message={message.message} time={message.time} />
                                        ))}
                                        </VStack>
                                <Center>
                                    <Box as='button' onClick={() => setShowLive(true)} width={"60px"}>
                                        <FontAwesomeIcon color="white" icon={solid('chevron-up')} size="lg"/>
                                    </Box>
                                </Center>
                                </>
                                }
                            </Box>
                </div>
            </div>
    );
}