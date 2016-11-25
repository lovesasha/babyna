// 初始化时读取配置（localStorage或json文件）到全局变量，一些可能需要从网络读取配置
// 从配置文件获取socket连接的地址以及接口名
// 负责socket连接和连接异常处理

// 异步方式
const Promise = require('bluebird')

const io = require(path.join(__dirname, '../lib/socket.io.min'))

let wshost = 'http://isasha.me:41981'

let user = io.connect(wshost + '/user')

let room = io.connect(wshost + '/room')

let chat = io.connect(wshost + '/chat')

// 全部接口都接受回调

// user模块

/*
 * 获取随机头像图片地址
 * return {imgname: '', imgpath:'', msg: ''}
 */
function avatar(cb) {
	return new Promise(function(resolve, reject) {
		user.emit('avatar', null, function(data) {
			// if (cb) cb(data)
			resolve(data)
		})
	})
}
/*
 * 登录
 * params {name: '', avatar: ''}
 * return {id, name, avatar}
 */
function login(params) {
	return new Promise(function(resolve, reject) {
		user.emit('regist', params, function(data) {
			resolve(data)
		})
	})
}

/*
 * 取消登录
 * params id
 */
function cancelLogin(params) {
	return new Promise(function(resolve, reject) {
		user.emit('unregist', params, function(data) {
			resolve(data)
		})
	})
}

// room模块

/*
 * 获取全部用户
 * return [{id, name, avatar}]
 */
function userall() {
	return new Promise(function(resolve, reject) {
		room.emit('userall', null, function(data) {
			resolve(data)
		})
	})
}
/*
 * 用户发生变化
 * Promise方式只会调用一次，所以采用注册回调方式
 */
function userchange(cb) {
	room.on('userchange', function(data) {
		if (cb) cb(data)
	})
}

// chat模块--该模块设计有缺陷

/*
 * 发送消息
 * params {avatar, msg, receiver}
 */
function message(params) {
	return new Promise(function(resolve, reject) {
		chat.emit('message', params, function(data) {
			resolve(data)
		})
	})
}

/*
 * 接收到消息
 */
function onmessage(cb) {
	user.on('message', function(data) {
		if (cb) cb(data)
	})
}

/*
 * 发送消息错误
 */
function onmsgerr(cb) {
	user.on('msgerr', function(data) {
		if (cb) cb(data)
	})
}


module.exports = {
	avatar: avatar,
	login: login,
	// cancelLogin: cancelLogin,
	userall: userall,
	userchange: userchange,
	message: message,
	onmessage: onmessage,
	onmsgerr: onmsgerr
}
