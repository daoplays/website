import { Box, Center, Text, HStack, VStack } from "@chakra-ui/react";

//  dungeon constants
import { DUNGEON_FONT_SIZE, levels } from "./constants";
import { PlayerData } from "./utils";

//enemies
import assassin from "./images/Assassin.gif";
import blue_slime from "./images/Blue_Slime.gif";
import boulder from "./images/Boulder.png";
import carnivine from "./images/Carnivine.gif";
import dungeon_master from "./images/Dungeon_Master.gif";
import elves from "./images/Elves.gif";
import giant_blue_slime from "./images/Giant_Blue_Slime.gif";
import giant_green_slime from "./images/Giant_Green_Slime.gif";
import giant_rat from "./images/Giant_Rat.gif";
import giant_spider from "./images/Giant_Spider.gif";
import goblins from "./images/Goblins.gif";
import green_slime from "./images/Green_Slime.gif";
import mimic from "./images/Mimic.gif";
import orc from "./images/Orc.gif";
import shade from "./images/Shade.gif";
import skeleton_knight from "./images/Skelly_Knight.gif";
import skeletons from "./images/Skellies.gif";
import skeleton_wizard from "./images/Skelly_Wiz.gif";
import floor_spikes from "./images/Spikes.png";
import werewolf from "./images/Werewolf.gif";

import closed_chest from "./images/chest_closed.png";
import open_chest from "./images/chest_open.png";
import bones from "./images/Bones.png";
import green_slime_corpse from "./images/slime_corpse.png";
import blue_slime_corpse from "./images/Blue_Slime_Corpse.png";
import spider_corpse from "./images/Spider_Corpse.png";
import carnivine_corpse from "./images/Vine_Corpse.png";
import werewolf_corpse from "./images/Wolf_Corpse.png";
import shade_corpse from "./images/Shade_Corpse.png";

//characters
import knight from "./images/Knight.gif";
import ranger from "./images/Ranger.gif";
import wizard from "./images/Wizard.gif";
import corpse from "./images/Corpse.png";

import loot from "./images/loot.png";
import dice_roll from "./images/die_roll.gif";

import rd20_1 from "./dice_images/r1.png";
import rd20_2 from "./dice_images/r2.png";
import rd20_3 from "./dice_images/r3.png";
import rd20_4 from "./dice_images/r4.png";
import rd20_5 from "./dice_images/r5.png";
import rd20_6 from "./dice_images/r6.png";
import rd20_7 from "./dice_images/r7.png";
import rd20_8 from "./dice_images/r8.png";
import rd20_9 from "./dice_images/r9.png";
import rd20_10 from "./dice_images/r10.png";
import rd20_11 from "./dice_images/r11.png";
import rd20_12 from "./dice_images/r12.png";
import rd20_13 from "./dice_images/r13.png";
import rd20_14 from "./dice_images/r14.png";
import rd20_15 from "./dice_images/r15.png";
import rd20_16 from "./dice_images/r16.png";
import rd20_17 from "./dice_images/r17.png";
import rd20_18 from "./dice_images/r18.png";
import rd20_19 from "./dice_images/r19.png";
import rd20_20 from "./dice_images/r20.png";

import bd20_1 from "./dice_images/b1.png";
import bd20_2 from "./dice_images/b2.png";
import bd20_3 from "./dice_images/b3.png";
import bd20_4 from "./dice_images/b4.png";
import bd20_5 from "./dice_images/b5.png";
import bd20_6 from "./dice_images/b6.png";
import bd20_7 from "./dice_images/b7.png";
import bd20_8 from "./dice_images/b8.png";
import bd20_9 from "./dice_images/b9.png";
import bd20_10 from "./dice_images/b10.png";
import bd20_11 from "./dice_images/b11.png";
import bd20_12 from "./dice_images/b12.png";
import bd20_13 from "./dice_images/b13.png";
import bd20_14 from "./dice_images/b14.png";
import bd20_15 from "./dice_images/b15.png";
import bd20_16 from "./dice_images/b16.png";
import bd20_17 from "./dice_images/b17.png";
import bd20_18 from "./dice_images/b18.png";
import bd20_19 from "./dice_images/b19.png";
import bd20_20 from "./dice_images/b20.png";

