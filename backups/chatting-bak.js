const electron = require('electron')
const ipcRenderer = electron.ipcRenderer
const nativeImage = electron.nativeImage
const shell = electron.shell
const remote = electron.remote

// 聊天背景图片
// let bgImage = nativeImage.createFromPath('../img/main-bg.png')
// let bgSize = bgImage.getSize()  // {width, height}
let bgImage = new Image()
bgImage.src = '../img/main-bg.png'

let html = document.querySelector('html')
ipcRenderer.on('chatting-window-resize', function(event, data) {
	html.style.height = data[1] - 10 + 'px'
	// 重置聊天背景宽高
	if (data[0] / data[1] < bgImage.width / bgImage.height) {
		document.querySelector('.backdrop').style.backgroundSize = 'auto 100%'
	} else if (data[0] / data[1] > bgImage.width / bgImage.height) {
		document.querySelector('.backdrop').style.backgroundSize = '100% auto'
	}
})
// 图片不可拖拽
let imgs = document.querySelectorAll('img')
imgs.forEach(function(img, index) {
	img.setAttribute('draggable', false)
})

ipcRenderer.on('chatting-data', function(event, data) {
	vm.resetBasicData(data)
})
ipcRenderer.on('reset-chatting-window-status', function(event) {
	vm.resetWindowStatus()
})

let resize = {
	down: false,
	height: 0,
	start: {x: 0, y: 0},
	delta: {},
}

// let Vue = require(path.join(__dirname, '../js/vue.js'))
let Vue = require('E:/Electron/babyna/app/js/vue.js')

let vm = new Vue({
	el: '.container',
	data: {
		basic: {},
		maximized: false,
		windowOnTop: false
	},
	methods: {
		resetBasicData: function(data) {
			this.basic = data
		},
		minimize: function() {
			ipcRenderer.send('chatting-window-minimize', this.basic.account)
		},
		maximizeOrRestore: function() {
			if (! this.maximized) {
				ipcRenderer.send('chatting-window-maximize', this.basic.account)
			} else {
				ipcRenderer.send('chatting-window-restore', this.basic.account)
			}
			this.maximized = ! this.maximized
		},
		close: function() {
			ipcRenderer.send('chatting-window-close', this.basic.account)
		},
		resetWindowStatus: function() {
			this.maximized = false
		},
		windowSetting: function(e) {
			let items
			if (this.windowOnTop) {
				items = [
					{
						icon: 'ion-checkmark', 
						label: '保持窗口最前', 
						click: transformFunc(function() {
							ipcRenderer.send('window-on-top', false)
						})
					},
					{type: 'separator'},
					{label: '更多设置'}
				]
			} else {
				items = [
					{
						label: '保持窗口最前', 
						click: transformFunc(function() {
							ipcRenderer.send('window-on-top', true)
						})
					},
					{type: 'separator'},
					{label: '更多设置'}
				]
			}
			this.windowOnTop = !this.windowOnTop

			let data = {
				type: 'chatting-window-setting',
				account: this.basic.account,
				items: items,
				pos: {
					x: e.screenX,
					y: e.screenY
				}
			}
			ipcRenderer.send('show-context-menu', data)
		},
		sendSetting: function(e) {
		},
		resizeAreaStart: function(e) {
			resize.down = true
			resize.height = parseFloat(document.querySelector('.chatting-content').style.height)
			resize.start.x = e.pageX
			resize.start.y = e.pageY
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
				}
				document.querySelector('.chatting-content').style.height = height + 'px'
				document.querySelector('.main').style.height = 'calc(100% - ' + (height + 161) + 'px)'  // 136-60+85=161
			}
		},
		resizeAreaEnd: function(e) {
			resize.down = false
		},
		chattingContentEvent: function(e) {
			console.log(e.type)
			e.preventDefault()
		},
		sendMsg: function() {

		}
	},
	watch: {
		maximized: function() {
			if (this.maximized) {
				html.style.margin = 0
				setTimeout(() => {
					html.style.height = '100%'
				}, 50)
			} else {
				html.style.margin = '5px'
			}
		}
	}
})

function transformFunc(func) {
	return '(' + (func.toString()) + ')()'
}