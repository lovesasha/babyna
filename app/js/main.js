const electron = require('electron')
const ipcRenderer = electron.ipcRenderer
const shell = electron.shell
const electronScreen = electron.screen
const screenSize = electronScreen.getPrimaryDisplay().size
const remote = electron.remote
const app = remote.app
const BrowserWindow = remote.BrowserWindow
const Tray = remote.Tray
const Menu = remote.Menu
const globalShortcut = remote.globalShortcut
const path = require('path')
const url = require('url')
const EventEmitter = require('events').EventEmitter

// 顺序-工具/依赖包/自定义组件
const storage = require(path.join(__dirname, '../js/util/storage'))
const conn = require(path.join(__dirname, '../js/util/connection'))
const fsoperation = require(path.join(__dirname, '../js/util/fsoperation'))
const ContextMenu = require(path.join(__dirname, '../js/widget/contextmenu'))
const Vue = require(path.join(__dirname, '../js/lib/vue'))

let eventEmitter = new EventEmitter()

let chattingMessages = remote.getGlobal('chattingMessages')

// 图片不可拖拽
let imgs = document.querySelectorAll('img')
imgs.forEach(function(img, index) {
	img.setAttribute('draggable', false)
})


let vm = new Vue({
	el: '.container',
	data: {
		basic: {
			id: 0,
			avatar: '../img/avatar.png',
			nickname: '菜菜在奔跑',
			signature: '天不老，情难绝，心似双丝网，中有千千结。',
		},
		searcher: '',
		searchResult: [],
		tabIndex: 1,
		friendList: [],
		groupList: [],
		recentList: [
			// {avatar: '../img/maomao.png', nickname: '毛毛', time: '今天', content: '表弟你好阿', account: '543712492', signature: '我爱你 是多么清楚 多么坚固的信仰'},
			// {avatar: '../img/avatar.png', nickname: 'Sasha', time: '今天', content: '奔跑吧兄弟', account: '827134227', signature: '天不老，情难绝，心似双丝网，中有千千结。'},
			// {avatar: '../img/caicai.png', nickname: '菜菜在奔跑', time: '昨天', content: '奔跑吧兄弟', account: '2241089301', signature: '寻寻觅觅 冷冷清清 凄凄惨惨戚戚'}
		],
		contactIndex: {
			friends: -1,
			groups: -1,
			recents: -1,
			search: -1
		},
		bottomItems: [
			{icon: 'ion-ios-home', title: '访问主页'},
			// {icon: 'ion-navicon-round', title: '主菜单'},
			{icon: 'ion-ios-gear', title: '系统设置'},
			{icon: 'ion-volume-medium', title: '音效设置'},
			{icon: 'ion-ios-search-strong', title: '社交搜索'},
			{icon: 'ion-ios-information-outline', title: '关于应用'}
		]
	},
	methods: {
		minimize: function() {
			currentWindow.minimize()
		},
		close: function() {
			// app.quit()
			exitApp()
		},
		clearSearch: function() {
			this.searcher = ''
		},
		tabSelect: function(index) {
			this.tabIndex = index
		},
		avatarView: function() {
			imageWindow.webContents.send('avatar-view', this.basic.avatar)
		},
		mainOperation: function() {
			// 暂时只有切换场景秀功能
			chattingShowWindow.show()
		},
		contactItemSelect: function(type, index) {
			switch(type) {
			case 1:
				this.contactIndex.friends = index
				break
			case 2:
				this.contactIndex.groups = index
				break
			case 3:
				this.contactIndex.recents = index
				break
			case 9:
				this.contactIndex.search = index
				break
			}
		},
		startChatting: function(contact) {
			// shell.openExternal('tencent://message/?uin=' + contact.account)  // 打开QQ
			// 打开聊天窗口
			openChattingWindow(contact)
			// 取消托盘闪烁
			if (contact.id == messageSender) {
				clearInterval(flashTimer)
				trayIcon.setImage(path.join(__dirname, '../img/icon/logo.png'))
				setTimeout(() => {
					trayIcon.setImage(path.join(__dirname, '../img/icon/logo.png'))  // 防止重置icon后闪烁定时器又将其设置
				}, 400)
				flashTimer = undefined
			}
		},
		bottomItemClick: function(index) {
			switch(index) {
			case 0:  // 访问主页
				shell.openExternal('http://isasha.me/')
				break
			case 1:  // 系统设置
				soundWindow.show()
				break
			case 2:  // 音效设置
				soundWindow.show()
				break
			case 3:  // 社交搜索
				break
			case 4:  // 关于应用
				 aboutWindow.show()
				break
			}
		}
	},
	watch: {
		searcher: function() {
			let that = this
			let searcher = that.searcher.toLowerCase()
			that.searchResult = []
			that.recentList.forEach(function(item, index) {
				if (item.nickname.toLowerCase().indexOf(searcher) > -1) {
					that.searchResult.push(item)
				}
			})
		},
		recentList: function(list) {
			// 排序算法
			// let newList = []
			// list.forEach(function(item, index) {
			// })
			// this.recentList = newList
		}
	},
	filters: {
		time: function(value) {
			if (! value) return
			// 昨天 11.11 2015.11.11
			function prefix(num, n) {
				n = 2
				return (Array(n).join(0) + num).slice(-n)
			}
			let d = new Date(value)
			// return prefix(d.getHours()) + ':' + prefix(d.getMinutes()) + ':' + prefix(d.getSeconds())
			return prefix(d.getHours()) + ':' + prefix(d.getMinutes())
		}
	}
})

