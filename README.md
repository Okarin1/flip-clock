# flip-clock

一个基于 Vue 3 + @pqina/flip 的翻页时钟项目，支持时钟、倒计时、番茄钟与码表。

## 功能

- 翻页时钟显示（支持 12/24 小时、显示秒开关）
- 倒计时（快捷 5/10 分钟 + 自定义弹窗）
- 番茄钟（工作/休息时长可配置）
- 码表（开始/暂停/重置/停止）
- 全屏切换
- 设置与缩放大小持久化（localStorage）

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run serve

# 构建生产版本
npm run build
```

## 项目结构

```
src/
  App.vue              # 页面逻辑与状态
  main.js              # 入口
  components/
    Flip.vue           # 翻页显示组件
    ClockControls.vue  # 底部控制区与设置
```

## 依赖

- Vue 3
- @pqina/flip

## License

MIT
