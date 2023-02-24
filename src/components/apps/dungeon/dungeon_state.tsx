import {
    Box,
    Center,
    Text,
} from '@chakra-ui/react';


//  dungeon constants
import {DUNGEON_FONT_SIZE} from './constants';

//enemies
import closed_chest from "./images/chest_closed.png"
import open_chest from "./images/chest_open.png"
import mimic from "./images/Mimic.gif"
import slime from "./images/Slime.gif"
import goblins from "./images/Goblins.gif"
import skeletons_hallway from "./images/Skellies.gif"
import skeletons_graveyard from "./images/Skellies.gif"
import elves from "./images/Elves.gif"
import orc from "./images/Orc.gif"
import skeleton_knight from "./images/Skelly_Knight.gif"
import skeleton_wizard from "./images/Skelly_Wiz.gif"
import reaper from "./images/Reaper.gif"
import boulder from "./images/Boulder.png"
import floor_spikes from "./images/Spikes.png"
import bones from "./images/Bones.png"
import slime_corpse from "./images/slime_corpse.png"

//characters
import knight from "./images/Knight.gif"
import ranger from "./images/Ranger.gif"
import wizard from "./images/Wizard.gif"
import corpse from "./images/Corpse.png"

var seedrandom = require('seedrandom');

export const enum DungeonCharacter {
    knight = 0,
    ranger = 1,
    wizard = 2
}

export const enum DungeonEnemy {
    
    Chest = 0,
    Slime = 1,
    Goblins = 2,
    SkeletonsHallway = 3,
    SkeletonsGraveyard = 4,
    Elves = 5,
    Orc = 6,
    SkellyKnight = 7,
    SkellyWizard = 8,
    Reaper = 9,
    Boulder = 10,
    FloorSpikes = 11,
    None = 12
}

export const enum DungeonStatus {
    unknown = 0,
    alive = 1,
    dead = 2,
    exploring = 3
}

const DungeonEnemyAppearsText : string[][] = [
    // mimic
    ["You have found a treasure chest!",
    "You have found an old rusted treasure chest",
    "You have found an elaborately gilded coffer"],
    // slime 
    ["You have encountered an oozing green slime, prepare yourself!", 
    "A Green Slime squeezes out of a crack in the wall, prepare yourself!", 
    "A Green Slime drops from the ceiling, prepare yourself!"],
    // goblins 
    ["You have encountered a pair of goblins, prepare yourself!"],
    // skeletons_hallway 
    ["You have encountered a horde of skeletons, prepare yourself!",
    "You hear the rattling of bones ahead, prepare yourself!"], 
    // skeletons_graveyard
    ["You have encountered a horde of skeletons, prepare yourself!",
    "You hear the rattling of bones ahead, prepare yourself!"], 
    // elves
    ["You have encountered a group of elven archers, prepare yourself!", 
    "A patrolling group of elven archers turns the corner, prepare yourself!"], 
    // orc
    ["You have encountered a huge orc, prepare yourself!",
    "The ground shakes as a gigantic orc charges towards you, prepare yourself!"], 
    // skeleton_knight
    ["You have encountered a skeleton knight, prepare yourself!",
    "An armour-clad skeleton appears, prepare yourself!"], 
    // skeleton_wizard
    ["You have encountered a skeleton wizard, prepare yourself!",
    "A skeleton wizard suddenly appears before you, prepare yourself!"], 
    // reaper
    ["You have encountered the Grim Reaper, prepare yourself!",
    "The shadows around you start shifting and take on the form of the Grim Reaper, prepare yourself!"], 
    // boulder
    ["You enter a suspiciously empty room...", 
    "The hallway is dark but it seems empty..."], 
    // spikes
    ["You enter a suspiciously empty room...", 
    "The hallway is dark but it seems empty..."]
];

