
import {
    Box,
    Center,
    Text,
    HStack,
    VStack,
    Divider
} from '@chakra-ui/react';

import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';

import { DUNGEON_FONT_SIZE } from './constants';

import first_blood from "./achievement_nfts/DungeonExplorer.gif"

export const enum Achievements {
    DungeonCrawler,
    DungeonExplorer,
    DungeonParagon,
    FirstBlood,
    GottaKillEmAll,
    Rookie,
    Adventurer,
    JobDone,
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
    YouShallNotPass
    
}

export const AchievementNames : string[] = [
    "Dungeon Crawler",
    "Dungeon Explorer",
    "Dungeon Paragon",
    "First Blood",
    "Gotta Kill 'em All",
    "Rookie",
    "Adventurer",
    "Job Done",
    "Jack Of All Trades",
    "Like A Boss",
    "We Could Have Been Friends",
    "Yerr a Wizard, Harry",
    "Scrounger",
    "Scavenger",
    "Unlucky",
    "Cursed",
    "(╯°□°）╯︵ ┻━┻",
    "Cautious",
    "Coward",
    "Daily Dungeon I",
    "Daily Dungeon II",
    "Daily Dungeon III",
    "Once You Pop...",
    "Spoderman",
    "You Shall Not Pass!"
]

export const AchievementDescriptions : string[] = [
    "Earn 100 XP",
    "Earn 1000 XP",
    "Earn 10000 XP",
    "Kill your first enemy",
    "Kill 10 types of enemy",
    "Kill a tier 1 boss",
    "Kill a tier 1 boss 10 times",
    "Kill a tier 2 boss",
    "Kill a tier 2 boss with all 3 classes",
    "Kill 6 different bosses",
    "Defeat the Assassin as the Ranger",
    "Defeat the Dungeon Master as the Wizard",
    "Accumulate 10 SOL of loot",
    "Accumulate 100 SOL of loot",
    "Suffer a 3x losing streak",
    "Suffer a 6x losing streak",
    "Suffer a 10x losing streak",
    "Escape level 1 10 times",
    "Escape level 1 100 times",
    "Enter the Dungeon on 5 consecutive days",
    "Enter the Dungeon on 20 consecutive days",
    "Enter the Dungeon on 100 consecutive days",
    "Play 100 rounds in a day",
    "Be defeated by Spiders 100 times",
    "Be defeated by a Boss 50 times"
]

export const AchievementImages : string[] = [
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood,
    first_blood
]

// there are two types of achievement, play (0) and quit (1)
export const AchievementTypes : number[] = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    0,
    0,
    0,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
]

  export const AchievementCard = ({index, AchievementState, show_mint, ClaimAchievement} : {index : number, AchievementState: number[] | null, show_mint: boolean, ClaimAchievement: any}) => {

    if (AchievementState === null || AchievementState === undefined)
        return (<></>);

    return (
        <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE, width:"100%", marginBottom:"1rem"}}>
        <Card style={{ flexDirection: "row", borderWidth:'2px', borderColor:'white', filter:  (AchievementState !== null && AchievementState[index] === 1) ? "blur(7px)" : "blur(0px)" }} bg="dark">

            
            <Card.Img style={{width: "100px",objectFit: "scale-down", "imageRendering":"pixelated"}} src={AchievementImages[index]} alt="banner" />
            <Center height='100px'>
            <Divider orientation='vertical' />
            </Center>
  
            <Card.Body color="white"> 
                   <VStack alignItems={"left"}>
                    <Text style={{fontWeight:"bold"}}>{AchievementNames[index]}</Text>
                    {show_mint && (AchievementState[index] === 2 || AchievementState[index] === 3) &&
                        <HStack>
                            <Text>{AchievementDescriptions[index]}</Text>
                            
                            <Box as='button'  onClick={() => ClaimAchievement(index)}  borderWidth='2px' borderColor="white"   width="60px">
                                <Text  align="center" fontSize={DUNGEON_FONT_SIZE} color="white">Mint</Text>
                            </Box>
                            
                        </HStack>
                    
                    }
                    {(!show_mint || AchievementState[index] === 4) &&
                        <Text>{AchievementDescriptions[index]}</Text>
                    }
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
            <AchievementCard index={Achievements.JobDone} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.JackOfAllTrades} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.LikeABoss} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.WeCouldHaveBeenFriends} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.YerrAWizardHarry} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Scrounger} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Scavenger} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Unlucky} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Cursed} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.TableThrow} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Cautious} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Coward} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.DailyDungeonI} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.DailyDungeonII} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.DailyDungeonIII} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.OnceYouPop} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Spoderman} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.YouShallNotPass} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
        </Col>
    </Container>

    </>
    );
}