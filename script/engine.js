class Engine {
    constructor() {
        this.data = STORY;
        this.chars = CHARACTERS;
        this.state = 'intro';
        this.index = -1;
        this.typing = false;
        this.locked = false;
        
        window.addEventListener('keydown', e => e.code === 'Space' && this.next());
        const bgLayer = document.getElementById('bg-layer');
        if (bgLayer) {
            bgLayer.style.backgroundImage = `url('${this.data.intro[0].bg}')`;
        }
    }

    start() {
        console.log("Starting game...");
        const menu = document.getElementById('menu-screen');
        if (!menu) {
            console.error("Menu screen not found!");
            return;
        }
        menu.style.opacity = '0';
        menu.style.pointerEvents = 'none';
        setTimeout(() => {
            const gameScreen = document.getElementById('game-screen');
            if (gameScreen) {
                gameScreen.style.display = 'block';
                setTimeout(() => gameScreen.style.opacity = '1', 100);
            } else {
                console.error("Game screen not found!");
            }
            this.next();
        }, 800);
    }

    clickScreen(e) {
        if (e.target.closest('.ctrl-btn')) return;
        this.next();
    }

    next() {
        console.log(`Next step. State: ${this.state}, Index: ${this.index + 1}`);
        if (this.locked || this.typing) {
             if(this.typing) { this.finishType(); } 
             return; 
        }
        this.index++;
        const scene = this.data[this.state];
        if (!scene) {
            console.error(`Scene not found: ${this.state}`);
            return;
        }
        if (this.index >= scene.length) {
            console.log("End of scene.");
            return;
        }
        this.render(scene[this.index]);
    }

    render(step) {
        if (step.bg) document.getElementById('bg-layer').style.backgroundImage = `url('${step.bg}')`;
        
        const charData = this.chars[step.speaker];
        const container = document.getElementById('char-container');
        const nameEl = document.getElementById('ui-name');
        const box = document.getElementById('dialog-box');

        if (charData) {
            nameEl.style.color = charData.theme;
            box.style.borderLeftColor = charData.theme;
            
            // 图片立绘渲染逻辑
            if (charData.img) {
                const currentImg = container.querySelector('img');
                if (!currentImg || currentImg.src !== charData.img) {
                    container.style.opacity = '0';
                    setTimeout(() => {
                        container.innerHTML = `<img src="${charData.img}" class="char-img" onerror="this.style.display='none'">`;
                        container.style.opacity = '1';
                        container.style.transform = 'translateX(-50%) translateY(0)';
                    }, 200);
                }
            } else {
                container.style.opacity = '0';
                container.style.transform = 'translateX(-50%) translateY(20px)';
            }
        }

        if (step.choice) {
            this.showChoices(step.choice);
        } else if (step.next) {
            this.state = step.next;
            this.index = -1;
            this.next();
        } else {
            this.type(step.text, step.speaker);
        }
    }

    type(text, name) {
        this.typing = true;
        this.currentText = text;
        const textEl = document.getElementById('ui-text');
        const nameEl = document.getElementById('ui-name');
        nameEl.innerText = name || "";
        textEl.innerText = "";
        let i = 0;
        this.timer = setInterval(() => {
            textEl.innerText += text[i++];
            if (i >= text.length) this.finishType();
        }, 40);
    }

    finishType() {
        clearInterval(this.timer);
        document.getElementById('ui-text').innerText = this.currentText;
        this.typing = false;
    }

    showChoices(opts) {
        this.locked = true;
        const layer = document.getElementById('choice-layer');
        layer.innerHTML = "";
        layer.style.display = 'flex';
        opts.forEach(o => {
            const btn = document.createElement('div');
            btn.className = 'choice-btn';
            btn.innerText = o.text;
            btn.onclick = () => {
                layer.style.display = 'none';
                this.locked = false;
                this.state = o.next;
                this.index = -1;
                this.next();
            };
            layer.appendChild(btn);
        });
    }

    save(e) {
        e.stopPropagation();
        localStorage.setItem('grace_save', JSON.stringify({ state: this.state, index: this.index }));
        const box = document.getElementById('dialog-box');
        box.style.background = 'rgba(255,255,255,0.2)';
        setTimeout(() => box.style.background = 'var(--theme-glass)', 200);
    }

    load() {
        const raw = localStorage.getItem('grace_save');
        if (!raw) return this.death();
        const s = JSON.parse(raw);
        this.state = s.state;
        this.index = s.index - 1;
        this.start();
    }

    death() {
        this.locked = true;
        document.getElementById('death-layer').style.display = 'flex';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Engine();
});
