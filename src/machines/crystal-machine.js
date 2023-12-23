import { createMachine } from "xstate"

const CrystalMachine = createMachine(
  {
    id: "Crystal",
    initial: "IDLE",
    states: {
      IDLE: {
        on: {
          start: {
            target: "INIT",
          },
        },
      },
      INIT: {
        on: {
          ready: {
            target: "WHOLE",
          },
        },
      },
      WHOLE: {
        on: {
          overload: {
            target: "OVERLOADING",
          },
        },
      },
      OVERLOADING: {
        on: {
          break: {
            target: "BREAKING",
          },
        },
      },
      BREAKING: {
        on: {
          broke: {
            target: "BROKEN",
          },
        },
      },
      BROKEN: {
        on: {
          fix: {
            target: "FIXING",
          },
        },
      },
      FIXING: {
        on: {
          fixed: {
            target: "WHOLE",
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

export { CrystalMachine }
