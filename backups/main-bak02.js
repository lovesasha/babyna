const {
	app, 
	BrowserWindow, 
	ipcMain,
	Menu,
	Tray,
	globalShortcut
} = require('electron')
const path = require('path')
const url = require('url')
const EventEmitter = require('events').EventEmitter

let event = new EventEmitter()

// 调试模式
app.commandLine.appendSwitch('remote-debugging-port', '9000')
app.commandLine.appendSwitch('host-rules', 'MAP * 127.0.0.1')

// 主要窗体
let loginWindow
let mainWindow
let chattingWindowPool = {}  // 存放聊天窗口
// 其他窗体
let imageWindow    // 图片预览
let messageWindow  // 消息提示
let aboutWindow    // 关于应用

let maxChattingWindowCount = 1  // 允许打开的最多聊天窗体数为8个，开发时设置成1
let chattingWindowLoadedNum = 0
let trayIcon
let flashTimer

// 创建登录窗口
function createLoginWindow() {
	loginWindow = new BrowserWindow({
		width: 430+10,
		height: 330+10,
		resizable: false,
		frame: false,
		show: false,
		alwaysOnTop: true,
		skipTaskbar: true,
		transparent: true
	})

	/*loginWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'app/html/login.html'),
		protocol: 'file:',
		slashes: true
	}))*/
	loginWindow.loadURL('http://localhost:3000/html/login.html')

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

	// 托盘图标
	trayIcon = new Tray(path.join(__dirname, 'app/img/icons/logo-dark.png'))
	/*const contextMenu = Menu.buildFromTemplate([
		{
			label: '打开主面板',
			click: function() {
				if (loginWindow) loginWindow.restore()
				if (mainWindow) mainWindow.restore()
			}
		},
		{
			label: '气泡',
			// icon: path.join(__dirname, 'app/img/icons/logo.png'),
			click: function() {
				trayIcon.displayBalloon({
					icon: path.join(__dirname, 'app/img/icons/logo.png'),
					title: '气泡',
					content: '一闪一闪亮晶晶\n漫天都是小星星'
				})
			}
		},
		{
			label: '闪烁',
			click: function() {
				if (! flashTimer) {
					// 托盘闪烁
					let flash
					flashTimer = setInterval(() => {
						if (flash) {
							trayIcon.setImage(path.join(__dirname, 'app/img/icons/logo.png'))
							flash = false
						} else {
							trayIcon.setImage(path.join(__dirname, 'app/img/icons/transparent.png'))
							flash = true
						}
					}, 400)
				} else {
					clearInterval(flashTimer)
					trayIcon.setImage(path.join(__dirname, 'app/img/icons/logo.png'))
					flashTimer = undefined
				}
			}
		},
		{type: 'separator'},
		{
			label: '退出',
			click: function() {
				app.quit()
			}
		}
	])*/
	const trayContextMenu = [
		{
			label: '打开主面板',
			click: function() {
				if (loginWindow) loginWindow.restore()
				if (mainWindow) mainWindow.restore()
			}
		},
		{
			label: '气泡',
			click: function() {
				trayIcon.displayBalloon({
					icon: path.join(__dirname, 'app/img/icons/logo.png'),
					title: '气泡',
					content: '一闪一闪亮晶晶\n漫天都是小星星'
				})
			}
		},
		{type: 'separator'},
		{
			label: '退出',
			click: function() {
				app.quit()
			}
		}
	]
	trayIcon.setToolTip('Babyna')
	// trayIcon.setContextMenu(contextMenu)

	let ContextMenu = require('E:/Electron/babyna/app/js/widgets/contextmenu')
	let contextMenu = ContextMenu.createContextMenu()

	trayIcon.on('click', (event, bounds) => {
		mainWindow.send('temp-msg', bounds)
		if (loginWindow) loginWindow.restore()
		if (mainWindow) mainWindow.restore()
	})
	trayIcon.on('right-click', (event, bounds) => {
		mainWindow.send('temp-msg', bounds)
		contextMenu.setMenuItems(trayContextMenu)
		contextMenu.show(bounds.x, bounds.y)
	})
}

