import React, { useCallback, useEffect, useState } from 'react';

import PlotlyChart from 'react-plotlyjs-ts';
import {
   Box,
   Center,
    HStack,
    Text,
    VStack
    
} from '@chakra-ui/react';
import Table from 'react-bootstrap/Table';
//import { isMobile } from "react-device-detect";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Container from 'react-bootstrap/Container';
import { useMediaQuery } from 'react-responsive'
//import {
 //   useWallet
//} from '@solana/wallet-adapter-react';

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE, EMOJI_SIZE } from './constants';
import {AchievementData, bignum_to_num} from './utils';
import {DungeonEnemy, DungeonCharacter} from './dungeon_state';

import './css/table.css';
import './css/fonts.css';
import './css/tabs.css';


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
import "../dungeon/css/style.css"


function HorizontalBar({title, x1, x2} : {title: string, x1 : number[], x2 : number[]})
{
    const isMobile = useMediaQuery({ query: '(max-width: 500px)' })
    const isTab = useMediaQuery({ query: '(max-width: 900px)' })
    var trace1 = {
        x: x1,
        //y: ['giraffes'],
        orientation: 'h',
        marker: {
          color: 'rgb(167,251,93,255)',
          width: 1
        },
        type: 'bar',
        text: x1[0].toFixed(3),
        textposition: 'auto',
        name: 'Win',
        hoverinfo: "Win"
      };
      
      var trace2 = {
        x: x2,
        //y: ['giraffes'],
        orientation: 'h',
        type: 'bar',
        marker: {
          color: 'rgb(126,165,248,255)',
          width: 1
        },
        text: x2[0].toFixed(3),
        textposition: 'auto',
        name: 'Lose'
      };
      
      var data = [trace1, trace2];
      
      var layout = {
        height: 300,
        width:  isMobile ? 340: isTab ? 500 : 500,
        title: title,
        barmode: 'stack',
        showlegend: false,
        plot_bgcolor:"black",
        paper_bgcolor:"black",
        margin : {
            t: 40
        },
        font: {
            family: 'SFPixelate',
            size: 18,
            color: 'white'
          },
          yaxis: {
            showticklabels : false,
            showline: false
        },
        xaxis: {
            showticklabels : false
        },
      };
      

    return(

          <PlotlyChart
            data={data}
            layout={layout}
        />
    );
}

function PieChart({values, labels, title} : {values : number[], labels : string[], title : string})
{
    const isMobile = useMediaQuery({ query: '(max-width: 500px)' })
    const isTab = useMediaQuery({ query: '(max-width: 900px)' })
    if (values.length === 0)
        return(<></>);

    var data = [{
        values: values,
        labels: labels,
        marker: {
            colors: [
              'rgba(124, 124, 124, 255)',
              'rgb(167,251,93,255)',
              'rgb(126,165,248,255)'
            ]
          },
        type: 'pie'
    }];

    var layout = {
        height: 400,
        width: isMobile ? 300: isTab ? 500 : 500,
        title: title,
        plot_bgcolor:"black",
        paper_bgcolor:"black",
        font: {
            family: 'SFPixelate',
            size: 18,
            color: 'white'
          }
        
    };
    return(
        <PlotlyChart
        data={data}
        layout={layout}
      />
    );
}


function wins(AchievementData : AchievementData, enemy : DungeonEnemy) : number
{
    return AchievementData.enemies_win[enemy] + AchievementData.enemies_win[32 + enemy] + AchievementData.enemies_win[64 + enemy];
}

function losses(AchievementData : AchievementData, enemy : DungeonEnemy) : number
{
    return AchievementData.enemies_lose[enemy] + AchievementData.enemies_lose[32 + enemy] + AchievementData.enemies_lose[64 + enemy];
}

