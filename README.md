<p align="center">
    <img src="https://i0.hdslb.com/bfs/article/2954c995c96dd4ece5922282f54ec58b8941412.png" width="400">
</p>
<p align="center">
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue" alt="license MIT"></a>
    <a href="https://qm.qq.com/q/iifNs5qukg"><img src="https://img.shields.io/badge/QQ%E7%BE%A4-920930589-green" alt="QQ群：920930589"></a>
    <a href="https://www.taptap.cn/app/719622"><img src="https://img.shields.io/badge/TapTap-%E6%88%91%E7%9A%84%E6%96%87%E5%AD%97%E4%BF%AE%E4%BB%99%E5%85%A8%E9%9D%A0%E5%88%B7-18d6e0" alt="TapTap"></a>
    <a href="https://hellogithub.com/repository/e73a691ffcfa4d0e92a05912fe8c0b46"><img src="https://abroad.hellogithub.com/v1/widgets/recommend.svg?rid=e73a691ffcfa4d0e92a05912fe8c0b46&claim_uid=OCYdts5lPczHag4&theme=small" alt="Featured｜HelloGitHub" /></a>
</p>

## 我的文字修仙全靠刷

### 斗破修仙世界改编版（2026-10-19）

基于谦君的原项目改编，保留装备、法宝、灵宠、道侣、商店、成就、无尽塔与世界 BOSS，继续遵循下方 CC BY-NC 4.0 协议。

- 斗之气至斗帝共 103 个境界节点，11 个区域可手动或自动历练。原自由行走、NPC 赠礼与垂钓保留，障碍物比例为 2%。
- 「秘境与机缘」包含三条焚天火域试炼：青莲地心火（五星大斗师，五关）、陨落心炎（五星斗王，五关）、净莲妖火（五星斗尊，七关）。门槛只决定能否进入，能否获胜取决于装备、属性和斗技。
- 三千焱炎火通过丹塔六关首通获取；生灵之焱由药草种植奇遇的华农老人概率赠送；与古薰儿好感达到 1000 后结伴获得金帝焚天炎；斗尊起野外有概率遭遇吞炎魔影，战胜后概率获得虚无吞炎。其他异火随机寻获，全部 23 道的获取方式可在「异火图鉴」查看。
- 所有已炼化异火自动协同攻击，每道附带一段基于本次命中伤害的火焰伤害。总附伤递减、低于 55%，不彼此乘算、不重复暴击。
- 统一防御减伤、技能冷却和伤害计算。五门斗技可学习、修习至五重并选择主修。强化每级增加初始主属性 4%，上限 +30（四舍五入），分六档强化石；失败保留装备和等级。
- 普通装备仅有强化成长，可材料定向打造、同部位传承强化；传承后来源归零。新手礼包支持至少两件红装的红色刷新。兑换码四件专属装备可强化、升境，并随收集异火自动共鸣：初始主属性约高 10%，每道不同异火再加基准 0.5%，最多额外 11.5%，不重复叠乘；每份存档限一套，其他途径不会产出。
- 野外有相逢、救援、护送、采药与残图事件，战斗事件胜利后增加 12～18 好感。灵石赠礼 +4、两份药草赠礼 +7，间隔 60 秒；资源不足不扣费。好感度表整合新旧 NPC，支持赠礼及结为伴侣。
- 药圃支持离线生长，挂机交战时也可收获，修为奖励在战斗结束后结算。凝血草、冰灵焰草、养魂涎分别回复最大气血的 15%、25%、35%，存于道具背包；自动打怪时气血不高于 50% 自动用药，间隔 6 秒，优先高回复药草。
- 自动打怪与自动修炼二选一，支持跨页面和最多四小时离线结算；界面显示运行状态，同修模式取消。试炼期间不能通过挂机、换装、境界点、药草或营地补充属性；每关胜利恢复 10% 气血。刷新后保留试炼进度并暂停自动战斗，需主动继续。
- 旧存档保留物品、强化等级与已收集异火，战斗属性按新体系重算；迁移前保留原始备份，可在洞府设置导出「数值调整前备份」。

本地运行：`npm install`、`npm run dev`。逻辑与数值验证：`npm test`；生产构建：`npm run build`。

详见 [数值设计、获取规则与模拟结果](docs/BALANCE.md)。

- 项目框架 [Vue.js](https://cn.vuejs.org)
- 项目 UI [Element Plus](https://element-plus.org/zh-CN)
- 状态管理库 [Pinia](https://pinia.vuejs.org/zh)

Docker 贡献者：

- wuchenchina [无尘](https://github.com/wuchenchina)
- CoolXiTech [酷曦科技](https://github.com/CoolXiTech)
- Firfr [Firfe](https://github.com/Firfr)

鸣谢以上开源项目及贡献者，排名不分先后.

## 快速开始

- [本地安装指南](https://github.com/setube/vue-xiuxiangame/wiki/%E6%9C%AC%E5%9C%B0%E5%AE%89%E8%A3%85%E6%8C%87%E5%8D%97)
- [Docker 部署指南](https://github.com/setube/vue-xiuxiangame/wiki/Docker%E9%83%A8%E7%BD%B2%E6%8C%87%E5%8D%97)

## 版权声明

知识共享署名-非商业性使用 4.0 国际许可协议

本作品采用知识共享署名-非商业性使用 4.0 国际许可协议进行许可。
要查看此许可协议的副本，请访问 http://creativecommons.org/licenses/by-nc/4.0/。

您自由地：
共享 — 在任何媒介以任何形式复制、发行本作品
改编 — 修改、转换或以本作品为基础进行创作

惟须遵守以下条件：
署名 — 您必须给出适当的署名，提供指向本许可协议的链接，同时标明是否（对原始作品）作了修改。您可以用任何合理的方式来署名，但不得以任何方式暗示许可人为您或您的使用背书。

非商业性使用 — 您不得将本作品用于商业目的。

没有附加限制 — 您不得适用法律术语或者技术措施从而限制其他人做许可协议允许的事情。

声明：
本作品是作者（谦君）的原创作品，项目源码地址：https://github.com/setube/vue-xiuxiangame
本授权条款不得被视为或解释为对任何版权的放弃或其他限制。

当您分享本作品的改编版本时，您必须：

- 在显著位置标注原作者的署名
- 保留本许可协议文档
- 明确说明修改内容及修改日期
- 使用相同的 CC BY-NC 4.0 协议进行分发

© 2025 谦君 - 保留所有权利（根据本许可协议授予的权限除外）
