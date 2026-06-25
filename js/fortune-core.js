function clearUserData() {
    try {
        if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
            if (confirm('再次确认：这将删除所有任务和设置，确定继续吗？')) {
                // 清除任务数据
                if (typeof tasks !== 'undefined') {
                    tasks = [];
                }
                window.DataSyncStorage.removeRaw('tasks');

                // 清除设置
                window.DataSyncStorage.removeRaw('autoSave');
                window.DataSyncStorage.removeRaw('taskNotifications');
                window.DataSyncStorage.removeRaw('rememberMe');

                // 重新渲染
                if (typeof renderTasks === 'function') {
                    renderTasks();
                }

                showNotification('所有数据已清除', 'info');
            }
        }
    } catch (err) {
        SafeLogger.error('clearUserData error', err);
        showNotification('清除数据失败，稍后重试', 'error');
    }
}

// 显示通知函数
function showNotification(message, type = 'info') {
    try {
        // 移除现有通知
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // 添加到页面
        document.body.appendChild(notification);

        // 自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('is-exiting');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 3000);

    } catch (err) {
        SafeLogger.error('showNotification error', err);
        // 如果通知系统失败，使用alert作为后备
        alert(message);
    }
}

// 页面通知显示函数
function showPageNotification(message) {
    // 移除现有通知
    const existingNotification = document.querySelector('.page-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 创建新通知
    const notification = document.createElement('div');
    notification.className = 'page-notification';
    notification.textContent = message;

    document.body.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('is-exiting');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}





// 切换象限展开状态 - 单象限全屏模式
function toggleQuadrantExpand(quadrantId) {
    const quadrantView = document.getElementById('quadrant-view');
    const targetQuadrant = document.getElementById(quadrantId);
    const quadrantToolbar = document.querySelector('.quadrant-toolbar');
    const header = document.querySelector('header');
    const tabs = document.querySelector('.tabs');

    if (!targetQuadrant) return;

    // 检查当前象限是否已展开
    if (targetQuadrant.classList.contains('single-quadrant-fullscreen')) {
        // 退出单象限全屏模式
        quadrantView.classList.remove('fullscreen-mode');
        targetQuadrant.classList.remove('single-quadrant-fullscreen');

        // 显示所有象限
        document.querySelectorAll('.quadrant').forEach(q => {
            q.style.display = 'flex';
        });

        // 显示工具栏
        if (quadrantToolbar) quadrantToolbar.style.display = '';

        // 显示头部和导航栏
        if (header) header.style.display = '';
        if (tabs) tabs.style.display = '';

        // 恢复滚动条
        document.body.style.overflow = '';
    } else {
        // 进入单象限全屏模式
        quadrantView.classList.add('fullscreen-mode');
        targetQuadrant.classList.add('single-quadrant-fullscreen');

        // 隐藏其他象限，只显示目标象限
        document.querySelectorAll('.quadrant').forEach(q => {
            if (q.id === quadrantId) {
                q.style.display = 'flex';
            } else {
                q.style.display = 'none';
            }
        });

        // 隐藏工具栏
        if (quadrantToolbar) quadrantToolbar.style.display = 'none';

        // 隐藏头部和导航栏
        if (header) header.style.display = 'none';
        if (tabs) tabs.style.display = 'none';

        // 隐藏滚动条
        document.body.style.overflow = 'hidden';
    }
}

// 点击模态框外部关闭
window.addEventListener('click', function handleModalOutsideClick(event) {
    if (event.target === modalEl) {
        closeModal();
    }

    const helpModal = document.getElementById('help-modal');
    if (event.target === helpModal) {
        closeHelpModal();
    }
});

// 黄历运势模拟数据
const mockFortuneData = [
    {
        date: new Date(2024, 5, 15),
        luckLevel: "大吉",
        fortune: "今日运势极佳，贵人相助，事业上有突破性进展。感情生活甜蜜，单身者有机会遇到心仪对象。财运亨通，投资理财收益可观。",
        dos: ["签订合同", "投资理财", "求婚订婚", "搬家入宅", "开业庆典"],
        donts: ["争吵", "借贷", "动土", "远行"],
        auspiciousHours: ["07:00-09:00", "11:00-13:00", "15:00-17:00"],
        solarTerm: "芒种",
        ganzhi: "甲辰年 己巳月 庚戌日",
        conflict: "冲龙(甲辰)煞北",
        direction: "财神正东 喜神西北"
    },
    {
        date: new Date(2024, 5, 16),
        luckLevel: "吉",
        fortune: "整体运势平稳上升，工作上会有新机会出现。注意保持良好人际关系，避免小人作祟。感情方面需多沟通，避免误会。",
        dos: ["学习进修", "求职面试", "社交聚会", "健身锻炼", "储蓄理财"],
        donts: ["远行", "大额消费", "手术", "借贷"],
        auspiciousHours: ["09:00-11:00", "13:00-15:00", "19:00-21:00"],
        solarTerm: "芒种",
        ganzhi: "甲辰年 己巳月 辛亥日",
        conflict: "冲蛇(乙巳)煞西",
        direction: "财神正南 喜神西南"
    },
    {
        date: new Date(2024, 5, 17),
        luckLevel: "中",
        fortune: "今日运势稍有波动，工作中需谨慎行事，避免冲动决定。健康方面需注意饮食安全，避免生冷食物。财运一般，不宜大额投资。",
        dos: ["整理家务", "健身运动", "储蓄理财", "阅读学习", "制定计划"],
        donts: ["投资", "签约", "重要决定", "远行", "争吵"],
        auspiciousHours: ["07:00-09:00", "11:00-13:00"],
        solarTerm: "芒种",
        ganzhi: "甲辰年 己巳月 壬子日",
        conflict: "冲马(丙午)煞南",
        direction: "财神正西 喜神正南"
    },
    {
        date: new Date(2024, 5, 18),
        luckLevel: "凶",
        fortune: "今日运势较差，易遇阻碍。需保持耐心，避免冲突。健康方面需注意饮食安全，避免过度劳累。财务上需谨慎，避免投资。",
        dos: ["静心修养", "制定计划", "阅读学习", "储蓄", "整理"],
        donts: ["重要决策", "投资交易", "远行", "签约", "借贷"],
        auspiciousHours: ["13:00-15:00", "17:00-19:00"],
        solarTerm: "芒种",
        ganzhi: "甲辰年 己巳月 癸丑日",
        conflict: "冲羊(丁未)煞东",
        direction: "财神正北 喜神东南"
    },
    {
        date: new Date(2024, 5, 19),
        luckLevel: "吉",
        fortune: "运势回升，贵人相助，工作上有新突破。财务方面有好消息，适合处理财务事宜。感情甜蜜，适合约会或家庭聚会。",
        dos: ["商务谈判", "团队合作", "健身锻炼", "投资理财", "社交活动"],
        donts: ["熬夜", "冲动消费", "争吵", "远行"],
        auspiciousHours: ["09:00-11:00", "15:00-17:00", "19:00-21:00"],
        solarTerm: "芒种",
        ganzhi: "甲辰年 己巳月 甲寅日",
        conflict: "冲猴(戊申)煞北",
        direction: "财神正东 喜神东北"
    }
];

// 签文数据库（扩展版 - 包含哲理、有趣、幽默、经典四大类）
const fortuneDatabase = {
    zh: [
        // ===== 哲理类 =====
        { text: "天行健，君子以自强不息", meaning: "如天体运行刚健不息，君子应效法天道，自立自强，永不停息。", advice: "今日宜积极进取，勇于面对挑战，坚持不懈地努力。", category: "哲理" },
        { text: "地势坤，君子以厚德载物", meaning: "大地宽广厚实，君子应效法地道，以深厚的德行承载万物。", advice: "今日宜宽容待人，以德服人，用包容的心态处理事务。", category: "哲理" },
        { text: "上善若水，水利万物而不争", meaning: "最高尚的品德像水一样，滋润万物而不与万物相争。", advice: "今日宜以柔克刚，顺势而为，不强行与人争辩。", category: "哲理" },
        { text: "知者不惑，仁者不忧，勇者不惧", meaning: "有智慧的人不会困惑，有仁德的人不会忧虑，勇敢的人不会恐惧。", advice: "今日宜培养智慧、仁德和勇气，坦然面对一切。", category: "哲理" },
        { text: "道法自然", meaning: "大道的运行遵循自然规律，人不该强行干预。", advice: "今日宜顺应自然节奏，不要急于求成，让事情自然发展。", category: "哲理" },
        { text: "大智若愚", meaning: "真正有大智慧的人，表面看起来可能有些愚钝。", advice: "今日宜保持谦逊，不炫耀自己，低调行事。", category: "哲理" },
        { text: "难得糊涂", meaning: "人生有些事情不必太较真，适当糊涂是智慧。", advice: "今日宜对小事睁只眼闭只眼，把精力放在重要的事情上。", category: "哲理" },
        { text: "塞翁失马，焉知非福", meaning: "眼前的损失可能是未来的收获，祸福相依。", advice: "今日遇到挫折不要灰心，保持乐观，可能有意想不到的转机。", category: "哲理" },
        { text: "物极必反，否极泰来", meaning: "事物发展到极端就会向相反方向转化，坏到极点就会好转。", advice: "今日困境即将结束，希望就在眼前。", category: "哲理" },
        { text: "授人以鱼不如授人以渔", meaning: "给人鱼不如教人捕鱼的方法，教会方法比直接给予更重要。", advice: "今日宜学习新技能，提升自己的能力，而不是依赖他人。", category: "哲理" },
        { text: "三人行，必有我师", meaning: "几个人一起行走，其中必定有值得我学习的人。", advice: "今日宜虚心向身边的人学习，每个人都有值得借鉴的地方。", category: "哲理" },
        { text: "学而不思则罔，思而不学则殆", meaning: "只学习不思考会迷惑，只思考不学习会危险。", advice: "今日宜在学习中思考，在思考中学习，理论与实践结合。", category: "哲理" },
        { text: "温故而知新", meaning: "复习学过的知识，能获得新的理解和体会。", advice: "今日宜回顾过去的经验，从中总结新的启示。", category: "哲理" },
        { text: "己所不欲，勿施于人", meaning: "自己不愿意承受的事情，不要施加给别人。", advice: "今日宜换位思考，站在他人的角度考虑问题。", category: "哲理" },
        { text: "不以物喜，不以己悲", meaning: "不因外物的好坏而高兴，不因自己的得失而悲伤。", advice: "今日宜保持平常心，不被外界环境左右自己的情绪。", category: "哲理" },
        { text: "淡泊明志，宁静致远", meaning: "不追求名利才能表明志向，心境宁静才能实现远大目标。", advice: "今日宜减少对外物的欲望，专注于内心的追求。", category: "哲理" },
        { text: "人无远虑，必有近忧", meaning: "如果没有长远的考虑，必定会有眼前的忧患。", advice: "今日宜为未来做好规划，不要只顾眼前利益。", category: "哲理" },
        { text: "欲速则不达", meaning: "过于性急反而不能达到目的。", advice: "今日宜保持耐心，按部就班，不要急于求成。", category: "哲理" },
        { text: "磨刀不误砍柴工", meaning: "做好准备工作看似浪费时间，实际上能提高效率。", advice: "今日宜先做好充分准备，再开始行动。", category: "哲理" },
        { text: "工欲善其事，必先利其器", meaning: "要做好事情，先要准备好工具。", advice: "今日宜检查自己的工具和技能，确保一切准备就绪。", category: "哲理" },

        // ===== 有趣类 =====
        { text: "世上无难事，只要肯放弃", meaning: "换个角度思考，有时候放弃也是一种智慧。", advice: "今日遇到实在解决不了的难题，不妨暂时放下，换个方向。", category: "有趣" },
        { text: "早起的鸟儿有虫吃，早起的虫儿被鸟吃", meaning: "做任何事情都要看清自己的位置和身份。", advice: "今日宜认清自己的角色，不要盲目跟风。", category: "有趣" },
        { text: "生活不止眼前的苟且，还有读不懂的诗和到不了的远方", meaning: "理想很丰满，现实很骨感，接受这个事实反而更轻松。", advice: "今日宜脚踏实地，不要好高骛远，把眼前的小事做好。", category: "有趣" },
        { text: "只要心中有沙，哪里都是马尔代夫", meaning: "心态决定一切，乐观的人在哪里都能找到快乐。", advice: "今日宜调整心态，在平凡的生活中发现乐趣。", category: "有趣" },
        { text: "间歇性踌躇满志，持续性混吃等死", meaning: "大多数人都是这样的状态，接受自己反而更自在。", advice: "今日宜接纳自己的状态，不要给自己太大压力。", category: "有趣" },
        { text: "贫穷限制了我的想象力", meaning: "物质条件的确会影响视野，但这不妨碍我们追求精神富足。", advice: "今日宜在有限的条件下创造无限的可能。", category: "有趣" },
        { text: "你若安好，便是晴天霹雳", meaning: "一种幽默的调侃，提醒我们不要总是羡慕别人。", advice: "今日宜专注于自己，不要总是和别人比较。", category: "有趣" },
        { text: "人生就像茶几，上面摆满了杯具（悲剧）", meaning: "生活中难免有各种不如意，要学会用幽默化解。", advice: "今日宜保持幽默感，把生活中的小挫折当作笑料。", category: "有趣" },
        { text: "瘦不了 (受了)", meaning: "一个谐音梗，提醒我们接受不完美的自己。", advice: "今日宜与自己和解，接纳自己的不完美。", category: "有趣" },
        { text: "我单身，我骄傲", meaning: "单身也是一种生活状态，一样可以过得精彩。", advice: "今日宜享受独处的时光，单身也自有单身的乐趣。", category: "有趣" },
        { text: "钱不是万能的，是万达的", meaning: "用幽默的方式表达对金钱的认知。", advice: "今日宜理性看待金钱，既不拜金也不仇富。", category: "有趣" },
        { text: "你的就是我的，我的还是我的", meaning: "一种霸道的幽默，提醒我们要懂得分享。", advice: "今日宜学会分享，分享会带来更多快乐。", category: "有趣" },
        { text: "别人笑我太疯癫，我笑他人看不穿", meaning: "每个人都有自己的生活方式，不必强求别人理解。", advice: "今日宜坚持自己的节奏，不在乎他人的眼光。", category: "有趣" },
        { text: "不想当将军的士兵不是好厨子", meaning: "乱用俗语的幽默，提醒我们不要被条条框框束缚。", advice: "今日宜打破常规，用新的思维方式解决问题。", category: "有趣" },
        { text: "条条大路通罗马，但有人出生就在罗马", meaning: "起跑线不同，但这不影响我们努力奔跑。", advice: "今日宜专注于自己的进步，不要和别人的起跑线比较。", category: "有趣" },

        // ===== 幽默类 =====
        { text: "今天不想上班，这句话对老板说就辞职了", meaning: "有些话只能想想，不能乱说。", advice: "今日宜谨言慎行，想清楚再说话。", category: "幽默" },
        { text: "减肥是明天的事，吃饭是现在的事", meaning: "拖延症的典型表现，但快乐最重要。", advice: "今日宜适度享受美食，不要对自己太苛刻。", category: "幽默" },
        { text: "我的钱包就像洋葱，每次打开都让人想哭", meaning: "用幽默表达经济压力，心态乐观很重要。", advice: "今日宜笑对财务问题，开源节流慢慢改善。", category: "幽默" },
        { text: "我也想优雅地老去，但生活总给我使绊子", meaning: "生活充满意外，优雅地摔倒也是一种本事。", advice: "今日宜保持乐观，即使摔倒了也要姿势优美。", category: "幽默" },
        { text: "我的优点是：知错能改，我的缺点是：从来不改", meaning: "自嘲式幽默，提醒我们要有自知之明。", advice: "今日宜正视自己的缺点，哪怕从小改变开始。", category: "幽默" },
        { text: "我不是懒，我是处于能量保存模式", meaning: "为懒惰找个有趣的借口，但该动的时候还是要动。", advice: "今日宜适度休息，但不要找借口逃避该做的事。", category: "幽默" },
        { text: "我的脑子：我们要努力！我的身体：不，你不想", meaning: "思想和身体的矛盾是常态，要学会协调。", advice: "今日宜听从身体的信号，劳逸结合。", category: "幽默" },
        { text: "人生苦短，我先睡了", meaning: "用幽默表达对生活的态度，休息很重要。", advice: "今日宜保证充足睡眠，休息是为了走更远的路。", category: "幽默" },
        { text: "我也曾想过改变世界，后来发现世界改变了我", meaning: "被现实改变的无奈，但也有成长的收获。", advice: "今日宜在坚持理想和接受现实之间找到平衡。", category: "幽默" },
        { text: "道理我都懂，但是臣妾做不到啊", meaning: "知道和做到之间有很大的距离，要理解这个差距。", advice: "今日宜把大道理分解成小行动，一步一步来。", category: "幽默" },
        { text: "别看我平时不说话，一说话就得罪人", meaning: "幽默地承认自己的社交弱点，接纳自己的特点。", advice: "今日宜在表达前三思，但不要害怕表达。", category: "幽默" },
        { text: "我的特长是：在关键时刻掉链子", meaning: "自嘲紧张时的表现，学会用幽默化解尴尬。", advice: "今日宜放松心态，关键时刻不要给自己太大压力。", category: "幽默" },

        // ===== 经典类 =====
        { text: "水滴石穿，非一日之功", meaning: "持续的努力能够克服最大的困难，成功需要时间的积累。", advice: "今日宜坚持既定目标，不急于求成，相信积累的力量。", category: "经典" },
        { text: "山重水复疑无路，柳暗花明又一村", meaning: "困境中往往蕴含着转机，坚持下去就能看到希望。", advice: "今日遇到困难不要气馁，换个角度思考，机会就在眼前。", category: "经典" },
        { text: "宝剑锋从磨砺出，梅花香自苦寒来", meaning: "优秀的品质和能力都是通过艰苦的磨练获得的。", advice: "今日宜接受挑战，在困难中磨练自己，提升能力。", category: "经典" },
        { text: "海纳百川，有容乃大", meaning: "像大海一样包容万物，心胸宽广才能成就大事。", advice: "今日宜开放心胸，接纳不同意见，团结合作共创佳绩。", category: "经典" },
        { text: "千里之行，始于足下", meaning: "再远的路程都要从脚下开始，伟大的事业始于细微的行动。", advice: "今日宜脚踏实地，从小事做起，为长远目标奠定基础。", category: "经典" },
        { text: "知己知彼，百战不殆", meaning: "了解自己和对手，就能在竞争中立于不败之地。", advice: "今日宜深入了解情况，做好充分准备再行动。", category: "经典" },
        { text: "机不可失，时不再来", meaning: "好机会不会等人，错过了就很难再有。", advice: "今日宜把握机遇，果断行动，不要犹豫不决。", category: "经典" },
        { text: "静以修身，俭以养德", meaning: "通过宁静来修养身心，通过节俭来培养品德。", advice: "今日宜保持内心平静，生活简朴，专注于自我提升。", category: "经典" },
        { text: "业精于勤，荒于嬉；行成于思，毁于随", meaning: "学业的精进在于勤奋，荒废在于嬉戏；事业的成功在于思考，失败在于因循随便。", advice: "今日宜勤奋努力，勤于思考，不要贪图玩乐。", category: "经典" },
        { text: "不积跬步，无以至千里", meaning: "不积累半步一步，就不能到达千里之远。", advice: "今日宜重视每一点进步，积少成多。", category: "经典" },
        { text: "学如逆水行舟，不进则退", meaning: "学习就像逆着水流划船，不努力前进就会后退。", advice: "今日宜持续学习，不能有片刻松懈。", category: "经典" },
        { text: "路遥知马力，日久见人心", meaning: "路途遥远才能知道马的力气，时间久了才能看清人的心。", advice: "今日宜耐心了解他人，不要急于下判断。", category: "经典" },
        { text: "良药苦口利于病，忠言逆耳利于行", meaning: "好药虽然苦但对病有好处，真诚的话虽然难听但对行为有帮助。", advice: "今日宜虚心接受批评和建议，即使听起来不舒服。", category: "经典" },
        { text: "少壮不努力，老大徒伤悲", meaning: "年轻时不努力，年老了只能空悲伤。", advice: "今日宜珍惜时光，不要等到后悔时才想起来努力。", category: "经典" },
        { text: "盛年不重来，一日难再晨", meaning: "美好的青春年华不会再来，一天很难有两个早晨。", advice: "今日宜把握当下，珍惜每一分每一秒。", category: "经典" },
        { text: "莫等闲，白了少年头，空悲切", meaning: "不要虚度年华，等到头发白了才悲伤。", advice: "今日宜抓住时间，创造属于自己的价值。", category: "经典" },
        { text: "劝君莫惜金缕衣，劝君惜取少年时", meaning: "不要珍惜金缕衣，要珍惜少年时光。", advice: "今日宜珍惜年轻时光，这是最宝贵的财富。", category: "经典" },
        { text: "纸上得来终觉浅，绝知此事要躬行", meaning: "从书本上得来的知识终归浅显，要真正理解必须亲身实践。", advice: "今日宜将学到的知识付诸实践，在实践中检验真理。", category: "经典" },
        { text: "问渠那得清如许，为有源头活水来", meaning: "池塘的水之所以清澈，是因为有源头活水不断注入。", advice: "今日宜不断学习新知识，保持思想的活力。", category: "经典" },
        { text: "落红不是无情物，化作春泥更护花", meaning: "落花不是没有感情的东西，化作春泥更能呵护花朵。", advice: "今日宜学习奉献精神，在成全他人的过程中实现自己的价值。", category: "经典" },
        { text: "长风破浪会有时，直挂云帆济沧海", meaning: "终有一天会乘风破浪，高挂云帆横渡大海。", advice: "今日宜保持信心，相信自己的目标终将实现。", category: "经典" },
        { text: "会当凌绝顶，一览众山小", meaning: "定要登上泰山顶峰，俯瞰群山都显得渺小。", advice: "今日宜有远大志向，站得高才能看得远。", category: "经典" },
        { text: "沉舟侧畔千帆过，病树前头万木春", meaning: "沉船旁边千帆竞发，病树前头万木逢春。", advice: "今日宜看到新事物的成长，不要纠结于过去的失败。", category: "经典" },
        { text: "不畏浮云遮望眼，自缘身在最高层", meaning: "不怕浮云遮住视线，因为身在最高层。", advice: "今日宜提升自己的境界，站得高就不怕被迷惑。", category: "经典" },
        { text: "山重水复疑无路，柳暗花明又一村", meaning: "困境中往往蕴含着转机，坚持下去就能看到希望。", advice: "今日遇到困难不要气馁，换个角度思考，机会就在眼前。", category: "经典" },
        { text: "春蚕到死丝方尽，蜡炬成灰泪始干", meaning: "春蚕直到死才停止吐丝，蜡烛烧成灰才停止流泪。", advice: "今日宜学习奉献精神，全心全意投入自己的事业。", category: "经典" },
        { text: "人生自古谁无死，留取丹心照汗青", meaning: "自古以来人终有一死，要留下一片赤诚之心光照史册。", advice: "今日宜坚守自己的信念和原则，不为利益所动摇。", category: "经典" },
        { text: "粉身碎骨浑不怕，要留清白在人间", meaning: "即使粉身碎骨也不怕，要留清白在人间。", advice: "今日宜坚持正义和真理，不惜一切代价维护。", category: "经典" },
        { text: "千磨万击还坚劲，任尔东西南北风", meaning: "经历千磨万击依然坚劲，任凭你刮东西南北风。", advice: "今日宜保持坚韧不拔的意志，无论外界如何变化。", category: "经典" },
        { text: "咬定青山不放松，立根原在破岩中", meaning: "紧紧咬定青山不放松，根深深扎在岩石缝中。", advice: "今日宜坚定自己的目标，扎根深处，不被动摇。", category: "经典" },
        { text: "不要人夸好颜色，只留清气满乾坤", meaning: "不需要别人夸颜色好，只留清气充满天地。", advice: "今日宜注重内在修养，不在意外在的虚名。", category: "经典" },
        { text: "苟利国家生死以，岂因祸福避趋之", meaning: "只要对国家有利，生死以赴，绝不因个人祸福而避让。", advice: "今日宜以大局为重，不计个人得失。", category: "经典" },
        { text: "位卑未敢忘忧国", meaning: "地位低下也不敢忘记忧国忧民。", advice: "今日宜有家国情怀，即使平凡也能贡献自己的力量。", category: "经典" },
        { text: "先天下之忧而忧，后天下之乐而乐", meaning: "在天下人忧虑之前先忧虑，在天下人快乐之后才快乐。", advice: "今日宜有责任感和使命感，心系大局。", category: "经典" },
        { text: "天下兴亡，匹夫有责", meaning: "国家的兴衰成败，每个普通人都有责任。", advice: "今日宜认识到自己的责任，为集体和社会贡献力量。", category: "经典" },
        { text: "人生得意须尽欢，莫使金樽空对月", meaning: "人生得意时要尽情享受，不要让金杯空对明月。", advice: "今日宜享受当下的快乐，不要总是忧愁未来。", category: "经典" },
        { text: "天生我材必有用，千金散尽还复来", meaning: "上天造就我的才能必定有用处，千金散尽还会回来。", advice: "今日宜相信自己的价值，不要为暂时的得失而焦虑。", category: "经典" },
        { text: "安能摧眉折腰事权贵，使我不得开心颜", meaning: "怎能低眉弯腰侍奉权贵，让我不开心。", advice: "今日宜保持独立人格，不向权势低头。", category: "经典" },
        { text: "采菊东篱下，悠然见南山", meaning: "在东篱下采摘菊花，悠然看见南山。", advice: "今日宜放慢节奏，享受生活的闲适与宁静。", category: "经典" },
        { text: "明月松间照，清泉石上流", meaning: "明月照在松林间，清泉在石上流淌。", advice: "今日宜欣赏自然之美，在忙碌中寻找片刻宁静。", category: "经典" },
        { text: "大漠孤烟直，长河落日圆", meaning: "大漠中孤烟直上，长河上落日浑圆。", advice: "今日宜有开阔的胸怀和视野，不被琐事所困。", category: "经典" },
        { text: "行到水穷处，坐看云起时", meaning: "走到水的尽头，坐下来看云起云落。", advice: "今日宜顺其自然，在绝境中也要保持从容。", category: "经典" },
        { text: "采得百花成蜜后，为谁辛苦为谁甜", meaning: "采集百花酿成蜜后，为谁辛苦为谁甜？", advice: "今日宜思考自己付出和收获的关系，找到平衡点。", category: "经典" },
        { text: "历览前贤国与家，成由勤俭败由奢", meaning: "遍观前代国家和家庭，成功因勤俭，败亡因奢侈。", advice: "今日宜勤俭节约，不要铺张浪费。", category: "经典" },
        { text: "由俭入奢易，由奢入俭难", meaning: "从节俭到奢侈容易，从奢侈到节俭困难。", advice: "今日宜保持适度节俭的生活习惯。", category: "经典" },
        { text: "历览前贤国与家，成由勤俭败由奢", meaning: "遍观前代国家和家庭，成功因勤俭，败亡因奢侈。", advice: "今日宜勤俭节约，不要铺张浪费。", category: "经典" }
    ],
    en: [
        // Philosophy
        { text: "Heaven moves vigorously, the gentleman strives for self-improvement", meaning: "Like the vigorous movement of heaven, a gentleman should follow the way of heaven, be self-reliant and never stop.", advice: "Today is suitable for being proactive, facing challenges bravely, and persevering in your efforts.", category: "Philosophy" },
        { text: "Earth's terrain is vast, the gentleman carries all with virtue", meaning: "The earth is vast and solid, a gentleman should follow the way of earth, carrying all things with deep virtue.", advice: "Today is suitable for being tolerant, convincing others with virtue, and handling affairs with an inclusive mindset.", category: "Philosophy" },
        { text: "Constant dripping wears away the stone, not achieved in a day", meaning: "Continuous effort can overcome the greatest difficulties, success requires accumulation of time.", advice: "Today is suitable for persisting with established goals, not rushing for success, and believing in the power of accumulation.", category: "Philosophy" },
        { text: "When the way seems blocked, there's always another village ahead", meaning: "Difficulties often contain opportunities for change, persistence will lead to hope.", advice: "Don't be discouraged when facing difficulties today, think from different angles, opportunities are right in front of you.", category: "Philosophy" },
        { text: "The sword's edge comes from grinding, plum blossoms' fragrance from bitter cold", meaning: "Excellent qualities and abilities are obtained through hard training.", advice: "Today is suitable for accepting challenges, tempering yourself in difficulties, and improving your abilities.", category: "Philosophy" },
        { text: "The sea accepts all rivers, tolerance makes greatness", meaning: "Like the sea that embraces all things, broad-mindedness can achieve great things.", advice: "Today is suitable for opening your heart, accepting different opinions, and working together for success.", category: "Philosophy" },
        { text: "A journey of a thousand miles begins with a single step", meaning: "No matter how far the journey, it must start from your feet, great endeavors begin with small actions.", advice: "Today is suitable for being down-to-earth, starting with small things, and laying the foundation for long-term goals.", category: "Philosophy" },
        { text: "Know yourself and your opponent, you will never be defeated", meaning: "Understanding yourself and your opponent will keep you undefeated in competition.", advice: "Today is suitable for deeply understanding the situation and making thorough preparations before taking action.", category: "Philosophy" },
        { text: "Opportunity knocks but once, time waits for no one", meaning: "Good opportunities won't wait for people, once missed they're hard to come by again.", advice: "Today is suitable for seizing opportunities, taking decisive action, and not hesitating.", category: "Philosophy" },
        { text: "Cultivate yourself through tranquility, nurture virtue through frugality", meaning: "Cultivate body and mind through tranquility, develop character through frugality.", advice: "Today is suitable for maintaining inner peace, living simply, and focusing on self-improvement.", category: "Philosophy" }
    ]
};

// 日历相关功能
let currentDate = new Date();
let selectedDate = new Date();

function initCalendar() {
    updateCalendarDisplay();

    // 绑定日历导航事件
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            updateCalendarDisplay();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            updateCalendarDisplay();
        });
    }

    // 绑定日期选择器事件
    const datePicker = document.getElementById('fortune-date-picker');
    if (datePicker) {
        datePicker.addEventListener('change', (e) => {
            selectedDate = new Date(e.target.value);
            updateCalendarDisplay();
            updateFortuneDisplay();
        });
    }
}

