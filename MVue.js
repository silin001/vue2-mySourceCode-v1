const compileUtil = {
  // 处理person.msg 多层次数据
  getVal (expr, vm) {
    return expr.split('.').reduce((data, currentVal) => {
      // console.log(currentVal)
      return data[currentVal]
    }, vm.$data)
  },
  text (node, expr, vm) { // expr :msg
    let value
    if (expr.includes('{{')) {
      value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
        console.log(args)
        return this.getVal(args[1], vm)
      })
    } else {
      value = this.getVal(expr, vm)
    }
    this.updater.textUpdater(node, value)
  },
  html (node, expr, vm) {
    const value = this.getVal(expr, vm)
    this.updater.htmlUpdater(node, value)

  },
  model (node, expr, vm) {
    const value = this.getVal(expr, vm)
    this.updater.modelUpdater(node, value)
  },
  on (node, expr, vm, eventName) {
    let fun = vm.$options.methods && vm.$options.methods[expr]
    console.log(node, eventName)
    node.addEventListener(eventName, fun.bind(vm), false)
  },
  // TODO  bind 和: 属性绑定待实现
  bind (node, expr, vm, attrNmae) {
    console.log(attrNmae, expr)
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
// 解析指令
class Compile {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    this.vm = vm
    // 1.获取文档碎片对象，放入内存减少页面重构和回流
    const fragment = this.node2Fragent(this.el)
    console.log('🚀🚀 ~ file: MVue.js ~ line 7 ~ Compile ~ constructor ~ fragment', fragment)
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
    const attributes = [...node.attributes]
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
      console.log(content)
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
// vue类
class MVue {
  constructor(options) {
    this.$el = options.el
    this.$data = options.data
    this.$options = options
    if (this.$el) {
      // 1.实现一个数据观察者：observer类
      // 2.实现一个指令解析器： compile类
      new Compile(this.$el, this)
    }
  }
}