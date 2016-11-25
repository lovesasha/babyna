const electron = require('electron')
const ipcRenderer = electron.ipcRenderer
const shell = electron.shell
const remote = electron.remote
const app = remote.app
const BrowserWindow = remote.BrowserWindow
const Tray = remote.Tray
const path = require('path')
const url = require('url')

const storage = require(path.join(__dirname, '../js/util/storage'))
const conn = require(path.join(__dirname, '../js/util/connection'))
const Vue = require(path.join(__dirname, '../js/lib/vue'))


// 窗口信息
let currentWindow = remote.getCurrentWindow()
let mainWindow = BrowserWindow.fromId(2)

let vm = new Vue({
	el: '.container',
	data: {
		username: '',
		password: '',
		avatar: 'http://works.isasha.me/happychatting/halfme.png',
		avatarHide: false,
		avatarLoaded: false,
		shouldRememberPwd: false,
		shouldAutoLogin: false,
		entering: false
	},
	methods: {
		minimize: function() {
			currentWindow.minimize()
		},
		close: function() {
			app.quit()
		},
		login: function() {
			if (this.username != '') {
				if (! this.entering) {
					let params = {name: this.username, avatar: this.avatar}
					mainWindow.webContents.send('user:login', params)
					// 保存用户信息
					storage.set('userData', params)
				}
				this.entering = ! this.entering
			}
		},
		rememberPwd: function() {
			this.shouldRememberPwd = ! this.shouldRememberPwd
		},
		autoLogin: function() {
			this.shouldAutoLogin = ! this.shouldAutoLogin
		},
		register: function() {
			shell.openExternal('http://bella41981.applinzi.com/club/reg')
		},
		forgetpwd: function() {
			shell.openExternal('http://bella41981.applinzi.com/club/forgetPwd')
		},
		setData: function(dataKey, dataValue) {
			this[dataKey] = dataValue
		},
		refreshAvatar: function() {
			let that = this
			that.avatarHide = false
			that.avatarLoaded = false
			conn.avatar().then(function(data) {
				let img = new Image()
				img.onload = function() {
					that.avatarHide = true
					that.avatarLoaded = true
					that.avatar = data.imgpath
				}
				img.src = data.imgpath
			})
		}
	}
})

// 读取配置信息
let userData = storage.get('userData')
if (userData) {
	vm.username = userData.name
	vm.avatar = userData.avatar
}
