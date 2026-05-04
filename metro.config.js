const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

const { blockList } = config.resolver
const blockListRegex = Array.isArray(blockList) ? blockList : blockList ? [blockList] : []
config.resolver.blockList = [
  ...blockListRegex,
  /.*\.(test|spec)\.[jt]sx?$/,
  /.*\/__tests__\/.*/,
  /.*\/__mocks__\/.*/,
]

module.exports = config
