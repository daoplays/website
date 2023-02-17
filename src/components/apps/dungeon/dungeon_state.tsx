import {
    Box,
    Center,
    Text,
} from '@chakra-ui/react';

//  dungeon constants
import {DUNGEON_FONT_SIZE, BET_SIZE} from './constants';

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

//characters
import knight from "./images/Knight.gif"
import ranger from "./images/Ranger.gif"
import wizard from "./images/Wizard.gif"
import corpse from "./images/Corpse.png"


const enum DungeonCharacter {
    knight = 0,
    ranger = 1,
    wizard = 2
}

const enum DungeonEnemy {
    
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

const enum DungeonStatus {
    unknown = 0,
    alive = 1,
    dead = 2,
    exploring = 3
}

const DungeonEnemyName = ["Mimic", "Slime", "Goblins", "Skeletons", "Skeletons", "Elves", "Orc", "Skeleton Knight", "Skeleton Wizard", "Reaper", "Boulder", "Floor Spikes"];

const DungeonEnemyInitialText = ["mimic", "an oozing green slime", "a pair of goblins", "a horde of skeletons", "a horde of skeletons", "a group of elven archers", "a huge orc", "a skeleton knight", "a skeleton wizard", "the Grim Reaper", "Boulder", "Floor Spikes"];

const DungeonEnemyDefeatText = ["The mimic's transformation stuns you for just a moment, but that is all it needed", "The slime oozes past your defenses and envelopes you, suffocating you where you stand", "The goblins are too fast, you lose sight of them for just a second and the next thing you see is a knife to your throat", "The skeletons manage to surround you, and strike from all sides", "There were just.. too many skeletons", "You take an arrow to the knee, and while stumbling are unable to dodge the next volley to the heart", "With one swing from it's axe the orc cracks your head open like an egg", "Your attacks are simply deflected off the knight's armour until it gets bored and strikes you down", "Hoarsely croaking some ancient incantation the wizard turns you inside out before you even have a chance to attack", "The Reaper's scythe passes through you as though you were no more than air as it claims another soul", "Boulder", "Floor Spikes"];

export const DisplayEnemyAppearsText = ({current_enemy, current_level} : {current_enemy : DungeonEnemy, current_level : number}) => {

         
    // for the traps we report an empty room
    if (current_enemy === DungeonEnemy.Boulder || current_enemy === DungeonEnemy.FloorSpikes) {
        return(
        <div className="font-face-sfpb">
           <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">You enter a suspiciously empty room...</Text>
       </div>
       );
    };

    if (current_enemy === DungeonEnemy.Chest) {
       return(
       <div className="font-face-sfpb">
          <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">You have found a treasure chest in room {current_level}!</Text>
      </div>
      );
   };
    

    // otherwise say the enemy type
    return(
       <div className="font-face-sfpb">
           <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">You have encountered {DungeonEnemyInitialText[current_enemy]} in room {current_level}</Text>
           <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Prepare yourself!</Text>
       </div>
    );
}

export const DisplayPlayerFailedText = ({current_enemy} : {current_enemy : DungeonEnemy}) => {

         
    // for the traps we have special text for failure
    if (current_enemy === DungeonEnemy.Boulder) {
        return(
            <Center>
            <Box width="80%">
            <div className="font-face-sfpb">
                <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">A boulder suddenly falls from the ceiling, crushing you instantly.</Text>
            </div>
            </Box>
            </Center>
        );
    }

    if (current_enemy === DungeonEnemy.FloorSpikes) {
        return(
            <Center>
            <Box width="80%">
            <div className="font-face-sfpb">
                <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">A trapdoor opens beneath your feet, dropping you onto a mass of bloodied spikes.</Text>
            </div>
            </Box>
            </Center>
        );
    }
    

    // otherwise say the enemy type
    return(
        <Center>
            <Box width="80%">
                <div className="font-face-sfpb">
                    <Text  fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">{DungeonEnemyDefeatText[current_enemy]}</Text>
                </div>
            </Box>
        </Center>
    );
}

const EnemyDefeatedText = ({current_enemy} : {current_enemy : DungeonEnemy}) => {

    // for the traps we have special text for survival
    if (current_enemy === DungeonEnemy.Boulder || current_enemy === DungeonEnemy.FloorSpikes) {
        return(
            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">...but pass through without incident.</Text>
         );
    };

    if (current_enemy === DungeonEnemy.Chest) {
        return(
            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">You approach with great suspicion, but open it to find it full of gold!</Text>
         );
    };

    // otherwise say the enemy type
    return(
        <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">You have defeated the {DungeonEnemyName[current_enemy]}</Text>  
    );
    

}

export const DisplayPlayerSuccessText = ({current_level, current_enemy} : {current_level : number, current_enemy : DungeonEnemy}) => {

    if (current_level <  7) {
        return(
        <div className="font-face-sfpb">
            <EnemyDefeatedText current_enemy={current_enemy}/>
            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Escape to claim your current loot of {Math.pow(2,current_level) *  BET_SIZE} SOL</Text>
            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Explore further to try and double your loot to {Math.pow(2,current_level+1) *  BET_SIZE} SOL</Text>
       </div>
       );
    }

    // otherwise  we retire
    return(
        <div className="font-face-sfpb">
            <EnemyDefeatedText current_enemy={current_enemy}/>
            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Looking around you realise your job is done and there is nothing left to kill</Text>
            <Text fontSize={DUNGEON_FONT_SIZE} textAlign="center" color="white">Retire to claim your current loot of {Math.pow(2,current_level) *  BET_SIZE} SOL</Text>
            
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
    
}