function WinLoss({AchievementData, enemy} : {AchievementData : AchievementData, enemy : DungeonEnemy})
{
    let w : number = wins(AchievementData , enemy);
    let l : number = losses(AchievementData, enemy);


    return(
            <>
            <Text m="0" p="0" align="center">
            <span style={{"color":"green"}}>{w}</span>
            <span style={{"color":"white"}}> / </span>
            <span style={{"color":"red"}}>{l}</span>
            </Text>
            </>
    );
}

function TotalWinLoss({AchievementData} : {AchievementData : AchievementData})
{
    let w : number = 0;
    let l : number = 0;

    for (let i = 0; i < 32 * 3; i++) {
        w += AchievementData.enemies_win[i];
        l += AchievementData.enemies_lose[i];
    }



    return(
            <>
            <Text align="center" fontSize={DEFAULT_FONT_SIZE} m="0" p="0">
            <span style={{"color":"green"}}>{w}</span>
            <span style={{"color":"white"}}> / </span>
            <span style={{"color":"red"}}>{l}</span>
            </Text>
            </>
    );
}

function CharacterWinLoss({AchievementData, player_character} : {AchievementData : AchievementData, player_character : DungeonCharacter})
{
    let w : number = 0;
    let l : number = 0;

    for (let i = 0 + player_character * 32; i < 32 + player_character * 32; i+=1) {
        w += AchievementData.enemies_win[i];
        l += AchievementData.enemies_lose[i];
    }



    return(
            <>
            <Text align="center" fontSize={DUNGEON_FONT_SIZE} m="0" p="0">
            <span style={{"color":"green"}}>{w}</span>
            <span style={{"color":"white"}}> / </span>
            <span style={{"color":"red"}}>{l}</span>
            </Text>
            </>
    );
}

function Clears(AchievementData : AchievementData) : number
{
    return AchievementData.levels_won[6] + AchievementData.levels_won[13] + AchievementData.levels_won[20];
}


