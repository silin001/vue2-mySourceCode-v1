# vue2-mySourceCode-v1
vue2.0 源码解析v1
只对对象数据进行监听,数组暂没实现.
data实现代理
# vue 响应式原理理解 ⭐⭐⭐
Vue在初始化实例时，由Observer类遍历data里所有属性，并实例化Dep类，一个属性一个Dep用来管理该属性下的所有Watcher（如果同一个属性在DOM节点中多次使用会创建多个Watcher），并使用Object.defineProperty()方法把这些属性都转为getter/setter。

在Compile中，初始化视图并实例化Watcher，将更新函数放到Watcher的回调上。

初始化视图时，会读取属性值，触发get，在get中将创建的Watcher交由dep管理。

当修改数据时，会触发set，调用dep的notify，执行该dep管理下的所有Watcher的回调，重新render当前组件，生成新的虚拟DOM树。

Vue框架会遍历并对比新虚拟DOM树和旧虚拟DOM树种每个节点的差别，并记录下来，最后，加载操作，将所有记录的不同点，局部修改到真DOM树上。

# 发布订阅流程:
1. new Observer 的时候给所有数据绑定了 getter/setter，同时每一层数据 data 都有一个 dep

2. new Compile 的时候编译节点触发 compileUtil 里 执行 new Watcher

3. new Watcher 里的 getOldVal（就是现在这个函数）先Dep.target = this，把wathcer自身绑到 Dep 类上，然后调用 compileUtil.getVal

4. getVal里有操作 data【curVal】，会触发这个data【curVal】 的 getter

5. getter 里判断执行 Dep.target && dep.addSub(Dep.target) 【Dep.target的值第3步加上的】，这样 dep 实例的 subs 就有了一个watcher

6. 回到 watcher 的 getOldVal 里，要把 Dep.target 置null，否则下次谁再执行getter的时候，Dep.target 里就有其他的 wathcers，然后这些 wathcers 会被添加进别人的 dep.subs 里

# 代码实现步骤:
  1. 创建vue类,
  2. Compile类 解析指令, 初始化视图
  3. 创建Observer类 劫持监听所有数据. 创建Dep实例
    get初始化时:
      使用依赖收集器Dep  关联  Dep 和 Ovserver
    set更改数据时:
      告诉Dep 通知变化
  4. Dep类
    添加订阅者addSub()
    通知变化notify(), update
  5. Watcher类 观察者.看旧值是否有变化如果有就要去更新.
    getOldVal()获取旧值
    update()判断更新

#  代码最终实现步骤:
  1. 创建vue类,
  2. Compile类 解析指令, 初始化视图
     +处理v-html\v-text\on...事件时需要 绑定更新函数 Watcher类 (观察者)
  3. 创建Observer类 劫持监听所有数据. 创建Dep实例
    get初始化时:
      使用依赖收集器Dep  关联  Dep 和 Ovserver
    set更改数据时:
      告诉Dep 通知变化
  4. Dep类
    添加订阅者addSub()
    通知变化notify(), update
  5. Watcher类 观察者.看旧值是否有变化如果有就要去更新.
    getOldVal()获取旧值
    update()判断更新
  6.双向数据绑定实现