// 创建托盘图标
function createTrayIcon() {

}

// 创建主界面窗口
function createMainWindow() {
	mainWindow = new BrowserWindow({
		width: 300,
		height: 640+10,
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
		transparent: true
	})
	/*mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'app/html/main.html'),
		protocol: 'file:',
		slashes: true
	}))*/
	mainWindow.loadURL('http://localhost:3000/html/main.html')

	mainWindow.webContents.on('context-menu', function (e, params) {
		mainWindow.send('temp-msg', params)
		e.preventDefault()
	})

	mainWindow.on('resize', () => {
		mainWindow.webContents.send('main-window-resize', mainWindow.getSize())
	})

	mainWindow.on('focus', () => {
		globalShortcut.register('ctrl+w', () => {})
	})
	mainWindow.on('blur', () => {
		globalShortcut.unregister('ctrl+w')
	})

	mainWindow.on('closed', () => {
		// exitApp()
	})
}

// 创建聊天窗口
function createChattingWindow(index) {
	// 根据屏幕宽高设置窗口最大尺寸
	const electronScreen = require('electron').screen
	const screenSize = electronScreen.getPrimaryDisplay().size

	let preWindow = new BrowserWindow({
		width: 540+10,
		height: 460+10,
		minWidth: 500,
		minHeight: 440,
		maxWidth: screenSize.width,
		maxHeight: screenSize.height - 40,
		resizable: true,
		frame: false,
		show: false,
		transparent: true
	})
	preWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'app/html/chatting.html'),
		protocol: 'file:',
		slashes: true
	}))
	// preWindow.loadURL('http://localhost:3000/html/chatting.html')

	// 文档加载完后再显示窗口
	preWindow.webContents.on('did-finish-load', function() {
		preWindow.send('chatting-window-id', preWindow.id)
		if (++chattingWindowLoadedNum == maxChattingWindowCount) {
			// 发送窗口就绪事件
			event.emit('windows-ready')
		}
	})

	preWindow.on('resize', () => {
		preWindow.webContents.send('chatting-window-resize', preWindow.getSize())
	})

	preWindow.on('focus', () => {
		globalShortcut.register('esc', () => {
			preWindow.webContents.send('reset-chatting-window-status')  // 重置窗口状态--取消最大化
			preWindow.hide()
			for (var win in chattingWindowPool) {
				let chatting = chattingWindowPool[win]
				if (preWindow == chatting.window) {
					chatting.account = null  // 下次展示时居中
				}
			}
		})
		globalShortcut.register('ctrl+w', () => {
			preWindow.webContents.send('reset-chatting-window-status')  // 重置窗口状态--取消最大化
			preWindow.hide()
			for (var win in chattingWindowPool) {
				let chatting = chattingWindowPool[win]
				if (preWindow == chatting.window) {
					chatting.account = null  // 下次展示时居中
				}
			}
		})
	})
	preWindow.on('blur', () => {
		globalShortcut.unregister('esc')
		globalShortcut.unregister('ctrl+w')
	})

	preWindow.on('closed', () => {
		if (globalShortcut) globalShortcut.unregister('esc')
		if (globalShortcut) globalShortcut.unregister('ctrl+w')
		// 窗口异常退出，需要重新实例化
		setTimeout(() => {
			createChattingWindow(index)
		}, 500)
		delete chattingWindowPool['chatting_window_' + index]
	})

	chattingWindowPool['chatting_window_' + index] = {
		window: preWindow,
		account: null
	}
}

function exitApp() {
	// 需要关闭全部窗口才能完全退出
	// BrowserWindow.getAllWindows().forEach(function(window, index) {
	// 	window.destroy()
	// })
	app.quit()
}

