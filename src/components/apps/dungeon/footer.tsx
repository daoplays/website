import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    Box,
    HStack,
    Center,
    Text,

} from '@chakra-ui/react';

import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
} from '@chakra-ui/react'
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
import { DUNGEON_FONT_SIZE} from './constants';


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

var FOOTER_TIME_FONT_SIZE = "10px"

if (isMobile) {
    FOOTER_TIME_FONT_SIZE = "8px"
}
  

export function Footer() {

    const [discord_messages, setDiscordMessages] = useState<DiscordMessage[]>([])
    const state_interval = useRef<number | null>(null);
    const has_initial_state = useRef<boolean>(false);


    const check_discord_state = useCallback(async () => 
    {
        console.log("in check discord state");

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

    const ParseDiscordMessage = ({message} : {message : DiscordMessage}) => {

        if (discord_messages.length === 0) {
            return(<></>);

        }
        let time = Date.parse(message.time);
        var now = new Date().getTime();
        var distance = now - time;
        let distance_min = (distance/1000/60).toFixed(2)
        console.log(message.time)
        console.log(time, now, );
        let split_message = message.message.split(" ");
        let character_emoji = emoji_map.get(split_message[0]);

        // defeated enemy

        if (split_message.length === 6) {
            let enemy_emoji =  emoji_map.get(split_message[2]);
            return(
                <HStack>
                    <img src={character_emoji} width="auto" alt={""} style={{maxHeight: 32, maxWidth: 32}}/>
                    <Text fontSize={DUNGEON_FONT_SIZE} align="center" color="white">defeated</Text>
                    <img src={enemy_emoji} width="auto" alt={""} style={{maxHeight: 32, maxWidth: 32}}/>
                    <Text fontSize={DUNGEON_FONT_SIZE} align="center" color="white">in level {split_message[5]}</Text>
                    <Text fontSize={FOOTER_TIME_FONT_SIZE} align="center" color="grey">({distance_min} min ago)</Text>
                </HStack>
            );
        }

        // died
        if (split_message.length === 8) {
            let enemy_emoji =  emoji_map.get(split_message[4]);
            return(
                <HStack>
                    <img src={character_emoji} width="auto" alt={""} style={{maxHeight: 32, maxWidth: 32}}/>
                    <Text fontSize={DUNGEON_FONT_SIZE} align="center" color="white">was killed by</Text>
                    <img src={enemy_emoji} width="auto" alt={""} style={{maxHeight: 32, maxWidth: 32}}/>
                    <Text fontSize={DUNGEON_FONT_SIZE} align="center" color="white">in level {split_message[7]}</Text>
                    <Text fontSize={FOOTER_TIME_FONT_SIZE} align="center" color="grey">({distance_min} min ago)</Text>
                </HStack>
            );
        }

        let string_bit = split_message.slice(1,8).join(" ");

        return(
            <HStack>
                <img src={character_emoji} width="auto" alt={""} style={{maxHeight: 32, maxWidth: 32}}/>
                <Text fontSize={DUNGEON_FONT_SIZE} align="center" color="white">{string_bit}</Text>
                <img src={gold_emoji} width="auto" alt={""} style={{maxHeight: 32, maxWidth: 32}}/>
                <Text fontSize={FOOTER_TIME_FONT_SIZE} align="center" color="grey">({distance_min} min ago)</Text>
            </HStack>
        );

    }

    return (
        <div className="font-face-sfpb">
            <div className="footer" style={{paddingTop: "50px"}}>
                <footer className="py-3 bg-dark fixed-bottom">
                    <Box width = "100%"><Center>

                            <Accordion allowToggle> 
                                <AccordionItem border='none'>
                                    <h2>
                                        
                                    <AccordionButton>
                                        <ParseDiscordMessage message={discord_messages[0]}/>
                                        <AccordionIcon color="white"/>
                                    </AccordionButton>
                                    
                                    </h2>
                                    <AccordionPanel pb={4} color="white" >
                                        <ParseDiscordMessage message={discord_messages[1]}/>
                                        <ParseDiscordMessage message={discord_messages[2]}/>
                                        <ParseDiscordMessage message={discord_messages[3]}/>
                                        <ParseDiscordMessage message={discord_messages[4]}/>
                                        <ParseDiscordMessage message={discord_messages[5]}/>
                                        <ParseDiscordMessage message={discord_messages[6]}/>
                                        <ParseDiscordMessage message={discord_messages[7]}/>
                                        <ParseDiscordMessage message={discord_messages[8]}/>
                                        <ParseDiscordMessage message={discord_messages[9]}/>
                                    </AccordionPanel>
                                </AccordionItem>
                            </Accordion>
                            </Center>
                    </Box>
                </footer>
            </div>
        </div>
    );
}