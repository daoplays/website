import React from "react";

/*
import assassin_emoji from "./emojis/Assassin.gif";
import blue_slime_emoji from "./emojis/BlueSlime.gif";
import boulder_emoji from "./emojis/Boulder.png";
import carnivine_emoji from "./emojis/Carnivine.gif";
import dungeon_master_emoji from "./emojis/DungeonMaster.gif";
import elves_emoji from "./emojis/Elves.gif";
import giant_blue_slime_emoji from "./emojis/GiantBlueSlime.gif";
import giant_green_slime_emoji from "./emojis/GiantGreenSlime.gif";
import giant_rat_emoji from "./emojis/GiantRat.gif";
import giant_spider_emoji from "./emojis/GiantSpider.gif";
import goblins_emoji from "./emojis/Goblin.gif";
import green_slime_emoji from "./emojis/GreenSlime.gif";
import mimic_emoji from "./emojis/Mimic.gif";
import orc_emoji from "./emojis/Orc.gif";
import shade_emoji from "./emojis/Shade.gif";
import skeleton_knight_emoji from "./emojis/SkellyKnight.gif";
import skeletons_emoji from "./emojis/Skellies.gif";
import skeleton_wizard_emoji from "./emojis/SkellyWiz.gif";
import floor_spikes_emoji from "./emojis/Spikes.png";
import werewolf_emoji from "./emojis/Werewolf.gif";

import knight_emoji from "./emojis/Knight.gif";
import ranger_emoji from "./emojis/Ranger.gif";
import wizard_emoji from "./emojis/Wizard.gif";
import "../dungeon/css/style.css";

function PieChart({ values, labels, title }: { values: number[]; labels: string[]; title: string }) {
    const isMobile = useMediaQuery({ query: "(max-width: 500px)" });
    const isTab = useMediaQuery({ query: "(max-width: 900px)" });

    if (values.length === 0) return <></>;

    var data = [
        {
            values: values,
            labels: labels,
            marker: {
                colors: ["rgba(124, 124, 124, 255)", "rgb(167,251,93,255)", "rgb(126,165,248,255)"],
            },
            type: "pie",
        },
    ];

    var layout = {
        height: isMobile ? 300 : isTab ? 400 : 400,
        width: isMobile ? 300 : isTab ? 500 : 500,
        title: title,
        plot_bgcolor: "black",
        paper_bgcolor: "black",
        font: {
            family: "SFPixelate",
            size: isMobile ? 10 : isTab ? 18 : 18,
            color: "white",
        },
    };
    return <PlotlyChart data={data} layout={layout} />;
}

function wins(AchievementData: AchievementData, enemy: DungeonEnemy): number {
    return AchievementData.enemies_win[enemy] + AchievementData.enemies_win[32 + enemy] + AchievementData.enemies_win[64 + enemy];
}

function losses(AchievementData: AchievementData, enemy: DungeonEnemy): number {
    return AchievementData.enemies_lose[enemy] + AchievementData.enemies_lose[32 + enemy] + AchievementData.enemies_lose[64 + enemy];
}

function WinLoss({ AchievementData, enemy }: { AchievementData: AchievementData; enemy: DungeonEnemy }) {
    let w: number = wins(AchievementData, enemy);
    let l: number = losses(AchievementData, enemy);

    return (
        <>
            <Text m="0" p="0" align="center">
                <span style={{ color: "green" }}>{w}</span>
                <span style={{ color: "white" }}> / </span>
                <span style={{ color: "red" }}>{l}</span>
            </Text>
        </>
    );
}

function TotalWinLoss({ AchievementData }: { AchievementData: AchievementData }) {
    let w: number = 0;
    let l: number = 0;

    for (let i = 0; i < 32 * 3; i++) {
        w += AchievementData.enemies_win[i];
        l += AchievementData.enemies_lose[i];
    }

    return (
        <>
            <Text align="center" fontSize={DEFAULT_FONT_SIZE} m="0" p="0">
                <span style={{ color: "green" }}>{w}</span>
                <span style={{ color: "white" }}> / </span>
                <span style={{ color: "red" }}>{l}</span>
            </Text>
        </>
    );
}

function CharacterWinLoss({ AchievementData, player_character }: { AchievementData: AchievementData; player_character: DungeonCharacter }) {
    let w: number = 0;
    let l: number = 0;

    for (let i = 0 + player_character * 32; i < 32 + player_character * 32; i += 1) {
        w += AchievementData.enemies_win[i];
        l += AchievementData.enemies_lose[i];
    }

    return (
        <>
            <Text align="center" fontSize={DUNGEON_FONT_SIZE} m="0" p="0">
                <span style={{ color: "green" }}>{w}</span>
                <span style={{ color: "white" }}> / </span>
                <span style={{ color: "red" }}>{l}</span>
            </Text>
        </>
    );
}

function Clears(AchievementData: AchievementData): number {
    return AchievementData.levels_won[6] + AchievementData.levels_won[13] + AchievementData.levels_won[20];
}

function PlayerStats({ AchievementData, player_data }: { AchievementData: AchievementData | null; player_data: PlayerData | null }) {
    const isMobile = useMediaQuery({ query: "(max-width: 500px)" });

    if (AchievementData === null) return <></>;

    //console.log(AchievementData);
    //<Text fontSize={DUNGEON_FONT_SIZE}>Name: MasterMason</Text>
    //<Text fontSize={DUNGEON_FONT_SIZE}>Level: 2</Text>

    //<Text fontSize={DUNGEON_FONT_SIZE}>Total XP: 700</Text>
    return (
        <Center width="100%">
            <Box width="100%">
                <div className="font-face-sfpb" style={{ color: "white", fontSize: DUNGEON_FONT_SIZE }}>
                    {!isMobile && (
                        <HStack width="100%" spacing="10%" mb="2rem">
                            <VStack align="center">
                                <Text align="center" fontSize={DEFAULT_FONT_SIZE}>
                                    {AchievementData.play_streak}
                                </Text>
                                <Text align="center" fontSize={DUNGEON_FONT_SIZE}>
                                    Daily
                                    <br />
                                    Dungeon
                                    <br />
                                    Streak
                                </Text>
                            </VStack>

                            <VStack align="center">
                                <Text align="center" fontSize={DEFAULT_FONT_SIZE}>
                                    {AchievementData.games_played_today}
                                </Text>
                                <Text align="center" fontSize={DUNGEON_FONT_SIZE}>
                                    Levels
                                    <br />
                                    Explored
                                    <br />
                                    Today
                                </Text>
                            </VStack>

                            <VStack align="center">
                                <Text align="center" fontSize={DEFAULT_FONT_SIZE}>
                                    {AchievementData.games_played}
                                </Text>
                                <Text align="center" fontSize={DUNGEON_FONT_SIZE}>
                                    Total
                                    <br />
                                    Levels
                                    <br />
                                    Explored
                                </Text>
                            </VStack>

                            <VStack align="center">
                                <Text align="center" fontSize={DEFAULT_FONT_SIZE}>
                                    {(bignum_to_num(AchievementData.total_lamports_claimed) / 1e9).toFixed(3)}
                                </Text>
                                <Text align="center" fontSize={DUNGEON_FONT_SIZE}>
                                    Total
                                    <br />
                                    Looted
                                </Text>
                            </VStack>

                            <VStack align="center">
                                <Text align="center" fontSize={DEFAULT_FONT_SIZE}>
                                    {Clears(AchievementData)}
                                </Text>
                                <Text align="center" fontSize={DUNGEON_FONT_SIZE}>
                                    Total
                                    <br />
                                    Dungeon
                                    <br />
                                    Clears
                                </Text>
                            </VStack>

                            <VStack align="center">
                                <TotalWinLoss AchievementData={AchievementData} />
                                <Text align="center" fontSize={DUNGEON_FONT_SIZE}>
                                    Total Levels
                                    <br />
                                    Survived/Killed
                                </Text>
                            </VStack>
                        </HStack>
                    )}

                    {isMobile && (
                        <Center>
                            <HStack spacing="1rem" mb="2rem">
                                <VStack align="center">
                                    <VStack align="center">
                                        <Text align="center" fontSize={DEFAULT_FONT_SIZE}>
                                            {AchievementData.play_streak}
                                        </Text>
                                        <Text align="center" fontSize={DUNGEON_FONT_SIZE}>
                                            Daily Dungeon
                                            <br />
                                            Streak
                                        </Text>
                                    </VStack>

                                    <VStack align="center">
                                        <Text align="center" fontSize={DEFAULT_FONT_SIZE}>
                                            {(bignum_to_num(AchievementData.total_lamports_claimed) / 1e9).toFixed(3)}
                                        </Text>
                                        <Text align="center" fontSize={DUNGEON_FONT_SIZE}>
                                            Total
                                            <br />
                                            Looted
                                        </Text>
                                    </VStack>
                                </VStack>

                                <VStack align="center">
                                    <VStack align="center">
                                        <Text align="center" fontSize={DEFAULT_FONT_SIZE}>
                                            {AchievementData.games_played_today}
                                        </Text>
                                        <Text align="center" fontSize={DUNGEON_FONT_SIZE}>
                                            Levels Explored
                                            <br />
                                            Today
                                        </Text>
                                    </VStack>

                                    <VStack align="center">
                                        <Text align="center" fontSize={DEFAULT_FONT_SIZE}>
                                            {Clears(AchievementData)}
                                        </Text>
                                        <Text align="center" fontSize={DUNGEON_FONT_SIZE}>
                                            Total Dungeon
                                            <br />
                                            Clears
                                        </Text>
                                    </VStack>
                                </VStack>

                                <VStack align="center">
                                    <VStack align="center">
                                        <Text align="center" fontSize={DEFAULT_FONT_SIZE}>
                                            {AchievementData.games_played}
                                        </Text>
                                        <Text align="center" fontSize={DUNGEON_FONT_SIZE}>
                                            Total Levels
                                            <br />
                                            Explored
                                        </Text>
                                    </VStack>

                                    <VStack align="center">
                                        <TotalWinLoss AchievementData={AchievementData} />
                                        <Text align="center" fontSize={DUNGEON_FONT_SIZE}>
                                            Total Levels
                                            <br />
                                            Survived/Killed
                                        </Text>
                                    </VStack>
                                </VStack>
                            </HStack>
                        </Center>
                    )}

                    <Text fontSize={DUNGEON_FONT_SIZE}>Character Stats</Text>
                    <Table className="custom-centered-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>
                                    <Center>
                                        <img
                                            src={knight_emoji}
                                            width="auto"
                                            alt={""}
                                            style={{
                                                marginLeft: "8px",
                                                maxHeight: EMOJI_SIZE,
                                                maxWidth: EMOJI_SIZE,
                                            }}
                                        />
                                    </Center>
                                </th>
                                <th style={{ visibility: "hidden" }}>
                                    <Center>
                                        <img
                                            src={ranger_emoji}
                                            width="auto"
                                            alt={""}
                                            style={{
                                                maxHeight: EMOJI_SIZE,
                                                maxWidth: EMOJI_SIZE,
                                            }}
                                        />
                                    </Center>
                                </th>
                                <th>
                                    <Center>
                                        <img
                                            src={wizard_emoji}
                                            width="auto"
                                            alt={""}
                                            style={{
                                                maxHeight: EMOJI_SIZE,
                                                maxWidth: EMOJI_SIZE,
                                            }}
                                        />
                                    </Center>
                                </th>
                                <th style={{ visibility: "hidden" }}>
                                    <Center>
                                        <img
                                            src={knight_emoji}
                                            width="auto"
                                            alt={""}
                                            style={{
                                                marginLeft: "8px",
                                                maxHeight: EMOJI_SIZE,
                                                maxWidth: EMOJI_SIZE,
                                            }}
                                        />
                                    </Center>
                                </th>
                                <th>
                                    <Center>
                                        <img
                                            src={ranger_emoji}
                                            width="auto"
                                            alt={""}
                                            style={{
                                                maxHeight: EMOJI_SIZE,
                                                maxWidth: EMOJI_SIZE,
                                            }}
                                        />
                                    </Center>
                                </th>
                                <th style={{ visibility: "hidden" }}>
                                    <Center>
                                        <img
                                            src={wizard_emoji}
                                            width="auto"
                                            alt={""}
                                            style={{
                                                maxHeight: EMOJI_SIZE,
                                                maxWidth: EMOJI_SIZE,
                                            }}
                                        />
                                    </Center>
                                </th>
                            </tr>
                        </thead>
                        <tbody
                            style={{
                                backgroundColor: "black",
                            }}
                        >
                            <tr>
                                <td>XP</td>
                                <td>{player_data?.character_xp[0]} XP</td>
                                <td style={{ visibility: "hidden" }}>{player_data?.character_xp[1]}</td>
                                <td>{player_data?.character_xp[2]} XP</td>
                                <td style={{ visibility: "hidden" }}>{player_data?.character_xp[0]}</td>
                                <td>{player_data?.character_xp[1]} XP</td>
                                <td style={{ visibility: "hidden" }}>{player_data?.character_xp[2]}</td>
                            </tr>
                            <tr>
                                <td>Levels Survived/Killed</td>
                                <td>
                                    <CharacterWinLoss AchievementData={AchievementData} player_character={DungeonCharacter.knight} />
                                </td>
                                <td style={{ visibility: "hidden" }}>
                                    <CharacterWinLoss AchievementData={AchievementData} player_character={DungeonCharacter.ranger} />
                                </td>
                                <td>
                                    <CharacterWinLoss AchievementData={AchievementData} player_character={DungeonCharacter.wizard} />
                                </td>
                                <td style={{ visibility: "hidden" }}>
                                    <CharacterWinLoss AchievementData={AchievementData} player_character={DungeonCharacter.knight} />
                                </td>
                                <td>
                                    <CharacterWinLoss AchievementData={AchievementData} player_character={DungeonCharacter.ranger} />
                                </td>
                                <td style={{ visibility: "hidden" }}>
                                    <CharacterWinLoss AchievementData={AchievementData} player_character={DungeonCharacter.wizard} />
                                </td>
                            </tr>
                        </tbody>
                    </Table>

                    <VStack mt="2rem" width="100%" align="left" spacing="2rem">
                        <Text fontSize={DUNGEON_FONT_SIZE}>Minions</Text>
                        <Table className="custom-table">
                            <thead>
                                <tr>
                                    <th>
                                        <Center>
                                            <img
                                                src={boulder_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    marginLeft: "8px",
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={giant_rat_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={giant_spider_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={goblins_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={green_slime_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={mimic_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={floor_spikes_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                </tr>
                            </thead>
                            <tbody
                                style={{
                                    backgroundColor: "black",
                                }}
                            >
                                <tr>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.BoulderTrap} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.GiantRat} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.GiantSpider} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.Goblins} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.GreenSlime} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.Mimic} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.SpikeTrap} />
                                    </td>
                                </tr>
                            </tbody>
                        </Table>

                        <Table className="custom-table">
                            <thead>
                                <tr>
                                    <th>
                                        <Center>
                                            <img
                                                src={blue_slime_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={elves_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={giant_blue_slime_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={orc_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={skeletons_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={skeleton_knight_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={skeleton_wizard_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                </tr>
                            </thead>
                            <tbody
                                style={{
                                    backgroundColor: "black",
                                }}
                            >
                                <tr>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.BlueSlime} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.Elves} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.GiantBlueSlime} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.Orc} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.Skeletons} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.SkeletonKnight} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.SkeletonWizard} />
                                    </td>
                                </tr>
                            </tbody>
                        </Table>

                        <Text fontSize={DUNGEON_FONT_SIZE}>Bosses</Text>

                        <Table className="custom-table">
                            <thead>
                                <tr>
                                    <th>
                                        <Center>
                                            <img
                                                src={carnivine_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={giant_green_slime_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={werewolf_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={assassin_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={dungeon_master_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                    <th>
                                        <Center>
                                            <img
                                                src={shade_emoji}
                                                width="auto"
                                                alt={""}
                                                style={{
                                                    maxHeight: EMOJI_SIZE,
                                                    maxWidth: EMOJI_SIZE,
                                                }}
                                            />
                                        </Center>
                                    </th>
                                </tr>
                            </thead>
                            <tbody
                                style={{
                                    backgroundColor: "black",
                                }}
                            >
                                <tr>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.Carnivine} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.GiantGreenSlime} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.Werewolf} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.Assassin} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.DM} />
                                    </td>
                                    <td>
                                        <WinLoss AchievementData={AchievementData} enemy={DungeonEnemy.Shade} />
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                    </VStack>
                </div>
            </Box>
        </Center>
    );
}

export function StatsScreen({
    AchievementData,
    loot_per_day,
    player_data,
}: {
    AchievementData: AchievementData | null;
    loot_per_day: string;
    player_data: PlayerData | null;
}) {
    const [activeTab, setActiveTab] = useState<any>("home");
    const [dates, setDates] = useState<string[]>([]);
    const [volume_data, setVolumeData] = useState<number[]>([]);
    const [user_data, setUserData] = useState<number[]>([]);

    const [character_data, setCharacterData] = useState<number[]>([]);
    const [total_plays, setTotalPlays] = useState<number>(0);
    const [total_volume, setTotalVolume] = useState<number>(0);
    const [total_users, setTotalUsers] = useState<number>(0);

    console.log("in stats", player_data);
    const FetchData = useCallback(async () => {
        let daily_data = await (
            await fetch("https://raw.githubusercontent.com/SolDungeon/chart_data/main/daily_data.csv").then((res) => res.text())
        ).split("\n");

        //console.log(daily_data);

        let dates_from_file: string[] = [];
        let users_from_file: number[] = [];
        let interactions_from_file: number[] = [];

        for (let i = 1; i < daily_data.length; i++) {
            let line = daily_data[i].split(",");

            if (line[0] === "") {
                continue;
            }
            dates_from_file.push(line[0]);
            interactions_from_file.push(Number(line[1]));
            users_from_file.push(Number(line[2]));
        }

        setDates(dates_from_file);
        setVolumeData(interactions_from_file);
        setUserData(users_from_file);

        let main_stats = await await fetch("https://raw.githubusercontent.com/SolDungeon/chart_data/main/main_stats.json").then((res) =>
            res.json(),
        );

        //console.log(main_stats);

        setCharacterData(main_stats["characters"]);
        setTotalPlays(main_stats["total_games"]);
        setTotalVolume(main_stats["total_volume"]);
        setTotalUsers(main_stats["total_users"]);
    }, [setVolumeData, setUserData, setCharacterData, setTotalUsers]);

    useEffect(() => {
        FetchData();
    }, [FetchData]);

    function LongPlot({ title, x_data, y_data, y2_data }: { title: string; x_data: string[]; y_data: number[]; y2_data: number[] }) {
        const isMobile = useMediaQuery({ query: "(max-width: 500px)" });
        const isTab = useMediaQuery({ query: "(max-width: 900px)" });

        var trace1 = {
            x: x_data,
            y: y_data,
            type: "scatter",
            mode: "lines",
            line: {
                color: "rgb(126,165,248)",
                width: 2,
            },
        };

        var trace2 = {
            x: x_data,
            y: y2_data,
            yaxis: "y2",
            type: "scatter",
            color: "red",
            mode: "lines",
            line: {
                color: "rgb(167,251,93)",
                width: 2,
            },
        };

        var data = [trace1, trace2];

        var layout = {
            height: isMobile ? 400 : isTab ? 400 : 400,
            width: isMobile ? 350 : isTab ? 500 : 1000,
            title: title,
            plot_bgcolor: "black",
            paper_bgcolor: "black",
            showlegend: false,

            font: {
                family: "SFPixelate",
                size: isMobile ? 10 : isTab ? 18 : 18,
                color: "white",
            },
            xaxis: {
                tickformat: "%d %b \n %Y",
                dtick: 14 * 24 * 60 * 60 * 1000,
            },
            yaxis: {
                showgrid: true,
                gridcolor: "grey",
                gridwidth: 1,
                title: "Games Played",
                titlefont: { color: "rgb(126,165,248)" },
            },
            yaxis2: {
                title: "Users",
                titlefont: { color: "rgb(167,251,93)" },
                overlaying: "y",
                side: "right",
            },
        };

        return <PlotlyChart data={data} layout={layout} />;
    }

    //console.log("active tab", activeTab)
    return (
        <Container className="responsivePage" style={{ marginBottom: "5rem" }}>
            <Tabs className="custom-tab" activeKey={activeTab} onSelect={(eventKey) => setActiveTab(eventKey)}>
                <Tab eventKey="home" title="OVERVIEW" tabClassName="custom-tab">
                    <Center className="responsivePage">
                        <HStack className="responsiveGraph">
                            <LongPlot title="Dungeons & Degens Daily Data" x_data={dates} y_data={volume_data} y2_data={user_data} />
                            <VStack className="lineGraphVstack" alignItems="left">
                                <Box width="100%" mr="2rem" p="2px" borderWidth="2px" borderColor="white">
                                    <Text className="font-face-sfpb" textAlign="center" fontSize={DUNGEON_FONT_SIZE} color="white">
                                        Total Games <br /> {total_plays}
                                    </Text>
                                </Box>
                                <Box width="100%" ml="2rem" p="2px" borderWidth="2px" borderColor="white">
                                    <Text className="font-face-sfpb" textAlign="center" fontSize={DUNGEON_FONT_SIZE} color="white">
                                        Total Loot <br />
                                        {total_volume.toFixed(2)}
                                    </Text>
                                </Box>
                                <Box width="100%" ml="2rem" p="2px" borderWidth="2px" borderColor="white">
                                    <Text className="font-face-sfpb" textAlign="center" fontSize={DUNGEON_FONT_SIZE} color="white">
                                        Total Users <br /> {total_users}
                                    </Text>
                                </Box>
                                <Box width="100%" ml="2rem" p="2px" borderWidth="2px" borderColor="white">
                                    <Text className="font-face-sfpb" textAlign="center" fontSize={DUNGEON_FONT_SIZE} color="white">
                                        LOOT / day <br /> {loot_per_day}
                                    </Text>
                                </Box>
                            </VStack>
                        </HStack>
                    </Center>
                    <Center className="responsivePage">
                        <HStack className="responsiveGraph">
                            <PieChart values={character_data} labels={["Knight", "Ranger", "Wizard"]} title="Character Choices" />
                        </HStack>
                    </Center>
                </Tab>
                <Tab eventKey="perils" title="PLAYER" tabClassName="custom-tab">
                    <PlayerStats AchievementData={AchievementData} player_data={player_data} />
                </Tab>
            </Tabs>
        </Container>
    );
}
*/
