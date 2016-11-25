const electron = require('electron')
const ipcRenderer = electron.ipcRenderer
const remote = electron.remote
const BrowserWindow = remote.BrowserWindow

let html = document.querySelector('html')
let fromWindowId
/*ipcRenderer.on('set-menu-items', function(event, data, id) {
	vm.setMenuItems(data)
	let len = data.length
	for (let item in data) {
		if (data[item].type == 'separator') len --
	}
	if (len == 1) {
		html.style.height = '26px'
	} else if (len == 2) {
		html.style.height = '50px'
	} else {
		html.style.height = 26*len-(2*len-3) + 'px'
	}
	fromWindowId = id
})

// let Vue = require(path.join(__dirname, '../js/vue.js'))
let Vue = require('E:/Electron/babyna/app/js/vue.js')

let vm = new Vue({
	el: '.container',
	data: {
		menuItems: []
	},
	methods: {
		setMenuItems: function(items) {
			this.menuItems = items
		},
		itemClick: function(item, index) {
			let fromWindow = BrowserWindow.fromId(fromWindowId)
			fromWindow.webContents.send('context-menu-click', index, item.mark)
		}
	}
})*/

let Vue = require('E:/Electron/babyna/app/js/vue.js')

function ContextMenu() {

	this.contextMenu = function() {
		this.contextmenu = new BrowserWindow({
			width: 180,
			height: 200,
			resizable: false,
			frame: false,
			show: false,
			alwaysOnTop: true,
			skipTaskbar: true,
			transparent: true
		})
		this.contextmenu.loadURL('http://localhost:3000/html/widgets/contextmenu.html')
		this.contextmenu.on('blur', () => {
			this.contextmenu.hide()
		})

		return this
	}

	this.setMenuItems = function(menuItems) {
		/*let len = menuItems.length
		for (let item in menuItems) {
			if (menuItems[item].type == 'separator') len --
		}
		if (len == 1) {
			html.style.height = '26px'
		} else if (len == 2) {
			html.style.height = '50px'
		} else {
			html.style.height = 26*len-(2*len-3) + 'px'
		}*/
		let len = 0
		for (let item in menuItems) {
			if (menuItems[item].type != 'separator') len ++
		}
		let height = len * 24 + 12
		this.contextmenu.setSize(this.contextmenu.getSize()[0], height)
		this.contextmenu.webContents.send('set-menu-items', menuItems)
	}

	this.show = function(e) {
		this.contextmenu.setPosition(e.screenX, e.screenY)
		this.contextmenu.show()
	}

}

let contextMenu = new ContextMenu()

module.exports = contextMenu

/*module.exports = {

	contextMenu: contextMenu,

	vueWorks: vueWorks
}*/

// 明天研究
/*module.exports = {
	newVue: function() {
		vm = new Vue({
			el: '.container',
			data: {
				menuItems: []
			},
			methods: {
				setMenuItems: function(items) {
					this.menuItems = items
				},
				itemClick: function(item, index) {
					let fromWindow = BrowserWindow.fromId(fromWindowId)
					fromWindow.webContents.send('context-menu-click', index, item.mark)
				}
			}
		})
	},
	setContextMenu: function(menuItems) {
		let contextMenu = new BrowserWindow({
			width: 180,
			height: 200,
			resizable: false,
			frame: false,
			show: false,
			alwaysOnTop: true,
			skipTaskbar: true,
			transparent: true
		})
		contextMenu.loadURL('http://localhost:3000/html/widgets/contextmenu.html')
		contextMenu.on('blur', () => {
			contextMenu.hide()
		})
		vm.setMenuItems(menuItems)
		let len = menuItems.length
		for (let item in menuItems) {
			if (menuItems[item].type == 'separator') len --
		}
		if (len == 1) {
			html.style.height = '26px'
		} else if (len == 2) {
			html.style.height = '50px'
		} else {
			html.style.height = 26*len-(2*len-3) + 'px'
		}
	}
}*/
