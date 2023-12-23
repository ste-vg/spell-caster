import { ArrowHelper, Box3, Box3Helper, Group, Vector3 } from "three"
import { vector } from "../utils"

export class SimViz {
  constructor(stage, sim, showDirection = true, showNoise = true) {
    this.stage = stage
    this.sim = sim

    this.container = new Group()
    this.stage.add(this.container)

    const box = new Box3()
    box.setFromCenterAndSize(new Vector3(0, 0, 0), this.sim.size)

    const helper = new Box3Helper(box, 0xffffff)
    this.container.add(helper)

    let x = 0
    let y = 0
    let z = 0
    this.directionArrows = []
    this.noiseArrows = []

    const offset = this.sim.offset

    for (let i = 0; i < this.sim.grid.points; i++) {
      const gridSpace = new Vector3(x, y, z)
      const dir = this.sim.getGridSpaceDirection(gridSpace)

      const origin = new Vector3(
        (x / this.sim.grid.x) * this.sim.size.x - this.sim.size.x * 0.5,
        (y / this.sim.grid.y) * this.sim.size.y - this.sim.size.y * 0.5,
        (z / this.sim.grid.z) * this.sim.size.z - this.sim.size.z * 0.5
      )

      origin.add(offset)
      const length = 0.05

      if (showDirection) {
        const directionArrowHelper = new ArrowHelper(dir, origin, length, 0xffff00, 0.02, 0.01)
        this.directionArrows.push({ helper: directionArrowHelper, gridSpace })
        this.container.add(directionArrowHelper)
      }

      if (showNoise) {
        const noiseArrowHelper = new ArrowHelper(dir, origin, length, 0xff0000, 0.02, 0.01)
        this.noiseArrows.push({ helper: noiseArrowHelper, gridSpace })
        this.container.add(noiseArrowHelper)
      }

      x++
      if (x >= this.sim.grid.x) {
        x = 0
        y++

        if (y >= this.sim.grid.y) {
          y = 0
          z++
        }
      }
    }
  }

  tick() {
    for (const arrow of this.directionArrows) {
      const direction = this.sim.getGridSpaceDirection(arrow.gridSpace)
      arrow.helper.setDirection(vector.normalize(direction))
      arrow.helper.setLength(Math.max(0.01, vector.length(direction) * 0.1))
    }

    for (const arrow of this.noiseArrows) {
      arrow.helper.setDirection(this.sim.getGridSpaceDirection(arrow.gridSpace, "noise"))
    }
  }
}