// 托盘上下文菜单
const trayContextMenu = {
	nologin: [
		{
			label: '打开主面板',
			click: function() {
				loginWindow.restore()
			}
		},
		{
			label: '退出',
			click: function() {
				// app.quit()
				exitApp()
			}
		}
	],
	login: [
		{
			label: '打开主面板',
			click: function() {
				currentWindow.restore()
			}
		},
		{
			label: '音效设置',
			click: function() {
				soundWindow.show()
			}
		},
		{
			label: '气泡',
			click: function() {
				trayIcon.displayBalloon({
					icon: path.join(__dirname, '../img/icon/logo.png'),
					title: '气泡',
					content: '一闪一闪亮晶晶\n漫天都是小星星'
				})
			}
		},
		{type: 'separator'},
		{
			label: '退出',
			click: function() {
				// app.quit()
				exitApp()
			}
		}
	]
}

// 当前窗口及其他信息
let loginWindow = BrowserWindow.fromId(1)
let currentWindow = remote.getCurrentWindow()
let contextMenu = ContextMenu.createContextMenu(currentWindow.id)
let trayIcon = new Tray(path.join(__dirname, '../img/icon/logo-dark.png'))

trayIcon.setToolTip('Babyna')
trayIcon.on('click', (event, bounds) => {
	if (flashTimer) {
		trayFlashClick()
	} else {
		if (loginWindow) loginWindow.restore()
		currentWindow.restore()
	}
})
trayIcon.on('right-click', (event, bounds) => {
	contextMenu.setMenuItems(trayContextMenu.nologin)
	contextMenu.show(bounds.x, bounds.y)
})

// 目测只有在任务栏的窗口才会在quit方法后关闭
function exitApp() {
	imageWindow.close()
	// soundSettingWindow.close()
	app.quit()
}

let imageWindow    // 图片预览
let soundWindow    // 音效设置
let messageWindow  // 消息提示
let aboutWindow    // 关于应用
let chattingShowWindow  // 皮肤场景秀