let red_dice_array: string[] = [
    rd20_1,
    rd20_2,
    rd20_3,
    rd20_4,
    rd20_5,
    rd20_6,
    rd20_7,
    rd20_8,
    rd20_9,
    rd20_10,
    rd20_11,
    rd20_12,
    rd20_13,
    rd20_14,
    rd20_15,
    rd20_16,
    rd20_17,
    rd20_18,
    rd20_19,
    rd20_20,
];

let blue_dice_array: string[] = [
    bd20_1,
    bd20_2,
    bd20_3,
    bd20_4,
    bd20_5,
    bd20_6,
    bd20_7,
    bd20_8,
    bd20_9,
    bd20_10,
    bd20_11,
    bd20_12,
    bd20_13,
    bd20_14,
    bd20_15,
    bd20_16,
    bd20_17,
    bd20_18,
    bd20_19,
    bd20_20,
];

export const WIN_FACTORS: number[] = [1.0, 1.5, 2.25, 3.375, 6.75, 13.5, 27, 54];

var seedrandom = require("seedrandom");

export const enum DungeonInstruction {
    add_funds = 0,
    play = 1,
    quit = 2,
    explore = 3,
    claim_achievement = 4,
    drink_potion = 5,
    buy_potion = 6,
}

export const enum DungeonCharacter {
    knight = 0,
    ranger = 1,
    wizard = 2,
}

export const enum DungeonEnemy {
    Assassin = 0,
    BlueSlime,
    BoulderTrap,
    Carnivine,
    DM,
    Elves,
    GiantBlueSlime,
    GiantGreenSlime,
    GiantRat,
    GiantSpider,
    Goblins,
    GreenSlime,
    Mimic,
    Orc,
    Shade,
    SkeletonKnight,
    Skeletons,
    SkeletonWizard,
    SpikeTrap,
    Werewolf,
    None,
}

export const DungeonCharacterEmoji: string[] = [
    "<a:Knight:1070460855575126116>",
    "<a:Ranger:1070471404425842688>",
    "<a:Wizard:1070471413829472287>",
];

export const GoldEmoji: string = "<a:Gold:1086961346492510298>";

export const DungeonEnemyEmoji: string[] = [
    "<a:Assassin:1082340379204014170>",
    "<a:BlueSlime:1082339378573086821>",
    "<:Boulder:1070460848155410432>",
    "<a:Carnivine:1080810978347855952>",
    "<a:DM:1082380987465465968>",
    "<a:Elves:1070460851317907466>",
    "<a:GiantSlimeBlue:1082339381060313098>",
    "<a:GiantSlimeGreen:1082339382624780370>",
    "<a:GiantRat:1082339379445502023>",
    "<a:GiantSpider:1082339383740473406>",
    "<a:Goblins:1070460853436030997>",
    "<a:GreenSlime:1082339385502093402>",
    "<a:Mimic:1086994090543022131>",
    "<a:Orc:1070471402496462858>",
    "<a:Shade:1082342760947925072>",
    "<a:SkellyKnight:1070471408523677747>",
    "<a:Skellies:1070471406887907338>",
    "<a:SkellyWiz:1070471409622585394>",
    "<:Spikes:1070471412084654080>",
    "<a:Werewolf:1082339387557289994>",
];

export const enum DungeonStatus {
    unknown = 0,
    alive = 1,
    dead = 2,
    exploring = 3,
}

