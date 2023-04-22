import { WWMap } from "components/schemas/map";
import { Tile, tileSchema } from "../components/schemas/tile";

type AWBWMapData = {
  name: string;
  tileData: number[];
  width: number;
};
const causticFinaleAwbw = [
  34, 3, 1, 5, 1, 1, 34, 3, 2, 2, 3, 7, 9, 2, 34, 26, 28, 111, 1, 1, 34, 26, 3,
  1, 1, 1, 39, 1, 1, 5, 35, 1, 1, 32, 33, 28, 3, 7, 27, 9, 34, 1, 3, 1, 3, 1,
  42, 26, 3, 1, 3, 1, 30, 27, 27, 9, 1, 1, 1, 29, 28, 28, 4, 27, 4, 9, 1, 1, 2,
  3, 1, 34, 16, 34, 3, 2, 32, 30, 30, 28, 34, 16, 34, 1, 1, 3, 1, 1, 1, 2, 16,
  1, 2, 2, 3, 34, 1, 3, 18, 20, 3, 1, 3, 1, 1, 3, 35, 7, 35, 1, 1, 1, 1, 21, 15,
  15, 20, 1, 1, 34, 1, 1, 7, 27, 4, 9, 3, 1, 34, 19, 1, 3, 1, 34, 3, 3, 1, 1, 3,
  34, 5, 47, 1, 3, 1, 1, 3, 16, 1, 1, 1, 2, 2, 2, 3, 1, 18, 15, 26, 1, 1, 2, 2,
  44, 1, 21, 15, 34, 1, 3, 2, 2, 3, 18, 20, 34, 5, 3, 44, 2, 3, 1, 1, 34, 1, 1,
  3, 1, 3, 2, 34, 16, 3, 28, 28, 1, 1, 3, 4, 27, 8, 1, 3, 1, 34, 3, 1, 1, 1, 16,
  1, 32, 28, 3, 1, 34, 2, 16, 28, 29, 29, 2, 1, 1, 34, 1, 3, 21, 34, 32, 31, 1,
  1, 1, 34, 21, 19, 3, 30, 31, 3, 1, 16, 1, 1, 1, 3, 30, 1, 34, 3, 1, 1, 3, 21,
  19, 3, 31, 1, 34, 21, 15, 19, 1, 2, 2, 1, 7, 27, 4, 133, 2, 1, 21, 19, 28, 8,
  1, 1, 3, 34, 1, 2, 3, 1, 26, 34, 1, 110, 105, 2, 3, 21, 15, 26, 1, 39, 1, 1,
  1, 1, 34, 7, 9, 1, 3, 111, 109, 133, 1, 34, 2, 5, 3, 2, 1, 3, 35, 15, 15, 26,
  3, 1, 34,
];

const awbwTileMapping: Record<string, Tile> = {
  "1": {type: "plain"},
  "3": {type: "forest"},
  "2": {type: "mountain"},
  "34": {type: "city", army: "neutral"},
  "111": {type: "unused-silo"},
  "33": {type: "reef"},
  //river
  "4": {type: "river", variant: 1},
  "5": {type: "river", variant: 3},
  "7": {type: "river", variant: 8},
  "8": {type: "river", variant: 2},
  "9": {type: "river", variant: 4},
  //road
  "15": {type: "road", variant: 1},
  "16": {type: "road", variant: 3},
  "18": {type: "road", variant: 8},
  "19": {type: "road", variant: 2},
  "20": {type: "road", variant: 4},
  "21": {type: "road", variant: 6},
  //bridge
  "26": {type: "bridge", variant: 1},
  "27": {type: "bridge", variant: 3},
  //ocean
  "28": {type: "sea", variant: 9},
  //shoal
  "29": {type: "shoal", variant: 1},
  "30": {type: "shoal", variant: 5},
  "31": {type: "shoal", variant: 3},
  "32": {type: "shoal", variant: 7},


  //port
  "37": {type: "harbor", army: "neutral"},

  //base
  "35": {type: "base", army: "neutral"},
  "44": {type: "base", army: "blue-moon"},
  "39": {type: "base", army: "orange-star"},
  //headquarters
  "42": {type: "hq", army: "orange-star"},
  "47": {type: "hq", army: "blue-moon"},
  //pipe
  "105": {type: "pipe", variant: 1},
  //pipe ending
  "109": {type: "pipe", variant: 13},
  "110": {type: "pipe", variant: 14},
  //comtower
  "133": {type: "comtower", army: "neutral"},
};



const convertAWBWMapToWWMap = (awbwMapData: AWBWMapData): WWMap => {
  const parsedArray: [[]...Tile[]] = [];
  for (let i = 0; i < awbwMapData.width; i++) {
    const emptyArray: Tile[] = []
    for (let j = 0; j < awbwMapData.width; j++) {
      emptyArray.push(awbwTileMapping[awbwMapData.tileData[j + i * awbwMapData.width]])
    }
    parsedArray.push(emptyArray)
  }
  console.log(parsedArray);
  return {
    name: awbwMapData.name,
    initialTiles: parsedArray,
  };
};
convertAWBWMapToWWMap(
  {
    name: "Caustic Finale",
  tileData: causticFinaleAwbw,
  width: 18
})