const DungeonEnemyDefeatedText : string[][] = [
    // mimic
    ["You approach with great suspicion, but open it to find it full of gold!",
    "You open the chest with care, and find it contains some useful supplies"],
    // slime 
    ["You have defeated the oozing green slime",
    "A mere slime is no match for you!"],
    // goblins 
    ["You have defeated the pair of goblins",
    "The goblins were intoxicated from mushroom brew. They barely put up a fight."],
    // skeletons_hallway 
    ["You have defeated the horde of skeletons",
    "You take out the skeletons one by one, leaving nothing but scattered bones across the floor"], 
    // skeletons_graveyard
    ["You have defeated the horde of skeletons",
    "You take out the skeletons one by one, leaving nothing but scattered bones across the floor"], 
    // elves
    ["You have defeated the group of elven archers",
    "You attack before the elves have even noticed you, striking them down faster than they can draw their bows"], 
    // orc
    ["You have defeated the orc",
    "The orcs size means it is too slow to hit you, or defend against your strikes"], 
    // skeleton_knight
    ["You have defeated the skeleton knight",
    "Noticing a crack in the knights armour you strike, and the knights protection disintegrates along with the skeleton itself"], 
    // skeleton_wizard
    ["You have defeated the skeleton wizard",
    "Your attacks disrupt the skeleton's incantation, causing it to backfire!"], 
    // reaper
    ["You have defeated the the Grim Reaper",
    "The Reaper chose the wrong soul to go after and you return it to the shadows"], 
    // boulder
    ["...but pass through without incident",
    "Just in time you notice a pressure plate hidden amongst the stones on the ground, and carefully step over it to continue onwards"], 
    // spikes
    ["...but pass through without incident",
    "Just in time you notice a pressure plate hidden amongst the stones on the ground, and carefully step over it to continue onwards"], 

];

const DungeonPlayerDefeatedText : string[][] = [
    // mimic
    ["The mimic's transformation stuns you for just a moment, but that is all it needed",
    "As you approach the chest you notice it starts to change shape, but before you can draw your weapon the mimic lunges and swallows you whole"], 
    // slime
    ["The slime oozes past your defenses and envelopes you, suffocating you where you stand",
    "Your weapons melt into a pool at your feet as you try to attack, and soon you join them"], 
    // goblins
    ["The goblins are too fast, you lose sight of them for just a second and the next thing you see is a knife to your throat"], 
    // skeletons_hallway
    ["The skeletons manage to surround you, and strike from all sides",
    "There were just.. too many skeletons"], 
    // skeletons_graveyard
    ["The skeletons manage to surround you, and strike from all sides",
    "There were just.. too many skeletons"], 
    // elves
    ["You take an arrow to the knee, and while stumbling are unable to dodge the next volley to the heart",
    "A volley of arrows turns you into a human pin-cushion"], 
    // orc
    ["With one swing from it's axe the orc cracks your head open like an egg",
    "The orc slams into you knocking you to the ground, and then crushes your head like a bug beneath its feet"], 
    // skeleton knight
    ["Your attacks are simply deflected off the knight's armour until it gets bored and strikes you down",
    "You are no match for the knight, only pieces are left after it is done with you"], 
    // skeleton wizard
    ["Hoarsely croaking some ancient incantation the wizard turns you inside out before you even have a chance to attack",
    "You collapse as your life energy is siphoned away by the skeletal mage"], 
    // reaper
    ["The Reaper's scythe passes through you as though you were no more than air as it claims another soul",
    "Your weapons do nothing to the Reaper, and it calmly reaches out a boney finger to claim your soul"], 
    // boulder
    ["A boulder suddenly falls from the ceiling, crushing you instantly.",
    "The door behind you slams shut and a boulder starts rolling towards you.  With nowhere to run you all you can do is watch with horror as it approaches"], 
    // spikes
    ["A trapdoor opens beneath your feet, dropping you onto a mass of bloodied spikes.",
    "Spikes suddenly burst from holes in the ground beneath your feet and impale you before you can react"]];

export const DisplayEnemyAppearsText = ({current_enemy, current_level, num_plays} : {current_enemy : DungeonEnemy, current_level : number, num_plays : number}) => {

    let seed_string = current_enemy.toString() + "_" + current_level.toString() + "_" + num_plays.toString();
    var random = seedrandom(seed_string);
    let enemy_text : string[] = DungeonEnemyAppearsText[current_enemy];
    let idx : number = Math.floor(random() * enemy_text.length);
    let chosen_text : string = enemy_text[idx];

    // otherwise say the enemy type
    return(
       <div className="font-face-sfpb">
           <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">{chosen_text}</Text>
       </div>
    );
}

export const DisplayPlayerFailedText = ({current_enemy, current_level, num_plays} : {current_enemy : DungeonEnemy, current_level : number, num_plays : number}) => {

    let seed_string = current_enemy.toString() + "_" + current_level.toString() + "_" + num_plays.toString();
    var random = seedrandom(seed_string);

    let enemy_text : string[] = DungeonPlayerDefeatedText[current_enemy];
    let idx : number = Math.floor(random() * enemy_text.length);
    let chosen_text : string = enemy_text[idx];

    return(
        <Center>
            <Box width="80%">
                <div className="font-face-sfpb">
                    <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">{chosen_text}</Text>
                </div>
            </Box>
        </Center>
    );
}

