import { App } from "./classes/App"

let limitedLogLimit = 300
let limitedLogCount = 0

console.logLimited = (...log) => {
  limitedLogCount++
  if (limitedLogCount <= limitedLogLimit) console.log(...log)
  if (limitedLogCount == limitedLogLimit) console.log("LOG LIMIT REACHED")
}

window.DEBUG = {
  /* 
    Show FPS meter.
  */
  fps: false,
  /*
    Show current app state
    and available state actions
    as defined in the app-machine
  */
  appState: false,
  /* 
    Show information about the 
    the available spells, the current
    spell being drawn and confidence
    score for each
  */
  casting: false,
  /* 
    Add yellow arrows that show the 
    particle sim flow field, this is 
    a vector grid that applies directional
    and speed influence on each particle
  */
  simFlow: false,
  /* 
    The flow field also has noise
    applied to it. This shows those
    values with red arrows.
  */
  simNoise: false,
  /* 
    Some particles are invisible
    and just there to apply force
    to the flow field. Setting this
    to true renders them as red 
    particles
  */
  forceParticles: false,
  locations: false,
  entrances: false,
  lights: false,
  trail: false,
  disableSounds: false,
  allowLookAtMoveWhenPaused: true,
  layoutDebug: false,
}

const app = new App()
