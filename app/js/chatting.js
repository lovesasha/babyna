const electron = require('electron')
const ipcRenderer = electron.ipcRenderer
const shell = electron.shell
const remote = electron.remote
const BrowserWindow = remote.BrowserWindow
const path = require('path')

const storage = require(path.join(__dirname, '../js/util/storage'))
const ContextMenu = require(path.join(__dirname, '../js/widget/contextmenu'))
const Vue = require(path.join(__dirname, '../js/lib/vue'))


// 图片不可拖拽
let imgs = document.querySelectorAll('img')
imgs.forEach(function(img, index) {
	img.setAttribute('draggable', false)
})

// 读取配置信息

// 聊天背景图片
let bgImage = new Image()
bgImage.src = '../img/main-bg.png'


// 当前窗口信息
let mainWindow = BrowserWindow.fromId(2)
let currentWindow = remote.getCurrentWindow()
let contextMenu = ContextMenu.createContextMenu(currentWindow.id)

currentWindow.on('resize', () => {
	let windowSize = currentWindow.getSize()
	// 重置聊天背景宽高--防止变形
	if (windowSize[0] / windowSize[1] < bgImage.width / bgImage.height) {
		document.querySelector('.backdrop').style.backgroundSize = 'auto 100%'
	} else if (windowSize[0] / windowSize[1] > bgImage.width / bgImage.height) {
		document.querySelector('.backdrop').style.backgroundSize = '100% auto'
	}
})

// 窗口通信
// 刷新窗口信息
ipcRenderer.on('chatting-data', function(event, data, messages) {
	vm.basic = data
	vm.messageList = messages
	// 消息记录滚动到底部
	setTimeout(function() {
		document.querySelector('.main').scrollTop = document.querySelector('.main').scrollHeight
	}, 50)
})

// 接收到消息--展示到聊天窗
ipcRenderer.on('chatting-message', function(event, data) {
	vm.messageList = vm.messageList || []
	vm.messageList.push(data)
	// 消息记录滚动到底部
	setTimeout(function() {
		document.querySelector('.main').scrollTop = document.querySelector('.main').scrollHeight
	}, 50)
})

let resize = {
	down: false,
	height: 0,
	start: {x: 0, y: 0},
	delta: {},
}

let vm = new Vue({
	el: '.container',
	data: {
		basic: {},
		windowSettingItems: [],
		sendSettingItems: [],
		maximized: false,
		messageList: [],
		isWindowOnTop: false,
		messageSendCode: 0  // 0 Enter  1 Ctrl+Enter
	},
	methods: {
		minimize: function() {
			currentWindow.minimize()
		},
		maximizeOrRestore: function() {
			if (! this.maximized) {
				currentWindow.maximize()
			} else {
				currentWindow.unmaximize()
			}
			this.maximized = ! this.maximized
		},
		close: function() {
			// 重置窗口状态
			this.maximized = false  // 还原窗口最大化图标
			document.querySelector('.chatting-content').innerHTML = ''  // 清空输入框内容
			currentWindow.setAlwaysOnTop(this.isWindowOnTop = false)  // 取消窗口置顶
			// 关闭（隐藏）窗口
			mainWindow.webContents.send('chatting-window-close', this.basic.id)
		},
		avatarView: function(message) {
			if (! message) {
				mainWindow.webContents.send('avatar-view', this.basic.avatar)
			} else if (message.self) {
				mainWindow.webContents.send('avatar-view', this.basic.avatarSelf)
			} else {
				mainWindow.webContents.send('avatar-view', message.avatar)
			}
		},
		windowSetting: function(e) {
			this.windowSettingItems = [
				{
					label: '保持窗口最前', 
					click: function() {
						vm.isWindowOnTop = ! vm.isWindowOnTop
						currentWindow.setAlwaysOnTop(vm.isWindowOnTop)
					}
				},
				{
					label: '切换场景秀',
					click: function() {
						mainWindow.webContents.send('change-chatting-show')
					}
				},
				{type: 'separator'},
				{
					label: '更多设置'
				}
			]
			if (this.isWindowOnTop) {
				this.windowSettingItems[0].icon = 'ion-checkmark'
			}
			contextMenu.setMenuItems(this.windowSettingItems)
			contextMenu.show(e.screenX, e.screenY)
		},
		sendSetting: function(e) {
			this.sendSettingItems = [
				{
					label: '按Enter键发送', 
					click: function() {
						vm.messageSendCode = 0
					}
				},
				{
					label: '按Ctrl+按Enter键发送',
					click: function() {
						vm.messageSendCode = 1
					}
				}
			]
			if (this.messageSendCode == 0) {
				this.sendSettingItems[0].icon = 'ion-checkmark'
			} else if (this.messageSendCode == 1) {
				this.sendSettingItems[1].icon = 'ion-checkmark'
			}
			contextMenu.setMenuItems(this.sendSettingItems)
			contextMenu.show(e.screenX, e.screenY)
		},
		resizeAreaStart: function(e) {
			resize.down = true
			resize.start.x = e.pageX
			resize.start.y = e.pageY
			resize.height = parseFloat(document.querySelector('.chatting-content').style.height)
			resize.scrollTop = document.querySelector('.main').scrollTop
		},
		resizeChattingArea: function(e) {
			if (resize.down) {
				resize.delta.x = resize.start.x - e.pageX
				resize.delta.y = resize.start.y - e.pageY
				let height = resize.height + resize.delta.y
				if (height < 40) {
					height = 40
				} else if (height > 260) {
					height = 260
				} else {
					document.querySelector('.main').scrollTop = resize.scrollTop + resize.delta.y
				}
				document.querySelector('.chatting-content').style.height = height + 'px'
				document.querySelector('.main').style.height = 'calc(100% - ' + (height + 155) + 'px)'  // 136-60+85=161 - 5
			}
		},
		resizeAreaEnd: function(e) {
			resize.down = false
		},
		chattingContentEvent: function(e) {
			console.log(e.type)
			e.preventDefault()
		},
		sendMessage: function() {
			sendMessage()
		},
		enterSendMessage: function(e) {
			if (this.messageSendCode == 0) {  // enter发送
				if (e.keyCode == 10) {
					newLine()
				} else if (e.keyCode == 13) {
					e.preventDefault()
					sendMessage()
				}
			} else if (this.messageSendCode == 1) {  // ctrl+enter发送
				if (e.keyCode == 10) {
					sendMessage()
				}
			}
		}
	},
	watch: {
		maximized: function() {
			if (this.maximized) {
				document.querySelector('html').style.margin = 0
				document.querySelector('html').style.height = '100%'
			} else {
				document.querySelector('html').style.margin = '5px'
				document.querySelector('html').style.height = 'calc(100% - 10px)'
			}
		}
	},
	filters: {
		time: function(value) {
			if (!value) return
			function prefix(num, n) {
				n = 2
				return (Array(n).join(0) + num).slice(-n)
			}
			let d = new Date(value)
			return prefix(d.getHours()) + ':' + prefix(d.getMinutes()) + ':' + prefix(d.getSeconds())
		}
	}
})

