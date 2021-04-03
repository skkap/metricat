import {
  app,
  protocol,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  MenuItem,
  powerSaveBlocker
} from "electron";
import {
  createProtocol
} from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import {
  WindowKind,
  windowConfigurations,
  WindowInstance
} from "./windows/WindowConfiguration";
import { Tracking } from "@/analytics/Tracking";
import { MetricsExportService } from "./export/MetricsExportService";

global["metricsExportService"] = new MetricsExportService();

const isDevelopment = process.env.NODE_ENV !== "production";

const tracking = new Tracking(app.getPath('userData'), app.getVersion());

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const windows: Map<string, WindowInstance> = new Map();

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { secure: true, standard: true } }]);

function createWindow(id: string, windowKind: WindowKind, parameters: string): void {
  // if window with this id exists will not create the second one
  if (windows.has(id)) {
    return;
  }

  const windowConfiguration = windowConfigurations.get(windowKind)!!;

  const window = new BrowserWindow({
    title: windowConfiguration.title,
    width: windowConfiguration.width,
    height: windowConfiguration.height,
    resizable: windowConfiguration.resizable,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    }
  });

  const windowOpenTime = new Date().getTime();

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    window.loadURL((process.env.WEBPACK_DEV_SERVER_URL as string) + "#/" + windowConfiguration.path + "?" + parameters);
    //if (!process.env.IS_TEST) window.webContents.openDevTools()
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    window.loadURL("app://./index.html/" + "#/" + windowConfiguration.path + "?" + parameters);
  }
  windows.set(id, new WindowInstance({
    id: id,
    windowKind: windowKind,
    instance: window
  }));

  window.on("page-title-updated", function (e) {
    // To keep correct window title
    e.preventDefault();
  });

  window.on('close', (e) => {
    if (windowConfiguration.confirmClosing) {
      const choice = dialog.showMessageBoxSync(window, {
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: windowConfiguration.confirmClosingString || "Are you sure you want to close?"
      });
      if (choice === 1) {
        e.preventDefault();
      }
    }
  });

  window.on("closed", () => {
    const windowInstance: WindowInstance | undefined = windows.get(id);
    if (windowInstance) {
      windows.delete(id);

      const windowOpenDuration = new Date().getTime() - windowOpenTime;
      tracking.timing("windowOpenDuration", windowConfiguration.path, windowOpenDuration);

      if (windowInstance.windowKind === WindowKind.RECORDING) {
        // If all reconding windows are closed, open connection window
        const firstRecordingWindow = Array.from(windows.values()).find(wi => wi.windowKind === WindowKind.RECORDING)
        if (!firstRecordingWindow) {
          createWindow("connection", WindowKind.CONNECTION, "");
        }
      }
    }
  });

  tracking.pageView(windowConfiguration.path);
}

function closeWindow(id: string) {
  const windowInstance: WindowInstance | undefined = windows.get(id);
  if (windowInstance) {
    windowInstance.instance.close();
  }
}

ipcMain.on("open-window", (event, id: string, windowKind: WindowKind, parameters: string) => {
  createWindow(id, windowKind, parameters);
});

ipcMain.on("close-connection-window", () => {
  closeWindow("connection");
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it"s common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (windows.size === 0) {
    createWindow("connection", WindowKind.CONNECTION, "");
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  };

  createWindow("connection", WindowKind.CONNECTION, "");

  // Don't suspend app so it can keep taking metrics.
  powerSaveBlocker.start("prevent-app-suspension");
});

const isMac = process.platform === "darwin";

const template = [
  ...(isMac ? [new MenuItem({
    label: "Metricat",
    submenu: [
      { role: "about" },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  })] : []),
  new MenuItem({
    label: "File",
    submenu: [
      {
        label: 'New connection',
        click: async () => {
          createWindow("connection", WindowKind.CONNECTION, "");
        }
      },
      { type: 'separator' },
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  }),
  new MenuItem({
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'delete' },
      { type: 'separator' },
      { role: 'selectAll' }
    ]
  }),
  ...(isDevelopment ? [new MenuItem({
    label: "View",
    submenu: [
      { role: 'togglefullscreen' },
      { role: 'toggleDevTools' }
    ]
  })] : [
      new MenuItem({
        label: "View",
        submenu: [
          { role: 'togglefullscreen' }
        ]
      })
    ])
]

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", data => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
