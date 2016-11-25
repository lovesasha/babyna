const {
	app, 
	BrowserWindow, 
	ipcMain,
	Menu,
	Tray
} = require('electron')
const path = require('path')
const url = require('url')

// 调试模式
app.commandLine.appendSwitch('remote-debugging-port', '9000')
app.commandLine.appendSwitch('host-rules', 'MAP * 127.0.0.1')

// 主要窗体
let loginWindow
let mainWindow
let chattingWindows = {}  // 存放聊天窗口
// 其他窗体
let imageWindow    // 图片预览
let messageWindow  // 消息提示
let aboutWindow    // 关于应用

let trayIcon
let flashTimer

// 初始化时先将窗口准备完毕
function prepareWindows() {
	// 登录窗口
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

	loginWindow.on('closed', () => {
		loginWindow = null
	})

	// 托盘图标
	trayIcon = new Tray(path.join(__dirname, 'app/img/icons/logo-dark.png'))
	const contextMenu = Menu.buildFromTemplate([
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
	])
	trayIcon.setToolTip('QQ')
	trayIcon.setContextMenu(contextMenu)
	trayIcon.on('click', () => {
		if (loginWindow) loginWindow.restore()
		if (mainWindow) mainWindow.restore()
	})
	// End 登录窗口

	// 主界面窗口
	mainWindow = new BrowserWindow({
		width: 300,
		height: 640+10,
		minWidth: 280,
		minHeight: 530,
		maxWidth: 360,
		maxHeight: 730,
		resizable: true,
		frame: false,
		show: false,
		alwaysOnTop: true,
		skipTaskbar: true,
		transparent: true
	})
	// End 主界面窗口

	// 聊天窗口
	// 根据屏幕宽高设置窗口最大尺寸
	const electronScreen = require('electron').screen
	const screenSize = electronScreen.getPrimaryDisplay().size

	let preWindow = new BrowserWindow({
		width: 600+10,
		height: 500+10,
		minWidth: 580,
		minHeight: 500,
		maxWidth: screenSize.width,
		maxHeight: screenSize.height - 40,
		resizable: true,
		frame: false,
		show: false,
		transparent: true
	})
	chattingWindows['pre-create-chatting-window'] = preWindow  // 26characters
	// End 聊天窗口
}


// 加载窗口
app.on('ready', prepareWindows)


// 主进程通信
// 公共
ipcMain.on('exit-app', () => {
	app.quit()
})

// 登录窗口
ipcMain.on('login-window-minimize', () => {
	loginWindow.minimize()
})
ipcMain.on('login-success', () => {

	/*mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'app/html/main.html'),
		protocol: 'file:',
		slashes: true
	}))*/
	mainWindow.loadURL('http://localhost:3000/html/main.html')

	// 文档加载完后再显示窗口
	mainWindow.webContents.on('did-finish-load', function() {
		// 根据屏幕宽高设置窗口位置
		const electronScreen = require('electron').screen
		const screenSize = electronScreen.getPrimaryDisplay().size
		let winSize = mainWindow.getSize()
		mainWindow.setPosition(screenSize.width-winSize[0]-20, 20)
		// 设置托盘图标
		trayIcon.setImage(path.join(__dirname, 'app/img/icons/logo.png'))
		mainWindow.show()
		// 必须在新窗口打开后才能关闭，确保至少有一个窗口存在
		if (loginWindow) loginWindow.close()
	})

	mainWindow.on('resize', () => {
		mainWindow.webContents.send('main-window-resize', mainWindow.getSize())
	})

	mainWindow.on('closed', () => {
		mainWindow = null
		app.quit()
	})

})

// 主窗口
ipcMain.on('main-window-minimize', () => {
	mainWindow.minimize()
})
ipcMain.on('start-chatting', (event, data) => {

	// 先判断聊天对象的窗口是否已经打开，如果已经打开，直接激活
	let chattingWindow = chattingWindows[data.account]
	if (chattingWindow != null) {
		chattingWindow.focus()
		return;
	}
	// 窗口不允许开太多，否则可能造成崩溃或内存不足，暂定最多开6个聊天窗口
	let winCount = 0
	for (win in chattingWindows) {
		if (++winCount > 6) return
	}
	// 暂时用本地地址做为图标，后面可能改为网络地址
	let avatar = data.avatar
	let icon = avatar.substring(avatar.lastIndexOf('/'))

	// 根据屏幕宽高设置窗口最大尺寸
	const electronScreen = require('electron').screen
	const screenSize = electronScreen.getPrimaryDisplay().size
	let newChatting = chattingWindows['pre-create-chatting-window'] || new BrowserWindow({
		width: 600+10,
		height: 500+10,
		minWidth: 580,
		minHeight: 500,
		maxWidth: screenSize.width,
		maxHeight: screenSize.height - 40,
		resizable: true,
		frame: false,
		show: false,
		transparent: true
	})

	chattingWindows[data.account] = newChatting

	/*newChatting.loadURL(url.format({
		pathname: path.join(__dirname, 'app/html/chatting.html'),
		protocol: 'file:',
		slashes: true
	}))*/
	newChatting.loadURL('http://localhost:3000/html/chatting.html')

	// 文档加载完后再显示窗口
	newChatting.webContents.on('did-finish-load', function() {
		// 设置窗口图标和标题
		newChatting.setTitle(data.nickname)
		newChatting.setIcon(path.join(__dirname, 'app/img/' + icon))
		// 向聊天窗口传递数据
		newChatting.webContents.send('chatting-data', data)
		newChatting.show()
	})

	newChatting.on('resize', () => {
		newChatting.webContents.send('chatting-window-resize', newChatting.getSize())
	})

	newChatting.on('closed', () => {
		chattingWindows[data.account] = null
		newChatting = null
	})

	// 预创建一个窗口，用于提升性能
	if (winCount < 6) {
		let preWindow = new BrowserWindow({
			width: 600+10,
			height: 500+10,
			minWidth: 580,
			minHeight: 500,
			maxWidth: screenSize.width,
			maxHeight: screenSize.height - 40,
			resizable: true,
			frame: false,
			show: false,
			transparent: true
		})
		chattingWindows['pre-create-chatting-window'] = preWindow  // 26characters
	}
})

// 聊天窗口
ipcMain.on('chatting-window-minimize', (event, account) => {
	chattingWindows[account].minimize()
})
ipcMain.on('chatting-window-maximize', (event, account) => {
	chattingWindows[account].maximize()
})
ipcMain.on('chatting-window-close', (event, account) => {
	chattingWindows[account].close()
})
