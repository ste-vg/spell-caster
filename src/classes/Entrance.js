import { CatmullRomCurve3, Group, Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from "three"

export class Entrance {
  constructor(name, points, enterFunc) {
    this.name = name
    this.points = points
    this.enterFunc = enterFunc
  }

  createPathTo(destination, offset, offsetFromDestination) {
    const shift = offsetFromDestination ? { ...destination } : { x: 0, y: 0, z: 0 }

    let waypoints = this.calculateEvenlySpacedVectors({ x: 0.5, y: 0.5, z: 0.5 }, destination, 5)

    let newPath = [...this.points, ...waypoints, destination].map((p) => ({
      x: p.x - shift.x,
      y: p.y - shift.y,
      z: p.z - shift.z,
    }))

    const curve = new CatmullRomCurve3(newPath.map((p) => new Vector3(p.x, p.y, p.z)))

    return curve
  }

  calculateEvenlySpacedVectors(center, vector1, numVectors = 2) {
    const angleBetweenVectors = (2 * Math.PI) / numVectors

    const x1 = vector1.x - center.x
    const z1 = vector1.z - center.z
    const radius = Math.sqrt(x1 ** 2 + z1 ** 2)

    const angle1 = Math.atan2(z1, x1)

    const evenlySpacedVectors = []

    for (let i = 1; i <= numVectors; i++) {
      const angle = angle1 + i * angleBetweenVectors
      const vector = {
        x: center.x + radius * Math.cos(angle),
        y: 0.2 + Math.random() * 0.6,
        z: center.z + radius * Math.sin(angle),
      }
      evenlySpacedVectors.push(vector)
    }

    return evenlySpacedVectors
  }

  createDebugMarkers(container, offset) {
    const group = new Group()

    this.points.forEach((p) => {
      const helper = new Mesh(new SphereGeometry(0.01), new MeshBasicMaterial({ color: 0xffffff }))
      helper.position.x = p.x * offset.x
      helper.position.y = p.y * offset.y
      helper.position.z = p.z * offset.z
      group.add(helper)
    })

    container.add(group)
  }

  enter() {
    if (this.enterFunc) this.enterFunc()
  }
}
