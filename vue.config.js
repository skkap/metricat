// https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/configuration.html#configuring-electron-builder
module.exports = {
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
            builderOptions: {
                "appId": "com.skkap.metricat",
                "productName": "Metricat",
                "win": {
                    "target": "nsis",
                    "icon": "build/icon.ico"
                },
                "linux": {
                    "executableName": "Metricat",
                    "synopsis": "Prometheus metrics viewer.",
                    "description": "Metricat is a metrics viewer for Prometheus exporters. Think of it as a portable Grafana on your desktop.",
                    "category": "Development"
                },
                "mac": {
                    // https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/
                    "category": "public.app-category.developer-tools",
                    "hardenedRuntime": true,
                    "gatekeeperAssess": false,
                    "entitlements": "./build/entitlements.mac.inherit.plist",
                    "entitlementsInherit": "./build/entitlements.mac.inherit.plist"
                },
                "afterSign": "./build/notarize.js",
                "dmg": {
                    "sign": false
                },
            }
        }
    }
}
