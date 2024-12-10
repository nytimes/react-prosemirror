module.exports = {
  displayName: "react-prosemirror",
  rootDir: "src",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  testPathIgnorePatterns: ["src/components/__tests__/ProseMirror.*.test.tsx"],
  moduleNameMapper: {
    "(.+)\\.js": "$1",
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
};
