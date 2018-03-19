export const spyOnMethods = (obj) => {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'function') {
      obj[key] = jest.fn(obj[key])
    }
  }
  for (const key of Object.getOwnPropertyNames(obj.__proto__)) {
    if (typeof obj.__proto__[key] === 'function') {
      obj[key] = jest.fn(obj.__proto__[key])
    }
  }
  return obj
}

