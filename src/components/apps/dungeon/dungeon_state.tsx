import {
    Box,
    Center,
    Text,
    HStack
} from '@chakra-ui/react';

//  dungeon constants
import {DUNGEON_FONT_SIZE} from './constants';

//enemies
import assassin from "./images/Assassin.gif"
import blue_slime from "./images/Blue_Slime.gif"
import boulder from "./images/Boulder.png"
import carnivine from "./images/Carnivine.gif"
import dungeon_master from "./images/Dungeon_Master.gif"
import elves from "./images/Elves.gif"
import giant_blue_slime from "./images/Giant_Blue_Slime.gif"
import giant_green_slime from "./images/Giant_Green_Slime.gif"
import giant_rat from "./images/Giant_Rat.gif"
import giant_spider from "./images/Giant_Spider.gif"
import goblins from "./images/Goblins.gif"
import green_slime from "./images/Green_Slime.gif"
import mimic from "./images/Mimic.gif"
import orc from "./images/Orc.gif"
import shade from "./images/Shade.gif"
import skeleton_knight from "./images/Skelly_Knight.gif"
import skeletons from "./images/Skellies.gif"
import skeleton_wizard from "./images/Skelly_Wiz.gif"
import floor_spikes from "./images/Spikes.png"
import werewolf from "./images/Werewolf.gif"

import closed_chest from "./images/chest_closed.png"
import open_chest from "./images/chest_open.png"
import bones from "./images/Bones.png"
import green_slime_corpse from "./images/slime_corpse.png"
import blue_slime_corpse from "./images/Blue_Slime_Corpse.png"
import spider_corpse from "./images/Spider_Corpse.png"
import carnivine_corpse from "./images/Vine_Corpse.png"
import werewolf_corpse from "./images/Wolf_Corpse.png"
import shade_corpse from "./images/Shade_Corpse.png"

//characters
import knight from "./images/Knight.gif"
import ranger from "./images/Ranger.gif"
import wizard from "./images/Wizard.gif"
import corpse from "./images/Corpse.png"

import loot from "./images/loot.png"

import Roll18 from "./images/Roll18.gif"

import './css/dungeon_state.css'
export const WIN_FACTORS : number[] = [1.0, 1.5, 2.25, 3.375, 6.75, 13.5, 27, 54];


var seedrandom = require('seedrandom');

export const enum DungeonCharacter {
    knight = 0,
    ranger = 1,
    wizard = 2
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
    None
}



export const DungeonCharacterEmoji : string[] = [
    "<a:Knight:1070460855575126116>",
    "<a:Ranger:1070471404425842688>",
    "<a:Wizard:1070471413829472287>"
]





export const GoldEmoji : string = "<a:Gold:1086961346492510298>";

export const DungeonEnemyEmoji : string[] = [

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
]

export const enum DungeonStatus {
    unknown = 0,
    alive = 1,
    dead = 2,
    exploring = 3
}

