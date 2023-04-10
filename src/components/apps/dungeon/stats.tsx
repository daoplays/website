import React, { useCallback, useEffect, useState } from 'react';

import PlotlyChart from 'react-plotlyjs-ts';
import {
   Box,
   Center,
    HStack,
    Text
    
} from '@chakra-ui/react';
import Table from 'react-bootstrap/Table';
//import { isMobile } from "react-device-detect";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Container from 'react-bootstrap/Container';

import { DUNGEON_FONT_SIZE } from './constants';

import './css/table.css';
import './css/fonts.css';
import './css/tabs.css';

/*
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



var EMOJI_SIZE = 32
if (isMobile) {
    EMOJI_SIZE = 24
}
*/

function PieChart({values, labels, title} : {values : number[], labels : string[], title : string})
{
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
        width: 500,
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
/*
function TiersPlayed()
{
    return(
        <Center>
        <Box width = "80%">
        <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>

            <Table className="custom-table">
                <thead>
                <tr>
                <th></th>
                <th><img src={boulder_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={giant_rat_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={giant_spider_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={goblins_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={green_slime_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={mimic_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={skeletons_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={floor_spikes_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                </tr>
                </thead>
                <tbody style={{
                    backgroundColor: 'black'
                }}>
                
                    <tr>
                        <td>Plays</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        
                        
                    </tr>
                    <tr>
                        <td >Wins</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                    </tr>
                    <tr>
                        <td >%</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                    </tr>
                </tbody>
            </Table>

            <Table className="custom-table">
                <thead>
                <tr>
                <th></th>
                <th><img src={carnivine_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={giant_green_slime_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={werewolf_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                </tr>
                </thead>
                <tbody style={{
                    backgroundColor: 'black'
                }}>
                
                    <tr>
                        <td>Plays</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        
                    </tr>
                    <tr>
                        <td >Wins</td>
                        <td >40</td>
                        <td >16</td>
                        <td >10</td>
                    </tr>
                    <tr>
                        <td >%</td>
                        <td >50</td>
                        <td >50</td>
                        <td >50</td>
                    </tr>
                </tbody>
            </Table>

            <Table className="custom-table">
                <thead>
                <tr>
                <th></th>
                <th><img src={blue_slime_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={boulder_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={elves_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={giant_blue_slime_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={goblins_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={mimic_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={orc_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={skeleton_knight_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={skeletons_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={skeleton_wizard_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={floor_spikes_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                </tr>
                </thead>
                <tbody style={{
                    backgroundColor: 'black'
                }}>
                
                    <tr>
                        <td>Plays</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        
                    </tr>
                    <tr>
                        <td >Wins</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                    </tr>
                    <tr>
                        <td >%</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                    </tr>
                </tbody>
            </Table>

            <Table className="custom-table">
                <thead>
                <tr>
                <th></th>
                <th><img src={assassin_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={dungeon_master_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                <th><img src={shade_emoji} width="auto" alt={""} style={{maxHeight: EMOJI_SIZE, maxWidth: EMOJI_SIZE}}/></th>
                </tr>
                </thead>
                <tbody style={{
                    backgroundColor: 'black'
                }}>
                
                    <tr>
                        <td>Plays</td>
                        <td >10</td>
                        <td >10</td>
                        <td >10</td>
                        
                    </tr>
                    <tr>
                        <td >Wins</td>
                        <td >40</td>
                        <td >16</td>
                        <td >10</td>
                    </tr>
                    <tr>
                        <td >%</td>
                        <td >50</td>
                        <td >50</td>
                        <td >50</td>
                    </tr>
                </tbody>
            </Table>
        </div>
        </Box>
        </Center>
    );
}
*/
function GameStats({plays, wins} : {plays : number[], wins : number[]})
{

    if (plays.length === 0)
        return(<></>);

    let tier_1_plays = plays[0] + plays[1] + plays[2];
    let tier_1_wins = wins[0] + wins[1] + wins[2];

    let tier_2_plays = plays[3] + plays[4] + plays[5] + plays[6];
    let tier_2_wins = wins[3] + wins[4] + wins[5] + wins[6];


    return(
        <Center>
        <Box width = "80%">
        <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>

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

export function StatsScreen()
{

    const [activeTab, setActiveTab] = useState<any>("home");
    const [dates, setDates] = useState<string[]>([]);
    const [volume_data, setVolumeData] = useState<number[]>([]);
    const [user_data, setUserData] = useState<number[]>([]);

    const [character_data, setCharacterData] = useState<number[]>([]);
    const [betsize_data, setBetSizeData] = useState<number[]>([]);
    const [total_plays, setTotalPlays] = useState<number>(0);
    const [total_volume, setTotalVolume] = useState<number>(0);
    const [plays_data, setPlaysData] = useState<number[]>([]);
    const [wins_data, setWinsData] = useState<number[]>([]);


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
        setPlaysData(main_stats["plays"]);
        setWinsData(main_stats["wins"]);



        
    },[setVolumeData, setUserData, setCharacterData]);

    useEffect(() => 
    {
        FetchData();
        
    }, [FetchData]);

    function LongPlot({title, x_data, y_data, y2_data} : {title : string, x_data : string[], y_data : number[],  y2_data : number[]})
    {

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
            height: 400,
            width: 1000,
            title: title,
            plot_bgcolor:"black",
            paper_bgcolor:"black",
            showlegend: false,
            font: {
                family: 'SFPixelate',
                size: 18,
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
            }
            
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
        <Container>
        <Tabs
            className="custom-tab" activeKey={activeTab} onSelect={(eventKey) => setActiveTab(eventKey)}
        >
            <Tab eventKey="home" title="Overview" tabClassName="custom-tab">

                <Center>
                    <LongPlot title="Dungeons & Degens Daily Data" x_data={dates} y_data={volume_data} y2_data={user_data}/>
                </Center>
                <Center>
                    <HStack>
                    <Box mr="2rem" p="2px" borderWidth='2px'  borderColor="white">
                        <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>
                        <Text align="center">Total Plays  <br/> {total_plays}</Text>
                        </div>
                    </Box>
                    <Box ml="2rem" p="2px" borderWidth='2px'  borderColor="white">
                        <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>
                        <Text align="center">Total Volume <br/> {total_volume.toFixed(2)}</Text>
                        </div>
                    </Box>  
                    </HStack>
                </Center>
                <Center>
                    <HStack>
                        <PieChart values={character_data} labels={["Knight", "Ranger", "Wizard"]} title="Character Choices"/>
                        <PieChart values={betsize_data} labels={["0.05", "0.1", "0.25"]} title="Bet Size Choices"/>
                    </HStack>
                </Center>
            </Tab>
            <Tab eventKey="games" title="Games" tabClassName="custom-tab">
                <GameStats plays={plays_data} wins ={wins_data}/>
                
            </Tab> 
            {/*
            <Tab eventKey="perils" title="Perils" tabClassName="custom-tab">
                <TiersPlayed/>
                
            </Tab>     
            */}
        </Tabs>
    </Container>
    );
}