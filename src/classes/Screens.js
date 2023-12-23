import gsap from "gsap"
import { Flip } from "gsap/Flip"

gsap.registerPlugin(Flip)
export class Screens {
  constructor(appElement, machine) {
    this.body = document.body
    this.screensElement = this.body.querySelector(".screens")
    this.spellsInfoElement = document.querySelector(".spells")
    this.appElement = appElement
    this.machine = machine
    this.state = null

    this.spellCornerScreens = ["SETUP_GAME", "GAME_RUNNING", "ENDLESS_MODE", "SPECIAL_SPELL", "ENDLESS_SPECIAL_SPELL"]
    this.spellDetailScreens = ["INSTRUCTIONS_SPELLS", "SPELL_OVERLAY", "ENDLESS_SPELL_OVERLAY"]

    this.setupButtons()
  }

  setupButtons() {
    const buttons = [...this.appElement.querySelectorAll("[data-send]")]
    buttons.forEach((button) => {
      if (button.dataset.send) {
        button.addEventListener("click", () => this.machine.send(button.dataset.send))
      }
    })
  }

  update(newState) {
    this.state = newState
    this.appElement.dataset.state = this.state

    let delay = 1
    let screen = this.screensElement.querySelector(`[data-screen="${this.state}"]`)

    if (screen) {
      console.log("screen", screen)
      const fades = screen.querySelectorAll("[data-fade]")
      gsap.fromTo(
        fades,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, delay, duration: 1, stagger: 0.1, ease: "power2.out" }
      )
    }

    const state = Flip.getState("[data-flip-spell]")

    this.spellsInfoElement.classList[this.spellCornerScreens.includes(this.state) ? "add" : "remove"]("corner")
    this.spellsInfoElement.classList[this.spellDetailScreens.includes(this.state) ? "add" : "remove"]("full")

    const flipDelay = this.state === "INSTRUCTIONS_SPELLS" ? 1.5 : 0.6

    Flip.from(state, {
      duration: 0.8,
      ease: "power2.inOut",
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, y: 30 },
          { duration: 1, y: 0, delay: flipDelay, stagger: 0.1, opacity: 1, ease: "power2.out" }
        ),
      onLeave: (elements) => gsap.fromTo(elements, { opacity: 1 }, { opacity: 0 }),
    })
  }
}
