/*
 * @Author: your name
 * @Date: 2021-08-23 14:22:30
 * @LastEditTime: 2021-08-31 09:42:48
 * @LastEditors: Please set LastEditors
 * @Description:  劫持监听所有属性
 * @FilePath: \risk-uid:\web_si\my_webDemo\源码学习系列\vue响应式原理\sourceCode-vue2\sourceCode-v1\Observe.js
 */

// 5. watcher类 观察者, 作用：看新值与旧值是否有变化 如果有就要去更新
// 在每次更改数据的时候 new Watcher
class Watcher {
  constructor(vm, expr, cbcallback) {
    this.vm = vm
    this.expr = expr
    // console.log(expr)
    this.cbcallback = cbcallback
    // 先把旧值保存起来
    this.oldVal = this.getOldVal()

  }
  // 获取旧值
  getOldVal () {
    Dep.target = this // 此时this已经有了watcher  给Dep添加一个target属性
    const oldVal = compileUtil.getVal(this.expr, this.vm)
    Dep.target = null //  不销毁掉 会重复
    return oldVal
  }
  // 更新新值
  update () {
    const newVal = compileUtil.getVal(this.expr, this.vm)
    if (newVal !== this.oldVal) {
      // callback回调新值
      this.cbcallback(newVal)
    }
  }
}
// 4.Dep类 作用： 1通知watcher更新视图、2收集watcher观察者，
class Dep {
  constructor() {
    this.subs = []
  }
  // 收集观察者
  addSub (watcher) {
    this.subs.push(watcher)
  }
  // 通知观察者去更新
  notify () {
    console.log('观察者', this.subs)
    this.subs.forEach(w => w.update())
  }
}
// 3.数据劫持
class Observer {
  constructor(data) {
    this.observe(data)
  }
  // 将一个正常的object转换为每个层级的属性都是响应式（可以被侦测）的object遍历所有数据
  observe (data) {
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(key => {
        this.defineReactive(data, key, data[key])
      })
    }
  }
  // 数据劫持
  defineReactive (obj, key, value) {
    // 递归遍历子节点
    this.observe(value)
    // 依赖收集器
    const dep = new Dep()
    // 核心：劫持并监听所有属性
    Object.defineProperty(obj, key, {
      enumerable: true, // 是否可读
      configurable: false, // 可被配置，比如可以被delete
      get () { // 初始化劫持数据时
        // ⭐⭐⭐往Dep里添加观察者！！！ 使用依赖收集器dep  关联  Dep 和 Ovserver
        // 通过dep收集 watcher 依赖
        Dep.target && dep.addSub(Dep.target)
        return value
      },
      set: (newVal) => {  //这里使用箭头函数是因为下面的this。
        if (newVal !== value) {
          // 对新的值继续劫持
          this.observe(newVal)
          value = newVal
        }
        // 值发生变化时，通知Dep中的 watcher 更新视图
        dep.notify()
      }
    })
  }
}