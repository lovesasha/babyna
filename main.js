const {
	app, 
	BrowserWindow,
	globalShortcut
} = require('electron')
const path = require('path')
const url = require('url')

// 全局聊天信息，存放聊记录信息
global.chattingMessages = {}

// 调试模式--XHR网络连接调试时需要关闭
// app.commandLine.appendSwitch('remote-debugging-port', '9000')
// app.commandLine.appendSwitch('host-rules', 'MAP * 127.0.0.1')

// 主要窗体
let loginWindow
let mainWindow
// 其他窗体
let imageWindow    // 图片预览
let messageWindow  // 消息提示
let aboutWindow    // 关于应用

// 创建登录窗口
function createLoginWindow() {
	loginWindow = new BrowserWindow({
		width: 430,
		height: 340,
		resizable: false,
		frame: false,
		show: false,
		alwaysOnTop: true,
		skipTaskbar: true,
		transparent: true,
		useContentSize: true
	})

	loginWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'app/html/login.html'),
		protocol: 'file:',
		slashes: true
	}))
	// loginWindow.loadURL('http://localhost:3000/html/login.html')

	// 文档加载完后再显示窗口
	loginWindow.webContents.on('did-finish-load', function() {
		loginWindow.show()
	})

	loginWindow.on('focus', () => {
		globalShortcut.register('ctrl+w', () => {})
	})
	loginWindow.on('blur', () => {
		globalShortcut.unregister('ctrl+w')
	})

	loginWindow.on('closed', () => {
		loginWindow = null
	})
}

// 创建主界面窗口
function createMainWindow() {
	mainWindow = new BrowserWindow({
		width: 300,
		height: 640,
		minWidth: 280,
		minHeight: 550,
		maxWidth: 360,
		maxHeight: 730,
		maximizable: false,
		resizable: true,
		frame: false,
		show: false,
		alwaysOnTop: true,
		skipTaskbar: true,
		transparent: true,
		useContentSize: true
	})
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'app/html/main.html'),
		protocol: 'file:',
		slashes: true
	}))
	// mainWindow.loadURL('http://localhost:3000/html/main.html')

	// 根据屏幕宽高设置窗口位置
	const electronScreen = require('electron').screen
	const screenSize = electronScreen.getPrimaryDisplay().size
	let winSize = mainWindow.getSize()
	mainWindow.setPosition(screenSize.width-winSize[0]-20, 20)

	mainWindow.on('focus', () => {
		globalShortcut.register('ctrl+w', () => {})
	})
	mainWindow.on('blur', () => {
		globalShortcut.unregister('ctrl+w')
	})
}

// 应用就绪后加载窗口
app.on('ready', () => {
	// 创建登录窗口
	createLoginWindow()
	// 创建主界面窗口
	createMainWindow()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
	app.quit()
})
