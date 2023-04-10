
import {
    Box,
    Center,
    Text,
    HStack,
    VStack,
    Divider
} from '@chakra-ui/react';
import { isMobile } from "react-device-detect";

import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';

import { DUNGEON_FONT_SIZE } from './constants';

import dungeon_crawler from "./achievement_nfts/DungeonCrawler.gif"
import dungeon_explorer from "./achievement_nfts/DungeonExplorer.gif"
import dungeon_paragon from "./achievement_nfts/DungeonParagon.gif"
import first_blood from "./achievement_nfts/FirstBlood.gif"
import kill_em_all from "./achievement_nfts/GottaKillEmAll.gif"
import rookie from "./achievement_nfts/Rookie.gif"
import adventurer from "./achievement_nfts/Adventurer.gif"
import bat_out_of_hell from "./achievement_nfts/BatOutOfHell.gif"
import jack_of_all_trades from "./achievement_nfts/JackOfAllTrades.gif"
import could_have_bee_friends from "./achievement_nfts/WeCouldHaveBeenFriends.gif"
import yerr_a_wizard from "./achievement_nfts/YerrAWizardHarry.gif"
import scrounger from "./achievement_nfts/Scrounger.gif"
import scavenger from "./achievement_nfts/Scavenger.gif"
import looter from "./achievement_nfts/Looter.gif"
import unlucky from "./achievement_nfts/Unlucky.gif"
import cursed from "./achievement_nfts/Cursed.gif"
import table_throw from "./achievement_nfts/TableFlip.gif"
import cautious from "./achievement_nfts/Cautious.gif"
import coward from "./achievement_nfts/Coward.gif"
import chicken from "./achievement_nfts/Chicken.gif"
import daily_dungeon_1 from "./achievement_nfts/DailyDungeonI.gif"
import daily_dungeon_2 from "./achievement_nfts/DailyDungeonII.gif"
import daily_dungeon_3 from "./achievement_nfts/DailyDungeonIII.gif"
import once_you_pop from "./achievement_nfts/OnceYouPop.gif"
import spoderman from "./achievement_nfts/Spoderman.gif"
import shall_not_pass from "./achievement_nfts/YouShallNotPass.gif"
import master_of_none from "./achievement_nfts/MasterOfNone.gif"
import master_of_all from "./achievement_nfts/MasterOfAll.gif"
import fertilizer from "./achievement_nfts/Fertilizer.gif"
import dm_slayer from "./achievement_nfts/DMSlayer.gif"

export const enum Achievements {
    DungeonCrawler,
    DungeonExplorer,
    DungeonParagon,
    FirstBlood,
    GottaKillEmAll,
    Rookie,
    Adventurer,
    BatOutOfHell,
    JackOfAllTrades,
    LikeABoss,
    WeCouldHaveBeenFriends,
    YerrAWizardHarry,
    Scrounger,
    Scavenger,
    Unlucky,
    Cursed,
    TableThrow,
    Cautious,
    Coward,
    DailyDungeonI,
    DailyDungeonII,
    DailyDungeonIII,
    OnceYouPop,
    Spoderman,
    YouShallNotPass,
    Looter,
    Chicken,
    MasterOfNone,
    MasterOfAll,
    Fertilizer,
    DMSlayer
    
}

export interface Achievement {
    name: string;
    description: string;
    image: string;
    type: number;
    secret: boolean;
    percent: number;
}