const DungeonEnemyAppearsText : string[][] = [
    // assasin
    ["You have encountered an Assassin, prepare yourself!", 
    "A smoke bomb goes off at the end of the corridor and an assassin flits into view.  Prepare yourself!"],
    // blue slime
    ["You have encountered an blue slime, prepare yourself!", 
    "A Blue Slime squeezes out of a crack in the wall, prepare yourself!", 
    "A Blue Slime drops from the ceiling, prepare yourself!"],
    // boulder
    ["You enter a suspiciously empty room...", 
    "The hallway is dark but it seems empty..."],
    // carnivine
    ["You have encountered a Carnivine, prepare yourself!",
    "The smell of flowers makes you relax, but only until you see the source is a Carnivine.  Prepare yourself!",
    "Thick vines cover the walls.  You've entered the lair of a Carnivine!  Prepare yourself!"],
    //dungeon master
    ["You have encountered a Dungeon Master, prepare yourself!", 
    "The air begins to crackle around you as a Dungeon Master prepares to attack, get ready!"],
    // elves
    ["You have encountered a group of elven archers, prepare yourself!", 
    "A patrolling group of elven archers turns the corner, prepare yourself!"], 
    // giant blue slime
    ["You have encountered a giant blue slime, prepare yourself!",
    "Multiple blue slimes coalesce before you into a single giant slime! Prepare yourself!"],
    // giant green slime
    ["You have encountered a giant green slime, prepare yourself!",
    "Multiple green slimes coalesce before you into a single giant slime! Prepare yourself!"],
    // giant rat
    ["You have encountered a giant rat, prepare yourself!",
    "You notice the terrible stench in the room just as a giant rat bursts from the sewer grate ahead of you.  Prepare yourself!"],
    // giant spider
    ["You have encountered a giant spider, prepare yourself!",
    "A mass of sticky web bars your way.  As you start to cut through a giant spider drops from the ceiling, prepare yourself!"],
    // goblins 
    ["You have encountered a pair of goblins, prepare yourself!"],
    // green slime 
    ["You have encountered an oozing green slime, prepare yourself!", 
    "A Green Slime squeezes out of a crack in the wall, prepare yourself!", 
    "A Green Slime drops from the ceiling, prepare yourself!"],
    // mimic
    ["You have found a treasure chest!",
    "You have found an old rusted treasure chest",
    "You have found an elaborately gilded coffer"],
    // orc
    ["You have encountered a huge orc, prepare yourself!",
    "The ground shakes as a gigantic orc charges towards you, prepare yourself!"], 
    // shade
    ["You have encountered a Shade, prepare yourself!",
    "The shadows around you start shifting and take on the form of a Shade, prepare yourself!"], 
    // skeleton_knight
    ["You have encountered a skeleton knight, prepare yourself!",
    "An armour-clad skeleton appears, prepare yourself!"], 
    // skeletons
    ["You have encountered a horde of skeletons, prepare yourself!",
    "You hear the rattling of bones ahead, prepare yourself!"], 
    // skeleton_wizard
    ["You have encountered a skeleton wizard, prepare yourself!",
    "A skeleton wizard suddenly appears before you, prepare yourself!"], 
    // spikes
    ["You enter a suspiciously empty room...", 
    "The hallway is dark but it seems empty..."],
    // werewolf
    ["You have encountered a werewolf, prepare yourself!",
    "You have encountered a strange half naked man... who transforms before you into a werewolf! Prepare yourself!"]
];

const DungeonEnemyDefeatedText : string[][] = [
    // assassin
    ["You have defeated the assassin",
    "You see through the assassins tricks and are waiting to strike when it next appears in front of you",
    "The assassin was quick, but you were quicker"],
    // blue slime
    ["You have defeated the oozing blue slime",
    "A mere slime is no match for you!"],
    // boulder
    ["...but pass through without incident",
    "Just in time you notice a pressure plate hidden amongst the stones on the ground, and carefully step over it to continue onwards"],
    // carnivine
    ["You have defeated the carnivine",
    "You turn the Carnivine into compost",
    "You hack through thorns and leaves until the Carnivine is reduced to mulch"],
    // dungeon master
    ["You have defeated the dungeon master",
    "The dungeon master starts monologuing in typical villainic style.  Its overconfidence is its weakness and mid speech you strike it down",
    "Lighting arcs towards you but just misses the mark.  You rush in while the dungeon master recharges and cut their head off before they can attack again"],
    // elves
    ["You have defeated the group of elven archers",
    "You attack before the elves have even noticed you, striking them down faster than they can draw their bows"], 
    // giant blue slime
    ["You have defeated the giant blue slime",
    "Your attack causes the slime to rupture, spilling blue ooze all over the floor"],
    // giant green slime
    ["You have defeated the giant green slime",
    "Your attack causes the slime to rupture, spilling green ooze all over the floor"],
    // giant rat
    ["You have defeated the giant rat",
    "Living underground has left the rat half blind, and you easily circle around and strike it down"],
    // giant spider
    ["You have defeated the giant spider",
    "Running in, you slide beneath the spider and attack its soft underbelly with all your might"],
    // goblins 
    ["You have defeated the pair of goblins",
    "The goblins were intoxicated from mushroom brew. They barely put up a fight."],
    // green slime 
    ["You have defeated the oozing green slime",
    "A mere slime is no match for you!"],
    // mimic
    ["You approach with great suspicion, but open it to find it full of gold!",
    "You open the chest with care, and find it contains some useful supplies"],
    // orc
    ["You have defeated the orc",
    "The orcs size means it is too slow to hit you, or defend against your strikes"],  
    // shade
    ["You have defeated the Shade",
    "The Shade chose the wrong soul to go after and you return it to the shadows"], 
    // skeleton_knight
    ["You have defeated the skeleton knight",
    "Noticing a crack in the knights armour you strike, and the knights protection disintegrates along with the skeleton itself"], 
    // skeletons
    ["You have defeated the horde of skeletons",
    "You take out the skeletons one by one, leaving nothing but scattered bones across the floor"], 
    // skeleton_wizard
    ["You have defeated the skeleton wizard",
    "Your attacks disrupt the skeleton's incantation, causing it to backfire!"], 
    // spikes
    ["...but pass through without incident",
    "Just in time you notice a pressure plate hidden amongst the stones on the ground, and carefully step over it to continue onwards"], 
    // werewolf
    ["You have defeated the werewolf",
    "Before the transformation is complete you strike, cutting the head clean off",
    "The werewolf attacks with bestial rage, but it is no match for you"]
];