// 预创建图片预览窗口
function prepareImageWindow() {
	imageWindow = new BrowserWindow({
		width: 700,
		height: 500,
		minWidth: 600,
		minHeight: 400,
		frame: false,
		show: false,
		skipTaskbar: true,
		transparent: true,
		useContentSize: true
	})
	imageWindow.loadURL(url.format({
		pathname: path.join(__dirname, '../html/avatar-view.html'),
		protocol: 'file:',
		slashes: true
	}))
	// imageWindow.loadURL('http://localhost:3000/html/avatar-view.html')
	imageWindow.on('focus', () => {
		imageWindow.setAlwaysOnTop(true)
		globalShortcut.register('esc', () => {
			imageWindow.hide()
		})
		globalShortcut.register('ctrl+w', () => {
			imageWindow.hide()
		})
	})
	imageWindow.on('blur', () => {
		imageWindow.setAlwaysOnTop(false)
		globalShortcut.unregister('esc')
		globalShortcut.unregister('ctrl+w')
	})
	imageWindow.on('close', () => {
		// 窗口异常退出，需要重新实例化
		setTimeout(() => {
			prepareImageWindow()
		}, 500)
		globalShortcut.unregister('esc')
		globalShortcut.unregister('ctrl+w')
	})
}

// 预创建音效设置窗口
function prepareSoundWindow() {
	soundWindow = new BrowserWindow({
		width: 400,
		height: 300,
		resizable: false,
		frame: false,
		show: false,
		transparent: true,
		useContentSize: true,
		icon: path.join(__dirname, '../img/icon/icon.png')
	})
	soundWindow.loadURL(url.format({
		pathname: path.join(__dirname, '../html/sound-setting.html'),
		protocol: 'file:',
		slashes: true
	}))
	// soundWindow.loadURL('http://localhost:3000/html/sound-setting.html')
	soundWindow.on('close', () => {
		// 窗口异常退出，需要重新实例化
		setTimeout(() => {
			prepareSoundWindow()
		}, 500)
	})
}

// 预创建关于应用描述窗口
function prepareAboutWindow() {
	aboutWindow = new BrowserWindow({
		width: 300,
		height: 200,
		resizable: false,
		frame: false,
		show: false,
		transparent: true,
		useContentSize: true,
		icon: path.join(__dirname, '../img/icon/icon.png')
	})
	aboutWindow.loadURL(url.format({
		pathname: path.join(__dirname, '../html/about.html'),
		protocol: 'file:',
		slashes: true
	}))
	// aboutWindow.loadURL('http://localhost:3000/html/about.html')
	aboutWindow.on('close', () => {
		// 窗口异常退出，需要重新实例化
		setTimeout(() => {
			prepareAboutWindow()
		}, 500)
	})
}

// 预创建皮肤场景秀切换窗口
function prepareChattingShow() {
	chattingShowWindow = new BrowserWindow({
		width: 750,
		height: 540,
		resizable: false,
		frame: false,
		show: false,
		transparent: true,
		useContentSize: true,
		icon: path.join(__dirname, '../img/icon/icon.png')
	})
	chattingShowWindow.loadURL(url.format({
		pathname: path.join(__dirname, '../html/chatting-show.html'),
		protocol: 'file:',
		slashes: true
	}))
	// chattingShowWindow.loadURL('http://localhost:3000/html/chatting-show.html')
	chattingShowWindow.on('close', () => {
		// 窗口异常退出，需要重新实例化
		setTimeout(() => {
			prepareChattingShow()
		}, 500)
	})
}

// 预创建窗口
function prepareWindows() {
	// 图片预览
	prepareImageWindow()
	// 音效设置
	prepareSoundWindow()
	// 关于应用
	prepareAboutWindow()
	// 皮肤场景秀
	prepareChattingShow()
}

// 查看头像
ipcRenderer.on('avatar-view', function(event, avatar) {
	imageWindow.webContents.send('avatar-view', avatar)
})

// 切换场景秀
ipcRenderer.on('change-chatting-show', function(event) {
	chattingShowWindow.show()
})


// 聊天窗口
let chattingWindowPool = {}      // 存放聊天窗口
let maxChattingWindowCount = 3   // 允许打开的最多聊天窗体数为6个，开发时设置成1
let chattingWindowLoadedNum = 0  // 已加载完的窗口数