function updateCalendarDisplay() {
    const monthNames = currentLanguage === 'zh' ?
        ['一月', '二月', '三月', '四月', '五月', '六月',
            '七月', '八月', '九月', '十月', '十一月', '十二月'] :
        ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

    // 更新月份显示
    const calendarMonth = document.getElementById('calendar-month');
    if (calendarMonth) {
        if (currentLanguage === 'zh') {
            calendarMonth.textContent = `${currentDate.getFullYear()}年${monthNames[currentDate.getMonth()]}`;
        } else {
            calendarMonth.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        }
    }

    // 生成日历天数
    const calendarDays = document.getElementById('calendar-days');
    if (!calendarDays) return;

    calendarDays.replaceChildren();

    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - (firstDay.getDay() || 7) + 1);

    for (let i = 0; i < 42; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);

        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = dayDate.getDate();

        // 添加样式类
        if (dayDate.getMonth() !== currentDate.getMonth()) {
            dayElement.classList.add('other-month');
        }

        if (dayDate.toDateString() === new Date().toDateString()) {
            dayElement.classList.add('today');
        }

        if (dayDate.toDateString() === selectedDate.toDateString()) {
            dayElement.classList.add('selected');
        }

        // 绑定点击事件
        dayElement.addEventListener('click', () => {
            selectedDate = new Date(dayDate);
            updateCalendarDisplay();
            updateDatePicker();
            updateFortuneDisplay();
        });

        calendarDays.appendChild(dayElement);
    }
}