const DungeonEnemyAppearsText: string[][] = [
    // assasin
    [
        "You have encountered an Assassin, prepare yourself!",
        "A smoke bomb goes off at the end of the corridor and an assassin flits into view.  Prepare yourself!",
    ],
    // blue slime
    [
        "You have encountered an blue slime, prepare yourself!",
        "A Blue Slime squeezes out of a crack in the wall, prepare yourself!",
        "A Blue Slime drops from the ceiling, prepare yourself!",
    ],
    // boulder
    ["You enter a suspiciously empty room...", "The hallway is dark but it seems empty..."],
    // carnivine
    [
        "You have encountered a Carnivine, prepare yourself!",
        "The smell of flowers makes you relax, but only until you see the source is a Carnivine.  Prepare yourself!",
        "Thick vines cover the walls.  You've entered the lair of a Carnivine!  Prepare yourself!",
    ],
    //dungeon master
    [
        "You have encountered a Dungeon Master, prepare yourself!",
        "The air begins to crackle around you as a Dungeon Master prepares to attack, get ready!",
    ],
    // elves
    [
        "You have encountered a group of elven archers, prepare yourself!",
        "A patrolling group of elven archers turns the corner, prepare yourself!",
    ],
    // giant blue slime
    [
        "You have encountered a giant blue slime, prepare yourself!",
        "Multiple blue slimes coalesce before you into a single giant slime! Prepare yourself!",
    ],
    // giant green slime
    [
        "You have encountered a giant green slime, prepare yourself!",
        "Multiple green slimes coalesce before you into a single giant slime! Prepare yourself!",
    ],
    // giant rat
    [
        "You have encountered a giant rat, prepare yourself!",
        "You notice the terrible stench in the room just as a giant rat bursts from the sewer grate ahead of you.  Prepare yourself!",
    ],
    // giant spider
    [
        "You have encountered a giant spider, prepare yourself!",
        "A mass of sticky web bars your way.  As you start to cut through a giant spider drops from the ceiling, prepare yourself!",
    ],
    // goblins
    ["You have encountered a pair of goblins, prepare yourself!"],
    // green slime
    [
        "You have encountered an oozing green slime, prepare yourself!",
        "A Green Slime squeezes out of a crack in the wall, prepare yourself!",
        "A Green Slime drops from the ceiling, prepare yourself!",
    ],
    // mimic
    ["You have found a treasure chest!", "You have found an old rusted treasure chest", "You have found an elaborately gilded coffer"],
    // orc
    ["You have encountered a huge orc, prepare yourself!", "The ground shakes as a gigantic orc charges towards you, prepare yourself!"],
    // shade
    [
        "You have encountered a Shade, prepare yourself!",
        "The shadows around you start shifting and take on the form of a Shade, prepare yourself!",
    ],
    // skeleton_knight
    ["You have encountered a skeleton knight, prepare yourself!", "An armour-clad skeleton appears, prepare yourself!"],
    // skeletons
    ["You have encountered a horde of skeletons, prepare yourself!", "You hear the rattling of bones ahead, prepare yourself!"],
    // skeleton_wizard
    ["You have encountered a skeleton wizard, prepare yourself!", "A skeleton wizard suddenly appears before you, prepare yourself!"],
    // spikes
    ["You enter a suspiciously empty room...", "The hallway is dark but it seems empty..."],
    // werewolf
    [
        "You have encountered a werewolf, prepare yourself!",
        "You have encountered a strange half naked man... who transforms before you into a werewolf! Prepare yourself!",
    ],
];

