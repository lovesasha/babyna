const electron = require('electron')
const ipcRenderer = electron.ipcRenderer
const electronScreen = electron.screen
const screenSize = electronScreen.getPrimaryDisplay().size
const BrowserWindow = electron.remote ? remote.BrowserWindow : electron.BrowserWindow
const path = require('path')
const url = require('url')

ipcRenderer.on('menu-item-click', function(event, index) {
	contextMenu.itemClick(index)
})

function ContextMenu() {

	this.createContextMenu = function(windowId) {
		this.windowId = windowId
		// 上下文菜单为单实例，只允许创建一个，然后通过设置item来控制显示内容
		if (this.contextmenu != null) {
			return this.contextmenu
		}
		this.contextmenu = new BrowserWindow({
			width: 180,
			height: 200,
			resizable: false,
			frame: false,
			show: false,
			alwaysOnTop: true,
			skipTaskbar: true,
			transparent: true,
			useContentSize: true
		})

		this.contextmenu.loadURL(url.format({
			pathname: path.join(__dirname, '../../html/widget/contextmenu.html'),
			protocol: 'file:',
			slashes: true
		}))
		// this.contextmenu.loadURL('http://localhost:3000/html/widget/contextmenu.html')

		this.contextmenu.on('blur', () => {
			this.contextmenu.hide()
		})

		return this
	}

	this.setMenuItems = function(menuItems) {
		this.menuItems = menuItems
		let len = 0
		for (let item in menuItems) {
			if (menuItems[item].type != 'separator') len ++
		}
		let height = len * 24 + 12
		this.contextmenu.setSize(this.contextmenu.getSize()[0], height)
		this.contextmenu.webContents.send('set-menu-items', menuItems, this.windowId)
	}

	this.show = function(x, y) {
		let w = this.contextmenu.getSize()[0]
		let h = this.contextmenu.getSize()[1]
		if (x + w > screenSize.width - 10) {
			x = x - w
		}
		if (y + h > screenSize.height - 10) {
			y = y - h
		}
		this.contextmenu.setPosition(x, y)
		this.contextmenu.show()
	}

	this.itemClick = function(index) {
		let clickedItem = this.menuItems[index]
		if (clickedItem.click) clickedItem.click()
		this.contextmenu.hide()
	}

	this.destroy = function() {
		this.contextmenu.close()
	}
}

let contextMenu = new ContextMenu()

module.exports = contextMenu
