import {
    Box,
    Center,
} from '@chakra-ui/react';
import Table from 'react-bootstrap/Table';

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE } from './constants';

import './css/table.css';

export function OddsScreen()
{
    return(
        <>
        <Center marginBottom="5rem">
        <Box width = "80%">
        <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>

        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Overview</h2><br />

        Each Room in the DUNGEON spawns a Peril. Most Perils are Enemies you will need to fight, but some are Traps such as falling boulders, or spike pits.

        Each type of Peril has its own chance of death, with some Perils being more likely to kill  than others. The first three rooms have a 1/3 chance of defeating the player, while the remaining rooms have a 50% chance.

        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Tier 1 Probability Table (levels 1-3)</h2><br />

        
        <Table className="custom-table">
      <thead>
        <tr>
          <th>Peril</th>
          <th>Spawn %</th>
          <th>Death %</th>
          <th>Weighted Probability</th>
        </tr>
      </thead>
      <tbody style={{
            backgroundColor: 'black'
        }}>
            <tr>
                <td>Boulder Trap</td>
                <td >4</td>
                <td >50</td>
                <td >2</td>
            </tr>
            <tr>
                <td>Giant Rat</td>
                <td >20</td>
                <td >15.15</td>
                <td >3.03</td>
            </tr>
            <tr>
                <td>Giant Spider</td>
                <td >20</td>
                <td >25</td>
                <td >5</td>
            </tr>
            <tr>
                <td>Goblins</td>
                <td >15</td>
                <td >35</td>
                <td >5.25</td>
            </tr>
            <tr>
                <td>Green Slime</td>
                <td >14</td>
                <td >40</td>
                <td >5.6</td>
            </tr>
            <tr>
                <td>Mimic</td>
                <td >8</td>
                <td >65</td>
                <td >5.2</td>
            </tr>
            <tr>
                <td>Skeletons</td>
                
                <td >15</td>
                <td >35</td>
                <td >5.25</td>
            </tr>
            <tr>
                <td>Spike Trap</td>
                <td >4</td>
                <td >50</td>
                <td >2</td>
            </tr>
             <tr>
                <td></td>
                <td >100</td>
                <td ></td>
                <td >33.33</td>
            </tr>
      </tbody>
      </Table>

      <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Boss Tier 1 Probability Table (level 4)</h2><br />

        
        <Table className="custom-table">
        <thead>
        <tr>
        <th>Peril</th>
        <th>Spawn %</th>
        <th>Death %</th>
        <th>Weighted Probability</th>
        </tr>
        </thead>
        <tbody style={{
            backgroundColor: 'black'
        }}>
            <tr>
                <td>Carnivine</td>
                <td >10</td>
                <td >40</td>
                <td >4</td>
            </tr>
            <tr>
                <td>Giant Green Slime</td>
                <td >50</td>
                <td >60</td>
                <td >30</td>
            </tr>
            <tr>
                <td>Werewolf</td>
                <td >40</td>
                <td >40</td>
                <td >16</td>
            </tr>
            <tr>
                <td></td>
                <td >100</td>
                <td ></td>
                <td >50</td>
            </tr>
        </tbody>
        </Table>

        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Tier 2 Probability Table (levels 5-6)</h2><br />

                
        <Table className="custom-table">
        <thead>
        <tr>
        <th>Peril</th>
        <th>Spawn %</th>
        <th>Death %</th>
        <th>Weighted Probability</th>
        </tr>
        </thead>
        <tbody style={{
            backgroundColor: 'black'
        }}>
            <tr>
                <td>Blue Slime</td>
                <td >8</td>
                <td >50</td>
                <td >4</td>
            </tr>
            <tr>
                <td>Boulder Trap</td>
                <td >6</td>
                <td >55</td>
                <td >3.3</td>
            </tr>
            <tr>
                <td>Elves</td>
                <td >12</td>
                <td >45</td>
                <td >5.4</td>
            </tr>
            <tr>
                <td>Giant Blue Slime</td>
                <td >4</td>
                <td >62.5</td>
                <td >2.5</td>
            </tr>
            <tr>
                <td>Goblins</td>
                <td >15</td>
                <td >35</td>
                <td >5.25</td>
            </tr>
            <tr>
                <td>Mimic</td>
                <td >8</td>
                <td >65</td>
                <td >5.2</td>
            </tr>
            <tr>
                <td>Orc</td>
                <td >12</td>
                <td >50</td>
                <td >6</td>
            </tr>
            <tr>
                <td>Skeleton Knight</td>
                <td >7</td>
                <td >65</td>
                <td >4.55</td>
            </tr>
            <tr>
                <td>Skeletons</td>
                <td >15</td>
                <td >35</td>
                <td >5.25</td>
            </tr>
            <tr>
            <td>Skeleton Wizard</td>

                <td >7</td>
                <td >75</td>
                <td >5.25</td>
            </tr>
            <tr>
                <td>Spike Trap</td>
                <td >6</td>
                <td >55</td>
                <td >3.3</td>
            </tr>
            <tr>
                <td></td>
                <td >100</td>
                <td ></td>
                <td >50</td>
            </tr>
        </tbody>
        </Table>

    <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Boss Tier 2 Probability Table (level 7)</h2><br />

        
    <Table className="custom-table">
    <thead>
    <tr>
    <th>Peril</th>
    <th>Spawn %</th>
    <th>Death %</th>
    <th>Weighted Probability</th>
    </tr>
    </thead>
    <tbody style={{
                        backgroundColor: 'black'
                    }}>
        <tr>
            <td>Assassin</td>
            <td >40</td>
            <td >40</td>
            <td >16</td>
            </tr>
        <tr>
            <td>Dungeon Master</td>
            <td >10</td>
            <td >40</td>
            <td >4</td>
        </tr>
        <tr>
            <td>Shade</td>
            <td >50</td>
            <td >60</td>
            <td >30</td>
        </tr>
        <tr>
            <td></td>
            <td >100</td>
            <td ></td>
            <td >50</td>
        </tr>
    </tbody>
    </Table>

        </div>
        </Box>
        </Center>
        </>
    );
}
