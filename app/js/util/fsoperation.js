const fs = require('fs')
const http = require('http')
const path = require('path')
const Promise = require('bluebird')

// 递归遍历目录文件
function walk(path) {
    let dirList = fs.readdirSync(path)
    dirList.forEach(function(item) {
        if (fs.statSync(path + '/' + item).isDirectory()) {
            // walk(path + '/' + item)  // 暂时不需要递归
        } else {
            // fileList.push(path + '/' + item)
            fileList.push(item)  // 只返回文件名
        }
    })
}

// 下载网络图片
function download(url, path) {
	return new Promise(function(resolve, reject) {
		http.get(url, function(res) {
			let data = ''
			
			res.setEncoding('binary')
			
			res.on('data', function(chunk) {
				data += chunk
			})
			
			res.on('end', function() {
				saveImg(path + url.substring(url.lastIndexOf('/') + 1), data)
				resolve()
			})
			
			res.on('error', function(error) {
				console.log(JSON.stringify(error.message))
			})
		})
	})
}

// 存储图片到本地
function saveImg(path, data) {
	fs.writeFile(path, data, 'binary', function(err) {
		if (err) {
			throw err
		}
	})
}


let fileList = []

// 遍历文件夹
function listDirectory(directory) {
	walk(directory)

	return fileList
}

// 从指定网络地址下载图片资源到本地
function downloadImage(url, path) {
	download(url, path)
}


// 存放头像路径
let avatarPath = path.join(__dirname, '../../img/avatar')

// 遍历头像目录下的所有头像
function listAvatars() {
	let avatars = fs.readdirSync(avatarPath)
	avatars.forEach(function(item) {
		if (! fs.statSync(avatarPath + '/' + item).isDirectory()) {
			avatars.push(item)
		}
	})

	return avatars
}

let avatars = listAvatars()

// 下载头像并存到头像目录
function downloadAvatar(url) {
	return new Promise(function(resolve, reject) {
		let avatarName = url.substring(url.lastIndexOf('/') + 1)
		if (avatars.indexOf(avatarName) == -1) {
			avatars.push(avatarName)
			download(url, avatarPath).then(resolve)
		} else {
			resolve()
		}
	})
}

module.exports = {
	listDirectory: listDirectory,
	downloadImage: downloadImage,
	downloadAvatar: downloadAvatar
}