function createChattingWindow(index) {
	let chattingWindow = new BrowserWindow({
		width: 540,
		height: 460,
		minWidth: 500,
		minHeight: 440,
		maxWidth: screenSize.width,
		maxHeight: screenSize.height-40,
		resizable: true,
		frame: false,
		show: false,
		transparent: true,
		useContentSize: true
	})
	chattingWindow.loadURL(url.format({
		pathname: path.join(__dirname, '../html/chatting.html'),
		protocol: 'file:',
		slashes: true
	}))
	// chattingWindow.loadURL('http://localhost:3000/html/chatting.html')

	// 文档加载完后再显示窗口
	chattingWindow.webContents.on('did-finish-load', function() {
		if (++chattingWindowLoadedNum == maxChattingWindowCount) {
			// 预创建完毕
			eventEmitter.emit('chatting-windows-ready')
		}
	})

	chattingWindow.on('focus', () => {
		globalShortcut.register('esc', () => {
			hideChattingWindow(chattingWindow)
		})
		globalShortcut.register('ctrl+w', () => {
			hideChattingWindow(chattingWindow)
		})
	})
	chattingWindow.on('blur', () => {
		globalShortcut.unregister('esc')
		globalShortcut.unregister('ctrl+w')
	})

	chattingWindow.on('close', () => {
		globalShortcut.unregister('esc')
		globalShortcut.unregister('ctrl+w')
		// 窗口异常退出，需要重新实例化
		setTimeout(() => {
			createChattingWindow(index)
		}, 500)
		delete chattingWindowPool['chatting_window_' + index]
	})

	chattingWindowPool['chatting_window_' + index] = {
		window: chattingWindow,
		id: null
	}
}

// 根据窗口绑定的账号查找窗口
function getChattingWindow(id) {
	for (var win in chattingWindowPool) {
		let chatting = chattingWindowPool[win]
		if (id == chatting.id) {
			return chatting.window
		}
	}
}

// 打开聊天窗口
function openChattingWindow(contact) {
	// 先判断聊天对象的窗口是否已经打开，如果已经打开，直接激活
	let chattingWindow = getChattingWindow(contact.id)
	if (chattingWindow != null) {
		chattingWindow.show()
		return
	}
	// 聊天对象的窗口未打开，则从窗口池中打开一个空的窗口
	for (var win in chattingWindowPool) {
		let chatting = chattingWindowPool[win]
		// 窗口可用
		if (chatting.id == null) {
			chatting.id = contact.id
			// 设置窗口图标和标题
			let icon = contact.avatar.substring(contact.avatar.lastIndexOf('/'))
			chatting.window.setTitle(contact.nickname)
			chatting.window.setIcon(path.join(__dirname, '../img/avatar/' + icon))
			// 向聊天窗口传递数据
			contact.avatarSelf = vm.basic.avatar
			chatting.window.webContents.send('chatting-data', contact, chattingMessages[contact.id])
			// 展示聊天窗口
			chatting.window.setSize(540+10, 460+10)
			chatting.window.center()
			chatting.window.show()
			return
		}
	}
}

// 聊天窗口关闭时（隐藏），需要重置窗口状态
ipcRenderer.on('chatting-window-close', function(event, id) {
	hideChattingWindow(id)
})

// 隐藏并重置聊天窗口
function hideChattingWindow(windowOrId) {
	let cw
	for (var win in chattingWindowPool) {
		let chatting = chattingWindowPool[win]
		if (typeof windowOrId != 'object' && windowOrId == chatting.id) {
			cw = chatting
			break
		} else if (typeof windowOrId == 'object' && windowOrId == chatting.window) {
			cw = chatting
			break
		}
	}
	if (cw) {
		cw.id = null  // 下次展示时居中
		cw.window.hide()
	}
}

// Socket通信--由该主面板的渲染进程维护

