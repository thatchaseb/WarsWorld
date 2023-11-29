import { DispatchableError } from "shared/DispatchedError";
import { getFinalPositionSafe } from "shared/schemas/position";
import type { MatchWrapper } from "shared/wrappers/match";
import type { MainEvent, MoveEvent, SubEvent } from "../../types/events";
import { applyAbilityEvent } from "./handlers/ability";
import { applyAttackEvent } from "./handlers/attack";
import { applyBuildEvent } from "./handlers/build/build";
import { applyCOPowerEvent } from "./handlers/coPower";
import { applyLaunchMissileEvent } from "./handlers/launchMissile";
import { applyMoveEvent } from "./handlers/move";
import { applyPassTurnEvent } from "./handlers/passTurn";
import { applyRepairEvent } from "./handlers/repair";
import { applyUnloadNoWaitEvent } from "./handlers/unloadNoWait";
import { applyUnloadWaitEvent } from "./handlers/unloadWait";

//TODO: call subevents from move case? or different?
export const applyMainEventToMatch = (
  match: MatchWrapper,
  event: MainEvent
): void => {
  switch (event.type) {
    case "build": {
      applyBuildEvent(match, event);
      break;
    }
    case "move": {
      applyMoveEvent(match, event);
      break;
    }
    case "unloadNoWait": {
      applyUnloadNoWaitEvent(match, event);
      break;
    }
    case "coPower": {
      applyCOPowerEvent(match, event);
      break;
    }
    case "passTurn": {
      applyPassTurnEvent(match, event);
      break;
    }
    default: {
      throw new DispatchableError(`Can't apply main event type ${event.type}`);
    }
  }
};

export const applySubEventToMatch = (
  match: MatchWrapper,
  { subEvent, path }: MoveEvent
) => {
  const fromPosition = getFinalPositionSafe(path);
  const unit = match.units.getUnitOrThrow(fromPosition);

  switch (subEvent.type) {
    case "wait": {
      break;
    }
    case "attack": {
      applyAttackEvent(match, subEvent, fromPosition);
      break;
    }
    case "ability": {
      applyAbilityEvent(match, unit);
      break;
    }
    case "unloadWait": {
      applyUnloadWaitEvent(match, subEvent, fromPosition);
      break;
    }
    case "repair": {
      applyRepairEvent(match, subEvent, fromPosition);
      break;
    }
    case "launchMissile": {
      applyLaunchMissileEvent(match, subEvent);
      break;
    }
    default: {
      /**
       * TODO since the switch is exhaustive,
       * this could only possible run if there's incompatible data in a replay
       * where when we read from it, the data isn't validated by zod.
       * maybe remove?
       *
       * the exhaustiveness is the reason for `as SubEvent` because otherwise `event` is `never`.
       */
      throw new DispatchableError(
        `Can't apply sub event type ${(subEvent as SubEvent).type}`
      );
    }
  }

  unit.data.isReady = false;
};