const DungeonEnemyDefeatedText: string[][] = [
    // assassin
    [
        "You have defeated the assassin",
        "You see through the assassins tricks and are waiting to strike when it next appears in front of you",
        "The assassin was quick, but you were quicker",
    ],
    // blue slime
    ["You have defeated the oozing blue slime", "A mere slime is no match for you!"],
    // boulder
    [
        "...but pass through without incident",
        "Just in time you notice a pressure plate hidden amongst the stones on the ground, and carefully step over it to continue onwards",
    ],
    // carnivine
    [
        "You have defeated the carnivine",
        "You turn the Carnivine into compost",
        "You hack through thorns and leaves until the Carnivine is reduced to mulch",
    ],
    // dungeon master
    [
        "You have defeated the dungeon master",
        "The dungeon master starts monologuing in typical villainic style.  Its overconfidence is its weakness and mid speech you strike it down",
        "Lighting arcs towards you but just misses the mark.  You rush in while the dungeon master recharges and cut their head off before they can attack again",
    ],
    // elves
    [
        "You have defeated the group of elven archers",
        "You attack before the elves have even noticed you, striking them down faster than they can draw their bows",
    ],
    // giant blue slime
    ["You have defeated the giant blue slime", "Your attack causes the slime to rupture, spilling blue ooze all over the floor"],
    // giant green slime
    ["You have defeated the giant green slime", "Your attack causes the slime to rupture, spilling green ooze all over the floor"],
    // giant rat
    ["You have defeated the giant rat", "Living underground has left the rat half blind, and you easily circle around and strike it down"],
    // giant spider
    ["You have defeated the giant spider", "Running in, you slide beneath the spider and attack its soft underbelly with all your might"],
    // goblins
    ["You have defeated the pair of goblins", "The goblins were intoxicated from mushroom brew. They barely put up a fight."],
    // green slime
    ["You have defeated the oozing green slime", "A mere slime is no match for you!"],
    // mimic
    [
        "You approach with great suspicion, but open it to find it full of gold!",
        "You open the chest with care, and find it contains some useful supplies",
    ],
    // orc
    ["You have defeated the orc", "The orcs size means it is too slow to hit you, or defend against your strikes"],
    // shade
    ["You have defeated the Shade", "The Shade chose the wrong soul to go after and you return it to the shadows"],
    // skeleton_knight
    [
        "You have defeated the skeleton knight",
        "Noticing a crack in the knights armour you strike, and the knights protection disintegrates along with the skeleton itself",
    ],
    // skeletons
    [
        "You have defeated the horde of skeletons",
        "You take out the skeletons one by one, leaving nothing but scattered bones across the floor",
    ],
    // skeleton_wizard
    ["You have defeated the skeleton wizard", "Your attacks disrupt the skeleton's incantation, causing it to backfire!"],
    // spikes
    [
        "...but pass through without incident",
        "Just in time you notice a pressure plate hidden amongst the stones on the ground, and carefully step over it to continue onwards",
    ],
    // werewolf
    [
        "You have defeated the werewolf",
        "Before the transformation is complete you strike, cutting the head clean off",
        "The werewolf attacks with bestial rage, but it is no match for you",
    ],
];