function updateDatePicker() {
    const dateString = selectedDate.toISOString().split('T')[0];
    const datePicker = document.getElementById('fortune-date-picker');
    if (datePicker) {
        datePicker.value = dateString;
    }
}

function updateFortuneDisplay() {
    // 更新运势显示逻辑
    if (window.fortuneSystem) {
        window.fortuneSystem.selectedDate = selectedDate;
        window.fortuneSystem.updateFortuneDisplay();
    }
}
// 每日一签功能
class FortuneSystem {
    constructor() {
        this.hasDrawnToday = false;
        this.todaysFortune = null;
        this.isDrawing = false; // 添加绘制状态标志
        this.currentLanguage = currentLanguage; // 记录当前语言
        this.aiEnabled = false; // AI功能开关
        // 🔐 不再直接存储明文 apiKey，使用 getter 临时获取
        this._apiKeyCached = null; // 临时缓存（使用后立即清除）
        this.init();
    }

    init() {
        this.updateDate();
        this.checkTodayStatus();
        this.bindEvents();
        this.loadAISettings();
        this.initStats();

        // 确保AI按钮在页面加载后立即显示
        setTimeout(() => {
            this.updateAIButton();
        }, 100);
    }

    // 初始化统计数据
    initStats() {
        const stats = window.DataSyncStorage.getRaw('aiFortuneStats');
        if (!stats) {
            this.stats = {
                totalApiRequests: 0,
                totalAiGenerations: 0,
                successfulGenerations: 0,
                failedGenerations: 0,
                lastResetDate: new Date().toISOString()
            };
            this.saveStats();
            SafeLogger.debug('初始化新的统计数据:', this.stats);
        } else {
            this.stats = JSON.parse(stats);
            SafeLogger.debug('加载现有统计数据:', this.stats);
        }
    }

    // 保存统计数据
    saveStats() {
        window.DataSyncStorage.setRaw('aiFortuneStats', JSON.stringify(this.stats));
    }

    // 记录API请求
    recordApiRequest() {
        if (!this.stats) {
            SafeLogger.error('统计数据未初始化，重新初始化');
            this.initStats();
        }
        this.stats.totalApiRequests++;
        this.saveStats();
        this.recordDailyStats('apiRequests');
        SafeLogger.debug('API请求次数:', this.stats.totalApiRequests);
    }

    // 记录AI签语生成
    recordAiGeneration(success = true, fortuneData = null) {
        if (!this.stats) {
            SafeLogger.error('统计数据未初始化，重新初始化');
            this.initStats();
        }
        this.stats.totalAiGenerations++;
        if (success) {
            this.stats.successfulGenerations++;
            this.recordDailyStats('successfulGenerations');

            // 记录AI签文历史（用于去重）
            if (fortuneData && this.todaysFortune) {
                const aiHistoryKey = 'aiFortuneHistory';
                const aiHistory = JSON.parse(window.DataSyncStorage.getRaw(aiHistoryKey) || '[]');

                // 添加当前生成的签文到历史
                aiHistory.push({
                    text: this.todaysFortune.text || fortuneData.text,
                    timestamp: new Date().toISOString(),
                    date: new Date().toDateString()
                });

                // 只保留最近50条记录
                if (aiHistory.length > 50) {
                    aiHistory.shift(); // 移除最旧的记录
                }

                window.DataSyncStorage.setRaw(aiHistoryKey, JSON.stringify(aiHistory));
                SafeLogger.debug('已记录AI签文历史，当前历史记录数:', aiHistory.length);
            }
        } else {
            this.stats.failedGenerations++;
            this.recordDailyStats('failedGenerations');
        }
        this.recordDailyStats('totalGenerations');
        this.saveStats();
        SafeLogger.debug('AI签语生成统计:', {
            total: this.stats.totalAiGenerations,
            success: this.stats.successfulGenerations,
            failed: this.stats.failedGenerations
        });
    }

    // 记录每日统计数据
    recordDailyStats(type) {
        const today = new Date().toISOString().split('T')[0];
        const dailyStats = JSON.parse(window.DataSyncStorage.getRaw('aiFortuneDailyStats') || '{}');

        if (!dailyStats[today]) {
            dailyStats[today] = {
                apiRequests: 0,
                totalGenerations: 0,
                successfulGenerations: 0,
                failedGenerations: 0
            };
        }

        dailyStats[today][type] = (dailyStats[today][type] || 0) + 1;
        window.DataSyncStorage.setRaw('aiFortuneDailyStats', JSON.stringify(dailyStats));
    }

    // 获取历史数据
    getHistoricalData(days = 30) {
        const dailyStats = JSON.parse(window.DataSyncStorage.getRaw('aiFortuneDailyStats') || '{}');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const historicalData = [];
        const labels = [];

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(endDate.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;

            labels.unshift(dayLabel);

            const dayData = dailyStats[dateStr] || {
                apiRequests: 0,
                totalGenerations: 0,
                successfulGenerations: 0,
                failedGenerations: 0
            };

            historicalData.unshift(dayData);
        }

        return { labels, data: historicalData };
    }

