export const groupByKey = (arr, key) => {
  const map = new Map()
  for (const obj of arr) {
    if (map.has(obj[key])) {
      map.get(obj[key]).push(obj)
    } else {
      map.set(obj[key], [obj])
    }
  }
  return map
}
