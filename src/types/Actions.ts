export type PlayerId = 1 | 2;

export type Action =
  | 'PUNCH'
  | 'KICK'
  | 'BLOCK_DOWN'
  | 'BLOCK_UP'
  | 'WALK_LEFT'
  | 'WALK_RIGHT'
  | 'PAUSE_TOGGLE';

export type PlayerAction = `P${PlayerId}_${Action}`;

export const PLAYER_ACTIONS: Record<PlayerId, Record<Action, PlayerAction>> = {
  1: {
    PUNCH: 'P1_PUNCH',
    KICK: 'P1_KICK',
    BLOCK_DOWN: 'P1_BLOCK_DOWN',
    BLOCK_UP: 'P1_BLOCK_UP',
    WALK_LEFT: 'P1_WALK_LEFT',
    WALK_RIGHT: 'P1_WALK_RIGHT',
    PAUSE_TOGGLE: 'P1_PAUSE_TOGGLE'
  } as Record<Action, PlayerAction>,
  2: {
    PUNCH: 'P2_PUNCH',
    KICK: 'P2_KICK',
    BLOCK_DOWN: 'P2_BLOCK_DOWN',
    BLOCK_UP: 'P2_BLOCK_UP',
    WALK_LEFT: 'P2_WALK_LEFT',
    WALK_RIGHT: 'P2_WALK_RIGHT',
    PAUSE_TOGGLE: 'P2_PAUSE_TOGGLE'
  } as Record<Action, PlayerAction>
};

export type InputEvent = {
  type: PlayerAction;
  pressed: boolean;
};

export const GLOBAL_ACTIONS = {
  PAUSE: 'PAUSE_TOGGLE'
} as const;