const EnemyDefeatedText = ({current_enemy, current_level, num_plays} : {current_enemy : DungeonEnemy, current_level : number, num_plays : number}) => {

    let seed_string = current_enemy.toString() + "_" + current_level.toString() + "_" + num_plays.toString();
    var random = seedrandom(seed_string);

    let enemy_text : string[] = DungeonEnemyDefeatedText[current_enemy];
    let idx : number = Math.floor(random() * enemy_text.length);
    let chosen_text : string = enemy_text[idx];

    return(
        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">{chosen_text}</Text>  
    );
    

}

export const DisplayPlayerSuccessText = ({current_level, current_enemy, bet_size, num_plays} : {current_level : number, current_enemy : DungeonEnemy, bet_size : number, num_plays : number}) => {

    if (current_level <  7) {
        return(
        <div className="font-face-sfpb">
            <EnemyDefeatedText current_enemy={current_enemy} current_level={current_level} num_plays={num_plays}/>
            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Escape to claim your current loot of {Math.pow(2,current_level) *  bet_size} SOL</Text>
            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Explore further to try and double your loot to {Math.pow(2,current_level+1) *  bet_size} SOL</Text>
       </div>
       );
    }

    // otherwise  we retire
    return(
        <div className="font-face-sfpb">
            <EnemyDefeatedText current_enemy={current_enemy} current_level={current_level} num_plays={num_plays}/>
            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Looking around you realise your job is done and there is nothing left to kill</Text>
            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Retire to claim your current loot of {Math.pow(2,current_level) *  bet_size} SOL</Text>
            
       </div>
       );

}

export const DisplayEnemy = ({player_state, enemy_state, current_enemy} : {player_state : DungeonStatus, enemy_state : DungeonStatus, current_enemy : DungeonEnemy}) => {

    if (enemy_state === DungeonStatus.unknown) {
        return(<></>);
    }

    if (enemy_state === DungeonStatus.dead)  {

        // for the traps we don't return anything
        if (current_enemy === DungeonEnemy.Boulder) {
            return(<></>);
        }
        if (current_enemy === DungeonEnemy.FloorSpikes) {
            return(<></>);
        }

        if (current_enemy === DungeonEnemy.Chest) {
            return ( <img style={{"imageRendering":"pixelated"}} src={open_chest} width="10000" alt={""}/> );
        }

        if (current_enemy === DungeonEnemy.Slime) {
            return ( <img style={{"imageRendering":"pixelated"}} src={slime_corpse} width="10000" alt={""}/> );
        }

        if (current_enemy === DungeonEnemy.SkeletonsHallway || current_enemy === DungeonEnemy.SkeletonsGraveyard) {
            return ( <img style={{"imageRendering":"pixelated"}} src={bones} width="10000" alt={""}/> );
        }

        return ( <img style={{"imageRendering":"pixelated"}} src={corpse} width="10000" alt={""}/> );
    }

    if (player_state === DungeonStatus.dead) {
        if (current_enemy === DungeonEnemy.Chest) {
            return ( <img style={{"imageRendering":"pixelated"}} src={mimic} width="10000" alt={""}/> );
        }
    }

    

    if (current_enemy === DungeonEnemy.Chest) {
        return ( <img style={{"imageRendering":"pixelated"}} src={closed_chest} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.Slime) {
        return ( <img style={{"imageRendering":"pixelated"}} src={slime} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.Goblins) {
        return ( <img style={{"imageRendering":"pixelated"}} src={goblins} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.SkeletonsHallway) {
        return ( <img style={{"imageRendering":"pixelated"}} src={skeletons_hallway} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.SkeletonsGraveyard) {
        return ( <img style={{"imageRendering":"pixelated"}} src={skeletons_graveyard} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.Elves) {
        return ( <img style={{"imageRendering":"pixelated"}} src={elves} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.Orc) {
        return ( <img style={{"imageRendering":"pixelated"}} src={orc} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.SkellyKnight) {
        return ( <img style={{"imageRendering":"pixelated"}} src={skeleton_knight} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.SkellyWizard) {
        return ( <img style={{"imageRendering":"pixelated"}} src={skeleton_wizard} width="10000" alt={""}/> );
    }
    if (current_enemy === DungeonEnemy.Reaper) {
        return ( <img style={{"imageRendering":"pixelated"}} src={reaper} width="10000" alt={""}/> );
    }

    // for the traps we don't return anything
    if (current_enemy === DungeonEnemy.Boulder) {
        return(<></>);
    }
    if (current_enemy === DungeonEnemy.FloorSpikes) {
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
        if (current_enemy === DungeonEnemy.Boulder) {
            return ( <img style={{"imageRendering":"pixelated"}} src={boulder} width="10000" alt={""}/> );
        }
        if (current_enemy === DungeonEnemy.FloorSpikes) {
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
                        
                        <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Lvl. {current_level}</Text>
                        
                </div>
            </Box>
    );
}