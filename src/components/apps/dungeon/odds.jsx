import {
    Box,
    Center,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer
} from '@chakra-ui/react';
import { isMobile } from "react-device-detect";

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE } from './constants';


export function OddsScreen()
{
    let table_size = "md";
    if (isMobile)
        table_size = "sm"

    return(
        <>
        <Center>
        <Box width = "80%">
        <div className="font-face-sfpb" style={{color: "white", fontSize: DUNGEON_FONT_SIZE}}>

        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Overview</h2><br />

        Each Room in the DUNGEON spawns a Peril. Most Perils are Enemies you will need to fight, but some are Traps such as falling boulders, or spike pits.

        Each type of Peril has its own chance of death, with some Perils being more likely to kill  than others. However, each Room has an overall 50/50 chance of success.

        <h2 className="mt-5" style={{fontSize: DEFAULT_FONT_SIZE}}>Probability Table</h2><br />

        
        <TableContainer >
            <Table variant='simple' size={table_size}>
            <Thead>
            <Tr>
                <Th>Peril</Th>
                {!isMobile &&
                    <Th isNumeric>Spawn %</Th>
                }
                {isMobile &&
                    <Th isNumeric>S %</Th>
                }
                {!isMobile &&
                    <Th isNumeric>Death %</Th>
                }
                {isMobile &&
                    <Th isNumeric>D %</Th>
                }
                {!isMobile &&
                    <Th isNumeric>Weighted Probability</Th>
                }
                {isMobile &&
                    <Th isNumeric>W. Pb</Th>
                }
                
            </Tr>
            </Thead>
            <Tbody>
            <Tr>
                <Td>Mimic</Td>
                <Td isNumeric>5</Td>
                <Td isNumeric>22</Td>
                <Td isNumeric>1.1</Td>
            </Tr>
            <Tr>
                <Td>Slime</Td>
                <Td isNumeric>10</Td>
                <Td isNumeric>10</Td>
                <Td isNumeric>1</Td>
            </Tr>
            <Tr>
                <Td>Goblins</Td>
                <Td isNumeric>15</Td>
                <Td isNumeric>40</Td>
                <Td isNumeric>6</Td>
            </Tr>
            <Tr>
                <Td>Skeletons</Td>
                <Td isNumeric>12</Td>
                <Td isNumeric>50</Td>
                <Td isNumeric>6</Td>
            </Tr>
            <Tr>
                <Td>Elves</Td>
                <Td isNumeric>10</Td>
                <Td isNumeric>55</Td>
                <Td isNumeric>5.5</Td>
            </Tr>
            <Tr>
                <Td>Orc</Td>
                <Td isNumeric>10</Td>
                <Td isNumeric>65</Td>
                <Td isNumeric>6.5</Td>
            </Tr>
            <Tr>
                {!isMobile &&
                    <Td>Skeleton Knight</Td>
                }
                {isMobile &&
                    <Td>Sk. Knight</Td>
                }
                <Td isNumeric>8</Td>
                <Td isNumeric>75</Td>
                <Td isNumeric>6</Td>
            </Tr>
            <Tr>
                {!isMobile &&
                    <Td>Skeleton Wizard</Td>
                }
                {isMobile &&
                    <Td>Sk. Wizard</Td>
                }
                <Td isNumeric>8</Td>
                <Td isNumeric>90</Td>
                <Td isNumeric>7.2</Td>
            </Tr>
            <Tr>
                <Td>Reaper</Td>
                <Td isNumeric>10</Td>
                <Td isNumeric>65</Td>
                <Td isNumeric>6.5</Td>
            </Tr>
            <Tr>
                {!isMobile &&
                    <Td>Boulder Trap</Td>
                }
                {isMobile &&
                    <Td>Boulder</Td>
                }
                <Td isNumeric>6</Td>
                <Td isNumeric>35</Td>
                <Td isNumeric>2.1</Td>
            </Tr>
            <Tr>
                {!isMobile &&
                    <Td>Spike Trap</Td>
                }
                {isMobile &&
                    <Td>Spike</Td>
                }
                <Td isNumeric>6</Td>
                <Td isNumeric>35</Td>
                <Td isNumeric>2.1</Td>
            </Tr>
             <Tr>
                <Td></Td>
                <Td isNumeric>100</Td>
                <Td isNumeric></Td>
                <Td isNumeric>50</Td>
            </Tr>
            </Tbody>
        </Table>
        </TableContainer>

        </div>
        </Box>
        </Center>
        </>
    );
}
