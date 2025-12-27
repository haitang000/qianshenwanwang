class GameEngine {
    constructor(scenario) {
        this.scenario = scenario;
        this.state = 'intro';
        this.idx = -1;
        this.typing = false;
        this.isTrolling = false;
        this.hasChoices = false;
        this.loveScore = 0;
        this.initParticles();
        this.initKeyboard();
    }

    initParticles() {
        const container = document.getElementById('particles');
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
                const viewGame = document.getElementById('view-game');
                if (!this.isTrolling && !this.hasChoices && viewGame && viewGame.style.display === 'block') {
                    this.next();
                }
            }
        });
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

            document.getElementById('menu-home').style.display = 'none';
            document.getElementById('view-game').style.display = 'block';
            this.next();
        } else {
            this.troll('load');
        }
    }

    start() {
        const menu = document.getElementById('menu-home');
        const view = document.getElementById('view-game');
        if (menu) menu.style.opacity = '0';
        setTimeout(() => {
            if (menu) menu.style.display = 'none';
            if (view) view.style.display = 'block';
            this.next();
        }, 800);
    }

    next() {
        if (this.isTrolling || this.hasChoices) return;
        if (this.typing) { this.typing = false; return; }
        const scene = this.scenario[this.state];
        this.idx++;
        if (this.idx < scene.length) this.render(scene[this.idx]);
    }

    render(step) {
        if (step.bg) document.getElementById('bg').style.backgroundImage = `url('${step.bg}')`;
        if (step.char) {
            const s = document.getElementById('sprite');
            if (s) {
                s.style.opacity = '1';
                s.style.transform = 'translateX(-50%) translateY(0)';
            }
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

    showChoices(opts) {
        this.hasChoices = true;
        const wrap = document.getElementById('choices');
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

    async troll(type, event) {
        if (event) event.stopPropagation();
        if (this.isTrolling) return;
        this.isTrolling = true;
        const screen = document.getElementById('troll-screen');
        const container = document.getElementById('troll-content');
        if (!screen || !container) return;

        let title = "CONNECTION LOST";
        let lines = [];
        let btn = "返回观测";

        if (type === 'skip') {
            title = "TOO FAST TO LIVE";
            lines = ["你的人生也打算快进吗？", "与其跳过，不如从未开始。"];
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
