export function fromPairs(arr) {
  const o = {}
  for (const [key, val] of arr) {
    o[key] = val
  }
  return o
}

