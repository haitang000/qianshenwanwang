const { app, BrowserWindow } = require('electron');
const path = require('path');

// 确保应用程序只运行一个实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // 当用户尝试打开第二个实例时，聚焦到已有的窗口
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    // 保持对窗口对象的全局引用，如果不这样做，当JavaScript对象被垃圾回收时，窗口将自动关闭
    let mainWindow;

    function createWindow() {
        // 创建浏览器窗口
        mainWindow = new BrowserWindow({
            width: 1024,
            height: 768,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            },
            title: '千神万王',
            icon: path.join(__dirname, 'assets', 'icon.ico')
        });

        // 加载应用的index.html
        mainWindow.loadFile('index.html');

        // 打开开发者工具
        // mainWindow.webContents.openDevTools();

        // 窗口关闭时触发
        mainWindow.on('closed', function () {
            // 取消引用窗口对象，如果应用支持多窗口，通常会将多个窗口存储在数组中
            // 此时应该删除相应的元素
            mainWindow = null;
        });

        // 禁止默认菜单
        mainWindow.setMenu(null);
    }

    // Electron完成初始化并准备创建浏览器窗口时调用此方法
    app.on('ready', createWindow);

    // 所有窗口关闭时退出应用
    app.on('window-all-closed', function () {
        // 在macOS上，除非用户用Cmd+Q明确退出，否则应用程序及其菜单栏通常保持活动状态
        if (process.platform !== 'darwin') app.quit();
    });

    app.on('activate', function () {
        // 在macOS上，当点击dock图标且没有其他窗口打开时，通常会在应用程序中重新创建一个窗口
        if (mainWindow === null) createWindow();
    });

    // 在这个文件中，可以包含应用程序的其他主进程代码
    // 也可以将它们放在单独的文件中，并在此处引用
}