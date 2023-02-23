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
        <Center>
        <Box width = "80%">
        <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>

        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Overview</h2><br />

        Each Room in the DUNGEON spawns a Peril. Most Perils are Enemies you will need to fight, but some are Traps such as falling boulders, or spike pits.

        Each type of Peril has its own chance of death, with some Perils being more likely to kill  than others. However, each Room has an overall 50/50 chance of success.

        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Probability Table</h2><br />

        
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
        <td>Mimic</td>
        <td >5</td>
        <td >22</td>
        <td >1.1</td>
        </tr>
        <tr>
                <td>Slime</td>
                <td >10</td>
                <td >10</td>
                <td >1</td>
            </tr>
            <tr>
                <td>Goblins</td>
                <td >15</td>
                <td >40</td>
                <td >6</td>
            </tr>
            <tr>
                <td>Skeletons</td>
                <td >12</td>
                <td >50</td>
                <td >6</td>
            </tr>
            <tr>
                <td>Elves</td>
                <td >10</td>
                <td >55</td>
                <td >5.5</td>
            </tr>
            <tr>
                <td>Orc</td>
                <td >10</td>
                <td >65</td>
                <td >6.5</td>
            </tr>
            <tr>
                <td>Skeleton Knight</td>
                
                <td >8</td>
                <td >75</td>
                <td >6</td>
            </tr>
            <tr>
                <td>Skeleton Wizard</td>
                <td >8</td>
                <td >90</td>
                <td >7.2</td>
            </tr>
            <tr>
                <td>Reaper</td>
                <td >10</td>
                <td >65</td>
                <td >6.5</td>
            </tr>
            <tr>
              <td>Boulder Trap</td>

                <td >6</td>
                <td >35</td>
                <td >2.1</td>
            </tr>
            <tr>
                <td>Spike Trap</td>

                <td >6</td>
                <td >35</td>
                <td >2.1</td>
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