    // 获取统计数据
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalAiGenerations > 0 ?
                (this.stats.successfulGenerations / this.stats.totalAiGenerations * 100).toFixed(1) : 0
        };
    }

    // 重置统计数据
    resetStats() {
        this.stats = {
            totalApiRequests: 0,
            totalAiGenerations: 0,
            successfulGenerations: 0,
            failedGenerations: 0,
            lastResetDate: new Date().toISOString()
        };
        this.saveStats();
        SafeLogger.debug('统计数据已重置');
    }

    // 通知报表页面更新
    notifyReportUpdate() {
        // 触发自定义事件，通知报表页面更新
        const event = new CustomEvent('aiFortuneStatsUpdated', {
            detail: this.getStats()
        });
        window.dispatchEvent(event);
        SafeLogger.debug('已发送统计更新事件');
    }

    // 加载AI设置
    loadAISettings() {
        // 🔐 安全加载：不存储明文，只检查是否有 key
        const savedAiEnabled = window.DataSyncStorage.getRaw('aiFortuneEnabled');

        // 加载AI启用状态
        if (savedAiEnabled === 'true' || savedAiEnabled === true || savedAiEnabled === 1) {
            this.aiEnabled = true;
            SafeLogger.debug('AI功能已启用');
        } else {
            this.aiEnabled = false;
            SafeLogger.debug('AI功能未启用');
        }

        // 检查是否有明文残留并迁移
        const savedApiKey = window.DataSyncStorage.getRaw('deepSeekApiKey');
        if (savedApiKey) {
            SafeLogger.warn('⚠️ 发现明文 API Key，正在迁移到加密存储...');
            // 迁移到加密存储（使用 aiServiceManager）
            if (window.aiServiceManager) {
                window.aiServiceManager.setAPIKey('deepseek', savedApiKey).then(() => {
                    window.DataSyncStorage.removeRaw('deepSeekApiKey');
                    SafeLogger.debug('✅ 明文 API Key 已迁移并删除');
                });
            } else if (window.secureStorage) {
                window.secureStorage.ready().then(() => {
                    let config = window.secureStorage.getSecure('aiConfig');
                    if (!config) {
                        config = {
                            deepseek: { enabled: true, apiKey: savedApiKey },
                            openai: { enabled: false, apiKey: null },
                            currentService: 'deepseek'
                        };
                    } else {
                        config.deepseek.apiKey = savedApiKey;
                        config.deepseek.enabled = true;
                    }
                    return window.secureStorage.setSecure('aiConfig', config);
                }).then(() => {
                    window.DataSyncStorage.removeRaw('deepSeekApiKey');
                    SafeLogger.debug('✅ 明文 API Key 已迁移并删除');
                }).catch(e => {
                    SafeLogger.error('❌ 迁移失败:', e);
                });
            }
        }

        // 🔐 不再存储 apiKey，使用时临时获取
        SafeLogger.debug('API Key 配置状态:', savedApiKey ? '⚠️ 存在明文（已自动迁移）' : '✅ 安全');
        SafeLogger.debug('AI功能状态:', this.aiEnabled ? '已启用' : '未启用');

        // 更新AI功能按钮状态
        this.updateAIButton();
    }

    // 🔐 安全获取 API Key（临时使用，用完即焚）
    async getApiKey() {
        SafeLogger.debug('🔍 开始获取API Key...');

        // 1️⃣ 优先从安全存储获取（管理员配置的API Key）
        if (window.secureGetApiKey) {
            SafeLogger.debug('✓ 尝试从 secureGetApiKey 获取...');
            const key = await window.secureGetApiKey('deepSeek');
            if (key) {
                SafeLogger.debug('✅ 从 secureGetApiKey 获取到API Key');
                return key;
            }
            SafeLogger.debug('✗ secureGetApiKey 未找到');
        }

        // 2️⃣ 从 aiServiceManager 获取
        if (window.aiServiceManager && window.aiServiceManager._services) {
            SafeLogger.debug('✓ 尝试从 aiServiceManager 获取...');
            const key = window.aiServiceManager._services.deepseek?.apiKey;
            if (key) {
                SafeLogger.debug('✅ 从 aiServiceManager 获取到API Key');
                return key;
            }
            SafeLogger.debug('✗ aiServiceManager 未找到');
        }

        // 3️⃣ 从加密存储获取（兼容旧的aiConfig格式）
        if (window.secureStorage) {
            SafeLogger.debug('✓ 尝试从 secureStorage aiConfig 获取...');
            await window.secureStorage.ready();
            const config = await window.secureStorage.getSecure('aiConfig');
            if (config && config.deepseek?.apiKey) {
                SafeLogger.debug('✅ 从 aiConfig 获取到API Key');
                return config.deepseek.apiKey;
            }
            SafeLogger.debug('✗ aiConfig 未找到');
        }

        // 4️⃣ 尝试从SecureStorage直接获取（兼容）
        if (window.SecureStorage) {
            SafeLogger.debug('✓ 尝试从 SecureStorage 直接获取...');
            const key = await window.SecureStorage.getSecure('deepSeekApiKey');
            if (key) {
                SafeLogger.debug('✅ 从 SecureStorage 直接获取到API Key');
                return key;
            }
            SafeLogger.debug('✗ SecureStorage 直接获取未找到');
        }

        // 5️⃣ 最后尝试旧的 localStorage（应该不存在，明文）
        SafeLogger.debug('✓ 尝试从 localStorage 获取...');
        const oldKey = window.DataSyncStorage.getRaw('deepSeekApiKey');
        if (oldKey) {
            SafeLogger.debug('✅ 从 localStorage 获取到API Key（明文，建议迁移）');
            return oldKey;
        }
        SafeLogger.debug('✗ localStorage 未找到');

        SafeLogger.debug('❌ 所有方式均未找到API Key');
        return null;
    }

    // 检查管理员状态
    checkAdminStatus() {
        const sessionData = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                return session.user && session.user.role === 'admin';
            } catch (error) {
                return false;
            }
        }
        return false;
    }

    // 更新AI功能按钮
    async updateAIButton() {
        const aiBtn = document.getElementById('ai-fortune-btn');
        if (aiBtn) {
            const isAdmin = this.checkAdminStatus();

            // 🔐 检查是否有 API Key
            const hasKey = await this.hasApiKey();

            // 默认显示AI按钮，让用户知道有这个功能
            aiBtn.style.display = 'inline-flex';
            aiBtn.classList.remove('fortune-ai-button-ready', 'fortune-ai-button-admin', 'fortune-ai-button-disabled');

            if (hasKey && this.aiEnabled) {
                this.setAIButtonContent(aiBtn, 'AI生成');
                aiBtn.title = 'AI智能生成签语';
                aiBtn.classList.add('fortune-ai-button-ready');
            } else if (isAdmin) {
                this.setAIButtonContent(aiBtn, 'AI配置');
                aiBtn.title = '点击配置AI功能（管理员）';
                aiBtn.classList.add('fortune-ai-button-admin');
            } else {
                this.setAIButtonContent(aiBtn, 'AI功能');
                aiBtn.title = 'AI功能状态（需要管理员配置）';
                aiBtn.classList.add('fortune-ai-button-disabled');
            }
        }
    }

    setAIButtonContent(button, label) {
        const icon = document.createElement('span');
        icon.className = 'material-icons';
        icon.textContent = 'smart_toy';
        button.replaceChildren(icon, document.createTextNode(label));
    }

    // 🔐 检查是否有 API Key
    async hasApiKey() {
        const key = await this.getApiKey();
        return !!key;
    }

    // AI生成签语
    async generateAIFortune() {
        SafeLogger.debug('=== 开始AI生成签语 ===');
        const requestedType = this.getSelectedFortuneType();

        // A delayed AI response must never reopen or overwrite the view after
        // the user has switched back to a traditional fortune.
        if (requestedType !== 'ai') return;

        // 🔐 安全获取 API Key
        const apiKey = await this.getApiKey();
        SafeLogger.debug('API Key状态:', apiKey ? '已配置' : '未配置');
        SafeLogger.debug('AI功能状态:', this.aiEnabled ? '已启用' : '未启用');
        SafeLogger.debug('用户会话状态:', currentUser ? '已登录' : '未登录');

        if (!apiKey) {
            SafeLogger.debug('API Key未配置，显示设置界面');
            this.showAISettings();
            return;
        }

        if (!this.aiEnabled) {
            SafeLogger.debug('AI功能未启用');
            showNotification('AI功能未启用，请联系管理员', 'error');
            return;
        }

        // 检查今天是否已经生成过AI签文
        const today = new Date().toDateString();
        const savedDate = window.DataSyncStorage.getRaw('fortuneDate_ai');
        if (savedDate === today) {
            showNotification(currentLanguage === 'zh' ? '今天已经生成过AI签文了，明天再来吧！' : 'You have already generated AI fortune today, come back tomorrow!', 'warning');
            return;
        }

        if (this.isDrawing) return;

        this.isDrawing = true;
        this.showLoadingState();

        try {
            const fortune = await this.callDeepSeekAPI(apiKey);
            // 将AI生成的内容分别存储到对应的属性中
            this.fortuneContent = fortune.text;
            this.fortuneMeaning = fortune.meaning;
            this.fortuneAdvice = fortune.advice;
            this.todaysFortune = fortune; // 也保存到todaysFortune作为备用

            SafeLogger.debug('AI fortune content stored.');

            // 记录AI签语生成成功
            this.recordAiGeneration(true, fortune);

            // 通知报表页面更新
            this.notifyReportUpdate();

            this.saveFortune('ai'); // 保存为AI签文
            showNotification('AI签语生成成功！', 'success');
        } catch (error) {
            SafeLogger.error('AI签语生成失败:', error);

            // 记录AI签语生成失败
            this.recordAiGeneration(false);

            // 通知报表页面更新
            this.notifyReportUpdate();

            // 根据错误类型显示不同的提示
            if (error.message.includes('API Key无效')) {
                showNotification('API Key无效，请检查管理员配置', 'error');
            } else if (error.message.includes('网络')) {
                showNotification('网络连接失败，请检查网络', 'error');
            } else {
                showNotification('AI生成失败: ' + error.message, 'error');
            }

            // 回退到传统签语
            SafeLogger.debug('回退到传统签语生成');
            this.generateTodaysFortune();
            this.showFortune();
        } finally {
            this.isDrawing = false;
            this.hideLoadingState();

            if (this.getSelectedFortuneType() !== requestedType) {
                SafeLogger.debug('AI generation completed after a type switch; keeping the selected view intact.');
                return;
            }

            // 确保在finally块中调用showFortune，无论成功还是失败
            SafeLogger.debug('=== 开始显示签语内容 ===');
            this.showFortune();
            SafeLogger.debug('=== 签语内容显示完成 ===');

            // 额外保障：延迟确保内容显示
            setTimeout(() => {
                if (this.getSelectedFortuneType() !== requestedType) return;

                const rightSection = document.getElementById('fortune-right-section');
                const meaningEl = document.getElementById('fortune-meaning');
                if (rightSection && (!meaningEl || meaningEl.textContent.trim() === '')) {
                    SafeLogger.debug('⚠️ 内容区域为空，使用最终备用方案');
                    this.updateFortuneContentDirectly();
                } else {
                    // 检查是否显示的是AI生成的内容
                    const textEl = document.getElementById('fortune-text');
                    if (textEl && this.todaysFortune && textEl.textContent !== this.todaysFortune.text) {
                        SafeLogger.debug('⚠️ 内容不匹配，强制更新为AI生成内容');
                        this.updateFortuneContentDirectly();
                    }
                }
            }, 200);
        }
    }

    // 调用DeepSeek API
    async callDeepSeekAPI(apiKey) {
        SafeLogger.debug('=== 开始调用DeepSeek API ===');
        const prompt = this.buildAIPrompt();
        SafeLogger.debug('生成的提示词:', prompt);
        SafeLogger.debug('API Key状态:', apiKey ? '已配置' : '未配置');

        // 记录API请求
        this.recordApiRequest();

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`  // 🔐 使用传入的 apiKey 参数
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个智慧的中文签语生成器，专门为用户生成每日励志签语。请用简洁优美的中文回复，格式为JSON：{"text":"签语内容","meaning":"含义解释","advice":"今日建议"}'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('API Key无效或已过期，请检查配置');
            } else if (response.status === 429) {
                throw new Error('API调用频率过高，请稍后重试');
            } else {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }
        }

        const data = await response.json();
        SafeLogger.debug('AI response received.');
        const content = data.choices[0].message.content;
        SafeLogger.debug('AI response content read.');

        // 解析AI返回的JSON
        try {
            // 清理Markdown代码块包裹
            let cleanContent = content.trim();

            // 处理各种可能的Markdown格式
            if (cleanContent.includes('```json')) {
                // 提取```json和```之间的内容
                const match = cleanContent.match(/```json\s*([\s\S]*?)\s*```/);
                if (match) {
                    cleanContent = match[1].trim();
                }
            } else if (cleanContent.includes('```')) {
                // 提取```和```之间的内容
                const match = cleanContent.match(/```\s*([\s\S]*?)\s*```/);
                if (match) {
                    cleanContent = match[1].trim();
                }
            }

            // 进一步清理可能的换行符和空格
            cleanContent = cleanContent.replace(/^\s*/, '').replace(/\s*$/, '');
            SafeLogger.debug('AI response content normalized.');

            const fortune = JSON.parse(cleanContent);
            SafeLogger.debug('AI fortune parsed.');
            const result = {
                text: fortune.text || '今日宜积极向上',
                meaning: fortune.meaning || '保持积极心态，迎接美好的一天',
                advice: fortune.advice || '今日宜专注目标，稳步前进',
                source: 'AI生成',
                timestamp: new Date().toISOString()
            };
            SafeLogger.debug('AI fortune result prepared.');
            return result;
        } catch (parseError) {
            SafeLogger.error('JSON解析失败:', parseError);
            SafeLogger.debug('AI response parsing failed; fallback fortune will be used.');
            // 如果解析失败，使用默认签语
            return {
                text: '今日宜积极向上',
                meaning: '保持积极心态，迎接美好的一天',
                advice: '今日宜专注目标，稳步前进',
                source: 'AI生成',
                timestamp: new Date().toISOString()
            };
        }
    }

    // 构建AI提示词
    buildAIPrompt() {
        const today = new Date();
        const dayOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][today.getDay()];
        const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日${dayOfWeek}`;

        // 获取已生成的AI签文历史
        const aiHistoryKey = 'aiFortuneHistory';
        const aiHistory = JSON.parse(window.DataSyncStorage.getRaw(aiHistoryKey) || '[]');
        const recentFortunes = aiHistory.slice(-10).map(f => f.text).join('、');

        // 使用时间戳和随机数增加随机性，而不是固定日期
        const randomSeed = Date.now() + Math.random() * 10000;

        // 随机选择签语类型，确保多样化
        const types = [
            {
                name: '名人名言',
                instruction: '请从中外名人的经典语录中选择一句，可以是哲学家、作家、科学家、企业家、艺术家等的智慧之言',
                examples: '例如史蒂夫·乔布斯、爱因斯坦、鲁迅、老子、稻盛和夫、达芬奇、尼采、王阳明等',
                avoid: '避免使用"天行健"、"学而不思"等常见语录'
            },
            {
                name: '古诗词名句',
                instruction: '请从中国古典诗词中选择一句富含哲理的名句，可以是唐诗宋词、元曲、诸子百家等',
                examples: '例如李白、杜甫、苏轼、辛弃疾、陶渊明、王维、白居易等的冷门佳作',
                avoid: '避免使用"长风破浪"、"采菊东篱"等常见诗句'
            },
            {
                name: '哲理短句',
                instruction: '请提供一句简洁而深刻的哲理语录，让人有所领悟和思考',
                examples: '关于生命、存在、价值、意义、时间、选择、成长等',
                avoid: '避免使用鸡汤式语录，追求深度和独特性'
            },
            {
                name: '智慧格言',
                instruction: '请分享一句富含人生智慧的格言警句，启发生活道理',
                examples: '关于选择、行动、思考、人际关系、自我管理、成功法则等',
                avoid: '避免使用"千里之行"、"水滴石穿"等常见格言'
            },
            {
                name: '现代金句',
                instruction: '请创作或引用一句现代风格的智慧语录，贴近当代人的生活',
                examples: '关于工作、学习、生活平衡、心理健康、成长思维等',
                avoid: '避免陈词滥调，追求新颖独特'
            },
            {
                name: '幽默智慧',
                instruction: '请用幽默诙谐的方式表达人生智慧，让人会心一笑',
                examples: '关于生活琐事、工作吐槽、自我调侃等，但要有深度',
                avoid: '避免低俗，保持格调'
            }
        ];

        // 使用随机种子选择类型，而不是固定日期
        const typeIndex = Math.floor(randomSeed * types.length) % types.length;
        const selectedType = types[typeIndex];

        // 构建排除历史记录的提示
        let excludePrompt = '';
        if (recentFortunes) {
            excludePrompt = `
**历史记录排除**：
- 以下签文是最近生成的，请避免重复：${recentFortunes}
- 请确保生成全新的内容，与以上签文完全不同`;
        }

        return `今天是${dateString}，请为这一天生成一个独特且富有创意的每日签语。

**签语类型**：${selectedType.name}
**内容要求**：${selectedType.instruction}
**参考范围**：${selectedType.examples}
**避免内容**：${selectedType.avoid}

**重要要求**：
1. **签语内容**：
   - 简洁有力，8-20个字为佳
   - 富含哲理或智慧，能启发思考
   - 优先选择冷门但优质的内容，避开常见语录
   - 必须是全新的内容，不能与历史记录重复${excludePrompt}

2. **含义解释**：
   - 深入解读签语的深层含义和背景
   - 说明如何应用到现代生活和工作
   - 50-80字左右

3. **今日建议**：
   - 提供具体可执行的行动建议
   - 结合${dayOfWeek}和${dateString}的特点
   - 40-60字左右

**特别强调**：
- 每次生成都必须是独特新颖的，严禁重复
- 优先选择鲜为人知的优质内容
- 追求深度和独特性，避免陈词滥调
- 同一天的不同时刻生成也应该不同

