import { createApp } from "vue";
import App from "./App.vue";

// 全局样式
const style = document.createElement("style");
style.textContent = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  html, body, #app {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }
`;
document.head.appendChild(style);

// 定义全局初始化函数
window.handleTickInit = function (tick) {
  var nextYear = new Date().getFullYear() + 1;
  // 使用 window.Tick 避免 ESLint 报 undefined
  if (window.Tick && window.Tick.count && typeof window.Tick.count.down === 'function') {
    window.Tick.count.down(nextYear + "-01-01").onupdate = function (value) {
      tick.value = value;
    };
  }
};

createApp(App).mount("#app");
