import { DispatchableError } from "shared/DispatchedError";
import type { AttackAction } from "shared/schemas/action";
import { unitPropertiesMap } from "../../game-constants/unit-properties";
import { calculateDamage, getVisualHPfromHP } from "../../calculate-damage";
import type { MatchWrapper } from "shared/wrappers/match";
import type { Position } from "shared/schemas/position";
import type { AttackEvent } from "shared/types/events";
import type { SubActionToEvent } from "../handler-types";
import { getDistance } from "shared/schemas/position";
import type { UnitWrapper } from "../../../wrappers/unit";
import { canAttackWithPrimary, getBaseDamage } from "../../game-constants/base-damage";
import type { PlayerInMatchWrapper } from "shared/wrappers/player-in-match";

export type LuckRoll = {
  goodLuck: number,
  badLuck: number
};
type Params = [
  ...Parameters<SubActionToEvent<AttackAction>>,
  unitHasMoved: boolean,
  attackerLuck: LuckRoll,
  defenderLuck: LuckRoll
];

const calculateEngagementOutcome = (
  attacker: UnitWrapper,
  defender: UnitWrapper,
  attackerLuck: LuckRoll,
  defenderLuck: LuckRoll
): {defenderHP: number, attackerHP: number | undefined} => {

  let damageByAttacker = calculateDamage(
    {
      attacker,
      defender
    },
    attackerLuck,
    false
  );

  if (damageByAttacker === null) {
    damageByAttacker = 0; // this is necessary cause sonja scop reverses attacker and defender
  }

  //check if ded
  if (damageByAttacker >= defender.getHP()) {
    /*
     * TODO IMPORTANT i think we must have a "unit was destroyed" flag on an event
     * bc a client can't tell on sonya units cuz they are effectively always full HP
     */
    return {
      defenderHP: 0,
      attackerHP: undefined
    };
  }

  //check if defender can counterattack
  if (getDistance(attacker.data.position, defender.data.position) === 1) {
    if (
      "attackRange" in defender.properties &&
      defender.properties.attackRange[1] === 1
    ) {
      //defender is melee, maybe can counterattack
      //temporarily subtract hp to calculate counter dmg
      const originalHP = defender.getHP();
      defender.setHp(originalHP - damageByAttacker);

      const damageByDefender = calculateDamage(
        {
          attacker: defender,
          defender: attacker
        },
        defenderLuck,
        true
      );

      defender.setHp(originalHP);

      if (damageByDefender !== null) {
        //return event with counter-attack
        return {
          defenderHP: defender.getHP() - damageByAttacker,
          attackerHP: Math.max(0, attacker.getHP() - damageByDefender)
        };
      }
    }
  }

  return {
    defenderHP: defender.getHP() - damageByAttacker,
    attackerHP: undefined
  };
};

function getEliminationReason({
  attacker,
  defender,
  attackerHP,
  defenderHP
}: {
  attacker: PlayerInMatchWrapper;
  defender: PlayerInMatchWrapper;
  attackerHP: number | undefined;
  defenderHP: number | undefined;
}): AttackEvent["eliminationReason"] {
  if (defenderHP === 0 && defender.getUnits().length - 1 <= 0) {
    return "all-defender-units-destroyed";
  }

  if (attackerHP === 0 && attacker.getUnits().length - 1 <= 0) {
    return "all-attacker-units-destroyed";
  }

  return undefined;
}