const DungeonPlayerDefeatedText: string[][] = [
    // assassin
    [
        "The assassin has defeated you.",
        "Surrounded by fog you can't keep track of the assassins movements. You only learn of its location when you feel its blade in your back",
    ],
    // blue slime
    [
        "The slime oozes past your defenses and envelopes you, suffocating you where you stand",
        "Your weapons melt into a pool at your feet as you try to attack, and soon you join them",
    ],
    // boulder
    [
        "A boulder suddenly falls from the ceiling, crushing you instantly.",
        "The door behind you slams shut and a boulder starts rolling towards you.  With nowhere to run you all you can do is watch with horror as it approaches",
    ],
    // carvinvine
    [
        "The carvnivine has defeated you.",
        "Vines wrap around your legs and arms pulling you beneath the soft earth",
        "With every vine you cut down another replaces it.  Exhausted, you succumb to the Carnivines relentless attacks.",
    ],
    // dungeon master
    [
        "The dungeon master has defeated you.",
        "Lightning arcs from the dungeon master and instantly incinerates you as it makes contact",
        "Through ancient magics the dungeon master takes control of your body and forces you to end your own life",
    ],
    // elves
    [
        "You take an arrow to the knee, and while stumbling are unable to dodge the next volley to the heart",
        "A volley of arrows turns you into a human pin-cushion",
    ],
    // giant blue slime
    [
        "The giant blue slime has defeated you.",
        "Your attacks are absorbed by the giant slimes mass.  There is nothing you can do as it slowly envelops you.",
        "You can see the remains of other adventurers floating inside the giant slime, and realize with horror you will soon be joining them.",
    ],
    // giant greenf slime
    [
        "The giant green slime has defeated you.",
        "Your attacks are absorbed by the giant slimes mass.  There is nothing you can do as it slowly envelops you.",
        "You can see the remains of other adventurers floating inside the giant slime, and realize with horror you will soon be joining them.",
    ],
    // giant rat
    [
        "The giant rat has defeated you.",
        "As the rat approaches the smell of decay causes you to gag, and in that moment it strikes.",
        "The rat trips you with its tail, and grabbing your ankles in its jaw it drags you into the sewers below",
    ],
    // giant spider
    [
        "The giant spider has defeated you.",
        "You get trapped in a mass of spider webs giving the spider ample time to wrap you up for a snack",
        "With surprising speed the spider springs from its web and bites you.  The venom acts quickly and you fall to the ground paralyzed",
    ],
    // goblins
    ["The goblins are too fast, you lose sight of them for just a second and the next thing you see is a knife to your throat"],
    // green slime
    [
        "The slime oozes past your defenses and envelopes you, suffocating you where you stand",
        "Your weapons melt into a pool at your feet as you try to attack, and soon you join them",
    ],
    // mimic
    [
        "The mimic's transformation stuns you for just a moment, but that is all it needed",
        "As you approach the chest you notice it starts to change shape, but before you can draw your weapon the mimic lunges and swallows you whole",
    ],
    // orc
    [
        "With one swing from it's axe the orc cracks your head open like an egg",
        "The orc slams into you knocking you to the ground, and then crushes your head like a bug beneath its feet",
    ],
    // shade
    [
        "The Shade's scythe passes through you as though you were no more than air as it claims another soul",
        "Your weapons do nothing to the Shade, and it calmly reaches out a shadowy hand to claim your soul",
    ],
    // skeleton knight
    [
        "Your attacks are simply deflected off the knight's armour until it gets bored and strikes you down",
        "You are no match for the knight, only pieces are left after it is done with you",
    ],
    // skeletons
    ["The skeletons manage to surround you, and strike from all sides", "There were just.. too many skeletons"],
    // skeleton wizard
    [
        "Hoarsely croaking some ancient incantation the wizard turns you inside out before you even have a chance to attack",
        "You collapse as your life energy is siphoned away by the skeletal mage",
    ],
    // spikes
    [
        "A trapdoor opens beneath your feet, dropping you onto a mass of bloodied spikes.",
        "Spikes suddenly burst from holes in the ground beneath your feet and impale you before you can react",
    ],
    // werewolf
    ["The werewolf has defeated you.", "The werewolf leaps on you faster than you can react and tears you to shreds"],
];

export function GetCharacterLevel(player_data : PlayerData | null): number {

    if (player_data == null)
        return 1;

        let current_level = 1;
        for (let i = 0; i < levels.length; i++) {
            if (player_data.character_xp[player_data.player_character] >= levels[i]) {
                current_level = i + 1;
            }
        }
    return (
        current_level
    );
}

export const DiceRollText = ({
    roll_one,
    roll_two,
    loading,
    player_data
}: {
    roll_one: number;
    roll_two: number;
    loading: boolean;
    player_data : PlayerData | null
}) => {
    let dice_size: string | number = "75px";

    if (loading) {
        return (
            <VStack mt="1rem">
            <Box width="30px" height="30px">
                <img src={dice_roll} width="auto" alt={""} style={{ maxHeight: "30px", maxWidth: "30px" }} />
            </Box>
            <Text className="font-face-sfpb" fontSize={10} textAlign="center" color="grey">
                    Loading
            </Text>
            </VStack>
        );
    }

    let level : number = GetCharacterLevel(player_data);
    let bonus_roll : string = (level / 2).toFixed(0);

    let advantage = roll_two > 0;
    let critical_miss = false;
    if (advantage) {
        if (roll_one === 1 && roll_two === 1 )
            critical_miss = true;

        return (
            <VStack mt="1rem">
                <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                    You Rolled With Advantage:
                </Text>
                <HStack>
                    <img
                        height={dice_size}
                        width={dice_size}
                        src={roll_one > roll_two ? red_dice_array[roll_one - 1] : blue_dice_array[roll_one - 1]}
                        alt={""}
                    />
                    <img
                        height={dice_size}
                        width={dice_size}
                        src={roll_two > roll_one ? red_dice_array[roll_two - 1] : blue_dice_array[roll_two - 1]}
                        alt={""}
                    />
                </HStack>
                {!critical_miss &&
                    <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                        +{bonus_roll} Power Roll
                    </Text>
                }
                {critical_miss &&
                    <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                        Critical Miss!
                    </Text>
                }
            </VStack>
        );
    }

    if (roll_one === 1)
        critical_miss = true;

    // otherwise just return the first dice
    return (
        <VStack mt="1rem">
            <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                You Rolled:
            </Text>
            <img height={dice_size} width={dice_size} src={red_dice_array[roll_one - 1]} alt={""} />
            {!critical_miss &&
                <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                    +{bonus_roll} Power Roll
                </Text>
            }
            {critical_miss &&
                <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                    Critical Miss!
                </Text>
            }
        </VStack>
    );
};

