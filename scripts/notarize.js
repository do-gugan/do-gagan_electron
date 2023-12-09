console.log("Running notarize.js...");

require('dotenv').config();
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    console.log("Windows");
    return;
  }
  console.log("macOS");

  const appName = context.packager.appInfo.productFilename;
  // console.log("appName: " + appName);
  // console.log("appPath: " + `${appOutDir}/${appName}.app`);
  // console.log("appleID: " + process.env.APPLEID);
  // console.log("appleIdPassword: " + process.env.APPLEIDPASS);
  // console.log("ascProvider: " + process.env.ASC_PROVIDER);

  //return await notarize({
  notarize({
    appBundleId: 'com.do-gugan.do-gagan',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
    ascProvider: process.env.ASC_PROVIDER,
  });
  console.log("Finished.");
};