import type { LeagueType, Match, MatchStatus } from "@prisma/client";
import type { MovementType } from "shared/match-logic/buildable-unit";
import { applyMainEventToMatch } from "shared/match-logic/events/apply-event-to-match";
import { getChangeableTilesFromMap } from "shared/match-logic/get-changeable-tile-from-map";
import { getBaseMovementCost } from "shared/match-logic/movement-cost";
import type { MatchRules } from "shared/schemas/match-rules";
import type { Position } from "shared/schemas/position";
import { isSamePosition } from "shared/schemas/position";
import type { Tile } from "shared/schemas/tile";
import type { WWUnit } from "shared/schemas/unit";
import type { Weather } from "shared/schemas/weather";
import type { MainEvent } from "shared/types/events";
import type { ChangeableTile } from "shared/types/server-match-state";
import type { MapWrapper } from "./map";
import type { PlayerInMatchWrapper } from "./player-in-match";
import { PlayersWrapper } from "./players";
import { UnitWrapper } from "./unit";
import type { UnitsWrapper } from "./units";

/** TODO: Add favorites, possibly spectators, also a timer */
export class MatchWrapper {
  public playerToRemoveWeatherEffect: PlayerInMatchWrapper | null = null;
  public changeableTiles: ChangeableTile[];
  public players = new PlayersWrapper([], this);
  public currentWeather: Weather = "clear";

  constructor(
    public id: Match["id"],
    public leagueType: LeagueType,
    public rules: MatchRules,
    public status: MatchStatus,
    public map: MapWrapper,
    public units: UnitsWrapper,
    public turn: number
  ) {
    this.changeableTiles = getChangeableTilesFromMap(map.data);
  }

  applyMainEvent(event: MainEvent) {
    applyMainEventToMatch(this, event);
  }

  getTile(position: Position): Tile | ChangeableTile {
    this.map.throwIfOutOfBounds(position);

    const foundChangeableTile = this.changeableTiles.find((t) => isSamePosition(t.position, position));

    if (foundChangeableTile !== undefined) {
      return foundChangeableTile;
    }

    return this.map.data.tiles[position[1]][position[0]];
  }

  /**
   * returns the amount of movement points which must be spent to *enter* the tile
   * `null` means impassible terrain.
   */
  getMovementCost(position: Position, movementType: MovementType): number | null {
    const player = this.players.getCurrentTurnPlayer();

    const baseMovementCost = getBaseMovementCost(movementType, player.getMovementWeather(), this.getTile(position).type);

    if (baseMovementCost === null) {
      return null;
    }

    /** TODO not a unit hook, but a position/tile hook! */
    return player.getHook("movementCost")?.(baseMovementCost, player.match) ?? baseMovementCost;
  }

  addUnwrappedUnit(unit: WWUnit) {
    this.units.data.push(new UnitWrapper(unit, this));
  }
}
