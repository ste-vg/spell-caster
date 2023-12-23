export const lerp = (start, end, amount) => {
  return start + amount * (end - start)
}

export const randomFromArray = (arr) => {
  if (!arr || !arr.length) return null
  return arr[Math.floor(Math.random() * arr.length)]
}
