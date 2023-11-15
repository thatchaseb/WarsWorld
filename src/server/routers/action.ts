import { observable } from "@trpc/server/observable";
import { emitEvent, subscribeToEvents } from "server/emitter/event-emitter";
import { handleMoveAction } from "server/match-logic/action-handlers/move";
import { matchStore } from "server/match-logic/match-store";
import { prisma } from "server/prisma/prisma-client";
import { Action, mainActionSchema } from "server/schemas/action";
import { isSamePosition } from "server/schemas/position";
import { unitPropertiesMap } from "shared/match-logic/buildable-unit";
import { EmittableEvent, WWEvent } from "shared/types/events";
import { MatchWrapper } from "shared/wrappers/match";
import { PlayerInMatchWrapper } from "shared/wrappers/player-in-match";
import { z } from "zod";
import {
  matchBaseProcedure,
  publicBaseProcedure,
  router,
} from "../trpc/trpc-setup";

type ActionHandlerProps<T extends Action> = {
  currentPlayer: PlayerInMatchWrapper;
  action: T;
  matchState: MatchWrapper;
};

export type ActionHandler<T extends Action> = (
  props: ActionHandlerProps<T>
) => WWEvent;

// 1. validate shape (zod, .input())
// 2. validate action
// 3. create event from action

const validateAction = (
  action: Action,
  playerId: string,
  match: MatchWrapper
) => {
  const player = match.players.getById(playerId);

  if (player === undefined || player.data.hasCurrentTurn !== true) {
    throw new Error("You're not in this match or it's not your turn");
  }

  //TODO re-add this check, was unadded to test tRPC momentarily
  /*if (!actingPlayerInMatch.hasCurrentTurn) {
    throw new Error("It's not your turn");
  }*/

  switch (action.type) {
    case "build": {
      const { cost, facility } = unitPropertiesMap[action.unitType];
      // TODO hook: cost and facility modifiers based on powers etc.

      if (cost > player.data.funds) {
        throw new Error("You don't have enough funds to build this unit");
      }

      if (match.units.hasUnit(action.position)) {
        throw new Error("Can't build where there's a unit already");
      }

      if (
        match.changeableTiles.find(
          (t) =>
            isSamePosition(action.position, t.position) &&
            t.type === facility &&
            t.ownerSlot === player.data.slot
        )
      ) {
        throw new Error(
          "Can't build here because the tile is missing the correct build facility or you don't own it"
        );
      }

      break;
    }
    case "move": {
      handleMoveAction({
        currentPlayer: player,
        action,
        matchState: match,
      });
    }
  }
};

const actionToEvent = (matchId: string, action: Action): EmittableEvent => {
  switch (action.type) {
    case "build": {
      return {
        type: "build",
        matchId,
        position: action.position,
        unitType: action.unitType,
      };
    }
    default: {
      throw new Error(`Unknown action type ${action.type}`);
    }
  }
};

export const actionRouter = router({
  send: matchBaseProcedure
    .input(mainActionSchema)
    .mutation(async ({ input, ctx }) => {
      validateAction(input, ctx.currentPlayer.id, ctx.match);

      // important: validate all actions first before changing server state
      //            or persisting to DB

      const event = actionToEvent(input.matchId, input);

      await prisma.event.create({
        data: {
          matchId: input.matchId,
          content: event,
        },
      });

      matchStore.getOrThrow(input.matchId).applyEvent(event);
      emitEvent(event);

      return {
        status: "ok", // TODO not necessary?
      };
    }),
  onEvent: publicBaseProcedure.input(z.string()).subscription(({ input }) =>
    observable<EmittableEvent>((emit) => {
      const unsubscribe = subscribeToEvents(input, emit.next);
      return () => unsubscribe();
    })
  ),
});