export const DisplayEnemyAppearsText = ({
    current_enemy,
    current_level,
    num_plays,
}: {
    current_enemy: DungeonEnemy;
    current_level: number;
    num_plays: number;
}) => {
    let seed_string = current_enemy.toString() + "_" + current_level.toString() + "_" + num_plays.toString();
    var random = seedrandom(seed_string);
    let enemy_text: string[] = DungeonEnemyAppearsText[current_enemy];
    let idx: number = Math.floor(random() * enemy_text.length);
    let chosen_text: string = enemy_text[idx];

    // otherwise say the enemy type
    return (
        <Text className="font-face-sfpb" mt="1rem" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
            {chosen_text}
        </Text>
    );
};

export const DisplayPlayerFailedText = ({
    current_enemy,
    current_level,
    num_plays,
}: {
    current_enemy: DungeonEnemy;
    current_level: number;
    num_plays: number;
}) => {
    let seed_string = current_enemy.toString() + "_" + current_level.toString() + "_" + num_plays.toString();
    var random = seedrandom(seed_string);

    let enemy_text: string[] = DungeonPlayerDefeatedText[current_enemy];
    let idx: number = Math.floor(random() * enemy_text.length);
    let chosen_text: string = enemy_text[idx];

    return (
        <Center width="90%">
            <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                {chosen_text}
            </Text>
        </Center>
    );
};

const EnemyDefeatedText = ({
    current_enemy,
    current_level,
    num_plays,
}: {
    current_enemy: DungeonEnemy;
    current_level: number;
    num_plays: number;
}) => {
    let seed_string = current_enemy.toString() + "_" + current_level.toString() + "_" + num_plays.toString();
    var random = seedrandom(seed_string);

    let enemy_text: string[] = DungeonEnemyDefeatedText[current_enemy];
    let idx: number = Math.floor(random() * enemy_text.length);
    let chosen_text: string = enemy_text[idx];

    return (
        <Text width="100%" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
            {chosen_text}
        </Text>
    );
};

export const DisplayPlayerSuccessText = ({
    current_level,
    current_enemy,
    last_loot,
    num_plays,
    total_loot,
    loot_bonus,
}: {
    current_level: number;
    current_enemy: DungeonEnemy;
    last_loot: number;
    num_plays: number;
    total_loot: number;
    loot_bonus: boolean;
}) => {
    if (current_level < 7) {
        return (
            <Center className="font-face-sfpb" width="100%">
                <VStack width="100%">
                    <EnemyDefeatedText current_enemy={current_enemy} current_level={current_level} num_plays={num_plays} />

                    <HStack alignContent="center" mt="1rem">
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                            You found {last_loot.toFixed(2)}
                        </Text>

                        <img src={loot} width="auto" alt={""} style={{ maxHeight: DUNGEON_FONT_SIZE, maxWidth: DUNGEON_FONT_SIZE }} />

                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                            {loot_bonus ? "(x2 bonus)" : ""}
                        </Text>
                    </HStack>

                    <HStack alignContent="center" mt="1rem">
                        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                            Escape to claim {total_loot.toFixed(2)}
                        </Text>

                        <img src={loot} width="auto" alt={""} style={{ maxHeight: DUNGEON_FONT_SIZE, maxWidth: DUNGEON_FONT_SIZE }} />

                        <Text mt="1rem" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                            Or explore further to try and find more
                        </Text>
                    </HStack>
                </VStack>
            </Center>
        );
    }

    // otherwise  we retire
    return (
        <div className="font-face-sfpb">
            <EnemyDefeatedText current_enemy={current_enemy} current_level={current_level} num_plays={num_plays} />

            <Center>
                <HStack alignContent="center" mt="1rem">
                    <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                        You found {last_loot.toFixed(2)}
                    </Text>

                    <img src={loot} width="auto" alt={""} style={{ maxHeight: DUNGEON_FONT_SIZE, maxWidth: DUNGEON_FONT_SIZE }} />
                </HStack>
            </Center>

            <Text mt="1rem" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                Looking around you realise your job is done and there is nothing left to kill
            </Text>
            <HStack alignContent="center" mt="1rem">
                <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                    Retire to claim your current loot {total_loot.toFixed(2)}
                </Text>

                <img src={loot} width="auto" alt={""} style={{ maxHeight: DUNGEON_FONT_SIZE, maxWidth: DUNGEON_FONT_SIZE }} />
            </HStack>
        </div>
    );
};