export const AchievementMetaData : Achievement[] = [
    {name: "Dungeon Crawler", description: "Earn 100 XP", image: dungeon_crawler, type: 0, secret: false, percent: 32.6},
    {name: "Dungeon Explorer", description: "Earn 1000 XP", image: dungeon_explorer, type: 0, secret: false, percent: 4.0},
    {name: "Dungeon Paragon", description: "Earn 10000 XP", image: dungeon_paragon, type: 0, secret: false, percent: 0},
    {name: "First Blood", description: "Kill your first enemy", image: first_blood, type: 0, secret: false, percent: 94.3},
    {name: "Gotta Kill 'em All", description: "Kill 10 types of enemy", image: kill_em_all, type: 0, secret: false, percent: 0},
    {name: "Rookie", description: "Kill a tier 1 boss", image: rookie, type: 0, secret: false, percent: 0},
    {name: "Adventurer", description: "Kill a tier 1 boss 10 times", image: adventurer, type: 0, secret: false, percent: 0},
    {name: "Bat Out Of Hell", description: "Kill a tier 2 boss", image: bat_out_of_hell, type: 0, secret: false, percent: 0},
    {name: "Jack Of All Trades", description: "Kill a tier 2 boss with all 3 classes", image: jack_of_all_trades, type: 0, secret: false, percent: 0},
    {name: "Like A Boss", description: "Kill 6 different bosses", image: scrounger, type: 0, secret: false, percent: 0},
    {name: "We Could Have Been Friends", description: "Defeat the Assassin as the Ranger", image: could_have_bee_friends, type: 0, secret: true, percent: 0},
    {name: "Yerr a Wizard, Harry", description: "Defeat the Dungeon Master as the Wizard", image: yerr_a_wizard, type: 0, secret: true, percent: 0},
    {name: "Scrounger", description: "Accumulate 10 SOL of loot", image: scrounger, type: 1, secret: false, percent: 7.4},
    {name: "Scavenger", description: "Accumulate 100 SOL of loot", image: scavenger, type: 1, secret: false, percent: 0.6},
    {name: "Unlucky", description: "Suffer a 3x losing streak", image: unlucky, type: 0, secret: true, percent: 48.0},
    {name: "Cursed", description: "Suffer a 6x losing streak", image: cursed, type: 0, secret: true, percent: 5.7},
    {name: "(╯°□°）╯︵ ┻━┻", description: "Suffer a 10x losing streak", image: table_throw, type: 0, secret: true, percent: 0},
    {name: "Cautious", description: "Escape level 1 10 times", image: cautious, type: 1, secret: false, percent: 0},
    {name: "Coward", description: "Escape level 1 100 times", image: coward, type: 1, secret: false, percent: 0},
    {name: "Daily Dungeon I", description: "Enter the Dungeon on 5 consecutive days", image: daily_dungeon_1, type: 0, secret: false, percent: 0},
    {name: "Daily Dungeon II", description: "Enter the Dungeon on 20 consecutive days", image: daily_dungeon_2, type: 0, secret: false, percent: 0},
    {name: "Daily Dungeon III", description: "Enter the Dungeon on 100 consecutive days", image: daily_dungeon_3, type: 0, secret: false, percent: 0},
    {name: "Once You Pop...", description: "Play 100 rounds in a day", image: once_you_pop, type: 0, secret: true, percent: 0},
    {name: "Spoderman", description: "Be defeated by Spiders 100 times", image: spoderman, type: 0, secret: true, percent: 0},
    {name: "You Shall Not Pass!", description: "Be defeated by a Boss 50 times", image: shall_not_pass, type: 0, secret: true, percent: 0},
    {name: "Looter", description: "Accumulate 1000 SOL of loot", image: looter, type: 0, secret: true, percent: 0},
    {name: "Chicken", description: "Escape Level 1 1000 times", image: chicken, type: 0, secret: true, percent: 0},
    {name: "Master Of None", description: "Kill a tier 2 boss with all 3 classes 10 times", image: master_of_none, type: 0, secret: true, percent: 0},
    {name: "Master Of All", description: "Kill a tier 2 boss with all 3 classes 100 times", image: master_of_all, type: 0, secret: true, percent: 0},
    {name: "Fertilizer", description: "Be defeated by Carnivines 10 times", image: fertilizer, type: 0, secret: true, percent: 0},
    {name: "DM Slayer", description: "Defeat a Dungeon Master", image: dm_slayer, type: 0, secret: true, percent: 0}
]

export const AchievementCard = ({index, AchievementState, show_mint, ClaimAchievement} : {index : number, AchievementState: number[] | null, show_mint: boolean, ClaimAchievement: any}) => {

    let this_state = 1;
    if (AchievementState !== null && AchievementState !== undefined)
        this_state = AchievementState[index];

    let image_size = !isMobile ? "100px" : "50px";
    let divider_size = !isMobile ? "100px" : "70px";
    return (
        <div className="font-face-sfp" style={{color: "white", fontSize: DUNGEON_FONT_SIZE, width:"100%", marginBottom:"1rem"}}>
        <Card style={{ flexDirection: "row", borderWidth:'2px', borderColor: (this_state === 1) ? 'white': 'green', filter:  (this_state === 1 && AchievementMetaData[index].secret) ? "blur(0px)" : "blur(0px)" }} bg="dark">

            
            <Card.Img style={{width: image_size, objectFit: "scale-down", "imageRendering":"pixelated", filter:  (this_state === 1) ? "blur(0px)" : "blur(0px)" }} src={AchievementMetaData[index].image} alt="banner" />
            <Center height={divider_size}>
            <Divider orientation='vertical' />
            </Center>
  
            <Card.Body style={{paddingTop: "0.5rem", paddingBottom: "0.1rem"}} color="white"> 
                   <VStack alignItems={"left"} spacing="0.1rem">
                    <Text marginTop="0" style={{fontWeight:"bold"}}>{AchievementMetaData[index].name}</Text>
                    {show_mint && (this_state === 2 || this_state === 3) ?
                        <HStack>
                            <Text>{AchievementMetaData[index].description}</Text>
                            
                            <Box as='button'  onClick={() => ClaimAchievement(index)}  borderWidth='2px' borderColor="white"   width="60px">
                                <Text  align="center" fontSize={DUNGEON_FONT_SIZE} color="white">Mint</Text>
                            </Box>
                            
                        </HStack>

                    :
                    <Text marginTop="0" marginBottom="0">{AchievementMetaData[index].description}</Text>
                    
                    }
                    <Text color="grey" fontSize="10px">{AchievementMetaData[index].percent}% of players unlocked this</Text>
                </VStack>
            </Card.Body>
            </Card>
        </div>
        
    );
  }

export function AchievementsScreen({AchievementState, ClaimAchievement} : {AchievementState : number[] | null,  ClaimAchievement: any})
{
    return(
    <>
    <Container fluid style={{width:"80%", justifyContent: "center", marginBottom:"10rem"}}>
        <Col>
            <AchievementCard index={Achievements.DungeonCrawler} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.DungeonExplorer} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.DungeonParagon} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.FirstBlood} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.GottaKillEmAll} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Rookie} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Adventurer} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.BatOutOfHell} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.DMSlayer} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.JackOfAllTrades} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.MasterOfNone} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.MasterOfAll} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.WeCouldHaveBeenFriends} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.YerrAWizardHarry} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Scrounger} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Scavenger} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Looter} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Unlucky} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Cursed} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.TableThrow} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Cautious} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Coward} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Chicken} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.DailyDungeonI} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.DailyDungeonII} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.DailyDungeonIII} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.OnceYouPop} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Spoderman} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.YouShallNotPass} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Fertilizer} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
        </Col>
    </Container>

    </>
    );
}