const DungeonPlayerDefeatedText : string[][] = [
    // assassin
    ["The assassin has defeated you.",
    "Surrounded by fog you can't keep track of the assassins movements. You only learn of its location when you feel its blade in your back"],
    // blue slime
    ["The slime oozes past your defenses and envelopes you, suffocating you where you stand",
    "Your weapons melt into a pool at your feet as you try to attack, and soon you join them"],
    // boulder
    ["A boulder suddenly falls from the ceiling, crushing you instantly.",
    "The door behind you slams shut and a boulder starts rolling towards you.  With nowhere to run you all you can do is watch with horror as it approaches"], 
    // carvinvine
    ["The carvnivine has defeated you.",
    "Vines wrap around your legs and arms pulling you beneath the soft earth", 
    "With every vine you cut down another replaces it.  Exhausted, you succumb to the Carnivines relentless attacks."],
    // dungeon master
    ["The dungeon master has defeated you.",
    "Lightning arcs from the dungeon master and instantly incinerates you as it makes contact",
    "Through ancient magics the dungeon master takes control of your body and forces you to end your own life"],
    // elves
    ["You take an arrow to the knee, and while stumbling are unable to dodge the next volley to the heart",
    "A volley of arrows turns you into a human pin-cushion"], 
    // giant blue slime
    ["The giant blue slime has defeated you.",
    "Your attacks are absorbed by the giant slimes mass.  There is nothing you can do as it slowly envelops you.",
    "You can see the remains of other adventurers floating inside the giant slime, and realize with horror you will soon be joining them."],
    // giant greenf slime
    ["The giant green slime has defeated you.",
    "Your attacks are absorbed by the giant slimes mass.  There is nothing you can do as it slowly envelops you.",
    "You can see the remains of other adventurers floating inside the giant slime, and realize with horror you will soon be joining them."],
    // giant rat
    ["The giant rat has defeated you.",
    "As the rat approaches the smell of decay causes you to gag, and in that moment it strikes.",
    "The rat trips you with its tail, and grabbing your ankles in its jaw it drags you into the sewers below"],
    // giant spider
    ["The giant spider has defeated you.",
    "You get trapped in a mass of spider webs giving the spider ample time to wrap you up for a snack",
    "With surprising speed the spider springs from its web and bites you.  The venom acts quickly and you fall to the ground paralyzed"],
    // goblins
    ["The goblins are too fast, you lose sight of them for just a second and the next thing you see is a knife to your throat"], 
    // green slime
    ["The slime oozes past your defenses and envelopes you, suffocating you where you stand",
    "Your weapons melt into a pool at your feet as you try to attack, and soon you join them"], 
    // mimic
    ["The mimic's transformation stuns you for just a moment, but that is all it needed",
    "As you approach the chest you notice it starts to change shape, but before you can draw your weapon the mimic lunges and swallows you whole"], 
    // orc
    ["With one swing from it's axe the orc cracks your head open like an egg",
    "The orc slams into you knocking you to the ground, and then crushes your head like a bug beneath its feet"], 
    // shade
    ["The Shade's scythe passes through you as though you were no more than air as it claims another soul",
    "Your weapons do nothing to the Shade, and it calmly reaches out a shadowy hand to claim your soul"], 
    // skeleton knight
    ["Your attacks are simply deflected off the knight's armour until it gets bored and strikes you down",
    "You are no match for the knight, only pieces are left after it is done with you"], 
    // skeletons
    ["The skeletons manage to surround you, and strike from all sides",
    "There were just.. too many skeletons"], 
    // skeleton wizard
    ["Hoarsely croaking some ancient incantation the wizard turns you inside out before you even have a chance to attack",
    "You collapse as your life energy is siphoned away by the skeletal mage"], 
    // spikes
    ["A trapdoor opens beneath your feet, dropping you onto a mass of bloodied spikes.",
    "Spikes suddenly burst from holes in the ground beneath your feet and impale you before you can react"],
    // werewolf
    ["The werewolf has defeated you.",
    "The werewolf leaps on you faster than you can react and tears you to shreds"]    
];