// 发送消息
function sendMessage() {
	let messageContent = document.querySelector('.chatting-content').innerHTML.trim()
	if (messageContent == '') {
		return
	}
	if (messageContent.length > 500) {
		// 提示--输入内容过长
		return
	}
	let params = {
		msg: messageContent,
		receiver: vm.basic.id
	}
	mainWindow.webContents.send('chat:message', params)
	// 展示消息到聊天窗
	vm.messageList = vm.messageList || []
	vm.messageList.push({
		avatar: vm.basic.avatarSelf,
		content: messageContent,
		time: new Date().getTime(),
		self: true
	})
	// 滚动到底部
	setTimeout(function() {
		document.querySelector('.main').scrollTop = document.querySelector('.main').scrollHeight
	}, 50)
	// 清空内容
	document.querySelector('.chatting-content').innerHTML = ''
}

// 回车切换新行
function newLine() {
	var range = window.getSelection()
	var focusParentNode = range.focusNode
	if (focusParentNode == document.querySelector('.chatting-content')) {
		var div = document.createElement('div')
		div.innerHTML = '<br>'
		focusParentNode.appendChild(div)
		div = document.createElement('div')
		div.innerHTML = '<br>'
		focusParentNode.appendChild(div)
		range.selectAllChildren(div)
		range.collapseToStart()
		return
	}

	if (focusParentNode.nodeType == Node.TEXT_NODE) {
		focusParentNode = focusParentNode.parentNode
	}

	var nodeIndex = focusParentNode.childNodes.length
	if (range.focusNode.nodeType == Node.TEXT_NODE) {
		nodeIndex = focusParentNode.childNodes.length
	} else if (Node.ELEMENT_NODE) {
		nodeIndex = range.focusOffset
	}
	if (range.focusNode.nodeType == Node.TEXT_NODE) {
		nodeIndex = 0
	}

	var current = ''
	var next = ''
	focusParentNode.childNodes.forEach(function(item, index) {
		if (item == range.focusNode) {
			nodeIndex = index
			current += item.nodeValue.substring(0, range.focusOffset)
			next += item.nodeValue.substring(range.focusOffset)
		}
		if (index < nodeIndex) {
			if (item.nodeType == Node.ELEMENT_NODE) {
				current += item.outerHTML
			} else if (item.nodeType == Node.TEXT_NODE) {
				current += item.nodeValue
			}
		} else if (index > nodeIndex) {
			if (item.nodeType == Node.ELEMENT_NODE) {
				next += item.outerHTML
			} else if (item.nodeType == Node.TEXT_NODE) {
				next += item.nodeValue
			}
		} else {
			if (item.nodeType == Node.ELEMENT_NODE) {
				next += item.outerHTML
			}
		}
	})
	current = current == '' ? '<br>' : current
	next = next == '' ? '<br>' : next
	focusParentNode.innerHTML = current
	var div = document.createElement('div')
	div.innerHTML = next
	if (focusParentNode != document.querySelector('.chatting-content')) {
		document.querySelector('.chatting-content').insertAfter(div, focusParentNode)
	} else {
		focusParentNode.appendChild(div)
	}
	range.selectAllChildren(div)
	range.collapseToStart()
	// 滚动到底部
	document.querySelector('.chatting-content').scrollTop = document.querySelector('.chatting-content').scrollHeight
}

Node.prototype.insertAfter = function (newEl, targetEl) {
	var parentEl = targetEl.parentNode
	if(parentEl.lastChild == targetEl) {
		parentEl.appendChild(newEl)
	} else {
		parentEl.insertBefore(newEl, targetEl.nextSibling)
	}
}

String.prototype.trim = function() {
	return this.replace(/(^\s*)|(\s*$)/g, '')
	// return this.replace(/(^\s|&nbsp;|[\x20])*|((\s|&nbsp;|[\x20])*$)/g, '')
}