export const DisplayEnemy = ({
    player_state,
    enemy_state,
    current_enemy,
}: {
    player_state: DungeonStatus;
    enemy_state: DungeonStatus;
    current_enemy: DungeonEnemy;
}) => {
    if (enemy_state === DungeonStatus.unknown) {
        return <></>;
    }

    if (enemy_state === DungeonStatus.dead) {
        // for the traps we don't return anything
        if (current_enemy === DungeonEnemy.BoulderTrap) {
            return <></>;
        }
        if (current_enemy === DungeonEnemy.SpikeTrap) {
            return <></>;
        }

        if (current_enemy === DungeonEnemy.Mimic) {
            return <img style={{ imageRendering: "pixelated" }} src={open_chest} width="10000" alt={""} />;
        }

        if (current_enemy === DungeonEnemy.GreenSlime || current_enemy === DungeonEnemy.GiantGreenSlime) {
            return <img style={{ imageRendering: "pixelated" }} src={green_slime_corpse} width="10000" alt={""} />;
        }

        if (current_enemy === DungeonEnemy.BlueSlime || current_enemy === DungeonEnemy.GiantBlueSlime) {
            return <img style={{ imageRendering: "pixelated" }} src={blue_slime_corpse} width="10000" alt={""} />;
        }

        if (current_enemy === DungeonEnemy.Werewolf) {
            return <img style={{ imageRendering: "pixelated" }} src={werewolf_corpse} width="10000" alt={""} />;
        }

        if (current_enemy === DungeonEnemy.Carnivine) {
            return <img style={{ imageRendering: "pixelated" }} src={carnivine_corpse} width="10000" alt={""} />;
        }

        if (current_enemy === DungeonEnemy.Shade) {
            return <img style={{ imageRendering: "pixelated" }} src={shade_corpse} width="10000" alt={""} />;
        }

        if (current_enemy === DungeonEnemy.GiantSpider) {
            return <img style={{ imageRendering: "pixelated" }} src={spider_corpse} width="10000" alt={""} />;
        }

        if (current_enemy === DungeonEnemy.Skeletons) {
            return <img style={{ imageRendering: "pixelated" }} src={bones} width="10000" alt={""} />;
        }

        return <img style={{ imageRendering: "pixelated" }} src={corpse} width="10000" alt={""} />;
    }

    if (player_state === DungeonStatus.dead) {
        if (current_enemy === DungeonEnemy.Mimic) {
            return <img style={{ imageRendering: "pixelated" }} src={mimic} width="10000" alt={""} />;
        }
    }

    if (current_enemy === DungeonEnemy.Assassin) {
        return <img style={{ imageRendering: "pixelated" }} src={assassin} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.BlueSlime) {
        return <img style={{ imageRendering: "pixelated" }} src={blue_slime} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.Carnivine) {
        return <img style={{ imageRendering: "pixelated" }} src={carnivine} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.DM) {
        return <img style={{ imageRendering: "pixelated" }} src={dungeon_master} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.Elves) {
        return <img style={{ imageRendering: "pixelated" }} src={elves} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.GiantBlueSlime) {
        return <img style={{ imageRendering: "pixelated" }} src={giant_blue_slime} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.GiantGreenSlime) {
        return <img style={{ imageRendering: "pixelated" }} src={giant_green_slime} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.GiantRat) {
        return <img style={{ imageRendering: "pixelated" }} src={giant_rat} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.GiantSpider) {
        return <img style={{ imageRendering: "pixelated" }} src={giant_spider} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.Goblins) {
        return <img style={{ imageRendering: "pixelated" }} src={goblins} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.GreenSlime) {
        return <img style={{ imageRendering: "pixelated" }} src={green_slime} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.Mimic) {
        return <img style={{ imageRendering: "pixelated" }} src={closed_chest} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.Orc) {
        return <img style={{ imageRendering: "pixelated" }} src={orc} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.Shade) {
        return <img style={{ imageRendering: "pixelated" }} src={shade} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.SkeletonKnight) {
        return <img style={{ imageRendering: "pixelated" }} src={skeleton_knight} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.Skeletons) {
        return <img style={{ imageRendering: "pixelated" }} src={skeletons} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.SkeletonWizard) {
        return <img style={{ imageRendering: "pixelated" }} src={skeleton_wizard} width="10000" alt={""} />;
    }
    if (current_enemy === DungeonEnemy.Werewolf) {
        return <img style={{ imageRendering: "pixelated" }} src={werewolf} width="10000" alt={""} />;
    }

    // for the traps we don't return anything
    if (current_enemy === DungeonEnemy.BoulderTrap) {
        return <></>;
    }
    if (current_enemy === DungeonEnemy.SpikeTrap) {
        return <></>;
    }

    return <></>;
};