export const DisplayEnemyAppearsText = ({current_enemy, current_level, num_plays} : {current_enemy : DungeonEnemy, current_level : number, num_plays : number}) => {

    let seed_string = current_enemy.toString() + "_" + current_level.toString() + "_" + num_plays.toString();
    var random = seedrandom(seed_string);
    let enemy_text : string[] = DungeonEnemyAppearsText[current_enemy];
    let idx : number = Math.floor(random() * enemy_text.length);
    let chosen_text : string = enemy_text[idx];

    // otherwise say the enemy type
    return(
       <div className="font-face-sfpb">
           <Text mt="1rem" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">{chosen_text}</Text>
       </div>
    );
}

export const DisplayPlayerFailedText = ({current_enemy, current_level, num_plays} : {current_enemy : DungeonEnemy, current_level : number, num_plays : number}) => {
 
    let seed_string = current_enemy.toString() + "_" + current_level.toString() + "_" + num_plays.toString();
    var random = seedrandom(seed_string);


    let enemy_text : string[] = DungeonPlayerDefeatedText[current_enemy];
    let idx : number = Math.floor(random() * enemy_text.length);
    let chosen_text : string = enemy_text[idx];

    return (
      <>
        <Center>
          <Box width="80%">
            <div className="font-face-sfpb">
              <Text
                mt="1rem"
                fontSize={DUNGEON_FONT_SIZE}
                textAlign="center"
                color="white"
              >
                {chosen_text}
              </Text>
            </div>
          </Box>
        </Center>
        <div className="Roll-container">
          <img src={Roll18} alt="Roll 18" />
        </div>
      </>
    );
}

const EnemyDefeatedText = ({current_enemy, current_level, num_plays} : {current_enemy : DungeonEnemy, current_level : number, num_plays : number}) => {

    let seed_string = current_enemy.toString() + "_" + current_level.toString() + "_" + num_plays.toString();
    var random = seedrandom(seed_string);

    let enemy_text : string[] = DungeonEnemyDefeatedText[current_enemy];
    let idx : number = Math.floor(random() * enemy_text.length);
    let chosen_text : string = enemy_text[idx];

    return(
        <Text mt="1rem" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">{chosen_text}</Text>  
    );
    

}

