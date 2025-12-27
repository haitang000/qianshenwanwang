class GameEngine {
    constructor(scenario) {
        this.scenario = scenario;
        this.state = 'intro';
        this.idx = -1;
        this.typing = false;
        this.isTrolling = false;
        this.hasChoices = false;
        this.loveScore = 0;
        this.currentName = null;
        this.initParticles();
        this.initKeyboard();
        // 全局角色字典
        this.characters = window.CHARACTERS || {};
    }

    initParticles() {
        const container = this.getEl('particles');
        if (!container) return;
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: rgba(197, 160, 89, ${Math.random() * 0.3});
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                filter: blur(1px);
                animation: float ${Math.random() * 10 + 10}s linear infinite;
            `;
            container.appendChild(p);
        }
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                const viewGame = this.getEl('view');
                const visible = viewGame && getComputedStyle(viewGame).display !== 'none';
                if (!this.isTrolling && !this.hasChoices && viewGame && visible) {
                    this.next();
                }
            }
        });
    }

    // Helper to find an element by multiple possible IDs (keeps engine HTML-agnostic)
    getEl(key) {
        const map = {
            menu: ['menu-home', 'menu-screen'],
            view: ['view-game', 'game-screen'],
            bg: ['bg', 'bg-layer'],
            sprite: ['sprite', 'char-container'],
            choices: ['choices', 'choice-layer'],
            particles: ['particles', 'particles-container'],
            trollScreen: ['troll-screen', 'death-layer'],
            trollContent: ['troll-content', 'death-layer-content']
        };
        const ids = map[key] || [key];
        for (let id of ids) {
            const el = document.getElementById(id);
            if (el) return el;
        }
        return null;
    }

    saveGame(e) {
        if (e) e.stopPropagation();
        const data = {
            state: this.state,
            idx: this.idx,
            loveScore: this.loveScore
        };
        localStorage.setItem('senman_save', JSON.stringify(data));
        console.log("Progress Saved");
    }

    loadGame() {
        const saved = localStorage.getItem('senman_save');
        if (saved) {
            const data = JSON.parse(saved);
            this.state = data.state;
            this.idx = data.idx - 1;
            this.loveScore = data.loveScore || 0;

            const menu = this.getEl('menu');
            const view = this.getEl('view');
            if (menu) menu.style.display = 'none';
            if (view) {
                view.style.display = 'block';
                requestAnimationFrame(() => view.style.opacity = '1');
            }
            const char = this.getEl('sprite');
            if (char) char.style.opacity = '1';
            this.next();
        } else {
            this.troll('load');
        }
    }

    start() {
        // 在开始前检查是否需要显示前置提示（可选择不再显示）
        const ack = localStorage.getItem('prelude_ack');
        if (!ack) return this.showPrelude();
        this._doStart();
    }

    _doStart() {
        const menu = this.getEl('menu');
        const view = this.getEl('view');
        if (menu) menu.style.opacity = '0';
        setTimeout(() => {
            if (menu) menu.style.display = 'none';
            if (view) {
                view.style.display = 'block';
                requestAnimationFrame(() => view.style.opacity = '1');
            }
            const char = this.getEl('sprite');
            if (char) char.style.opacity = '1';
            this.next();
        }, 800);
    }

    showPrelude() {
        const pre = document.getElementById('prelude-screen');
        if (!pre) return this._doStart();
        pre.style.display = 'flex';
        requestAnimationFrame(() => pre.style.opacity = '1');
    }

    confirmPrelude(e) {
        if (e) e.stopPropagation();
        const never = document.getElementById('prelude-never');
        if (never && never.checked) localStorage.setItem('prelude_ack', '1');
        const pre = document.getElementById('prelude-screen');
        if (pre) pre.style.display = 'none';
        this._doStart();
    }

    next() {
        if (this.isTrolling || this.hasChoices) return;
        if (this.typing) { this.typing = false; return; }
        const scene = this.scenario[this.state];
        this.idx++;
        if (this.idx < scene.length) this.render(scene[this.idx]);
    }

    render(step) {
        const bgEl = this.getEl('bg');
        if (step.bg && bgEl) bgEl.style.backgroundImage = `url('${step.bg}')`;
        if (step.char) {
            // 支持三种格式：
            // 1) step.char === true -> 使用 step.name 做为角色名并渲染默认立绘
            // 2) step.char 是字符串 -> 角色名
            // 3) step.char 是对象 -> { name: '往昔.', sprite: 'smile' }
            if (step.char === true) this.renderCharacter(step.name);
            else this.renderCharacter(step.char);
        }
        if (step.choice) this.showChoices(step.choice);
        else if (step.next) {
            this.state = step.next;
            this.idx = -1;
            this.next();
        }
        else this.type(step.text, step.name);
    }

    type(text, name) {
        this.typing = true;
        this.currentName = name || null;
        const nameEl = document.getElementById('ui-name');
        const textEl = document.getElementById('ui-text');
        if (nameEl) nameEl.innerText = name || "";
        if (!textEl) return;
        textEl.innerText = "";
        let i = 0;
        const timer = setInterval(() => {
            if (!this.typing) {
                textEl.innerText = text;
                clearInterval(timer);
                return;
            }
            textEl.innerText += text[i++];
            if (i >= text.length) {
                this.typing = false;
                clearInterval(timer);
            }
        }, 45);
    }

    // 渲染角色立绘，支持多立绘（variant）
    renderCharacter(spec) {
        if (!spec) return;
        let name = null;
        let variant = null;
        if (typeof spec === 'string') name = spec;
        else if (typeof spec === 'object') { name = spec.name; variant = spec.sprite; }
        if (!name) return;

        const charDef = this.characters[name];
        const container = this.getEl('sprite');
        if (!container) return;

        // 找到立绘 URL（优先：指定 variant -> default -> 第一张）
        let spriteUrl = null;
        if (charDef && charDef.sprites) {
            const pick = variant || charDef.default || Object.keys(charDef.sprites)[0];
            spriteUrl = charDef.sprites[pick];
        }

        // 如果没有 spriteUrl，保留现有容器（例如 SVG 占位）并只确保它可见
        if (!spriteUrl) {
            console.debug('renderCharacter: no sprite for', name, 'keeping placeholder');
            container.style.opacity = '1';
            container.style.transform = 'translateX(-50%) translateY(0)';
            return;
        }
        console.debug('renderCharacter:', name, '->', spriteUrl);

        // 使用已有 img 或创建新的 img（仅在有 spriteUrl 时替换）
        let img = container.querySelector('img.character-sprite');
        if (!img) {
            img = document.createElement('img');
            img.className = 'character-sprite';
            container.innerHTML = '';
            container.appendChild(img);
        }

        // 若已经是相同图片，则直接显示（比较时考虑绝对 URL 与相对路径）
        const currentSrc = img.src || '';
        const same = currentSrc === spriteUrl || currentSrc.endsWith(spriteUrl);
        if (same) {
            requestAnimationFrame(() => img.style.opacity = '1');
        } else {
            img.style.opacity = '0';
            // 清理旧的 handlers，防止重复触发
            img.onload = null;
            img.onerror = null;
            img.onload = () => requestAnimationFrame(() => img.style.opacity = '1');
            img.onerror = () => {
                console.warn('Character sprite failed to load:', spriteUrl);
                // 回退：用角色默认占位 SVG（如果定义）
                const charDef2 = this.characters[name];
                if (charDef2 && charDef2.sprites) {
                    const fallback = Object.values(charDef2.sprites).find(v => v && v.startsWith('data:image'));
                    if (fallback) {
                        img.src = fallback;
                        return;
                    }
                }
            };
            img.src = spriteUrl;
        }

        container.style.opacity = '1';
        container.style.transform = 'translateX(-50%) translateY(0)';
    }

    // 动态注册或合并更多角色定义
    registerCharacters(map) {
        this.characters = Object.assign({}, this.characters, map);
    }

    showChoices(opts) {
        this.hasChoices = true;
        const wrap = this.getEl('choices');
        if (!wrap) return;
        wrap.innerHTML = "";
        wrap.style.display = 'flex';
        opts.forEach(opt => {
            const div = document.createElement('div');
            div.className = 'opt-card';
            div.innerText = opt.text;
            div.onclick = () => {
                this.hasChoices = false;
                this.loveScore += (opt.love || 0);
                wrap.style.display = 'none';
                this.state = opt.next;
                this.idx = -1;
                this.next();
            };
            wrap.appendChild(div);
        });
    }

    // 支持点击推进（对应 HTML 的 onclick="game.clickScreen(event)")
    clickScreen(e) {
        if (e) e.stopPropagation();
        if (this.isTrolling || this.hasChoices) return;
        if (this.typing) { this.typing = false; return; }
        this.next();
    }

    // 显示跳过/系统设置的死亡彩蛋
    death(e) {
        if (e) e.stopPropagation();
        this.troll('skip');
    }

    async troll(type, event) {
        if (event) event.stopPropagation();
        if (this.isTrolling) return;
        this.isTrolling = true;
        const screen = this.getEl('trollScreen');
        const container = this.getEl('trollContent');
        if (!screen || !container) return;

        let title = "CONNECTION LOST";
        let lines = [];
        let btn = "返回观测";

        if (type === 'skip') {
            title = "跳过剧情等于跳过人生";
            lines = ["---- 我也不知道谁说的", "与其跳过，不如从未开始。"];
            btn = "对不起，我想慢下来";
        } else if (type === 'load') {
            title = "ARCHIVE ERROR";
            lines = ["过去已被锁定。", "活在当下，或者活在幻想里。"];
            btn = "确认";
        } else {
            title = "SYSTEM DENIED";
            lines = ["参数已达最优解。", "那就是注视着眼前的少女。"];
            btn = "了解";
        }

        container.innerHTML = "";
        screen.style.display = 'flex';
        requestAnimationFrame(() => screen.style.opacity = "1");

        const add = (txt, cls, dly) => new Promise(res => setTimeout(() => {
            const el = document.createElement('div');
            el.innerText = txt;
            el.className = cls + " animate-up";
            container.appendChild(el);
            res();
        }, dly));

        await add(title, "glitch-title", 1000);
        for (let l of lines) await add(l, "troll-line", 800);
        await add(btn, "retry-btn", 1200);
        container.lastChild.onclick = () => location.reload();
    }
}