请用JSON格式回复，包含text、meaning、advice三个字段。`;
    }

    // 获取季节
    getSeason(date) {
        const month = date.getMonth() + 1;
        if (month >= 3 && month <= 5) return '春季';
        if (month >= 6 && month <= 8) return '夏季';
        if (month >= 9 && month <= 11) return '秋季';
        return '冬季';
    }

    // 获取天气心情（模拟）
    getWeatherMood() {
        const moods = ['晴朗', '多云', '微风', '细雨', '阳光'];
        return moods[Math.floor(Math.random() * moods.length)];
    }

    // 显示加载状态
    showLoadingState() {
        const rightSection = document.getElementById('fortune-right-section');
        if (rightSection) {
            rightSection.replaceChildren(this.createAILoadingState());
            rightSection.style.display = 'flex';
        }
    }

    createAILoadingState() {
        const loading = document.createElement('div');
        loading.className = 'ai-loading';
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        const text = document.createElement('div');
        text.className = 'loading-text';
        text.textContent = 'AI正在生成签语...';
        loading.append(spinner, text);
        return loading;
    }

    hideLoadingState() {
        // 隐藏加载状态，准备显示签语内容
        SafeLogger.debug('隐藏加载状态');
        const rightSection = document.getElementById('fortune-right-section');
        if (rightSection) {
            // 清除加载状态，恢复原始HTML结构
            rightSection.replaceChildren(this.createFortuneContentInner());
            SafeLogger.debug('清除加载状态，准备显示签语内容');
        }
    }

    createFortuneContentInner() {
        const inner = document.createElement('div');
        inner.className = 'fortune-content-inner';
        inner.append(
            this.createFortuneContentSection('💡', '含义解释', 'fortune-meaning', 'fortune-meaning'),
            this.createFortuneDivider(),
            this.createFortuneContentSection('✨', '今日建议', 'fortune-advice', 'fortune-advice')
        );
        return inner;
    }

    createFortuneDivider() {
        const divider = document.createElement('div');
        divider.className = 'fortune-divider';
        return divider;
    }

    createFortuneContentSection(iconText, titleText, contentClass, contentId) {
        const section = document.createElement('div');
        section.className = 'fortune-section';
        const icon = document.createElement('div');
        icon.className = 'section-icon';
        icon.textContent = iconText;
        const content = document.createElement('div');
        content.className = 'section-content';
        const title = document.createElement('div');
        title.className = 'section-title';
        title.textContent = titleText;
        const value = document.createElement('div');
        value.className = contentClass;
        value.id = contentId;
        content.append(title, value);
        section.append(icon, content);
        return section;
    }

    // 显示AI设置
    async showAISettings() {
        const isAdmin = this.checkAdminStatus();

        // 🔐 检查是否有 API Key（不存储在对象中）
        const hasKey = await this.hasApiKey();

        const modal = document.createElement('div');
        modal.className = 'ai-settings-modal';

        if (isAdmin) {
            modal.appendChild(this.createAdminAISettingsContent(modal));
        } else {
            modal.appendChild(this.createUserAISettingsContent(modal, hasKey));
        }

        document.body.appendChild(modal);

        // 绑定关闭事件
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.remove());
        }
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    createAISettingsShell(titleText) {
        const content = document.createElement('div');
        content.className = 'modal-content';

        const header = document.createElement('div');
        header.className = 'modal-header';
        const title = document.createElement('h3');
        title.textContent = titleText;
        const close = document.createElement('span');
        close.className = 'close-btn';
        close.textContent = '×';
        header.append(title, close);

        const body = document.createElement('div');
        body.className = 'modal-body';
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        content.append(header, body, footer);
        return { content, body, footer };
    }

    createAdminAISettingsContent(modal) {
        const { content, body, footer } = this.createAISettingsShell('🔧 管理员 - AI签语配置');

        body.append(
            this.createFortuneNoticeBox('⚠️ 管理员配置', '此配置将影响所有用户的AI签语功能，请谨慎操作。', '#fff3cd', '#856404', '#ffc107'),
            this.createApiKeyFormGroup(),
            this.createAIEnableFormGroup(),
            this.createFortuneInfoList('📋 管理员说明', [
                '配置后，所有用户都可以使用AI签语功能',
                'API Key使用AES-GCM 256-bit加密存储',
                '可以随时禁用AI功能，不影响其他功能',
                '建议定期更换API Key以确保安全'
            ], '#d1ecf1', '#0c5460')
        );

        const cancel = this.createAISettingsButton('取消', 'btn btn-secondary');
        cancel.addEventListener('click', () => modal.remove());
        const save = this.createAISettingsButton('保存配置', 'btn btn-primary');
        save.addEventListener('click', () => this.saveAISettings());
        footer.append(cancel, save);
        return content;
    }

    createUserAISettingsContent(modal, hasKey) {
        const { content, body, footer } = this.createAISettingsShell('🤖 AI签语功能');

        body.append(
            this.createFortuneNoticeBox('✨ AI签语功能', '使用AI智能生成个性化签语，每次都是独特的内容，永远不会重复！', '#f8f9fa', '#333', '#667eea', '#666'),
            this.createAIStatusBox(hasKey),
            this.createFortuneInfoList('ℹ️ 使用说明', [
                'AI功能需要管理员配置后才能使用',
                '如果功能未启用，请联系管理员',
                'AI会根据当前日期、季节生成个性化签语',
                '每次生成都是独特的内容，避免重复'
            ], '#fff3cd', '#856404')
        );

        const ok = this.createAISettingsButton('知道了', 'btn btn-primary');
        ok.addEventListener('click', () => modal.remove());
        footer.appendChild(ok);
        return content;
    }

    createFortuneNoticeBox(titleText, message, background, titleColor, borderColor = '', textColor = titleColor) {
        const box = document.createElement('div');
        box.className = 'fortune-notice-box';
        box.style.setProperty('--fortune-notice-bg', background);
        box.style.setProperty('--fortune-notice-title-color', titleColor);
        box.style.setProperty('--fortune-notice-text-color', textColor);
        if (borderColor) {
            box.style.setProperty('--fortune-notice-border', `4px solid ${borderColor}`);
        }
        const title = document.createElement('h4');
        title.className = 'fortune-notice-title';
        title.textContent = titleText;
        const text = document.createElement('p');
        text.className = 'fortune-notice-text';
        text.textContent = message;
        box.append(title, text);
        return box;
    }

    createApiKeyFormGroup() {
        const group = document.createElement('div');
        group.className = 'form-group';
        const label = document.createElement('label');
        label.htmlFor = 'api-key-input';
        label.textContent = '🔑 DeepSeek API Key:';
        const input = document.createElement('input');
        input.type = 'password';
        input.id = 'api-key-input';
        input.placeholder = '请输入DeepSeek API Key';
        const help = document.createElement('small');
        const strong = document.createElement('strong');
        strong.textContent = '获取方式：';
        const link = document.createElement('a');
        link.href = 'https://platform.deepseek.com';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'fortune-ai-link';
        link.textContent = 'DeepSeek开放平台';
        help.append(
            strong,
            document.createElement('br'),
            document.createTextNode('1. 访问 '),
            link,
            document.createElement('br'),
            document.createTextNode('2. 注册账号并获取API Key'),
            document.createElement('br'),
            document.createTextNode('3. API Key将安全存储在加密存储中，仅管理员可配置')
        );
        group.append(label, input, help);
        return group;
    }

    createAIEnableFormGroup() {
        const group = document.createElement('div');
        group.className = 'form-group';
        const label = document.createElement('label');
        label.className = 'fortune-ai-toggle-label';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'enable-ai-checkbox';
        checkbox.checked = this.aiEnabled;
        const text = document.createElement('span');
        text.textContent = '启用AI签语生成功能（所有用户）';
        label.append(checkbox, text);
        group.appendChild(label);
        return group;
    }

    createAIStatusBox(hasKey) {
        const box = document.createElement('div');
        box.className = 'fortune-ai-status-box';
        const title = document.createElement('h4');
        title.className = 'fortune-ai-status-title';
        title.textContent = '📊 功能状态';
        const text = document.createElement('p');
        text.className = 'fortune-ai-status-text';
        text.append(
            document.createTextNode('AI签语功能：'),
            this.createStrongText(this.aiEnabled ? '已启用' : '未启用'),
            document.createElement('br'),
            document.createTextNode('配置状态：'),
            this.createStrongText(hasKey ? '已配置' : '未配置')
        );
        box.append(title, text);
        return box;
    }

    createStrongText(text) {
        const strong = document.createElement('strong');
        strong.textContent = text;
        return strong;
    }

    createFortuneInfoList(titleText, items, background, color) {
        const box = document.createElement('div');
        box.className = 'fortune-info-box';
        box.style.setProperty('--fortune-info-bg', background);
        box.style.setProperty('--fortune-info-color', color);
        const title = document.createElement('h4');
        title.className = 'fortune-info-title';
        title.textContent = titleText;
        const list = document.createElement('ul');
        list.className = 'fortune-info-list';
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            list.appendChild(li);
        });
        box.append(title, list);
        return box;
    }

    createAISettingsButton(text, className) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = text;
        return button;
    }

    // 保存AI设置
    saveAISettings() {
        const apiKey = document.getElementById('api-key-input').value.trim();
        const enabled = document.getElementById('enable-ai-checkbox').checked;

        if (apiKey) {
            this.deepSeekApiKey = apiKey;
            window.DataSyncStorage.setRaw('deepSeekApiKey', apiKey);
        }

        this.aiEnabled = enabled;
        window.DataSyncStorage.setRaw('aiFortuneEnabled', enabled.toString());

        this.updateAIButton();

        // 关闭模态框
        document.querySelector('.ai-settings-modal').remove();

        showNotification('AI设置已保存', 'success');
    }

    // 【新增】语言更新方法
    updateFortuneLanguage() {
        // 检查语言是否发生变化
        if (this.currentLanguage !== currentLanguage) {
            this.currentLanguage = currentLanguage;

            // 【新增】更新日期显示以匹配新语言
            this.updateDate();

            // 如果已经抽过签，需要更新显示的内容
            if (this.hasDrawnToday && this.todaysFortune) {
                // 重新生成对应语言的签文
                this.generateTodaysFortune();
                // 更新显示
                this.showFortune();
                // 保存新的签文
                this.saveFortune();
            }
        }
    }

    // 【新增】语音播报功能
    speakFortune() {
        if (!this.todaysFortune) {
            this.showMessage(currentLanguage === 'zh' ? '请先抽取签文' : 'Please draw fortune first');
            return;
        }

        // 检查浏览器是否支持语音合成
        if (!('speechSynthesis' in window)) {
            this.showMessage(currentLanguage === 'zh' ? '您的浏览器不支持语音播报' : 'Your browser does not support speech synthesis');
            return;
        }

        // 停止当前播报
        speechSynthesis.cancel();

        // 构建要播报的文本
        const textToSpeak = currentLanguage === 'zh'
            ? `今日签文：${this.todaysFortune.text}。含义：${this.todaysFortune.meaning}。建议：${this.todaysFortune.advice}`
            : `Today's fortune: ${this.todaysFortune.text}. Meaning: ${this.todaysFortune.meaning}. Advice: ${this.todaysFortune.advice}`;

        // 创建语音合成实例
        const utterance = new SpeechSynthesisUtterance(textToSpeak);

        // 设置语音参数
        utterance.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en-US';
        utterance.rate = 0.8; // 语速
        utterance.pitch = 1; // 音调
        utterance.volume = 1; // 音量

        // 播报开始和结束事件
        utterance.onstart = () => {
            const speakBtn = document.getElementById('speak-fortune-btn');
            const stopBtn = document.getElementById('stop-speaking-btn');
            if (speakBtn) speakBtn.style.display = 'none';
            if (stopBtn) stopBtn.style.display = 'inline-flex';
        };

        utterance.onend = () => {
            const speakBtn = document.getElementById('speak-fortune-btn');
            const stopBtn = document.getElementById('stop-speaking-btn');
            if (speakBtn) speakBtn.style.display = 'inline-flex';
            if (stopBtn) stopBtn.style.display = 'none';
        };

        utterance.onerror = () => {
            this.showMessage(currentLanguage === 'zh' ? '语音播报出错' : 'Speech synthesis error');
            const speakBtn = document.getElementById('speak-fortune-btn');
            const stopBtn = document.getElementById('stop-speaking-btn');
            if (speakBtn) speakBtn.style.display = 'inline-flex';
            if (stopBtn) stopBtn.style.display = 'none';
        };

        // 开始播报
        speechSynthesis.speak(utterance);
    }

    // 【新增】停止语音播报
    stopSpeaking() {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const speakBtn = document.getElementById('speak-fortune-btn');
            const stopBtn = document.getElementById('stop-speaking-btn');
            if (speakBtn) speakBtn.style.display = 'inline-flex';
            if (stopBtn) stopBtn.style.display = 'none';
        }
    }

    updateDate() {
        const now = new Date();
        const dateStr = now.toLocaleDateString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        const lunarDate = this.getLunarDate(now);

        const currentDateEl = document.getElementById('current-date');
        const lunarDateEl = document.getElementById('lunar-date');

        if (currentDateEl) {
            currentDateEl.textContent = dateStr;
        }
        if (lunarDateEl) {
            lunarDateEl.textContent = lunarDate;
        }
    }

    getLunarDate(date) {
        // 根据当前语言显示不同格式的农历日期
        if (currentLanguage === 'zh') {
            const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月',
                '七月', '八月', '九月', '十月', '冬月', '腊月'];
            const month = lunarMonths[date.getMonth()];
            return `农历${month}`;
        } else {
            const lunarMonths = ['1st Month', '2nd Month', '3rd Month', '4th Month', '5th Month', '6th Month',
                '7th Month', '8th Month', '9th Month', '10th Month', '11th Month', '12th Month'];
            const month = lunarMonths[date.getMonth()];
            return `Lunar ${month}`;
        }
    }

    checkTodayStatus() {
        const today = new Date().toDateString();

        // 获取当前选中的签文类型
        const selectedType = this.getSelectedFortuneType();
        const typeSuffix = selectedType === 'ai' ? '_ai' : '_traditional';

        // 根据类型获取对应的存储数据
        const savedDate = window.DataSyncStorage.getRaw(`fortuneDate${typeSuffix}`);
        const savedFortune = window.DataSyncStorage.getRaw(`todaysFortune${typeSuffix}`);
        const savedLanguage = window.DataSyncStorage.getRaw(`fortuneLanguage${typeSuffix}`);

        // 检查是否是同一天且语言相同
        if (savedDate === today && savedFortune && savedLanguage === currentLanguage) {
            this.hasDrawnToday = true;
            this.todaysFortune = JSON.parse(savedFortune);
            this.showFortune();
        } else if (savedDate === today && savedFortune && savedLanguage !== currentLanguage) {
            // 同一天但语言不同，重新生成对应语言的签文
            this.hasDrawnToday = true;
            this.generateTodaysFortune();
            this.showFortune();
            this.saveFortune(selectedType);
        } else {
            // 没有签文数据，显示封套
            this.hasDrawnToday = false;
            this.todaysFortune = null;
            this.showEnvelope();
        }
    }

    // 获取当前选中的签文类型
    getSelectedFortuneType() {
        const selectedRadio = document.querySelector('input[name="fortune-type"]:checked');
        return selectedRadio ? selectedRadio.value : 'traditional';
    }

    bindEvents() {
        const drawBtn = document.getElementById('draw-fortune-btn');
        const envelope = document.getElementById('fortune-envelope');
        const shareBtn = document.getElementById('share-fortune-btn');
        const resetBtn = document.getElementById('reset-fortune-btn');
        const speakBtn = document.getElementById('speak-fortune-btn');
        const stopBtn = document.getElementById('stop-speaking-btn');
        const aiBtn = document.getElementById('ai-fortune-btn');

        // 签文类型选择器事件
        const fortuneTypeRadios = document.querySelectorAll('input[name="fortune-type"]');
        fortuneTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleFortuneTypeChange(e.target.value);
            });
        });

        if (drawBtn) {
            drawBtn.addEventListener('click', () => this.drawFortune());
        }

        if (aiBtn) {
            aiBtn.addEventListener('click', () => this.generateAIFortune());
        }

        if (envelope) {
            envelope.addEventListener('click', () => this.drawFortune());
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareFortune());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetFortune());
        }

        if (speakBtn) {
            speakBtn.addEventListener('click', () => this.speakFortune());
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopSpeaking());
        }
    }

    drawFortune() {
        const t = translations[currentLanguage];

        // 检查今天是否已经抽取过传统签文
        const today = new Date().toDateString();
        const savedDate = window.DataSyncStorage.getRaw('fortuneDate_traditional');
        if (savedDate === today) {
            this.showMessage(currentLanguage === 'zh' ? '今天已经抽过传统签文了，明天再来吧！' : 'You have already drawn traditional fortune today, come back tomorrow!');
            return;
        }

        // 防止重复点击
        if (this.isDrawing) {
            SafeLogger.debug('正在抽签中，请稍候...');
            return;
        }

        this.isDrawing = true;

        // 禁用按钮
        const drawBtn = document.getElementById('draw-fortune-btn');
        const envelope = document.getElementById('fortune-envelope');
        if (drawBtn) drawBtn.disabled = true;
        if (envelope) envelope.style.pointerEvents = 'none';

        // 立即播放抽签动画
        this.playDrawAnimation();

        // 立即开始星光动画
        this.createStarAnimation();

        // 延迟显示结果（保持神秘感）
        setTimeout(() => {
            this.generateTodaysFortune();
            this.showFortune();
            this.saveFortune('traditional'); // 保存为传统签文
            this.hasDrawnToday = true; // 标记今天已抽签

            // 重置状态
            this.isDrawing = false;
            if (drawBtn) drawBtn.disabled = false;
            if (envelope) envelope.style.pointerEvents = 'auto';
        }, 800); // 减少延时到0.8秒
    }

    playDrawAnimation() {
        const envelope = document.getElementById('fortune-envelope');
        if (envelope) {
            // 增强动画效果
            envelope.style.transition = 'all 0.3s ease';
            envelope.style.transform = 'scale(0.9) rotate(-2deg)';
            envelope.style.opacity = '0.8';

            setTimeout(() => {
                envelope.style.transform = 'scale(1.1) rotate(2deg)';
                envelope.style.opacity = '1';
            }, 150);

            setTimeout(() => {
                envelope.style.transform = 'scale(1.05) rotate(-1deg)';
            }, 300);

            setTimeout(() => {
                envelope.style.transform = 'scale(1) rotate(0deg)';
            }, 450);

            // 添加持续的轻微摇摆效果
            setTimeout(() => {
                envelope.style.animation = 'gentle-shake 0.5s ease-in-out infinite alternate';
            }, 600);

            // 在显示结果前停止动画
            setTimeout(() => {
                envelope.style.animation = 'none';
                envelope.style.transform = 'scale(1) rotate(0deg)';
            }, 1400);
        }
    }

    generateTodaysFortune() {
        const currentDatabase = fortuneDatabase[currentLanguage] || fortuneDatabase.zh;

        // 获取已使用的签文索引列表
        const usedKey = `fortuneUsedIndices_${currentLanguage}`;
        let usedIndices = JSON.parse(window.DataSyncStorage.getRaw(usedKey) || '[]');

        // 如果所有签文都使用过了，重置记录
        if (usedIndices.length >= currentDatabase.length) {
            SafeLogger.debug('所有签文已使用，重置记录');
            usedIndices = [];
            window.DataSyncStorage.setRaw(usedKey, JSON.stringify(usedIndices));
        }

        // 获取未使用的签文索引
        const availableIndices = currentDatabase
            .map((_, index) => index)
            .filter(index => !usedIndices.includes(index));

        // 随机选择一个未使用的签文
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        this.todaysFortune = currentDatabase[randomIndex];

        // 记录已使用的索引
        usedIndices.push(randomIndex);
        window.DataSyncStorage.setRaw(usedKey, JSON.stringify(usedIndices));

        this.hasDrawnToday = true;
        SafeLogger.debug(`生成签文 [${this.todaysFortune.category}] ${this.todaysFortune.text}`);
        SafeLogger.debug(`已使用 ${usedIndices.length}/${currentDatabase.length} 条签文`);
    }

    showFortune() {
        SafeLogger.debug('显示签语内容...');
        SafeLogger.debug('当前签语数据:', {
            todaysFortune: this.todaysFortune,
            fortuneContent: this.fortuneContent,
            fortuneMeaning: this.fortuneMeaning,
            fortuneAdvice: this.fortuneAdvice
        });

        const envelope = document.getElementById('fortune-envelope');
        const textWrapper = document.getElementById('fortune-text-wrapper');
        const rightSection = document.getElementById('fortune-right-section');
        const mainCard = document.getElementById('fortune-card');
        const leftSection = document.getElementById('fortune-left-section');

        // 移除封套居中模式，恢复正常的左右布局
        if (mainCard) mainCard.classList.remove('envelope-only-mode');
        if (leftSection) leftSection.classList.remove('envelope-centered');

        // 先显示内容容器，再查找内部元素
        if (envelope) envelope.style.display = 'none';
        if (textWrapper) textWrapper.style.display = 'flex';
        if (rightSection) {
            rightSection.style.display = 'flex';
            rightSection.style.visibility = 'visible';
            rightSection.style.opacity = '1';
            SafeLogger.debug('显示签语右侧内容区域');
        }

        // 强制刷新DOM并等待更新
        if (rightSection) {
            // 强制触发重排
            rightSection.offsetHeight;
        }

        // 等待DOM更新后再查找内部元素
        setTimeout(() => {
            SafeLogger.debug('=== 开始查找页面元素 ===');
            SafeLogger.debug('容器状态:', {
                textWrapper: textWrapper ? textWrapper.style.display : 'N/A',
                rightSection: rightSection ? rightSection.style.display : 'N/A'
            });

            const textEl = document.getElementById('fortune-text');
            const meaningEl = document.getElementById('fortune-meaning');
            const adviceEl = document.getElementById('fortune-advice');
            const drawBtn = document.getElementById('draw-fortune-btn');
            const shareBtn = document.getElementById('share-fortune-btn');
            const resetBtn = document.getElementById('reset-fortune-btn');
            const speakBtn = document.getElementById('speak-fortune-btn');

            SafeLogger.debug('查找页面元素结果:', {
                envelope: !!envelope,
                textWrapper: !!textWrapper,
                rightSection: !!rightSection,
                textEl: !!textEl,
                meaningEl: !!meaningEl,
                adviceEl: !!adviceEl,
                drawBtn: !!drawBtn,
                shareBtn: !!shareBtn,
                resetBtn: !!resetBtn,
                speakBtn: !!speakBtn
            });

            // 如果元素仍然找不到，使用更直接的方法
            if (!textEl || !meaningEl || !adviceEl) {
                SafeLogger.debug('⚠️ 元素查找失败，使用直接方法');
                this.updateFortuneContentDirectly();
            } else {
                SafeLogger.debug('✅ 元素查找成功，使用正常方法');
                this.updateFortuneContent(textEl, meaningEl, adviceEl, drawBtn, shareBtn, resetBtn, speakBtn);
            }
        }, 100);
    }

    // 更新签语内容
    updateFortuneContent(textEl, meaningEl, adviceEl, drawBtn, shareBtn, resetBtn, speakBtn) {
        SafeLogger.debug('=== 开始更新签语内容 ===');

        // todaysFortune is the single source of truth for the currently
        // selected type.  Do not let a previous AI result override a
        // traditional fortune after the user switches types.
        let fortuneText, fortuneMeaning, fortuneAdvice;

        if (this.todaysFortune) {
            fortuneText = this.todaysFortune.text;
            fortuneMeaning = this.todaysFortune.meaning;
            fortuneAdvice = this.todaysFortune.advice;
            SafeLogger.debug('使用当前选中类型的签语内容');
        } else {
            SafeLogger.error('没有可显示的签语内容');
            return;
        }

        // 更新页面内容
        SafeLogger.debug('开始更新页面内容...');
        if (textEl) {
            textEl.textContent = fortuneText;
            SafeLogger.debug('Fortune text rendered.');
        } else {
            SafeLogger.error('❌ 未找到签语文本元素 (fortune-text)');
        }
        if (meaningEl) {
            meaningEl.textContent = fortuneMeaning;
            SafeLogger.debug('Fortune meaning rendered.');
        } else {
            SafeLogger.error('❌ 未找到签语含义元素 (fortune-meaning)');
        }
        if (adviceEl) {
            adviceEl.textContent = fortuneAdvice;
            SafeLogger.debug('Fortune advice rendered.');
        } else {
            SafeLogger.error('❌ 未找到签语建议元素 (fortune-advice)');
        }

        // 备用方案：如果元素找不到，重建安全的内容节点
        if (!textEl || !meaningEl || !adviceEl) {
            SafeLogger.debug('使用备用方案：重建签语内容节点');
            const content = document.getElementById('fortune-content');
            if (content) {
                renderFortuneContentNodes(content, fortuneText, fortuneMeaning, fortuneAdvice);
                SafeLogger.debug('✅ 备用方案设置完成');
            }
        }

        // 更新按钮状态
        if (drawBtn) drawBtn.style.display = 'none';
        if (shareBtn) shareBtn.style.display = 'inline-flex';
        if (resetBtn) resetBtn.style.display = 'inline-flex';
        if (speakBtn) speakBtn.style.display = 'inline-flex';

        // 强制显示内容区域
        const content = document.getElementById('fortune-content');
        if (content) {
            content.style.display = 'block';
            content.style.visibility = 'visible';
            content.style.opacity = '1';
            SafeLogger.debug('强制显示内容区域');
        }

        SafeLogger.debug('签语内容显示完成');
    }

    // 直接更新签语内容（备用方案）
    updateFortuneContentDirectly() {
        SafeLogger.debug('=== 使用直接方法更新签语内容 ===');
        SafeLogger.debug('AI fortune content stored.');

        // Keep the direct-render fallback consistent with the primary path.
        let fortuneText, fortuneMeaning, fortuneAdvice;

        if (this.todaysFortune) {
            fortuneText = this.todaysFortune.text;
            fortuneMeaning = this.todaysFortune.meaning;
            fortuneAdvice = this.todaysFortune.advice;
            SafeLogger.debug('Using the current fortune content.');
        } else {
            SafeLogger.error('没有可显示的签语内容');
            return;
        }

        // 直接重建内容节点
        const content = document.getElementById('fortune-content');
        if (content) {
            renderFortuneContentNodes(content, fortuneText, fortuneMeaning, fortuneAdvice);
            // 强制显示内容区域
            content.style.display = 'block';
            content.style.visibility = 'visible';
            content.style.opacity = '1';
            SafeLogger.debug('✅ 直接设置签语内容节点完成');
        }

        // 更新按钮状态
        const drawBtn = document.getElementById('draw-fortune-btn');
        const shareBtn = document.getElementById('share-fortune-btn');
        const resetBtn = document.getElementById('reset-fortune-btn');
        const speakBtn = document.getElementById('speak-fortune-btn');

        if (drawBtn) drawBtn.style.display = 'none';
        if (shareBtn) shareBtn.style.display = 'inline-flex';
        if (resetBtn) resetBtn.style.display = 'inline-flex';
        if (speakBtn) speakBtn.style.display = 'inline-flex';

        SafeLogger.debug('✅ 直接方法更新完成');
    }

    // 处理签文类型变化
    handleFortuneTypeChange(type) {
        SafeLogger.debug('签文类型切换为:', type);

        // AI fields are only a generation-time cache. Clear them before
        // loading the newly selected type so an old AI result cannot leak
        // into a traditional-fortune view.
        this.fortuneContent = null;
        this.fortuneMeaning = null;
        this.fortuneAdvice = null;

        const today = new Date().toDateString();
        const typeSuffix = type === 'ai' ? '_ai' : '_traditional';

        // 检查该类型是否有今日的签文数据
        const savedDate = window.DataSyncStorage.getRaw(`fortuneDate${typeSuffix}`);
        const savedFortune = window.DataSyncStorage.getRaw(`todaysFortune${typeSuffix}`);
        const savedLanguage = window.DataSyncStorage.getRaw(`fortuneLanguage${typeSuffix}`);

        const drawBtn = document.getElementById('draw-fortune-btn');
        const aiBtn = document.getElementById('ai-fortune-btn');

        // 更新按钮显示（只控制显示/隐藏，不重复创建内容节点）
        if (type === 'traditional') {
            if (drawBtn) {
                drawBtn.style.display = 'inline-flex';
            }
            if (aiBtn) {
                aiBtn.style.display = 'none';
            }
        } else if (type === 'ai') {
            if (drawBtn) {
                drawBtn.style.display = 'none';
            }
            if (aiBtn) {
                aiBtn.style.display = 'inline-flex';
            }
        }

        // 如果该类型有今日的数据且语言相同，直接显示
        if (savedDate === today && savedFortune && savedLanguage === currentLanguage) {
            SafeLogger.debug(`加载${type === 'ai' ? 'AI' : '传统'}签文数据`);
            this.hasDrawnToday = true;
            this.todaysFortune = JSON.parse(savedFortune);
            this.showFortune();
        } else if (savedDate === today && savedFortune && savedLanguage !== currentLanguage) {
            // 同一天但语言不同，重新生成对应语言的签文
            SafeLogger.debug(`重新生成${type === 'ai' ? 'AI' : '传统'}签文（语言切换）`);
            this.hasDrawnToday = true;
            this.generateTodaysFortune();
            this.showFortune();
            this.saveFortune(type);
        } else {
            // 该类型没有数据，显示封套
            SafeLogger.debug(`${type === 'ai' ? 'AI' : '传统'}签文无数据，显示封套`);
            this.hasDrawnToday = false;
            this.todaysFortune = null;
            this.showEnvelope();
        }
    }

    // 清除当前签文内容
    clearCurrentFortune() {
        SafeLogger.debug('清除当前签文内容');
        this.todaysFortune = null;
        this.fortuneContent = null;
        this.fortuneMeaning = null;
        this.fortuneAdvice = null;
        this.hasDrawnToday = false;

        // 隐藏签文内容，显示信封
        const envelope = document.getElementById('fortune-envelope');
        const content = document.getElementById('fortune-content');
        const shareBtn = document.getElementById('share-fortune-btn');
        const resetBtn = document.getElementById('reset-fortune-btn');
        const speakBtn = document.getElementById('speak-fortune-btn');

        if (envelope) envelope.style.display = 'block';
        if (content) content.style.display = 'none';
        if (shareBtn) shareBtn.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'none';
        if (speakBtn) speakBtn.style.display = 'none';
    }

    createStarAnimation() {
        const container = document.getElementById('stars-container');
        if (!container) return;

        // 清除之前的星星
        container.replaceChildren();

        // 创建多个星星
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const star = document.createElement('div');
                star.className = 'star';
                star.textContent = '✨';
                star.style.left = Math.random() * 100 + '%';
                star.style.animationDelay = Math.random() * 0.5 + 's';
                container.appendChild(star);

                // 3秒后移除星星
                setTimeout(() => {
                    if (star.parentNode) {
                        star.parentNode.removeChild(star);
                    }
                }, 3000);
            }, i * 100);
        }
    }

    saveFortune(type = null) {
        const fortuneType = type || this.getSelectedFortuneType();
        const typeSuffix = fortuneType === 'ai' ? '_ai' : '_traditional';
        const today = new Date().toDateString();

        // 根据类型保存到对应的存储键
        window.DataSyncStorage.setRaw(`fortuneDate${typeSuffix}`, today);
        window.DataSyncStorage.setRaw(`todaysFortune${typeSuffix}`, JSON.stringify(this.todaysFortune));
        window.DataSyncStorage.setRaw(`fortuneLanguage${typeSuffix}`, currentLanguage);
    }

    // 显示封套（点击抽取签文的卡片）
    showEnvelope() {
        const envelope = document.getElementById('fortune-envelope');
        const textWrapper = document.getElementById('fortune-text-wrapper');
        const rightSection = document.getElementById('fortune-right-section');
        const actionButtonsGroup = document.getElementById('action-buttons-group');
        const drawBtn = document.getElementById('draw-fortune-btn');
        const aiBtn = document.getElementById('ai-fortune-btn');
        const mainCard = document.getElementById('fortune-card');
        const leftSection = document.getElementById('fortune-left-section');

        if (envelope) envelope.style.display = 'block';
        if (textWrapper) textWrapper.style.display = 'none';
        if (rightSection) rightSection.style.display = 'none';
        if (actionButtonsGroup) actionButtonsGroup.style.display = 'none';

        // 添加封套专用模式class，让封套居中显示
        if (mainCard) {
            mainCard.classList.add('envelope-only-mode');
        }

        if (leftSection) {
            leftSection.classList.add('envelope-centered');
        }

        // 调试：检查封套元素的宽度
        if (envelope) {
            const envelopeFront = envelope.querySelector('.envelope-front');
            if (envelopeFront) {
                // 强制设置封套宽度和内边距
                envelopeFront.classList.add('fortune-envelope-front-centered');

                // 同时设置文字的内边距
                const envelopeText = envelopeFront.querySelector('.envelope-text');
                if (envelopeText) {
                    envelopeText.classList.add('fortune-envelope-text-centered');
                }
            }
        }

        // 根据当前类型显示对应的抽取按钮
        const selectedType = this.getSelectedFortuneType();
        if (selectedType === 'ai') {
            if (drawBtn) drawBtn.style.display = 'none';
            if (aiBtn) aiBtn.style.display = 'inline-flex';
        } else {
            if (drawBtn) drawBtn.style.display = 'inline-flex';
            if (aiBtn) aiBtn.style.display = 'none';
        }

        SafeLogger.debug('显示封套（居中模式）');
    }

    shareFortune() {
        // 显示分享选项模态框
        this.showShareOptions();
    }

    showShareOptions() {
        // 创建分享选项模态框
        const modal = document.createElement('div');
        modal.className = 'share-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'fortune-share-modal-content';

        const title = document.createElement('h3');
        title.textContent = currentLanguage === 'zh' ? '分享运势' : 'Share Fortune';
        title.className = 'fortune-share-title';

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'fortune-share-options';

        // 生成图片分享选项
        const imageOption = this.createShareOption(
            '🖼️',
            currentLanguage === 'zh' ? '生成图片分享' : 'Generate Image',
            currentLanguage === 'zh' ? '创建精美的签文图片' : 'Create beautiful fortune image',
            () => this.generateFortuneImage()
        );

        // 生成链接分享选项
        const linkOption = this.createShareOption(
            '🔗',
            currentLanguage === 'zh' ? '生成链接分享' : 'Generate Link',
            currentLanguage === 'zh' ? '创建可分享的链接' : 'Create shareable link',
            () => this.generateFortuneLink()
        );

        // 文本分享选项
        const textOption = this.createShareOption(
            '📝',
            currentLanguage === 'zh' ? '复制文本' : 'Copy Text',
            currentLanguage === 'zh' ? '复制签文到剪贴板' : 'Copy fortune to clipboard',
            () => this.copyFortuneText()
        );

        optionsContainer.appendChild(imageOption);
        optionsContainer.appendChild(linkOption);
        optionsContainer.appendChild(textOption);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = currentLanguage === 'zh' ? '取消' : 'Cancel';
        closeBtn.className = 'fortune-share-button fortune-share-cancel-button';
        closeBtn.addEventListener('click', () => modal.remove());

        modalContent.appendChild(title);
        modalContent.appendChild(optionsContainer);
        modalContent.appendChild(closeBtn);
        modal.appendChild(modalContent);

        // 点击背景关闭模态框
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    createShareOption(icon, title, description, onClick) {
        const option = document.createElement('div');
        option.className = 'fortune-share-option';

        const iconEl = document.createElement('span');
        iconEl.textContent = icon;
        iconEl.className = 'fortune-share-option-icon';

        const textContainer = document.createElement('div');
        textContainer.className = 'fortune-share-option-text';

        const titleEl = document.createElement('div');
        titleEl.textContent = title;
        titleEl.className = 'fortune-share-option-title';

        const descEl = document.createElement('div');
        descEl.textContent = description;
        descEl.className = 'fortune-share-option-description';

        textContainer.appendChild(titleEl);
        textContainer.appendChild(descEl);

        option.appendChild(iconEl);
        option.appendChild(textContainer);

        option.addEventListener('click', () => {
            onClick();
            option.closest('.share-modal').remove();
        });

        return option;
    }

    generateFortuneImage() {
        try {
            // 检查是否有签文数据
            if (!this.todaysFortune || !this.todaysFortune.text) {
                const message = currentLanguage === 'zh' ? '请先抽取签文！' : 'Please draw a fortune first!';
                this.showMessage(message);
                return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 设置画布尺寸 - 使用更合适的比例
            canvas.width = 800;
            canvas.height = 1000;

            // 设置更温暖的浅米色背景，添加微妙渐变
            const bgGradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
            );
            bgGradient.addColorStop(0, '#fdf6e3'); // 更温暖的米色
            bgGradient.addColorStop(0.5, '#fcf8f0'); // 原始米色
            bgGradient.addColorStop(1, '#f5f1e8'); // 稍深的米色
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 绘制顶部日期信息
            this.drawTopDateInfo(ctx, canvas.width, canvas.height);

            // 绘制标题和祝福语
            this.drawTitleAndBlessing(ctx, canvas.width, canvas.height);

            // 绘制签文卡片
            this.drawFortuneCard(ctx, canvas.width, canvas.height);

            // 转换为图片并下载
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `每日一签_${new Date().toISOString().split('T')[0]}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    const message = currentLanguage === 'zh' ? '精美图片已生成并开始下载！' : 'Beautiful image generated and downloading!';
                    this.showMessage(message);
                } else {
                    throw new Error('图片生成失败');
                }
            }, 'image/png', 0.95);
        } catch (error) {
            SafeLogger.error('生成图片失败:', error);
            const message = currentLanguage === 'zh' ? '图片生成失败，请重试！' : 'Image generation failed, please try again!';
            this.showMessage(message);
        }
    }

    // 绘制顶部日期信息
    drawTopDateInfo(ctx, width, height) {
        const currentDate = new Date();

        // 计算整体内容区域的起始位置，使内容垂直居中
        const contentStartY = height * 0.15; // 从画布高度的15%开始

        // 绘制日期 - 大号粗体，增强对比度
        ctx.fillStyle = '#1a252f'; // 更深的颜色，提高可读性
        ctx.font = 'bold 36px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.1)'; // 添加微妙阴影
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillText(currentDate.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        }), width / 2, contentStartY + 60);

        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 绘制农历信息
        ctx.fillStyle = '#495057'; // 稍微深一些的颜色
        ctx.font = '24px "Noto Sans SC", sans-serif';
        ctx.fillText('农历九月', width / 2, contentStartY + 100);
    }

    // 绘制标题和祝福语
    drawTitleAndBlessing(ctx, width, height) {
        const contentStartY = height * 0.15; // 与日期信息保持一致

        // 绘制"每日一签"标题 - 改为深红色，提高可读性
        const titleGradient = ctx.createLinearGradient(0, contentStartY + 140, 0, contentStartY + 180);
        titleGradient.addColorStop(0, '#d32f2f'); // 深红色
        titleGradient.addColorStop(0.5, '#c62828'); // 更深的红色
        titleGradient.addColorStop(1, '#b71c1c'); // 最深的红色

        ctx.fillStyle = titleGradient;
        ctx.font = 'bold 48px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(197, 40, 40, 0.3)'; // 红色阴影
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText('每日一签', width / 2, contentStartY + 160);

        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 绘制祝福语 - 更深的颜色
        ctx.fillStyle = '#6c757d'; // 更深的灰色
        ctx.font = '20px "Noto Sans SC", sans-serif';
        ctx.fillText('愿你今日好运相伴', width / 2, contentStartY + 200);
    }

    // 绘制签文卡片
    drawFortuneCard(ctx, width, height) {
        const contentStartY = height * 0.15; // 与上面保持一致
        const cardX = width / 2 - 300;
        const cardY = contentStartY + 250; // 调整卡片位置
        const cardWidth = 600;
        const cardHeight = 400;

        // 绘制卡片阴影
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        // 绘制卡片背景 - 白色
        ctx.fillStyle = '#ffffff';
        this.drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 20, '#ffffff', null, 0);

        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 绘制更粗的金色边框
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4; // 更粗的边框
        ctx.shadowColor = 'rgba(255, 215, 0, 0.2)'; // 金色边框阴影
        ctx.shadowBlur = 2;
        this.drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 20, null, '#ffd700', 4);

        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // 绘制签文内容 - 更深的颜色，精确居中
        ctx.fillStyle = '#1a252f'; // 更深的颜色
        ctx.font = 'bold 42px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.1)'; // 添加微妙阴影
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // 计算签文内容的垂直居中位置
        const cardCenterY = cardY + cardHeight / 2;
        const textY = cardCenterY - 60; // 主签文位置
        ctx.fillText(this.todaysFortune.text, width / 2, textY);

        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 绘制签文解释 - 更深的颜色，精确居中
        ctx.fillStyle = '#495057'; // 更深的灰色
        ctx.font = '20px "Noto Sans SC", sans-serif';
        const meaningLines = this.wrapText(ctx, this.todaysFortune.meaning, cardWidth - 80);

        // 计算解释文字的起始位置，使整体内容在卡片中垂直居中
        const totalExplanationHeight = meaningLines.length * 30;
        const adviceHeight = this.todaysFortune.advice ? this.wrapText(ctx, this.todaysFortune.advice, cardWidth - 80).length * 30 + 20 : 0;
        const totalTextHeight = totalExplanationHeight + adviceHeight;
        const startY = cardCenterY + 20; // 从卡片中心向下偏移

        let yPos = startY;
        meaningLines.forEach(line => {
            ctx.fillText(line, width / 2, yPos);
            yPos += 30;
        });

        // 绘制建议 - 如果有的话
        if (this.todaysFortune.advice) {
            yPos += 20;
            const adviceLines = this.wrapText(ctx, this.todaysFortune.advice, cardWidth - 80);
            adviceLines.forEach(line => {
                ctx.fillText(line, width / 2, yPos);
                yPos += 30;
            });
        }

        // 添加装饰性角落元素
        this.drawCornerDecorations(ctx, cardX, cardY, cardWidth, cardHeight);
    }

    // 绘制装饰性角落元素
    drawCornerDecorations(ctx, cardX, cardY, cardWidth, cardHeight) {
        const cornerSize = 20;
        const cornerRadius = 8;

        ctx.save();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';

        // 左上角装饰
        ctx.beginPath();
        ctx.moveTo(cardX + cornerRadius, cardY + cornerSize);
        ctx.lineTo(cardX + cornerSize, cardY + cornerRadius);
        ctx.arc(cardX + cornerRadius, cardY + cornerRadius, cornerRadius, 0, Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 右上角装饰
        ctx.beginPath();
        ctx.moveTo(cardX + cardWidth - cornerSize, cardY + cornerRadius);
        ctx.lineTo(cardX + cardWidth - cornerRadius, cardY + cornerSize);
        ctx.arc(cardX + cardWidth - cornerRadius, cardY + cornerRadius, cornerRadius, Math.PI / 2, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 左下角装饰
        ctx.beginPath();
        ctx.moveTo(cardX + cornerRadius, cardY + cardHeight - cornerSize);
        ctx.lineTo(cardX + cornerSize, cardY + cardHeight - cornerRadius);
        ctx.arc(cardX + cornerRadius, cardY + cardHeight - cornerRadius, cornerRadius, 3 * Math.PI / 2, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 右下角装饰
        ctx.beginPath();
        ctx.moveTo(cardX + cardWidth - cornerSize, cardY + cardHeight - cornerRadius);
        ctx.lineTo(cardX + cardWidth - cornerRadius, cardY + cardHeight - cornerSize);
        ctx.arc(cardX + cardWidth - cornerRadius, cardY + cardHeight - cornerRadius, cornerRadius, Math.PI, 3 * Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    // 绘制圆角矩形
    drawRoundedRect(ctx, x, y, width, height, radius, fillColor, strokeColor, strokeWidth) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();

        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
        }

        if (strokeColor && strokeWidth) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.stroke();
        }
    }
    // 文本换行处理
    wrapText(ctx, text, maxWidth) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + words[i];
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    // 绘制装饰性元素（已废弃）
    drawDecorativeElements(ctx, width, height) {
        ctx.save();

        // 绘制四个角的装饰性图案
        const cornerSize = 60;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
        ctx.shadowBlur = 8;

        // 左上角
        this.drawCornerPattern(ctx, 100, 100, cornerSize);

        // 右上角
        ctx.save();
        ctx.translate(width - 100, 100);
        ctx.rotate(Math.PI / 2);
        this.drawCornerPattern(ctx, 0, 0, cornerSize);
        ctx.restore();

        // 左下角
        ctx.save();
        ctx.translate(100, height - 100);
        ctx.rotate(-Math.PI / 2);
        this.drawCornerPattern(ctx, 0, 0, cornerSize);
        ctx.restore();

        // 右下角
        ctx.save();
        ctx.translate(width - 100, height - 100);
        ctx.rotate(Math.PI);
        this.drawCornerPattern(ctx, 0, 0, cornerSize);
        ctx.restore();

        // 添加装饰性圆点
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.shadowBlur = 4;

        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const radius = Math.min(width, height) * 0.35;
            const x = width / 2 + Math.cos(angle) * radius;
            const y = height / 2 + Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // 绘制角落装饰图案
    drawCornerPattern(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y);
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + size);

        // 添加装饰性弧线
        ctx.arc(x + size / 2, y + size / 2, size / 3, 0, Math.PI / 2);
        ctx.stroke();
    }

    // 绘制标题区域
    drawTitleSection(ctx, width, height) {
        // 标题背景
        const titleBg = ctx.createLinearGradient(0, 150, 0, 250);
        titleBg.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
        titleBg.addColorStop(1, 'rgba(255, 215, 0, 0.05)');
        ctx.fillStyle = titleBg;
        ctx.fillRect(100, 150, width - 200, 100);

        // 主标题
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 64px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.fillText('每日一签', width / 2, 200);

        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 日期
        const currentDate = new Date();
        const dateStr = currentDate.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        ctx.fillStyle = '#6c757d';
        ctx.font = '32px "Noto Sans SC", sans-serif';
        ctx.fillText(dateStr, width / 2, 240);

        // 装饰性分隔线
        this.drawDecorativeLine(ctx, width / 2 - 120, 280, width / 2 + 120, 280);
    }

    // 绘制签文内容区域
    drawFortuneContent(ctx, width, height) {
        // 签文内容背景
        const contentBg = ctx.createLinearGradient(width / 2 - 200, 350, width / 2 + 200, 350);
        contentBg.addColorStop(0, 'rgba(255, 215, 0, 0.15)');
        contentBg.addColorStop(0.5, 'rgba(255, 215, 0, 0.25)');
        contentBg.addColorStop(1, 'rgba(255, 215, 0, 0.15)');
        ctx.fillStyle = contentBg;
        this.drawRoundedRect(ctx, width / 2 - 200, 320, 400, 80, 15, contentBg, null, 0);

        // 签文内容
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 48px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 4;
        ctx.fillText(this.todaysFortune.text, width / 2, 370);

        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // 签文解释
        ctx.fillStyle = '#495057';
        ctx.font = '28px "Noto Sans SC", sans-serif';
        const meaningLines = this.wrapText(ctx, this.todaysFortune.meaning, width - 200);
        let yPos = 480;
        meaningLines.forEach(line => {
            ctx.fillText(line, width / 2, yPos);
            yPos += 40;
        });

        // 建议 - 如果有的话
        if (this.todaysFortune.advice) {
            yPos += 40;

            // 建议标题背景
            const adviceBg = ctx.createLinearGradient(width / 2 - 150, yPos - 30, width / 2 + 150, yPos - 30);
            adviceBg.addColorStop(0, 'rgba(108, 117, 125, 0.1)');
            adviceBg.addColorStop(1, 'rgba(108, 117, 125, 0.05)');
            ctx.fillStyle = adviceBg;
            this.drawRoundedRect(ctx, width / 2 - 150, yPos - 30, 300, 40, 10, adviceBg, null, 0);

            // 建议标题
            ctx.fillStyle = '#6c757d';
            ctx.font = 'bold 24px "Noto Sans SC", sans-serif';
            ctx.fillText('建议', width / 2, yPos);
            yPos += 50;

            // 建议内容
            ctx.fillStyle = '#868e96';
            ctx.font = '24px "Noto Sans SC", sans-serif';
            const adviceLines = this.wrapText(ctx, this.todaysFortune.advice, width - 200);
            adviceLines.forEach(line => {
                ctx.fillText(line, width / 2, yPos);
                yPos += 32;
            });
        }
    }

    // 绘制品牌区域
    drawBrandSection(ctx, width, height) {
        const brandY = height - 200;

        // 装饰性分隔线
        this.drawDecorativeLine(ctx, width / 2 - 200, brandY, width / 2 + 200, brandY);

        // 品牌背景
        const brandBg = ctx.createLinearGradient(width / 2 - 120, brandY + 20, width / 2 + 120, brandY + 20);
        brandBg.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
        brandBg.addColorStop(1, 'rgba(255, 215, 0, 0.05)');
        ctx.fillStyle = brandBg;
        this.drawRoundedRect(ctx, width / 2 - 120, brandY + 20, 240, 60, 15, brandBg, null, 0);

        // 应用标识
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 28px "Noto Sans SC", sans-serif';
        ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
        ctx.shadowBlur = 6;
        ctx.fillText('象限时光', width / 2, brandY + 50);

        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#6c757d';
        ctx.font = '20px "Noto Sans SC", sans-serif';
        ctx.fillText('让重要的事不再匆忙', width / 2, brandY + 80);

        // 添加装饰性元素
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px "Noto Sans SC", sans-serif';
        ctx.fillText('✦ ✦ ✦', width / 2, brandY + 110);
    }

    // 绘制装饰性线条
    drawDecorativeLine(ctx, x1, y1, x2, y2) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
        ctx.shadowBlur = 4;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // 添加装饰性圆点
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.shadowBlur = 2;

        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x1 + (x2 - x1) * 0.25, y1 + (y2 - y1) * 0.25, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x1 + (x2 - x1) * 0.75, y1 + (y2 - y1) * 0.75, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }

    // 绘制圆角矩形
    drawRoundedRect(ctx, x, y, width, height, radius, fillColor, strokeColor, strokeWidth) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();

        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
        }

        if (strokeColor && strokeWidth) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.stroke();
        }
    }

    wrapText(ctx, text, maxWidth) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + words[i];
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    generateFortuneLink() {
        try {
            // 检查是否有签文数据
            if (!this.todaysFortune || !this.todaysFortune.text) {
                const message = currentLanguage === 'zh' ? '请先抽取签文！' : 'Please draw a fortune first!';
                this.showMessage(message);
                return;
            }

            // 创建分享数据
            const shareData = {
                fortune: this.todaysFortune,
                date: new Date().toISOString(),
                version: '1.0'
            };

            // 将数据编码为Base64，并进行URL安全处理
            const jsonString = JSON.stringify(shareData);
            const encodedData = btoa(encodeURIComponent(jsonString));

            // 生成分享链接 - 跳转到独立的运势页面
            const baseUrl = window.location.origin;
            const shareUrl = `${baseUrl}/fortune-share.html?fortune=${encodedData}`;

            // 检查剪贴板API是否可用
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    const message = currentLanguage === 'zh' ? '分享链接已复制到剪贴板！' : 'Share link copied to clipboard!';
                    this.showMessage(message);
                }).catch((error) => {
                    SafeLogger.warn('剪贴板API失败，显示链接模态框:', error);
                    this.showShareLinkModal(shareUrl);
                });
            } else {
                // 如果剪贴板API不可用，直接显示链接
                this.showShareLinkModal(shareUrl);
            }
        } catch (error) {
            SafeLogger.error('生成分享链接失败:', error);
            const message = currentLanguage === 'zh' ? '生成分享链接失败，请重试！' : 'Failed to generate share link, please try again!';
            this.showMessage(message);
        }
    }

    showShareLinkModal(shareUrl) {
        const modal = document.createElement('div');
        modal.className = 'share-link-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'fortune-share-link-modal-content';

        const title = document.createElement('h3');
        title.textContent = currentLanguage === 'zh' ? '分享链接' : 'Share Link';
        title.className = 'fortune-share-title fortune-share-link-title';

        const linkContainer = document.createElement('div');
        linkContainer.className = 'fortune-share-link-container';

        const linkText = document.createElement('div');
        linkText.textContent = shareUrl;
        linkText.className = 'fortune-share-link-text';

        const copyBtn = document.createElement('button');
        copyBtn.textContent = currentLanguage === 'zh' ? '复制链接' : 'Copy Link';
        copyBtn.className = 'fortune-share-button fortune-share-primary-button';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(shareUrl).then(() => {
                const message = currentLanguage === 'zh' ? '链接已复制！' : 'Link copied!';
                this.showMessage(message);
            });
        });

        const closeBtn = document.createElement('button');
        closeBtn.textContent = currentLanguage === 'zh' ? '关闭' : 'Close';
        closeBtn.className = 'fortune-share-button';
        closeBtn.addEventListener('click', () => modal.remove());

        linkContainer.appendChild(linkText);
        modalContent.appendChild(title);
        modalContent.appendChild(linkContainer);
        modalContent.appendChild(copyBtn);
        modalContent.appendChild(closeBtn);
        modal.appendChild(modalContent);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    copyFortuneText() {
        const shareText = currentLanguage === 'zh'
            ? `我今天的签文是：${this.todaysFortune.text}\n${this.todaysFortune.meaning}`
            : `Today's fortune: ${this.todaysFortune.text}\n${this.todaysFortune.meaning}`;

        navigator.clipboard.writeText(shareText).then(() => {
            const message = currentLanguage === 'zh' ? '签文已复制到剪贴板！' : 'Fortune copied to clipboard!';
            this.showMessage(message);
        });
    }

    resetFortune() {
        const confirmMessage = currentLanguage === 'zh'
            ? '确定要重新抽签吗？这将清除今天的签文记录。'
            : 'Are you sure you want to draw again? This will clear today\'s fortune record.';

        if (confirm(confirmMessage)) {
            // 停止语音播报
            this.stopSpeaking();

            this.hasDrawnToday = false;
            this.todaysFortune = null;
            this.isDrawing = false;
            window.DataSyncStorage.removeRaw('fortuneDate');
            window.DataSyncStorage.removeRaw('todaysFortune');

            // 重置界面
            const envelope = document.getElementById('fortune-envelope');
            const content = document.getElementById('fortune-content');
            const drawBtn = document.getElementById('draw-fortune-btn');
            const shareBtn = document.getElementById('share-fortune-btn');
            const resetBtn = document.getElementById('reset-fortune-btn');
            const speakBtn = document.getElementById('speak-fortune-btn');
            const stopBtn = document.getElementById('stop-speaking-btn');

            if (envelope) {
                envelope.style.display = 'block';
                envelope.style.pointerEvents = 'auto';
            }
            if (content) content.style.display = 'none';
            if (drawBtn) {
                drawBtn.style.display = 'inline-flex';
                drawBtn.disabled = false;
            }
            if (shareBtn) shareBtn.style.display = 'none';
            if (resetBtn) resetBtn.style.display = 'none';
            if (speakBtn) speakBtn.style.display = 'none';
            if (stopBtn) stopBtn.style.display = 'none';

            const resetMessage = currentLanguage === 'zh' ? '已重置，可以重新抽签了！' : 'Reset complete, you can draw again!';
            this.showMessage(resetMessage);
        }
    }

    showMessage(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.className = 'fortune-message-toast';
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2000);
    }
}

// 在页面加载时添加清除所有提醒按钮