export const DisplayPlayerSuccessText = ({current_level, current_enemy, bet_size, num_plays, last_gold} : {current_level : number, current_enemy : DungeonEnemy, bet_size : number, num_plays : number, last_gold : number}) => {

    let current_win = WIN_FACTORS[current_level] *  bet_size;

    

    if (current_level <  7) {
        let next_win = WIN_FACTORS[current_level + 1] *  bet_size;
        return(
        <div className="font-face-sfpb">
            <EnemyDefeatedText current_enemy={current_enemy} current_level={current_level} num_plays={num_plays}/>

            <div className="Roll-container">
                <img src={Roll18} alt="Roll 18" />
            </div>

            <Center>
            <HStack alignContent="center" mt="1rem">
                <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">You found {last_gold.toFixed(2)}</Text>
            
                <img
                    src={loot}
                    width="auto"
                    alt={""}
                    style={{ maxHeight: DUNGEON_FONT_SIZE, maxWidth: DUNGEON_FONT_SIZE }}
                />
            </HStack>
            </Center>                   


            <Text mt="1rem" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Escape to claim your current loot of {current_win.toFixed(3)} SOL</Text>
            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Explore further to try and increase your loot to {next_win.toFixed(3)} SOL</Text>
       </div>
       );
    }


    // otherwise  we retire
    return(
        <div className="font-face-sfpb">
            <EnemyDefeatedText current_enemy={current_enemy} current_level={current_level} num_plays={num_plays}/>

            <div className="Roll-container">
                <img src={Roll18} alt="Roll 18" />
            </div>
            
            <Center>
            <HStack alignContent="center" mt="1rem">
                <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">You found {last_gold.toFixed(2)}</Text>
            
                <img
                    src={loot}
                    width="auto"
                    alt={""}
                    style={{ maxHeight: DUNGEON_FONT_SIZE, maxWidth: DUNGEON_FONT_SIZE }}
                />
            </HStack>
            </Center>    


            <Text mt="1rem" fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Looking around you realise your job is done and there is nothing left to kill</Text>
            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Retire to claim your current loot of {current_win.toFixed(3)} SOL</Text>
            
       </div>
       );

}

