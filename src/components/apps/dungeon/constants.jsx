import { isMobile } from "react-device-detect";

// set font size
export var DEFAULT_FONT_SIZE = "30px"
export var DUNGEON_FONT_SIZE = "20px"

if (isMobile) {
    DEFAULT_FONT_SIZE = "15px"
    DUNGEON_FONT_SIZE = "10px"
}