// 用户登录
ipcRenderer.on('user:login', function(event, params) {
	conn.login(params).then(function(data) {
		let account = data.name
		// 保存当前用户信息
		vm.basic = {
			id: data.id,
			avatar: data.avatar,
			nickname: data.name,
			signature: '我爱你 是多么清楚 多么坚定的信仰'
		}
		// 预创建一些次要窗口
		prepareWindows()
		// 预创建聊天窗口
		for (let i = 0; i < maxChattingWindowCount; i ++) {
			createChattingWindow(i)
		}
		// 预创建完毕
		eventEmitter.on('chatting-windows-ready', () => {
			// 关闭登录窗口
			loginWindow.close()
			loginWindow = null
			// 更新托盘菜单
			trayIcon.setImage(path.join(__dirname, '../img/icon/logo.png'))
			trayIcon.setToolTip('账号：' + account)
			trayIcon.on('right-click', (event, bounds) => {
				contextMenu.setMenuItems(trayContextMenu.login)
				contextMenu.show(bounds.x, bounds.y)
			})
			// 显示主面板
			currentWindow.show()
		})
	})

	// 获取在线用户列表...
	getUserAll()

	// 用户变更--防止网络异常情况，直接刷新在线用户列表
	conn.userchange(function(data) {
		getUserAll()
		// 向群聊窗口展示一条变更的系统消息
		let message = {
			system: true,
			time: new Date().getTime()
		}
		switch(data.type) {
		case 1:
			if (data.user.id == vm.basic.id) {
				data.user.name = '我'
			}
			message.content = data.user.name + '进入了聊天室'
			break
		case 2:
			message.content = data.user.name + '离开了聊天室'
			delete chattingMessages[data.user.id]
			break
		}
		let chattingWindow = getChattingWindow(1)  // 群聊窗口ID为1
		if (chattingWindow) {
			chattingWindow.webContents.send('chatting-message', message)
		}
		// 挂到全局消息对象下
		chattingMessages[1] = chattingMessages[1] || []
		chattingMessages[1].push(message)
	})
})

// 获取在线用户列表
function getUserAll() {
	conn.userall().then(function(data) {
		let recentList = []
		data.forEach(function(item, index) {
			// 下载头像
			fsoperation.downloadAvatar(item.avatar)
			// downloadAvatar(item.avatar)
			// 填充数据
			if (item.id != vm.basic.id) {
				let contact = {
					id: item.id,
					avatar: item.avatar,
					nickname: item.name,
					account: item.name
				}
				let messages = chattingMessages[item.id]
				if (messages) {
					contact.time = messages[messages.length - 1].time
					contact.content = messages[messages.length - 1].content
				}
				if (item.id == 1) {
					contact.signature = '时光不老，贝壳不散'
				} else if (item.id == 2) {
					contact.signature = '我是万能的机器人菜菜，有事就找我倾诉喔'
				} else {
					contact.signature = '我爱你 是多么清楚 多么坚定的信仰'
				}
				recentList.push(contact)
			}
		})
		vm.recentList = recentList
	})
}

// 下载用户头像
/*function downloadAvatar(url) {
	// 遍历头像目录，如果头像不存在才需要下载
	let savePath = path.join(__dirname, '../img/avatar/')
	let images = fsoperation.listDirectory(savePath)
	let imageName = url.substring(url.lastIndexOf('/') + 1)
	if (images.indexOf(imageName) == -1) {
		fsoperation.downloadImage(url, savePath)
	}
}*/

// 向聊天对象发送消息
ipcRenderer.on('chat:message', function(event, params) {
	params.avatar = vm.basic.avatar
	conn.message(params)

	let id = params.receiver
	let message = {
		avatar: params.avatar,
		content: params.msg,
		time: new Date().getTime(),
		self: true
	}
	// 更新主面板列表展示
	let contact
	let indexOfContact
	vm.recentList.forEach(function(item, index) {
		if (item.id == id) {
			indexOfContact = index
			contact = item
			contact.content = message.content
			contact.time = message.time
			// vm.$set(vm.recentList, index, contact)
		}
	})
	// 使用Vue监听的变异方法，更新会话消息时间，并置于列表顶端
	vm.recentList.splice(indexOfContact, 1)
	vm.recentList.unshift(contact)
	// 挂到全局消息对象下
	chattingMessages[id] = chattingMessages[id] || []
	chattingMessages[id].push(message)
	// 保存本地
})

