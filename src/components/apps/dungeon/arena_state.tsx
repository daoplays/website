
import {
    Box,
    Text,
} from '@chakra-ui/react';


//  dungeon constants
import {DUNGEON_FONT_SIZE} from './constants';

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

var seedrandom = require('seedrandom');


export const enum PlayerCharacter {
    Knight = 0,
    Ranger,
    Wizard,
    Assassin,
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
    Werewolf
}


export const player_emoji_map = new Map([
    // enemies
    [PlayerCharacter.Assassin, assassin_emoji],
    [PlayerCharacter.BlueSlime, blue_slime_emoji],
    [PlayerCharacter.BoulderTrap, boulder_emoji],
    [PlayerCharacter.Carnivine, carnivine_emoji],
    [PlayerCharacter.DM, dungeon_master_emoji],
    [PlayerCharacter.Elves, elves_emoji],
    [PlayerCharacter.GiantBlueSlime, giant_blue_slime_emoji],
    [PlayerCharacter.GiantGreenSlime, giant_green_slime_emoji],
    [PlayerCharacter.GiantRat, giant_rat_emoji],
    [PlayerCharacter.GiantSpider, giant_spider_emoji],
    [PlayerCharacter.Goblins, goblins_emoji],
    [PlayerCharacter.GreenSlime, green_slime_emoji],
    [PlayerCharacter.Mimic, mimic_emoji],
    [PlayerCharacter.Orc, orc_emoji],
    [PlayerCharacter.Shade, shade_emoji],
    [PlayerCharacter.SkeletonKnight, skeleton_knight_emoji],
    [PlayerCharacter.Skeletons, skeletons_emoji],
    [PlayerCharacter.SkeletonWizard, skeleton_wizard_emoji],
    [PlayerCharacter.SpikeTrap, floor_spikes_emoji],
    [PlayerCharacter.Werewolf, werewolf_emoji],

    // characters
    [PlayerCharacter.Knight, knight_emoji],
    [PlayerCharacter.Ranger, ranger_emoji],
    [PlayerCharacter.Wizard, wizard_emoji]
  ]);


const ArenaWelcomeText : string[] = [
    "It's looking like another scorching day here in Limaren, but our first combatant doesn't seem to be bothered by the heat. They are ", 
    "Given who our first combatant is this promises to be another action packed fight here in the Limaren arena. It's none other than "
   
];

const PlayerIntro : string[][] = [

    //knight
    ["a Knight from the great Kingdom of Zaleth, and they look like they're eager to get started!"],
    //ranger
    ["a Ranger from the forests of Lamore, a people that are renowned for their skills with the bow, so i'm excited to see what they have to offer today!"],
    //wizard
    ["a powerful Wizard from the hallowed halls of Versinct University, looking to put their combat magic to the test."],

    // assassin
    [],
    //blue slime
    [],
    // boulder
    [],
    //carnivine
    [],
    //dm
    [],
    //elves
    [],
    //giant blue slime
    [],
    // giant green slime
    [],
    //rat
    [],
    //spider
    [],
    //goblins
    [],
    //green slime
    [],
    //mimic
    [],
    //orc
    [],
    //shade
    [],
    // skeleton knight
    [],
    // skeletons
    [],
    //skeleton wizard
    [],
    //spikes
    [],
    //werewolf
    []
]

const PlayerStartText : string[][] = [

    //knight
    ["The Knight raises their shield and charges in", "The Knight lets out a fearsome battle-cry as they seek to break the will of their opponent before the fight even starts", "The Knight immediately lunges with their sword"],
    //ranger
    ["The Ranger darts from side to side while closing the gap", "The Ranger immediately pulls up their bow and takes aim", "The Ranger dashes forwards with dagger in hand"],
    //wizard
    ["Energy crackles around the Wizard as they raise a magical barrier in front of them and march forwards", "Lightning fills the arena as the Wizard makes their first move", "The Wizard raises their hand and a blast of fire streaks towards their opponent"]
]


