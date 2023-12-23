import { createMachine } from "xstate"

export const EnemyMachine = createMachine(
  {
    id: "Enemy",
    initial: "IDLE",
    states: {
      IDLE: {
        on: {
          spawn: {
            target: "ANIMATING_IN",
            internal: false,
          },
        },
      },
      ANIMATING_IN: {
        on: {
          complete: {
            target: "ALIVE",
            internal: false,
          },
          accend: {
            target: "ACCEND",
            internal: false,
          },
        },
      },
      ALIVE: {
        on: {
          incoming: {
            target: "TAGGED",
            internal: false,
          },
          accend: {
            target: "ACCEND",
            internal: false,
          },
          vortex: {
            target: "VORTEX_ANIMATION",
          },
        },
      },
      ACCEND: {
        on: {
          leave: {
            target: "GONE",
            internal: false,
          },
        },
      },
      TAGGED: {
        on: {
          kill: {
            target: "ANIMATING_OUT",
            internal: false,
          },
          accend: {
            target: "ANIMATING_OUT",
          },
        },
      },
      VORTEX_ANIMATION: {
        on: {
          complete: {
            target: "DEAD",
          },
        },
      },
      GONE: {},
      ANIMATING_OUT: {
        on: {
          complete: {
            target: "DEAD",
            internal: false,
          },
        },
      },
      DEAD: {},
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
  },
  {
    actions: {},
    services: {},
    guards: {},
    delays: {},
  }
)
