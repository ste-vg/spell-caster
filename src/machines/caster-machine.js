import { createMachine } from "xstate"

export const CasterMachine = createMachine(
  {
    id: "Caster",
    initial: "IDLE",
    states: {
      IDLE: {
        on: {
          ready: {
            target: "INACTIVE",
          },
        },
      },
      INACTIVE: {
        on: {
          activate: {
            target: "ACTIVE",
          },
        },
      },
      ACTIVE: {
        on: {
          start_cast: {
            target: "CASTING",
          },
          deactivate: {
            target: "INACTIVE",
          },
        },
      },
      CASTING: {
        on: {
          finished: {
            target: "PROCESSING",
          },
          deactivate: {
            target: "INACTIVE",
          },
        },
      },
      PROCESSING: {
        on: {
          success: {
            target: "SUCCESS",
          },
          fail: {
            target: "FAIL",
          },
          deactivate: {
            target: "INACTIVE",
          },
        },
      },
      SUCCESS: {
        on: {
          complete: {
            target: "ACTIVE",
          },
          deactivate: {
            target: "INACTIVE",
          },
        },
      },
      FAIL: {
        on: {
          complete: {
            target: "ACTIVE",
          },
          deactivate: {
            target: "INACTIVE",
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