// 应用就绪后加载窗口
app.on('ready', () => {
	// 创建登录窗口
	createLoginWindow()
	// 创建主界面窗口
	createMainWindow()
})

app.on('will-quit', function () {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
	app.quit()
})


// 主进程通信
// 公共
ipcMain.on('exit-app', () => {
	// app.quit()
	exitApp()
})

// 登录窗口
ipcMain.on('login-window-minimize', () => {
	loginWindow.minimize()
})
ipcMain.on('login-success', () => {
	// 根据屏幕宽高设置窗口位置
	const electronScreen = require('electron').screen
	const screenSize = electronScreen.getPrimaryDisplay().size
	let winSize = mainWindow.getSize()
	mainWindow.setPosition(screenSize.width-winSize[0]-20, 20)
	// 设置托盘图标
	trayIcon.setImage(path.join(__dirname, 'app/img/icons/logo.png'))

	// 预创建聊天窗口
	for (let i = 0; i < maxChattingWindowCount; i ++) {
		createChattingWindow(i)
	}

	/*setTimeout(() => {
		mainWindow.show()
		// 必须在新窗口打开后才能关闭，确保至少有一个窗口存在
		if (loginWindow) loginWindow.close()
	}, 1000)*/

	// 窗口就绪
	event.on('windows-ready', () => {
		mainWindow.show()
		// 必须在新窗口打开后才能关闭，确保至少有一个窗口存在
		if (loginWindow) loginWindow.close()
	})
})

// 主界面窗口
ipcMain.on('main-window-minimize', () => {
	mainWindow.minimize()
})
ipcMain.on('start-chatting', (event, data) => {
	// 先判断聊天对象的窗口是否已经打开，如果已经打开，直接激活
	for (var win in chattingWindowPool) {
		let chatting = chattingWindowPool[win]
		if (data.account == chatting.account) {
			chatting.window.show()
			return
		}
	}
	// 聊天对象的窗口未打开，则从窗口池中打开一个空的窗口
	for (var win in chattingWindowPool) {
		let chatting = chattingWindowPool[win]
		// 窗口可用
		if (chatting.account == null) {
			chatting.account = data.account
			
			// 暂时用本地地址做为图标，后面可能改为网络地址
			let avatar = data.avatar
			let icon = avatar.substring(avatar.lastIndexOf('/'))
			// 设置窗口图标和标题
			chatting.window.setTitle(data.nickname)
			chatting.window.setIcon(path.join(__dirname, 'app/img/' + icon))
			// 向聊天窗口传递数据
			chatting.window.webContents.send('chatting-data', data)
			chatting.window.setSize(540+10, 460+10)
			chatting.window.center()
			chatting.window.show()
			return
		}
	}
	// 无可用窗口，提示超过最大聊天窗口数

})

// 聊天窗口
ipcMain.on('chatting-window-minimize', (event, account) => {
	for (var win in chattingWindowPool) {
		let chatting = chattingWindowPool[win]
		if (account == chatting.account) {
			chatting.window.minimize()
		}
	}
})
ipcMain.on('chatting-window-maximize', (event, account) => {
	for (var win in chattingWindowPool) {
		let chatting = chattingWindowPool[win]
		if (account == chatting.account) {
			chatting.bounds = chatting.window.getBounds()
			chatting.window.maximize()
		}
	}
})
ipcMain.on('chatting-window-restore', (event, account) => {
	for (var win in chattingWindowPool) {
		let chatting = chattingWindowPool[win]
		if (account == chatting.account) {
			chatting.window.setBounds(chatting.bounds)
		}
	}
})
ipcMain.on('chatting-window-close', (event, account) => {
	for (var win in chattingWindowPool) {
		let chatting = chattingWindowPool[win]
		if (account == chatting.account) {
			chatting.account = null
			chatting.window.hide()
		}
	}
})
