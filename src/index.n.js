const { app, BrowserWindow, ipcMain, Menu, Tray, dialog, screen, Notification } = require('electron');
const moment = require('moment');
const fs = require('fs');
const path = require('node:path');
const settings = require('./config.n');
var Twig = require('twig'), // Twig module
  twig = Twig.twig;
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(__dirname + '/' + settings.database.file);
let win;
let range = null;
let total_global = 0;
async function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  var { width, height } = primaryDisplay.workAreaSize
  width = Math.round(width - (width * settings.electron.scale_width_percentage));
  height = Math.round(height - (height * settings.electron.scale_height_percentage));
  win = new BrowserWindow({
    title: settings.name + ' ' + settings.version,
    width: width,
    height: height,
    minWidth: (1200 < width) ? 1200 : width,
    minHeight: (450 < height) ? 450 : height,
    'accept-first-mouse': true,
    icon: __dirname + '/icons/icon.ico',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.n.js'),
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  win.setResizable(true);
  win.loadFile(path.join(__dirname + "/template", 'index.html'));
  if (settings.electron.debug) {
    win.webContents.openDevTools();
  }
  win.on('closed', function () {
    win = null;
  });
  win.setMenu(null);
  tray = new Tray(__dirname + '/icons/icon.ico');
  const contextMenu = Menu.buildFromTemplate([{
    label: 'Открыть',
    click: function () {
      win.show();
    },
  },
  {
    label: 'Закрыть',
    click: function () {
      app.isQuiting = true;
      db.close();
      app.quit();
    },
  },
  ]);
  tray.setToolTip(settings.name + ' ' + settings.version);
  tray.setContextMenu(contextMenu);
  tray.on('double-click', function () {
    win.show();
  });
  win.on('close', function (event) {
    if (!app.isQuiting) {
      event.preventDefault();
      win.hide();
    }
    return false;
  });
  ipcMain.on('controll', (event, status) => {
    const webContents = event.sender
    const win = BrowserWindow.fromWebContents(webContents)
    switch (status) {
      case 0:
        dialog.showMessageBox(null, {
          type: 'warning',
          buttons: ['Да', 'Оставить в фоне'],
          title: 'Выход',
          message: 'Вы точно хотите закрыть приложение?'
        }).then((data) => {
          if (data.response == 0) {
            app.isQuiting = true;
            db.close();
            app.quit();
          } else {
            win.hide();
          }
        });
        break;
      case 1:
        win.minimize();
        break;
      case 2:
        if (win.isMaximized() === true) {
          win.unmaximize();
        }
        else {
          win.maximize()
        }
        break;

    }

  })
  ipcMain.on('debug', (event, data) => {
    console.log(data);
  });
  ipcMain.on('setRange', (event, data) => {
    range = data;
    db.run("UPDATE setting SET value = " + data[0] + " WHERE name = 'last_range_from'");
    db.run("UPDATE setting SET value = " + data[1] + " WHERE name = 'last_range_to';");
  });
  ipcMain.on('getData', (e) => {
    var result = {
      range: range,
      data: [],
      settings: {},
    };
    var settings = {};
    db.all("SELECT * FROM setting", (err, rows) => {
      if (err) {
        throw err;
      }
      rows.forEach((row) => {
        settings[row.name] = parseInt(row.value)
      });
      total_global = settings["total"];
      if (!range) {
        range = [settings["last_range_from"], settings["last_range_to"]];
        result.range = range;
      }
      db.all("SELECT * FROM days WHERE timestamp BETWEEN " + range[0] + " AND " + range[1] + " ORDER BY timestamp ASC", (err, rows) => {
        if (err) {
          throw err;
        }
        rows.forEach((row) => {
          var date = moment.unix(row.timestamp);
          if (!result.data[date.week()]) {
            result.data[date.week()] = {}
          }
          result.data[date.week()][date.day()] = row;
        });
        result.settings = settings;
        e.returnValue = result;
      });
    });
  });
  ipcMain.on('addDay', (event, data) => {
    var total = 0;
    var negative = 0 - data.porog;
    if (data.value < negative) {
      total = 0 - Math.abs(parseFloat(data.value) - ((negative - data.value) * 0.20))
    } else {
      if (data.value < 0) {
        total = data.value
      } else {
        total = data.value - ((data.value * data.percentage) / 100);
      }
    }
    db.run("INSERT INTO days VALUES (null," + data.date + "," + data.value + "," + data.porog + "," + data.percentage + "," + total + ")");
    db.run("UPDATE setting SET value = " + data.porog + " WHERE name = 'last_porog'");
    db.run("UPDATE setting SET value = " + data.percentage + " WHERE name = 'last_percentage'");
    db.run("UPDATE setting SET value = " + (total+total_global) + " WHERE name = 'total'");
    new Notification({ title: settings.name, body: "Данные внесены" }).show()
    return true;
  });
  ipcMain.on('editDay', (event, data) => {
    var total = 0;
    var negative = 0 - data.porog;
    if (data.value < negative) {
      total = 0 - Math.abs(parseFloat(data.value) - ((negative - data.value) * 0.20))
    } else {
      if (data.value < 0) {
        total = data.value
      } else {
        total = data.value - ((data.value * data.percentage) / 100);
      }
    }
    total_global -= data.old_total;
    db.run("UPDATE days SET value = "+data.value+", minus_delta = "+data.porog+", percentage = "+data.percentage+", total = "+total+", timestamp = "+data.date+" WHERE id = "+data.id);
    db.run("UPDATE setting SET value = " + (total+total_global) + " WHERE name = 'total'");
    new Notification({ title: settings.name, body: "Данные обновлены" }).show()
    return true;
  });
  ipcMain.on('setBalance', (event, data) => {
    db.run("UPDATE setting SET value = " + (data.value) + " WHERE name = 'total'");
    new Notification({ title: settings.name, body: "Данные обновлены" }).show()
    return true;
  });
  ipcMain.on('clearBase', (event, data) => {
    db.run("UPDATE setting SET value = 0 WHERE name = 'total'");
    db.run("DELETE FROM days");
    new Notification({ title: settings.name, body: "Данные обновлены" }).show()
    return true;
  });
  ipcMain.on('twig', (e, tpl, data) => {
    Twig.renderFile(__dirname + "/template/twig/" + tpl, data, (err, html) => {
      e.returnValue = html;
    });
  });
}
app.on('ready', createWindow);
