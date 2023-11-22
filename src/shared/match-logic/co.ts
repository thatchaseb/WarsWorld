import type { CO } from "shared/schemas/co";
import type { MatchWrapper } from "shared/wrappers/match";
import type { PlayerInMatchWrapper } from "shared/wrappers/player-in-match";
import type { Hooks } from "./co-hooks";
import { adder } from "./cos/adder";
import { andy } from "./cos/andy";
import { colin } from "./cos/colin";
import { drake } from "./cos/drake";
import { eagle } from "./cos/eagle";
import { grit } from "./cos/grit";
import { hawke } from "./cos/hawke";
import { javier } from "./cos/javier";
import { lash } from "./cos/lash";

type InstantEffectProps = {
  match: MatchWrapper;
  player: PlayerInMatchWrapper;
};

type COPower = {
  name: string;
  description: string;
  stars: number;
  instantEffect?: (props: InstantEffectProps) => void;
  hooks?: Partial<Hooks>;
};

// TODO general CO description, likes, dislikes, etc.
export type COProperties = {
  displayName: string;
  dayToDay?: {
    description: string;
    hooks: Partial<Hooks>;
  };
  powers: {
    COPower?: COPower;
    superCOPower: COPower;
  };
};

// @ts-expect-error: Working on the other CO's i think
export const COPropertiesMap: Record<CO, COProperties> = {
  andy,
  adder,
  drake,
  eagle,
  grit,
  hawke,
  javier,
  lash,
  colin
};
