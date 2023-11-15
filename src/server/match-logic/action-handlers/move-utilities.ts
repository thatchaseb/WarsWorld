import { TRPCError } from "@trpc/server";
import { Direction } from "server/schemas/direction";
import { Path, Position, isSamePosition } from "server/schemas/position";
import { WWUnit } from "server/schemas/unit";

/**
 * TODO
 * most of this system is needlessly convoluted.
 * it should be rewritten in a way where we don't use "deflated paths" for now
 * and without any "pre-checks" like diagonal etc.
 * and then just walk through the path positions one by one
 * and on each position check if it's a neighbour from the previous one
 * and it's not obstructed/off-grid and movement points aren't depleted.
 *
 * doing it this way will prevent jumps and we can add duplicate position checks easily later on
 * but afaik AWBW doesn't check for running back and forth so neither do we need to, even though
 * Advance Wars doesn't allow this (our frontend code won't allow to draw a path like that
 * but it would be possible to submit a path like that).
 */

/**
 * Diagonal movement must be explicit, so there must not be changes to both X and Y between corner positions.
 */
const throwIfPathIsAmbiguous = (path: Path) => {
  path.forEach((nextPosition, index) => {
    const previousPosition = path[index - 1];

    const xHasChanged = previousPosition[0] !== nextPosition[0];
    const yHasChanged = previousPosition[1] !== nextPosition[1];

    if (xHasChanged && yHasChanged) {
      throw new Error(
        "Path is ambiguous (one position to the next changes both X and Y)"
      );
    }
  });
};

/**
 * Duplicate positions are not allowed because they'd mess up inflatePath.
 * Alternative we could allow duplicates but deduplicate them before further processing.
 *
 * TODO change this from "subsequent" to make sure all positions in the path are unique because
 * units can't cross their own path.
 */
const throwIfPathContainsDuplicatePositions = (path: Path) => {
  path.forEach((currentPosition, index) => {
    const previousPosition = path[index - 1];

    if (
      previousPosition !== undefined &&
      isSamePosition(previousPosition, currentPosition)
    ) {
      throw new Error(
        "Duplicate, subsequent positions are not allowed in a path"
      );
    }
  });
};

export const throwIfUnitIsWaited = (unit: WWUnit) => {
  if (!unit.isReady) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You can't move a waited unit",
    });
  }
};

const getDirectionToGoFromOneToAnotherPosition = (
  currentPosition: Position,
  nextPosition: Position
): Direction => {
  if (nextPosition[0] === currentPosition[0]) {
    return nextPosition[1] > currentPosition[1] ? "down" : "up";
  }

  if (nextPosition[1] === nextPosition[1]) {
    throw new Error(
      "Can't determine the direction between two positions with same X & Y"
    );
  }

  return nextPosition[0] > currentPosition[0] ? "right" : "left";
};

const getNewPositionByApplyingDirectionOnce = (
  position: Position,
  direction: Direction
): Position => {
  const xChange = direction === "right" ? 1 : direction === "left" ? -1 : 0;
  const yChange = direction === "down" ? -1 : direction === "up" ? -1 : 0;

  return [position[0] + xChange, position[1] + yChange];
};

const getAllPositionsBetweenTwoPositions = (
  positionA: Position,
  positionB: Position | undefined
): Path => {
  if (positionB === undefined) {
    return [];
  }

  const directionToMoveIn = getDirectionToGoFromOneToAnotherPosition(
    positionA,
    positionB
  );

  const positions: Position[] = [];

  // while last added position isn't equal to positionB
  while (
    positions.at(-1)?.[0] !== positionB[0] &&
    positions.at(-1)?.[1] !== positionB[1]
  ) {
    const previousPosition = positions.at(-1) ?? positionA;
    positions.push(
      getNewPositionByApplyingDirectionOnce(previousPosition, directionToMoveIn)
    );
  }

  return positions.slice(0, -1); // last position is equal to positionB and we only want in-between
};

/** Fills the gaps between all path corners. */
const inflatePath = (path: Path): Path => {
  return path.reduce<Path>((previousPositions, currentPosition, index) => {
    const nextPosition = path[index + 1]; // can be undefined (last position), then positionsBetween will be empty
    const positionsBetween = getAllPositionsBetweenTwoPositions(
      currentPosition,
      nextPosition
    );
    return [...previousPositions, currentPosition, ...positionsBetween];
  }, []);
};