const PlayerResponseText : string[][] = [

    //knight
    [" but they are too slow in their heavy armour", " but it seems to have no effect", " but they are too slow in their heavy armour"],
    //ranger
    [" but there is a pattern in their movement", " but their shot goes wide", " but they fail to land a hit"],
    //wizard
    [" but the spell suddenly fails", " but the lightning strike misses its mark", " but flies meters past their head"]

]


const PlayerWinText : string[][] = [

    //knight
    [" and their opponent knocks them off balance with their shield before landing a killing blow with their sword.", " and their opponent lets out a bellowing war-cry before rushing in for the kill.", " and their opponent cleaves off their head with one swing of their blade"],
    //ranger
    [" and their opponent dodges out of the way, before ending the fight with a volley of arrows.", " and their opponent's arrow strikes with deadly precision.", " and their opponent weaves past their defenses to slash their throat."],
    //wizard
    [" and their opponent just chuckles quietly while raising an impenetrable magical barrier that gives them plenty of time to cast the finishing spell.", " and their opponent calls on the elements to bring down a deadly storm.", " and their opponent rains fire from the heavens to burn them to a crisp."]

]


const PlayerDrawText : string[][] = [

    //knight
    [" but their opponent drives their shield into the ground and braces for the attack.", " but their opponent bellows in response and stops them in their tracks.", " but their opponent leaps in with a quick strike to interrupt them."],
    //ranger
    [" but their opponent is too quick and dodges out of the way.", " but their opponent fires off a quick shot to interrupt their attack.", " but their opponent quickly throws their dagger and stops their attack"],
    //wizard
    [" but their opponent creates an impenetrable shield to protect themselves from harm.", " but their opponent raises a great storm in the arena that knocks them down before they can finish.", " but their opponent traps them in a ring of fire, forcing them to stop their attack to escape."]

]


export const GameOverText = ({character_one, character_two, move_one, move_two, player_one_wins} : {character_one : PlayerCharacter, character_two : PlayerCharacter, move_one : number, move_two : number, player_one_wins : boolean}) => {

    if (move_one === 0 || move_two === 0)
    {
        return(<></>);
    }
    if (player_one_wins) {
        let text = PlayerStartText[character_two][move_two - 1] + PlayerResponseText[character_two][move_two - 1] + PlayerWinText[character_one][move_two - 1];

        return(
            <Box width="80%">
            <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white">{text}</Text> 
            </Box>
        );
    }

    let text = PlayerStartText[character_one][move_one - 1] + PlayerResponseText[character_one][move_one - 1] + PlayerWinText[character_two][move_two - 1];
    return(
        <Box width="80%">
            <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white">{text}</Text> 
        </Box> 
    );
    

}

export const DrawText = ({character_one, character_two, move} : {character_one : PlayerCharacter, character_two : PlayerCharacter, move : number}) => {

    //console.log("draw text", character_one, character_two, move)
   let draw_text = PlayerStartText[character_one][move - 1] + " " + PlayerDrawText[character_two][move - 1] + "  It looks like this fight is going to go on for another round!";
    return(
        <Box width="80%">
            <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white">{draw_text}</Text> 
        </Box> 
    );
    

}


export const WaitingForPlayerText = ({player_character, game_id} : {player_character : PlayerCharacter, game_id : number}) => {

    let seed_string = player_character.toString() + "_" + game_id.toString();
    var random = seedrandom(seed_string);

    let starting_text = ArenaWelcomeText[Math.floor(random() * ArenaWelcomeText.length)]

    let options : string[] = PlayerIntro[player_character];
    //console.log(starting_text, player_character, options);
    let idx : number = Math.floor(random() * options.length);
    let chosen_text : string = options[idx];

    starting_text += " " + chosen_text;

    return(
        <Box width="80%">
            <Text className="font-face-sfpb" align="center" fontSize={DUNGEON_FONT_SIZE} color="white">{starting_text}</Text> 
        </Box> 
    );
    

}