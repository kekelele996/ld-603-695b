// 端到端冒烟：jsdom 加载真实构建产物 + 真实后端 HTTP，模拟用户点击完整闭环。
// 用法：先启动后端（uvicorn src.main:app --port 8137），再运行本脚本；
// 可用 BACKEND 环境变量覆盖地址。
import { JSDOM } from "jsdom";

const BACKEND = process.env.BACKEND || "http://127.0.0.1:8137";
const html = `<!doctype html><html><body><div id="root"></div>
<script src="/bundle.js"></script></body></html>`;

const dom = new JSDOM(html, {
  url: "http://local.test/",
  runScripts: "outside-only",
  pretendToBeVisual: true
});
const { window } = dom;
global.window = window;
global.document = window.document;
global.navigator = window.navigator;
global.HTMLElement = window.HTMLElement;
global.HTMLSelectElement = window.HTMLSelectElement;
global.Node = window.Node;
global.getComputedStyle = window.getComputedStyle;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
Object.defineProperty(window, "crypto", { value: globalThis.crypto, configurable: true });
window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {} }));
window.addEventListener("error", (e) => console.log("WINDOW ERROR:", e.message, e.filename, e.lineno));
window.addEventListener("unhandledrejection", (e) => console.log("UNHANDLED REJECTION:", String(e.reason?.message ?? e.reason)));

// jsdom 无 fetch：用 Node fetch 直连后端，路径 /api -> BACKEND；Response 用 Node 实现
window.fetch = (path, init = {}) =>
  fetch(BACKEND + String(path), init).then(async (res) =>
    new globalThis.Response(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" }
    }));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// React 输入框兼容写法：用原型原生 setter 赋值后再派发事件，绕开 value tracker
function setNativeValue(element, value) {
  const proto = element instanceof window.HTMLSelectElement ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
  setter.call(element, value);
  element.dispatchEvent(new window.Event("input", { bubbles: true }));
  element.dispatchEvent(new window.Event("change", { bubbles: true }));
}

const fs = await import("node:fs");
const path = await import("node:path");
const assetsDir = path.resolve("frontend/dist/assets");
const bundleName = fs.readdirSync(assetsDir).find((name) => name.startsWith("index-") && name.endsWith(".js"));
const bundle = fs.readFileSync(path.join(assetsDir, bundleName), "utf8");

try {
  window.eval(bundle);
} catch (e) {
  console.error("bundle eval failed:", e.message);
  process.exit(1);
}

await sleep(800);
const text = () => window.document.body.textContent;
const assert = (cond, msg) => { if (!cond) { console.error("FAIL:", msg, "\n", text().slice(0, 600)); process.exit(1); } };

assert(text().includes("消防合规总览"), "dashboard renders");
console.log("1. 总览页渲染 OK，统计数字出现:", /有效隐患/.test(text()));

// 切到隐患页
const clickButton = (label) => {
  const btn = [...window.document.querySelectorAll("button")].find((b) => b.textContent.includes(label));
  assert(btn, `按钮存在: ${label}`);
  btn.click();
};
clickButton("隐患整改");
await sleep(300);
assert(text().includes("隐患整改"), "隐患页渲染");
assert(text().includes("HZ-1001") && text().includes("HZ-1002"), "三张隐患单展示");
assert(text().includes("已逾期") && text().includes("逾期已升级"),
  "逾期标记与严重升级标记展示");
assert(text().includes("待整改") && text().includes("待复验") && text().includes("已关闭"), "状态文案展示");
console.log("2. 隐患页状态/逾期展示 OK");

// 当前用户是张巡(id=1)，1002 不是其任务 -> 显示仅原巡检员可复验，无执行复验按钮
const card1002 = [...window.document.querySelectorAll(".hazard-card")].find((c) => c.textContent.includes("HZ-1002"));
assert(card1002.textContent.includes("仅原巡检员可复验"), "非原巡检员看不到复验按钮");
console.log("3. 原巡检员复验权限控制 OK");

// 切换身份到李检(id=2)
const select = window.document.querySelector(".user-switcher select");
setNativeValue(select, "2");
await sleep(600);
const card1002b = [...window.document.querySelectorAll(".hazard-card")].find((c) => c.textContent.includes("HZ-1002"));
assert(card1002b.textContent.includes("执行复验"), "原巡检员可见复验按钮");
card1002b.querySelector("button").click(); // 执行复验
await sleep(100);
const passBtn = [...card1002b.querySelectorAll("button")].find((b) => b.textContent.includes("复验通过"));
assert(passBtn, "展开复验通过/不通过按钮");
passBtn.click();
await sleep(700);
const card1002c = [...window.document.querySelectorAll(".hazard-card")].find((c) => c.textContent.includes("HZ-1002"));
assert(card1002c.textContent.includes("已关闭") && card1002c.textContent.includes("复验通过，隐患关闭，设备恢复可用"),
  "复验通过关闭并提示恢复设备");
console.log("4. 页面复验通过 -> 关闭 OK");

// 设备台账联动：设备4 可用
clickButton("消防设备台账");
await sleep(300);
assert(text().includes("SP-B01"), "设备页渲染");
const dev4Row = [...window.document.querySelectorAll(".device-row")].find((r) => r.textContent.includes("SP-B01"));
assert(dev4Row.textContent.includes("可用"), "复验后设备恢复可用");
console.log("5. 设备台账状态联动 OK");

// 巡检任务页：异常提交
clickButton("巡检任务");
await sleep(300);
assert(text().includes("检查项录入"), "任务页录入表单");
// 选任务1 默认设备1，填检查项并切异常
const doc = window.document;
const itemInput = doc.querySelector('input[placeholder="如 WATER_PRESSURE"]');
setNativeValue(itemInput, "E2E_CHECK");
const abnormalChip = [...doc.querySelectorAll(".result-switch .chip")].find((b) => b.textContent.includes("异常"));
abnormalChip.click();
await sleep(50);
const deadlineInput = doc.querySelector('input[type="datetime-local"]');
assert(deadlineInput, "异常时显示隐患派单字段");
const submit = [...doc.querySelectorAll("button")].find((b) => b.textContent.includes("提交巡检结果"));
submit.click();
await sleep(700);
assert(text().includes("隐患单 HZ-") && text().includes("已生成，设备已停用"), "异常提交生成隐患单提示");
console.log("6. 页面异常提交 -> 派单 + 停用设备 OK");

// 立即再次提交相同检查项：按钮禁用 + 刷新重放只生效一次
const itemInput2 = doc.querySelector('input[placeholder="如 WATER_PRESSURE"]');
assert(itemInput2.value === "", "提交后表单清空");
setNativeValue(itemInput2, "E2E_CHECK");
await sleep(50);
assert(text().includes("该检查项在本任务中已提交过"), "重复检查项前端拦截提示");
const submit2 = [...doc.querySelectorAll("button")].find((b) => b.textContent.includes("提交巡检结果"));
assert(submit2.disabled, "重复提交按钮禁用");
console.log("7. 重复提交拦截 OK");

// 后端确认只有一张新隐患单
const res = await fetch(BACKEND + "/api/hazard-ticket");
const hazards = await res.json();
const e2eResults = await (await fetch(BACKEND + "/api/inspection-result")).json();
const e2eResult = e2eResults.find((r) => r.item_code === "E2E_CHECK");
const linked = hazards.filter((h) => h.result_id === e2eResult.id);
assert(linked.length === 1, "同一结果仅一张有效隐患单");
console.log("8. 一结果一隐患单 OK，新单:", linked[0].id, linked[0].rectify_status);

console.log("\nFRONTEND E2E SMOKE PASSED");