// 消息发送者，用于托盘闪烁判断
let messageSender

// 接收到消息
conn.onmessage(function(data) {
	if (data.sender == vm.basic.id) return  // 群聊收到自己的消息

	let wid = messageSender = data.sender
	let message = {
		avatar: data.avatar,
		content: data.msg,
		time: new Date().getTime()
	}
	// 更新主面板列表展示
	let contact
	let indexOfContact
	vm.recentList.forEach(function(item, index) {
		if (data.receiver == 1) {
			wid = messageSender = data.receiver
			if (item.id == data.sender) {  // 群聊消息，从联系人列表获取昵称
				message.nickname = item.nickname
			}
		}
		if (item.id == wid) {
			indexOfContact = index
			contact = item
			contact.content = message.content
			contact.time = message.time
			// vm.$set(vm.recentList, index, contact)
		}
	})
	// 使用Vue监听的变异方法，更新会话消息时间，并置于列表顶端
	vm.recentList.splice(indexOfContact, 1)
	vm.recentList.unshift(contact)
	// 新用户头像需要下载
	fsoperation.downloadAvatar(message.avatar).then(function() {
		// 窗口已打开则向聊天窗口传递消息数据
		let chattingWindow = getChattingWindow(wid)
		if (chattingWindow) {
			chattingWindow.webContents.send('chatting-message', message)
			// 最小化则闪烁窗口
			if (chattingWindow.isMinimized()) {
				chattingWindow.flashFrame(true)
				playSound()
			}
		} else {
			// 窗口未打开则托盘闪烁
			trayIconFlash(wid)
			playSound()
		}
	})
	// 挂到全局消息对象下
	chattingMessages[wid] = chattingMessages[wid] || []
	chattingMessages[wid].push(message)
	// 保存本地
})

// 消息发送错误
conn.onmsgerr(function(data) {
	let message = {
		system: true,
		content: '对方已下线'
	}
	let chattingWindow = getChattingWindow(data.receiver)
	if (chattingWindow) {
		chattingWindow.webContents.send('chatting-message', message)
	}
})

// 音效设置
let soundAudio
let soundNotice
let soundSetting = storage.get('soundSetting')
if (soundSetting) {
	soundAudio = new Audio(path.join(__dirname, '../sound/' + soundSetting.soundName + '.mp3'))
	soundNotice = soundSetting.soundNotice
} else {
	soundAudio = new Audio(path.join(__dirname, '../sound/微信.mp3'))
	soundNotice = true
}

ipcRenderer.on('sound-setting', function(event, soundSetting) {
	soundAudio = new Audio(path.join(__dirname, '../sound/' + soundSetting.soundName + '.mp3'))
	soundNotice = soundSetting.soundNotice
})

function playSound() {
	if (soundNotice) {
		soundAudio.currentTime = 0
		soundAudio.play()
	}
}

// 托盘闪烁
let flashTimer
let flashIcon
function trayIconFlash(contactId) {
	let contact
	vm.recentList.forEach(function(item, index) {
		if (item.id == contactId) {
			contact = item
		}
	})
	if (! flashTimer) {
		clearInterval(flashTimer)
		let flash = true
		flashIcon = contact.avatar.substring(contact.avatar.lastIndexOf('/'))
		flashTimer = setInterval(() => {
			if (flash) {
				trayIcon.setImage(path.join(__dirname, '../img/avatar/' + flashIcon))
				flash = false
			} else {
				trayIcon.setImage(path.join(__dirname, '../img/icon/transparent.png'))
				flash = true
			}
		}, 400)
	} else {
		flashIcon = contact.avatar.substring(contact.avatar.lastIndexOf('/'))
	}
	
	trayFlashClick = function() {
		clearInterval(flashTimer)
		trayIcon.setImage(path.join(__dirname, '../img/icon/logo.png'))
		flashTimer = undefined
		openChattingWindow(contact)
	}
}

// 托盘闪动时点击事件
var trayFlashClick = function() {}