function PlayerStats({AchievementData} : {AchievementData : AchievementData | null})
{

    if (AchievementData === null)
        return(<></>);

    //console.log(AchievementData);
    //<Text fontSize={DUNGEON_FONT_SIZE}>Name: MasterMason</Text>
    //<Text fontSize={DUNGEON_FONT_SIZE}>Level: 2</Text>

    //<Text fontSize={DUNGEON_FONT_SIZE}>Total XP: 700</Text>
    return(
        <Center>
        <Box width = "80%">
        <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>


            <HStack width="100%" spacing="10%" mb = "2rem">

                <VStack align="center">
                    <Text align="center" fontSize={DEFAULT_FONT_SIZE}>{AchievementData.play_streak}</Text>
                    <Text align="center" fontSize={DUNGEON_FONT_SIZE}>Daily<br/>Dungeon<br/>Streak </Text>
                </VStack>

                <VStack align="center" >
                    <Text align="center" fontSize={DEFAULT_FONT_SIZE}>{AchievementData.games_played_today}</Text>
                    <Text align="center" fontSize={DUNGEON_FONT_SIZE}>Levels<br/>Explored<br/>Today </Text>
                </VStack>

                <VStack align="center" >
                    <Text align="center" fontSize={DEFAULT_FONT_SIZE}>{AchievementData.games_played}</Text>
                    <Text align="center" fontSize={DUNGEON_FONT_SIZE}>Total<br/>Levels<br/>Explored </Text>
                </VStack>

                <VStack align="center">
                    <Text align="center" fontSize={DEFAULT_FONT_SIZE}>{(bignum_to_num(AchievementData.total_lamports_claimed)/1e9).toFixed(3)}</Text>
                    <Text align="center" fontSize={DUNGEON_FONT_SIZE}>Total<br/>SOL<br/>Looted </Text>
                </VStack>

                <VStack align="center">
                    <Text align="center" fontSize={DEFAULT_FONT_SIZE}>{Clears(AchievementData)}</Text>
                    <Text align="center" fontSize={DUNGEON_FONT_SIZE}>Total<br/>Dungeon<br/>Clears </Text>
                </VStack>

                <VStack align="center">
                    <TotalWinLoss AchievementData={AchievementData}/>
                    <Text align="center" fontSize={DUNGEON_FONT_SIZE}>Total Levels<br/>Survived/Killed </Text>
                </VStack>

            </HStack>

            <Text fontSize={DUNGEON_FONT_SIZE}>Levels Survived/Killed</Text>
                <Table className="custom-table">
                    <thead>
                    <tr>
                        <th><Center><img src={knight_emoji} width="auto" alt={""} style={{marginLeft: "8px", maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                        <th><Center><img src={ranger_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                        <th><Center><img src={wizard_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                        
                    </tr>
                    </thead>
                    <tbody style={{
                        backgroundColor: 'black'
                    }}>
                    
                        <tr>
                            <td ><CharacterWinLoss AchievementData = {AchievementData} player_character = {DungeonCharacter.knight}/></td>
                            <td ><CharacterWinLoss AchievementData = {AchievementData} player_character = {DungeonCharacter.ranger}/></td>
                            <td ><CharacterWinLoss AchievementData = {AchievementData} player_character = {DungeonCharacter.wizard}/></td>
                            
                        </tr>
                    </tbody>
                </Table>
 


            <VStack mt="2rem" width="100%" align="left" spacing="2rem">


                <Text fontSize={DUNGEON_FONT_SIZE}>Minions</Text>
                <Table className="custom-table">
                    <thead>
                    <tr>
                        <th><Center><img src={boulder_emoji} width="auto" alt={""} style={{marginLeft: "8px", maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                        <th><Center><img src={giant_rat_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                        <th><Center><img src={giant_spider_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                        <th><Center><img src={goblins_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                        <th><Center><img src={green_slime_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                        <th><Center><img src={mimic_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                        <th><Center><img src={floor_spikes_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                    </tr>
                    </thead>
                    <tbody style={{
                        backgroundColor: 'black'
                    }}>
                    
                        <tr>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.BoulderTrap}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.GiantRat}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.GiantSpider}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.Goblins}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.GreenSlime}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.Mimic}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.SpikeTrap}/></td>
                            
                            
                            
                        </tr>
                    </tbody>
                </Table>


                <Table className="custom-table">
                    <thead>
                    <tr>
                    <th><Center><img src={blue_slime_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                    <th><Center><img src={elves_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                    <th><Center><img src={giant_blue_slime_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                    <th><Center><img src={orc_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                    <th><Center><img src={skeletons_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                    <th><Center><img src={skeleton_knight_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                    <th><Center><img src={skeleton_wizard_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                    </tr>
                    </thead>
                    <tbody style={{
                        backgroundColor: 'black'
                    }}>
                    
                        <tr>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.BlueSlime}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.Elves}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.GiantBlueSlime}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.Orc}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.Skeletons}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.SkeletonKnight}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.SkeletonWizard}/></td>
                            
                        </tr>
                    </tbody>
                </Table>

                <Text fontSize={DUNGEON_FONT_SIZE}>Bosses</Text>


                <Table className="custom-table">
                    <thead>
                    <tr>
                        <th><Center><img src={carnivine_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                        <th><Center><img src={giant_green_slime_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                        <th><Center><img src={werewolf_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                        <th><Center><img src={assassin_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                        <th><Center><img src={dungeon_master_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                        <th><Center><img src={shade_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></Center></th>
                    </tr>
                    </thead>
                    <tbody style={{
                        backgroundColor: 'black'
                    }}>
                    
                        <tr>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.Carnivine}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.GiantGreenSlime}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.Werewolf}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.Assassin}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.DM}/></td>
                            <td ><WinLoss AchievementData = {AchievementData} enemy = {DungeonEnemy.Shade}/></td>

                            
                        </tr>
                    </tbody>
                </Table>

            </VStack>

        </div>
        </Box>
        </Center>
    );
}

function GameStats({plays, wins} : {plays : number[], wins : number[]})
{

    if (plays.length === 0)
        return(<></>);

    let tier_1_plays = plays[0] + plays[1] + plays[2];
    let tier_1_wins = wins[0] + wins[1] + wins[2];

    let tier_2_plays = plays[3] + plays[4] + plays[5] + plays[6];
    let tier_2_wins = wins[3] + wins[4] + wins[5] + wins[6];


    return(
        <Center marginBottom="5rem">
        <Box width = "80%">
        <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>

            <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Per Level Play Statistics</h2><br />


            <Table className="custom-table">
                <thead>
                <tr>
                    <th>Level</th>
                    <th>1</th>
                    <th>2</th>
                    <th>3</th>
                    <th>4</th>
                    <th>5</th>
                    <th>6</th>
                    <th>7</th>
                </tr>
                </thead>
                <tbody style={{
                    backgroundColor: 'black'
                }}>
                
                    <tr>
                        <td>Plays</td>
                        <td >{plays[0]}</td>
                        <td >{plays[1]}</td>
                        <td >{plays[2]}</td>
                        <td >{plays[3]}</td>
                        <td >{plays[4]}</td>
                        <td >{plays[5]}</td>
                        <td >{plays[6]}</td>
                        
                        
                    </tr>
                    <tr>
                        <td >Wins</td>
                        <td >{wins[0]}</td>
                        <td >{wins[1]}</td>
                        <td >{wins[2]}</td>
                        <td >{wins[3]}</td>
                        <td >{wins[4]}</td>
                        <td >{wins[5]}</td>
                        <td >{wins[6]}</td>
                    </tr>
                    <tr>
                        <td >%</td>
                        <td >{(wins[0] / plays[0]).toFixed(3)}</td>
                        <td >{(wins[1] / plays[1]).toFixed(3)}</td>
                        <td >{(wins[2] / plays[2]).toFixed(3)}</td>
                        <td >{(wins[3] / plays[3]).toFixed(3)}</td>
                        <td >{(wins[4] / plays[4]).toFixed(3)}</td>
                        <td >{(wins[5] / plays[5]).toFixed(3)}</td>
                        <td >{(wins[6] / plays[6]).toFixed(3)}</td>
                    </tr>
                    <tr>
                        <td >Expected %</td>
                        <td >0.666</td>
                        <td >0.666</td>
                        <td >0.666</td>
                        <td >0.5</td>
                        <td >0.5</td>
                        <td >0.5</td>
                        <td >0.5</td>
                    </tr>
                </tbody>
            </Table>

            <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Per Tier Play Statistics</h2><br />


            <Table className="custom-table">
                <thead>
                <tr>
                    <th>Tier</th>
                    <th>1</th>
                    <th>2</th>
                </tr>
                </thead>
                <tbody style={{
                    backgroundColor: 'black'
                }}>
                
                    <tr>
                        <td>Plays</td>
                        <td >{tier_1_plays}</td>
                        <td >{tier_2_plays}</td>                        
                    </tr>
                    <tr>
                        <td >Wins</td>
                        <td >{tier_1_wins}</td>
                        <td >{tier_2_wins}</td>
                    </tr>
                    <tr>
                        <td >%</td>
                        <td >{(tier_1_wins / tier_1_plays).toFixed(3)}</td>
                        <td >{(tier_2_wins / tier_2_plays).toFixed(3)}</td>
                    </tr>
                    <tr>
                        <td >Expected %</td>
                        <td >0.666</td>
                        <td >0.5</td>
                    </tr>
                </tbody>
            </Table>
        </div>
        </Box>
        </Center>
    );
}

export function StatsScreen({AchievementData} : {AchievementData : AchievementData | null})
{

    const [activeTab, setActiveTab] = useState<any>("home");
    const [dates, setDates] = useState<string[]>([]);
    const [volume_data, setVolumeData] = useState<number[]>([]);
    const [user_data, setUserData] = useState<number[]>([]);

    const [character_data, setCharacterData] = useState<number[]>([]);
    const [betsize_data, setBetSizeData] = useState<number[]>([]);
    const [total_plays, setTotalPlays] = useState<number>(0);
    const [total_volume, setTotalVolume] = useState<number>(0);
    const [total_users, setTotalUsers] = useState<number>(0);
    const [plays_data, setPlaysData] = useState<number[]>([]);
    const [wins_data, setWinsData] = useState<number[]>([]);

    const [tier_1_wins, setTier1Wins] = useState<number>(0);
    const [tier_2_wins, setTier2Wins] = useState<number>(0);
    const [tier_1_losses, setTier1Losses] = useState<number>(0);
    const [tier_2_losses, setTier2Losses] = useState<number>(0);


    //const wallet = useWallet();

    const FetchData = useCallback( async () => 
    {
        
        let daily_data = await (await fetch("https://raw.githubusercontent.com/SolDungeon/chart_data/main/daily_data.csv").then(res => res.text())).split("\n");

        //console.log(daily_data);

        let dates_from_file : string[] = [];
        let volume_from_file : number[] = [];
        let users_from_file : number[] = [];
        let interactions_from_file : number[] = [];

        for (let i = 1; i < daily_data.length; i++) {
            let line = daily_data[i].split(",")

            if (line[0] === "") {
                continue;
            }
            dates_from_file.push(line[0])
            volume_from_file.push(Number(line[1]))
            interactions_from_file.push(Number(line[2]))
            users_from_file.push(Number(line[3]))

        }

        setDates(dates_from_file);
        setVolumeData(volume_from_file);
        setUserData(users_from_file);

        let main_stats = await (await fetch("https://raw.githubusercontent.com/SolDungeon/chart_data/main/main_stats.json").then(res => res.json()));

        //console.log(main_stats);

        setCharacterData(main_stats["characters"]);
        setBetSizeData(main_stats["bet_sizes"]);
        setTotalPlays(main_stats["total_games"]);
        setTotalVolume(main_stats["total_volume"]);
        setTotalUsers(main_stats["total_users"])
        setPlaysData(main_stats["plays"]);
        setWinsData(main_stats["wins"]);


        let tier_1_wins = main_stats["wins"][0] + main_stats["wins"][1] + main_stats["wins"][2];
        let tier_1_plays = main_stats["plays"][0] + main_stats["plays"][1] + main_stats["plays"][2]
        setTier1Wins(tier_1_wins / tier_1_plays);
        setTier1Losses((tier_1_plays - tier_1_wins) / tier_1_plays);

        let tier_2_wins = main_stats["wins"][3] + main_stats["wins"][4] + main_stats["wins"][5] + main_stats["wins"][6];
        let tier_2_plays = main_stats["plays"][3] + main_stats["plays"][4] + main_stats["plays"][5] + main_stats["plays"][6]

        setTier2Wins(tier_2_wins / tier_2_plays);
        setTier2Losses((tier_2_plays - tier_2_wins) / tier_2_plays);





        
    },[setVolumeData, setUserData, setCharacterData, setTier1Wins, setTier1Losses, setTier2Wins, setTier2Losses, setTotalUsers]);

    useEffect(() => 
    {
        FetchData();
        
    }, [FetchData]);

    function LongPlot({title, x_data, y_data, y2_data} : {title : string, x_data : string[], y_data : number[],  y2_data : number[]})
    {
        const isMobile = useMediaQuery({ query: '(max-width: 500px)' })
        const isTab = useMediaQuery({ query: '(max-width: 900px)' })
          var trace1 = {
            x: x_data,
            y: y_data,
            type: 'scatter',
            mode: 'lines',
            line: {
                color: 'rgb(126,165,248)',
                width: 2
            }
          };
          
          var trace2 = {
            x: x_data,
            y: y2_data,
            yaxis: 'y2',
            type: 'scatter',
            color: "red",
            mode: 'lines',
            line: {
                color: 'rgb(167,251,93)',
                width: 2
            }
          };
          
          var data = [trace1, trace2];
          

          var layout = {
            height: isMobile ? 400: isTab ? 400 : 400,
            width: isMobile ? 350: isTab ? 500 : 1000,
            title: title,
            plot_bgcolor:"black",
            paper_bgcolor:"black",
            showlegend: false,
    
            font: {
                family: 'SFPixelate',
                size: isMobile ? 10: isTab ? 18 : 18,
                color: 'white'
              },
            xaxis: {
                tickformat: '%d %b \n %Y',
                dtick: 14*24*60*60*1000
            },
            yaxis: {
                showgrid: true,
                gridcolor: 'grey',
                gridwidth: 1,
                title: 'Volume (SOL)',
                titlefont: {color: 'rgb(126,165,248)'},

            },
            yaxis2: {
                title: 'Users',
                titlefont: {color: 'rgb(167,251,93)'},
                overlaying: 'y',
                side: 'right'
            },
            
            
        };

        return(
            <PlotlyChart
                data={data}
                layout={layout}
                
            />
        );
    }

    
    //console.log("active tab", activeTab)
    return(
        <Container className='responsivePage' style={{"marginBottom": "5rem"}}>
        <Tabs
            className="custom-tab" activeKey={activeTab} onSelect={(eventKey) => setActiveTab(eventKey)}
        >
            <Tab eventKey="home" title="OVERVIEW" tabClassName="custom-tab">

                <Center className='responsivePage'>
                    <HStack className='responsiveGraph' >
                        <LongPlot title="Dungeons & Degens Daily Data" x_data={dates} y_data={volume_data} y2_data={user_data}/>
                        <VStack  className='lineGraphVstack' alignItems="left">
                            <Box width = "100%" mr="2rem" p="2px" borderWidth='2px'  borderColor="white">
                                <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>
                                <Text align="center">Total Plays  <br/> {total_plays}</Text>
                                </div>
                            </Box>
                            <Box width = "100%"  ml="2rem" p="2px" borderWidth='2px'  borderColor="white">
                                <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>
                                <Text align="center">Total Volume <br/> {total_volume.toFixed(2)}</Text>
                                </div>
                            </Box> 
                            <Box width = "100%"  ml="2rem" p="2px" borderWidth='2px'  borderColor="white">
                                <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>
                                <Text align="center">Total Users <br/> {total_users}</Text>
                                </div>
                            </Box>   
                        </VStack>
                    </HStack>
                </Center>
                <Center  className='responsivePage'>
                    <HStack className='responsiveGraph' >
                        <PieChart values={character_data} labels={["Knight", "Ranger", "Wizard"]} title="Character Choices"/>
                        <PieChart values={betsize_data} labels={["0.05", "0.1", "0.25"]} title="Bet Size Choices"/>
                    </HStack>
                </Center>

                <Center  className='responsivePage'>
                    <HStack  className='responsiveGraph' >
                <HorizontalBar title="Tier 1 W/L" x1={[tier_1_wins]} x2={[tier_1_losses]}/>
                <HorizontalBar title="Tier 2 W/L" x1={[tier_2_wins]} x2={[tier_2_losses]}/>

                </HStack>

                </Center>
            </Tab>
            <Tab eventKey="games" title="GAMES" tabClassName="custom-tab">
                <GameStats plays={plays_data} wins ={wins_data}/>
                
            </Tab> 
            
            <Tab eventKey="perils" title="PLAYER" tabClassName="custom-tab">
                <PlayerStats AchievementData={AchievementData}/>
                
            </Tab>     
            
        </Tabs>
    </Container>
    );
}