export const attackActionToEvent: (...params: Params) => AttackEvent = (
  match,
  action,
  fromPosition,
  unitHasMoved, // for indirects not attacking and shooting
  attackerLuck,
  defenderLuck
) => {
  const player = match.getCurrentTurnPlayer();

  const attacker = match.getUnitOrThrow(fromPosition);

  if (attacker.data.playerSlot !== player.data.slot) {
    throw new DispatchableError("You don't own this unit")
  }

  const defender = match.getUnitOrThrow(action.defenderPosition);
  
  if (defender.player.team.index === player.team.index) {
    throw new DispatchableError("The target unit is from your own team")
  }

  //check if unit is in range
  const attackerProperties = unitPropertiesMap[attacker.data.type];

  if (!("attackRange" in attackerProperties)) {
    throw new DispatchableError("Unit cannot attack");
  }

  if (attackerProperties.attackRange[0] > 1 && unitHasMoved) {
    throw new DispatchableError("Trying to move and attack with an indirect unit");
  }

  if (!attacker.player.team.getVision().isPositionVisible(action.defenderPosition)) {
    throw new DispatchableError("The target unit is not in vision");
  }

  if (getBaseDamage(attacker, defender) === null) {
    throw new DispatchableError("This unit cannot attack specified enemy unit");
  }

  const attackDistance = getDistance(
    attacker.data.position,
    defender.data.position
  );


  let maximumAttackRange = attackerProperties.attackRange[1] - (match.currentWeather === "sandstorm" ? 1 : 0);
  maximumAttackRange =
    attacker.player.getHook("attackRange")?.(maximumAttackRange, {attacker, defender}) ?? maximumAttackRange;

  // we'll need this logic to prevent e.g. Max from having
  // [2, 1] artillery attack range in sandstorms.
  maximumAttackRange = Math.max(attackerProperties.attackRange[0], maximumAttackRange);

  if (
    attackerProperties.attackRange[0] > attackDistance ||
    attackDistance > maximumAttackRange
  ) {
    throw new DispatchableError("Unit is not in range to attack");
  }

  // sonja scop exception (she attacks first when attacked)
  if (defender.player.data.coId.name === "sonja" && defender.player.data.COPowerState === "super-co-power") {
    // "defender" is sonja unit with scop, "attacker" is unit that attacked sonja unit
    const result = calculateEngagementOutcome(
      defender,
      attacker,
      defenderLuck,
      attackerLuck
    );

    if (result.attackerHP === undefined) {
      // that means sonja scop unit killed attacker, so they couldn't "counterattack" the sonja unit
      // therefore, sonja unit (defender) remains untouched
      result.attackerHP = defender.getHP();
    }

    return {
      ...action,
      defenderHP: result.attackerHP,
      attackerHP: result.defenderHP,
      eliminationReason: getEliminationReason({
        attacker: attacker.player, // TODO not sure if this is the correct way around...
        defender: defender.player,
        attackerHP: result.defenderHP,
        defenderHP: result.attackerHP
      })
    };
  }

  const result = calculateEngagementOutcome(
    attacker,
    defender,
    attackerLuck,
    defenderLuck
  );
  return {
    ...action,
    defenderHP: result.defenderHP,
    attackerHp: result.attackerHP,
    eliminationReason: getEliminationReason({
      attacker: attacker.player,
      defender: defender.player,
      attackerHP: result.attackerHP,
      defenderHP: result.defenderHP
    })
  };
};

export const getPowerChargeGain = (
  attacker: UnitWrapper,
  attackerHpDiff: number,
  defender: UnitWrapper,
  defenderHpDiff: number
) => {
  //power meter charge
  const attackerVP = attacker.player.getVersionProperties();
  const defenderVP = defender.player.getVersionProperties();

  return {
    attackerPowerCharge: attackerVP.powerMeterIncreasePerHP(attacker) * attackerHpDiff +
      attackerVP.powerMeterIncreasePerHP(defender) * defenderHpDiff * attackerVP.offensivePowerGenMult,
    defenderPowerCharge: defenderVP.powerMeterIncreasePerHP(defender) * defenderHpDiff +
      defenderVP.powerMeterIncreasePerHP(attacker) * attackerHpDiff * defenderVP.offensivePowerGenMult
  };
}

export const applyAttackEvent = (
  match: MatchWrapper,
  event: AttackEvent,
  position: Position
) => {
  const attacker = match.getUnitOrThrow(position);
  const defender = match.getUnitOrThrow(event.defenderPosition);

  //Calculate visible hp difference:
  const attackerHpDiff = attacker.getVisualHP() - getVisualHPfromHP(event.attackerHP ?? attacker.getVisualHP());
  const defenderHpDiff = defender.getVisualHP() - getVisualHPfromHP(event.defenderHP);

  //sasha scop funds
  if (attacker.player.data.coId.name === "sasha" && attacker.player.data.COPowerState === "super-co-power") {
    attacker.player.data.funds += defenderHpDiff * defender.getBuildCost() / 10 * 0.5;
  }

  if (defender.player.data.coId.name === "sasha" && defender.player.data.COPowerState === "super-co-power") {
    defender.player.data.funds += attackerHpDiff * attacker.getBuildCost() / 10 * 0.5;
  }

  const {attackerPowerCharge, defenderPowerCharge} = getPowerChargeGain(
    attacker,
    attackerHpDiff,
    defender,
    defenderHpDiff
  );

  attacker.player.gainPowerCharge(attackerPowerCharge);
  defender.player.gainPowerCharge(defenderPowerCharge);

  //ammo consumption
  if (canAttackWithPrimary(attacker, defender)) {
    attacker.setAmmo((attacker.getAmmo() ?? 1) - 1);
  }

  if (event.attackerHP !== undefined && canAttackWithPrimary(defender, attacker)) {
    defender.setAmmo((defender.getAmmo() ?? 1) - 1);
  }


  //hp updates (+ removal if unit dies)
  if (event.defenderHP === 0) {
    defender.remove();
  } else {
    defender.setHp(event.defenderHP);
  }

  if (event.attackerHP !== undefined) {
    if (event.attackerHP === 0) {
      attacker.remove();
    } else {
      attacker.setHp(event.attackerHP);
    }
  }
};


/**
 * Apply move event
 * Create emittable sub events (for all players at once, as an array of emittable events)
 * Create emittable move events
 * Apply sub event
 */

export const attackEventInFog = (
  attackEvent: AttackEvent,
  fromPosition: Position,
  match: MatchWrapper,
  viewerSlot: number
) => {
  const player = match.getPlayerBySlot(viewerSlot);

  if (player === undefined) {
    return undefined;
  }

  const attacker = match.getUnit(fromPosition);

}