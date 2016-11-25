// 封装LocalStorage本地存储功能

function get(key, defaultValue) {
	var stored = window.localStorage.getItem(key)
	try {
	  stored = JSON.parse(stored)
	} catch (error) {
	  stored = null
	}
	if (defaultValue && stored === null) {
	  stored = defaultValue
	}
	return stored
}

function set(key, value) {
	if (value) {
	  window.localStorage.setItem(key, JSON.stringify(value))
	}
}

function remove(key) {
	window.localStorage.removeItem(key)
}

module.exports =  {
	get: get,
	set: set,
	remove: remove
}