export const DisplayEnemy = ({player_state, enemy_state, current_enemy} : {player_state : DungeonStatus, enemy_state : DungeonStatus, current_enemy : DungeonEnemy}) => {

    if (enemy_state === DungeonStatus.unknown) {
        return(<></>);
    }

    if (enemy_state === DungeonStatus.dead)  {

        // for the traps we don't return anything
        if (current_enemy === DungeonEnemy.BoulderTrap) {
            return(<></>);
        }
        if (current_enemy === DungeonEnemy.SpikeTrap) {
            return(<></>);
        }

        if (current_enemy === DungeonEnemy.Mimic) {
            return ( <img style={{"imageRendering":"pixelated"}} src={open_chest} width="10000" alt={""}/> );
        }

        if (current_enemy === DungeonEnemy.GreenSlime || current_enemy === DungeonEnemy.GiantGreenSlime) {
            return ( <img style={{"imageRendering":"pixelated"}} src={green_slime_corpse} width="10000" alt={""}/> );
        }

        if (current_enemy === DungeonEnemy.BlueSlime || current_enemy === DungeonEnemy.GiantBlueSlime) {
            return ( <img style={{"imageRendering":"pixelated"}} src={blue_slime_corpse} width="10000" alt={""}/> );
        }

        if (current_enemy === DungeonEnemy.Werewolf) {
            return ( <img style={{"imageRendering":"pixelated"}} src={werewolf_corpse} width="10000" alt={""}/> );
        }

        if (current_enemy === DungeonEnemy.Carnivine) {
            return ( <img style={{"imageRendering":"pixelated"}} src={carnivine_corpse} width="10000" alt={""}/> );
        }

        if (current_enemy === DungeonEnemy.Shade) {
            return ( <img style={{"imageRendering":"pixelated"}} src={shade_corpse} width="10000" alt={""}/> );
        }

        if (current_enemy === DungeonEnemy.GiantSpider) {
            return ( <img style={{"imageRendering":"pixelated"}} src={spider_corpse} width="10000" alt={""}/> );
        }

        if (current_enemy === DungeonEnemy.Skeletons) {
            return ( <img style={{"imageRendering":"pixelated"}} src={bones} width="10000" alt={""}/> );
        }

        return ( <img style={{"imageRendering":"pixelated"}} src={corpse} width="10000" alt={""}/> );
    }

    if (player_state === DungeonStatus.dead) {
        if (current_enemy === DungeonEnemy.Mimic) {
            return ( <img style={{"imageRendering":"pixelated"}} src={mimic} width="10000" alt={""}/> );
        }
    }

    
    if (current_enemy === DungeonEnemy.Assassin) {
        return ( <img style={{"imageRendering":"pixelated"}} src={assassin} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.BlueSlime) {
        return ( <img style={{"imageRendering":"pixelated"}} src={blue_slime} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.Carnivine) {
        return ( <img style={{"imageRendering":"pixelated"}} src={carnivine} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.DM) {
        return ( <img style={{"imageRendering":"pixelated"}} src={dungeon_master} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.Elves) {
        return ( <img style={{"imageRendering":"pixelated"}} src={elves} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.GiantBlueSlime) {
        return ( <img style={{"imageRendering":"pixelated"}} src={giant_blue_slime} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.GiantGreenSlime) {
        return ( <img style={{"imageRendering":"pixelated"}} src={giant_green_slime} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.GiantRat) {
        return ( <img style={{"imageRendering":"pixelated"}} src={giant_rat} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.GiantSpider) {
        return ( <img style={{"imageRendering":"pixelated"}} src={giant_spider} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.Goblins) {
        return ( <img style={{"imageRendering":"pixelated"}} src={goblins} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.GreenSlime) {
        return ( <img style={{"imageRendering":"pixelated"}} src={green_slime} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.Mimic) {
        return ( <img style={{"imageRendering":"pixelated"}} src={closed_chest} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.Orc) {
        return ( <img style={{"imageRendering":"pixelated"}} src={orc} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.Shade) {
        return ( <img style={{"imageRendering":"pixelated"}} src={shade} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.SkeletonKnight) {
        return ( <img style={{"imageRendering":"pixelated"}} src={skeleton_knight} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.Skeletons) {
        return ( <img style={{"imageRendering":"pixelated"}} src={skeletons} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.SkeletonWizard) {
        return ( <img style={{"imageRendering":"pixelated"}} src={skeleton_wizard} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.Werewolf) {
        return ( <img style={{"imageRendering":"pixelated"}} src={werewolf} width="10000" alt={""}/> );
    }

    // for the traps we don't return anything
    if (current_enemy === DungeonEnemy.BoulderTrap) {
        return(<></>);
    }
    if (current_enemy === DungeonEnemy.SpikeTrap) {
        return(<></>);
    }

    return(<></>);
}

export const DisplayPlayer = ({player_state, player_character, current_enemy} : {player_state : DungeonStatus, player_character : DungeonCharacter, current_enemy : DungeonEnemy}) => {

    if (player_state === DungeonStatus.unknown) {
        return(<></>);
    }

    if (player_state === DungeonStatus.dead)  {
        // if the current enemy is a trap we should return that here
        if (current_enemy === DungeonEnemy.BoulderTrap) {
            return ( <img style={{"imageRendering":"pixelated"}} src={boulder} width="10000" alt={""}/> );
        }
        if (current_enemy === DungeonEnemy.SpikeTrap) {
            return ( <img style={{"imageRendering":"pixelated"}} src={floor_spikes} width="10000" alt={""}/> );
        }

        // otherwise return the corpse
        return ( <img style={{"imageRendering":"pixelated"}} src={corpse} width="10000" alt={""}/> );
    }
    
    // otherwise just return the player
    if (player_character === DungeonCharacter.knight){
        return ( <img style={{"imageRendering":"pixelated"}} src={knight} width="10000" alt={""}/> );
    }

    if (player_character === DungeonCharacter.ranger){
        return ( <img style={{"imageRendering":"pixelated"}} src={ranger} width="10000" alt={""}/> );
    }

    if (player_character === DungeonCharacter.wizard){
        return ( <img style={{"imageRendering":"pixelated"}} src={wizard} width="10000" alt={""}/> );
    }

    return(
        <></>
    );
}


export const DisplayXP = ({current_xp} : {current_xp : number}) =>  {

        
    return(
            <Box width="10%">
                <div className="font-face-sfpb">
                        
                        <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">XP {current_xp}</Text>
                        
                </div>
            </Box>
    );
}


export const DisplayLVL = ({current_level} : {current_level : number}) =>  {

    
    return(
            <Box width="10%">
                <div className="font-face-sfpb">
                        
                        <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Lvl. {current_level > 0 ? current_level : ""}</Text>
                        
                </div>
            </Box>
    );
}
