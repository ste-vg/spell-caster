import { createMachine } from "xstate"

const AppMachine = createMachine(
  {
    id: "App",
    initial: "IDLE",
    states: {
      IDLE: {
        on: {
          load: {
            target: "LOADING",
            internal: false,
          },
        },
      },
      LOADING: {
        on: {
          error: {
            target: "LOAD_ERROR",
            internal: false,
          },
          complete: {
            target: "INIT",
            internal: false,
          },
        },
      },
      LOAD_ERROR: {
        on: {
          reload: {
            target: "LOADING",
            internal: false,
          },
        },
      },
      INIT: {
        on: {
          begin: {
            target: "TITLE_SCREEN",
            internal: false,
          },
        },
      },
      TITLE_SCREEN: {
        on: {
          next: {
            target: "INSTRUCTIONS_CRYSTAL",
            internal: false,
          },
          skip: {
            target: "SETUP_GAME",
            internal: false,
          },
          credits: {
            target: "CREDITS",
            internal: false,
          },
          endless: {
            target: "SETUP_ENDLESS",
            internal: false,
          },
          debug: {
            target: "SCENE_DEBUG",
          },
        },
      },
      INSTRUCTIONS_CRYSTAL: {
        on: {
          next: {
            target: "INSTRUCTIONS_DEMON",
            internal: false,
          },
        },
      },
      SETUP_GAME: {
        on: {
          run: {
            target: "GAME_RUNNING",
            internal: false,
          },
        },
      },
      CREDITS: {
        on: {
          close: {
            target: "TITLE_SCREEN",
            internal: false,
          },
          end: {
            target: "TITLE_SCREEN",
          },
        },
      },
      SETUP_ENDLESS: {
        on: {
          run: {
            target: "ENDLESS_MODE",
            internal: false,
          },
        },
      },
      SCENE_DEBUG: {
        on: {
          close: {
            target: "TITLE_SCREEN",
          },
        },
      },
      INSTRUCTIONS_DEMON: {
        on: {
          next: {
            target: "INSTRUCTIONS_CAST",
            internal: false,
          },
        },
      },
      GAME_RUNNING: {
        on: {
          pause: {
            target: "PAUSED",
            internal: false,
          },
          "game-over": {
            target: "GAME_OVER_ANIMATION",
            internal: false,
          },
          spells: {
            target: "SPELL_OVERLAY",
            internal: false,
          },
          win: {
            target: "WIN_ANIMATION",
          },
          special: {
            target: "SPECIAL_SPELL",
          },
        },
      },
      ENDLESS_MODE: {
        on: {
          end: {
            target: "CLEAR_ENDLESS",
            internal: false,
          },
          pause: {
            target: "ENDLESS_PAUSE",
            internal: false,
          },
          spells: {
            target: "ENDLESS_SPELL_OVERLAY",
          },
          special: {
            target: "ENDLESS_SPECIAL_SPELL",
          },
        },
      },
      INSTRUCTIONS_CAST: {
        on: {
          next: {
            target: "INSTRUCTIONS_SPELLS",
            internal: false,
          },
        },
      },
      PAUSED: {
        on: {
          resume: {
            target: "GAME_RUNNING",
            internal: false,
          },
          end: {
            target: "CLEAR_GAME",
          },
        },
      },
      GAME_OVER_ANIMATION: {
        on: {
          end: {
            target: "GAME_OVER",
            internal: false,
          },
        },
      },
      SPELL_OVERLAY: {
        on: {
          close: {
            target: "GAME_RUNNING",
            internal: false,
          },
        },
      },
      WIN_ANIMATION: {
        on: {
          end: {
            target: "WINNER",
          },
        },
      },
      SPECIAL_SPELL: {
        on: {
          complete: {
            target: "GAME_RUNNING",
          },
          win: {
            target: "WIN_ANIMATION",
          },
        },
      },
      CLEAR_ENDLESS: {
        on: {
          end: {
            target: "TITLE_SCREEN",
            internal: false,
          },
        },
      },
      ENDLESS_PAUSE: {
        on: {
          end: {
            target: "CLEAR_ENDLESS",
            internal: false,
          },
          resume: {
            target: "ENDLESS_MODE",
            internal: false,
          },
        },
      },
      ENDLESS_SPELL_OVERLAY: {
        on: {
          close: {
            target: "ENDLESS_MODE",
          },
        },
      },
      ENDLESS_SPECIAL_SPELL: {
        on: {
          complete: {
            target: "ENDLESS_MODE",
          },
        },
      },
      INSTRUCTIONS_SPELLS: {
        on: {
          next: {
            target: "SETUP_GAME",
            internal: false,
          },
        },
      },
      CLEAR_GAME: {
        on: {
          end: {
            target: "TITLE_SCREEN",
            internal: false,
          },
        },
      },
      GAME_OVER: {
        on: {
          restart: {
            target: "SETUP_GAME",
            internal: false,
          },
          instructions: {
            target: "RESETTING_FOR_INSTRUCTIONS",
            internal: false,
          },
          credits: {
            target: "RESETTING_FOR_CREDITS",
            internal: false,
          },
          endless: {
            target: "SETUP_ENDLESS",
            internal: false,
          },
        },
      },
      WINNER: {
        on: {
          restart: {
            target: "SETUP_GAME",
          },
          instructions: {
            target: "INSTRUCTIONS_CRYSTAL",
          },
          credits: {
            target: "CREDITS",
          },
          endless: {
            target: "SETUP_ENDLESS",
          },
        },
      },
      RESETTING_FOR_INSTRUCTIONS: {
        on: {
          run: {
            target: "INSTRUCTIONS_CRYSTAL",
          },
        },
      },
      RESETTING_FOR_CREDITS: {
        on: {
          run: {
            target: "CREDITS",
          },
        },
      },
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

export { AppMachine }
