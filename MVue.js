// 单独抽出工具方法, 1初始化数据2绑定观察者!
const compileUtil = {
  // 处理person.msg 多层次数据
  getVal (expr, vm) {
    // BUG 此处不能使用 reduce   对象数据双向绑定时有问题！  已优化！
    // return expr.split('.').reduce((data, currentVal) => {
    //   // console.log(currentVal)
    //   return data[currentVal]
    // }, vm.$data)
    // console.log(expr, vm)
    let val = vm.$data
    expr = expr.split('.')
    expr.forEach((item) => {
      val = val[item]
    })
    return val
  },
  setVal (expr, vm, newInputVal) {
    // BUG  使用reduce 这里对象结构数据 双向绑定时会 报错,已优化!
    // return expr.split('.').reduce((data, currentVal) => {
    //   console.log(data, currentVal)
    //   data[currentVal] = newInputVal
    // }, vm.$data)
    let val = vm
    expr = expr.split('.')
    expr.forEach((item, index) => {
      if (index < expr.length - 1) {
        val = val[item]
      } else {
        val[item] = newInputVal
      }
    })

  },
  // 重新处理text文本
  getContentVal (expr, vm) {
    // console.log('🚀🚀 ~ file: MVue.js ~ line 41 ~ getContentVal ~ expr', expr)
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getVal(args[1], vm)
    })
  },
  text (node, expr, vm) { // expr :msg
    let value
    if (expr.includes('{{')) {
      value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
        //⭐ 绑定watcher
        new Watcher(vm, args[1], () => {
          this.updater.textUpdater(node, this.getContentVal(expr, vm))// 因为text文本特殊 需要添加一个方法单点处理
        })
        return this.getVal(args[1], vm)
      })
    } else {
      console.log(expr)
      //⭐ 绑定watcher
      new Watcher(vm, expr, () => {
        this.updater.textUpdater(node, this.getVal(expr, vm))// 因为text文本特殊 需要添加一个方法单点处理
      })
      value = this.getVal(expr, vm)
    }
    this.updater.textUpdater(node, value)
  },
  html (node, expr, vm) {
    const value = this.getVal(expr, vm)
    //⭐ 绑定观察者watcher 对数据监听- 将来数据变化时触发这里的回调,更新视图!
    new Watcher(vm, expr, (newVal) => {
      this.updater.htmlUpdater(node, newVal)
    })
    // 1.初始化绑定值
    this.updater.htmlUpdater(node, value)
  },
  // ⭐ 双向数据绑定实现！
  model (node, expr, vm) {
    //2. ⭐ 添加绑定更新函数watcher, 数据=> 视图
    new Watcher(vm, expr, (newVal) => {
      this.updater.modelUpdater(node, newVal)
    })
    //1.
    let value = this.getVal(expr, vm)
    // 视图=> 数据=> 视图
    node.addEventListener('input', (el) => {
      const newVal = el.target.value
      // 设置input值
      this.setVal(expr, vm, newVal)
    })
    // console.log(value)
    this.updater.modelUpdater(node, value)
  },
  on (node, expr, vm, eventName) {
    let fun = vm.$options.methods && vm.$options.methods[expr]
    // console.log(node, eventName)
    node.addEventListener(eventName, fun.bind(vm), false)
  },
  // TODO  bind 和: 属性绑定待实现
  bind (node, expr, vm, attrNmae) {
    // console.log(attrNmae, expr)
    // node.setAttribute(attrNmae, expr)
    // compileUtil['text'](node, content, this.vm)

  },
  // 更新数据函数
  updater: {
    modelUpdater (node, value) {
      node.value = value
    },
    htmlUpdater (node, value) {
      node.innerHTML = value
    },
    textUpdater (node, value) {
      node.textContent = value
    }
  }
}
// 2.解析指令
class Compile {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    this.vm = vm
    // 1.获取文档碎片对象，放入内存减少页面重构和回流
    const fragment = this.node2Fragent(this.el)
    // 2.编译模板
    this.compile(fragment)
    // 3.追加子元素到根元素
    this.el.appendChild(fragment)
  }
  compile (fragment) {
    // 1.获取子节点
    let childNodes = [...fragment.childNodes]
    childNodes.forEach(element => {
      // console.log(element)
      if (this.isElementNode(element)) {
        // 是元素节点，
        // 编译元素节点
        // console.log('元素', element)
        this.compileElement(element)
      } else {
        // 文本节点
        // 编译文本节点
        // console.log('文本：', element)
        this.compileText(element)
      }
      // 递归遍历子元素的节点和文本
      if (element.childNodes && element.childNodes.length) {
        this.compile(element)
      }
    })
  }
  // 编译元素节点
  compileElement (node) {
    // console.log('🚀🚀 ~ file: MVue.js ~ line 36 ~ Compile ~ compileElement ~ node', node)
    const attributes = [...node.attributes] // 获取真正的属性列表 并且转为真数组
    // // 写法2
    // Array.prototype.slice.call(attributes).forEach()
    // [].slice.call(attributes).forEach()
    attributes.forEach(attr => {
      const { name, value } = attr
      // 如果是v-开头 就是一个指令
      if (this.isDirective(name)) {
        const [, dircitve] = name.split('-') // text  html  on:click
        const [dirName, eventName] = dircitve.split(':') // text html click
        // 更新数据驱动视图，根据不同指令渲染不同节点数据
        compileUtil[dirName](node, value, this.vm, eventName)
        // 删除有指令标签的属性
        node.removeAttribute('v-' + dircitve)
      } else if (this.isEventName(name)) {
        // @click = 'click'
        let [, eventName] = name.split('@')
        compileUtil['on'](node, value, this.vm, eventName)
      }
    })

  }
  // 编译文本节点
  compileText (node) {
    const content = node.textContent
    if (/\{\{(.+?)\}\}/.test(content)) {
      compileUtil['text'](node, content, this.vm)
    }
  }

  isEventName (attrName) {
    return attrName.search('@') !== -1
  }
  isDirective (attrName) {
    // startswith  有兼容问题
    // return attrName.startswith('v-')
    return attrName.search('v-') !== -1
  }
  node2Fragent (el) {
    // 创建文档碎片
    const f = document.createDocumentFragment()
    let firstChild
    // 让所有dom节点都进入fragment
    while (firstChild = el.firstChild) {
      f.appendChild(firstChild)
    }
    return f
  }
  // 判断当前el是否为节点
  isElementNode (node) {
    return node.nodeType === 1
  }
}
// 1.vue类
class MVue {
  constructor(options) {
    this.$el = options.el
    this.$data = options.data
    this.$options = options
    if (this.$el) {
      // 1.实现一个数据观察者：observer类
      new Observer(this.$data)
      // 2.实现一个指令解析器： compile类
      new Compile(this.$el, this)
      // 代理实现直接 this.a  取代 this.$data.XXX
      this.proxyData(this.$data)
    }
  }
  proxyData (data) {
    for (const key in data) {
      Object.defineProperty(this, key, {
        get () {
          return data[key]
        },
        set (newVal) {
          data[key] = newVal
        }
      })
    }
  }
}