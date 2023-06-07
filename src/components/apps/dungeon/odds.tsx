import { Box, Center } from "@chakra-ui/react";
import Table from "react-bootstrap/Table";

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE } from "./constants";

import "./css/table.css";

export function OddsScreen() {
    return (
        <>
            <Center marginBottom="5rem">
                <Box width="80%">
                    <div className="font-face-sfpb" style={{ color: "white", fontSize: DUNGEON_FONT_SIZE }}>
                        <h2 className="mt-5" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            Overview
                        </h2>
                        <br />
                        Each Room in the DUNGEON spawns a Peril. Most Perils are Enemies you will need to fight, but some are Traps such as
                        falling boulders, or spike pits. Each type of Peril has its own Power, with some Perils being stronger than others.
                        As your characters level up they will gain +Power to their rolls every other level to help you explore deeper into
                        the dungeon.
                        <h2 className="mt-5" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            Tier 1 Probability Table (levels 1-3)
                        </h2>
                        <br />
                        <Table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Peril</th>
                                    <th>Spawn %</th>
                                    <th>Power</th>
                                </tr>
                            </thead>
                            <tbody
                                style={{
                                    backgroundColor: "black",
                                }}
                            >
                                <tr>
                                    <td>Boulder Trap</td>
                                    <td>3</td>
                                    <td>16</td>
                                </tr>
                                <tr>
                                    <td>Giant Rat</td>
                                    <td>21</td>
                                    <td>6</td>
                                </tr>
                                <tr>
                                    <td>Giant Spider</td>
                                    <td>21</td>
                                    <td>8</td>
                                </tr>
                                <tr>
                                    <td>Goblins</td>
                                    <td>18</td>
                                    <td>10</td>
                                </tr>
                                <tr>
                                    <td>Green Slime</td>
                                    <td>18</td>
                                    <td>10</td>
                                </tr>
                                <tr>
                                    <td>Mimic</td>
                                    <td>1</td>
                                    <td>18</td>
                                </tr>
                                <tr>
                                    <td>Skeletons</td>
                                    <td>15</td>
                                    <td>12</td>
                                </tr>
                                <tr>
                                    <td>Spike Trap</td>
                                    <td>3</td>
                                    <td>16</td>
                                </tr>
                            </tbody>
                        </Table>
                        <h2 className="mt-5" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            Boss Tier 1 Probability Table (level 4)
                        </h2>
                        <br />
                        <Table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Peril</th>
                                    <th>Spawn %</th>
                                    <th>Power</th>
                                </tr>
                            </thead>
                            <tbody
                                style={{
                                    backgroundColor: "black",
                                }}
                            >
                                <tr>
                                    <td>Carnivine</td>
                                    <td>33</td>
                                    <td>16</td>
                                </tr>
                                <tr>
                                    <td>Giant Green Slime</td>
                                    <td>33</td>
                                    <td>14</td>
                                </tr>
                                <tr>
                                    <td>Werewolf</td>
                                    <td>34</td>
                                    <td>18</td>
                                </tr>
                            </tbody>
                        </Table>
                        <h2 className="mt-5" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            Tier 2 Probability Table (levels 5-6)
                        </h2>
                        <br />
                        <Table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Peril</th>
                                    <th>Spawn %</th>
                                    <th>Power</th>
                                </tr>
                            </thead>
                            <tbody
                                style={{
                                    backgroundColor: "black",
                                }}
                            >
                                <tr>
                                    <td>Blue Slime</td>
                                    <td>15</td>
                                    <td>14</td>
                                </tr>
                                <tr>
                                    <td>Boulder Trap</td>
                                    <td>5</td>
                                    <td>16</td>
                                </tr>
                                <tr>
                                    <td>Elves</td>
                                    <td>20</td>
                                    <td>18</td>
                                </tr>
                                <tr>
                                    <td>Giant Blue Slime</td>
                                    <td>6</td>
                                    <td>17</td>
                                </tr>
                                <tr>
                                    <td>Goblins</td>
                                    <td>6</td>
                                    <td>10</td>
                                </tr>
                                <tr>
                                    <td>Mimic</td>
                                    <td>2</td>
                                    <td>18</td>
                                </tr>
                                <tr>
                                    <td>Orc</td>
                                    <td>15</td>
                                    <td>16</td>
                                </tr>
                                <tr>
                                    <td>Skeleton Knight</td>
                                    <td>15</td>
                                    <td>20</td>
                                </tr>
                                <tr>
                                    <td>Skeletons</td>
                                    <td>6</td>
                                    <td>12</td>
                                </tr>
                                <tr>
                                    <td>Skeleton Wizard</td>
                                    <td>5</td>
                                    <td>19</td>
                                </tr>
                                <tr>
                                    <td>Spike Trap</td>
                                    <td>5</td>
                                    <td>16</td>
                                </tr>
                            </tbody>
                        </Table>
                        <h2 className="mt-5" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            Boss Tier 2 Probability Table (level 7)
                        </h2>
                        <br />
                        <Table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Peril</th>
                                    <th>Spawn %</th>
                                    <th>Power</th>
                                </tr>
                            </thead>
                            <tbody
                                style={{
                                    backgroundColor: "black",
                                }}
                            >
                                <tr>
                                    <td>Assassin</td>
                                    <td>48</td>
                                    <td>24</td>
                                </tr>
                                <tr>
                                    <td>Dungeon Master</td>
                                    <td>4</td>
                                    <td>28</td>
                                </tr>
                                <tr>
                                    <td>Shade</td>
                                    <td>48</td>
                                    <td>26</td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </Box>
            </Center>
        </>
    );
}