export const DisplayPlayer = ({
    player_state,
    player_character,
    current_enemy,
}: {
    player_state: DungeonStatus;
    player_character: DungeonCharacter;
    current_enemy: DungeonEnemy;
}) => {
    if (player_state === DungeonStatus.unknown) {
        return <></>;
    }

    if (player_state === DungeonStatus.dead) {
        // if the current enemy is a trap we should return that here
        if (current_enemy === DungeonEnemy.BoulderTrap) {
            return <img style={{ imageRendering: "pixelated" }} src={boulder} width="10000" alt={""} />;
        }
        if (current_enemy === DungeonEnemy.SpikeTrap) {
            return <img style={{ imageRendering: "pixelated" }} src={floor_spikes} width="10000" alt={""} />;
        }

        // otherwise return the corpse
        return <img style={{ imageRendering: "pixelated" }} src={corpse} width="10000" alt={""} />;
    }

    // otherwise just return the player
    if (player_character === DungeonCharacter.knight) {
        return <img style={{ imageRendering: "pixelated" }} src={knight} width="10000" alt={""} />;
    }

    if (player_character === DungeonCharacter.ranger) {
        return <img style={{ imageRendering: "pixelated" }} src={ranger} width="10000" alt={""} />;
    }

    if (player_character === DungeonCharacter.wizard) {
        return <img style={{ imageRendering: "pixelated" }} src={wizard} width="10000" alt={""} />;
    }

    return <></>;
};

export const DisplayXP = ({ current_xp }: { current_xp: number }) => {

    let current_level = 1;
    for (let i = 0; i < levels.length; i++) {
        if (current_xp >= levels[i]) {
            current_level = i + 1;
        }
    }
    let next_xp = -1; 
    if (current_level < levels.length) {
        next_xp = levels[current_level];
    }

    let xp_string = next_xp >= 0 ? "XP " + (next_xp - current_xp) + "/" + (next_xp - levels[current_level - 1]) : ""; 

    return (
        <Box width="20%">
            <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                Lvl {current_level} {xp_string}
            </Text>
        </Box>
    );
};

export const DisplayRoom = ({ current_room }: { current_room: number }) => {
    return (
        <Box width="10%">
            <Text className="font-face-sfpb" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">
                Room {current_room > 0 ? current_room : ""}
            </Text>
        </Box>
    );
};
