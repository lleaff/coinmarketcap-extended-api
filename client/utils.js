import request from 'request-promise-native'
import fromPairs from 'lodash/fromPairs'

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

export const fetchJson = async (url, options={}) => {
  const { retries=0, errorPrefix='fetchJson', } = options
  let requestOptions = {
    uri: url,
    json: true,
  }
  let result
  try {
    result = await request(requestOptions)
    if (!result) {
      console.error(`[${errorPrefix}] Empty response: `, result)
    }
  } catch(e) {
    if (e.name !== 'RequestError') { throw(e) }
    if (e.cause && e.cause.code === 'ECONNREFUSED') {
      console.error(`[${errorPrefix}]: Couldn't connect. Error:\n`, e)
      if (retries) {
        console.error(`[${errorPrefix}]: Retrying... (${retries} retries left)`)
        return await fetchJson(url, {
          ...options,
          retries: Math.max(retries - 1, 0),
        })
      }
      return null
    }
  }
  return result
}

export const applyTransforms = (raw, transforms) => fromPairs(transforms.map(
  ({ key, newKey, transform=(a=>a) }) => ([newKey, transform(raw[key])])
))

export const mapObjectValues = (obj, transform) => fromPairs(
  Object.entries(obj).map(([key, val]) => [key, transform(val)])
)
