export default {
  packagerConfig: {
    asar: true,
    osxSign: {},
    osxNotarize: {
      //@electron/notarize v2以降はnotarytool固定のためtoolオプションは廃止
      keychainProfile: 'do-gagan3_electron'
    },
    icon: "build/icon",
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
