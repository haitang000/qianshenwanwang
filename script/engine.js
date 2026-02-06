// 引擎架构优化 - 模块化设计
// 版本: 2.0
// 优化目标: 提升性能、可扩展性和可维护性

// 模块1: 场景管理模块
class SceneManager {
    constructor(data) {
        this.data = data;
        this.currentScene = null;
        this.currentIndex = -1;
    }

    loadScene(sceneId) {
        if (!this.data[sceneId]) {
            throw new Error(`Scene not found: ${sceneId}`);
        }
        this.currentScene = this.data[sceneId];
        this.currentIndex = -1;
        return this.currentScene;
    }

    getNextStep() {
        if (!this.currentScene) {
            throw new Error('No scene loaded');
        }
        this.currentIndex++;
        if (this.currentIndex >= this.currentScene.length) {
            return null; // 场景结束
        }
        return this.currentScene[this.currentIndex];
    }

    getCurrentState() {
        return {
            sceneId: this.currentSceneId,
            index: this.currentIndex
        };
    }

    setCurrentState(sceneId, index) {
        this.loadScene(sceneId);
        this.currentIndex = index;
    }

    set currentSceneId(id) {
        this.loadScene(id);
    }

    get currentSceneId() {
        // 查找当前场景的ID
        for (const [id, scene] of Object.entries(this.data)) {
            if (scene === this.currentScene) {
                return id;
            }
        }
        return null;
    }
}

// 模块2: 渲染模块
class Renderer {
    constructor() {
        this.elements = {
            bgLayer: document.getElementById('bg-layer'),
            charContainer: document.getElementById('char-container'),
            nameEl: document.getElementById('ui-name'),
            dialogBox: document.getElementById('dialog-box'),
            textEl: document.getElementById('ui-text'),
            choiceLayer: document.getElementById('choice-layer'),
            loadingLayer: document.getElementById('loading-layer'),
            loadingProgress: document.querySelector('.loading-progress'),
            loadingPercentage: document.querySelector('.loading-percentage'),
            loadingText: document.querySelector('.loading-text'),
            circleProgress: document.querySelector('.circle-progress'),
            loadingTips: document.querySelector('.loading-tips')
        };
        this.tips = [
            "每一条因果线的选择都将指向不可逃避的终焉。",
            "系统提示：跳过剧情可能会导致因果线断裂。",
            "虚空并不是敌人。它是这个世界的另一面。",
            "正在同步多维宇宙观测数据...",
            "正在纠正因果偏移量...",
            "小心那些穿透暗影帷幕的视线。",
            "Hello World!"  
        ];
    }

    // 渲染加载进度条
    renderLoadingProgress(progress, text = '加载中...') {
        const percent = Math.min(100, Math.max(0, progress));

        if (this.elements.loadingProgress) {
            this.elements.loadingProgress.style.width = `${percent}%`;
        }
        if (this.elements.loadingPercentage) {
            this.elements.loadingPercentage.textContent = `${percent}%`;
        }
        if (this.elements.circleProgress) {
            const offset = 283 - (283 * percent / 100);
            this.elements.circleProgress.style.strokeDashoffset = offset;
        }
        if (this.elements.loadingText) {
            this.elements.loadingText.textContent = text;
        }
    }

    // 显示加载进度条
    showLoading() {
        if (this.elements.loadingLayer) {
            this.elements.loadingLayer.style.display = 'flex';

            // 随机显示一条提示
            if (this.elements.loadingTips) {
                const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
                this.elements.loadingTips.textContent = `系统提示：${randomTip}`;
            }

            this.renderLoadingProgress(0);
        }
    }

    // 隐藏加载进度条
    hideLoading() {
        if (this.elements.loadingLayer) {
            this.elements.loadingLayer.style.display = 'none';
        }
    }

    // 渲染背景
    renderBackground(bgUrl) {
        if (bgUrl && this.elements.bgLayer) {
            this.elements.bgLayer.style.backgroundImage = `url('${bgUrl}')`;
        }
    }

    // 渲染角色
    renderCharacter(step, charData) {
        if (!charData || !this.elements.charContainer) return;

        // 设置主题颜色
        if (this.elements.nameEl) {
            this.elements.nameEl.style.color = charData.theme;
        }
        if (this.elements.dialogBox) {
            this.elements.
            dialogBox.style.borderLeftColor = charData.theme;
        }

        // 处理角色立绘
        let imgSrc = charData.img;
        if (step.char) {
            const charName = step.char.name || step.name;
            const sprite = step.char.sprite || 'neutral';
            const basePath = charName === '往昔.' ? 'assets/characters/wangxi/' : '';
            imgSrc = `${basePath}${sprite}.png`;
        }

        if (imgSrc) {
            this.updateCharacterImage(imgSrc);
        } else {
            this.hideCharacter();
        }
    }

    // 更新角色图片
    updateCharacterImage(imgSrc) {
        const currentImg = this.elements.charContainer.querySelector('img');
        const shouldUpdate = !currentImg || !currentImg.src.endsWith(imgSrc);

        if (shouldUpdate) {
            // 使用淡入淡出动画
            this.elements.charContainer.style.opacity = '0';
            setTimeout(() => {
                this.elements.charContainer.innerHTML = `<img src="${imgSrc}" class="char-img" onerror="this.style.display='none'">`;
                this.elements.charContainer.style.opacity = '1';
                this.elements.charContainer.style.transform = 'translateX(-50%) translateY(0)';
            }, 200);
        }
    }

    // 隐藏角色
    hideCharacter() {
        this.elements.charContainer.style.opacity = '0';
        this.elements.charContainer.style.transform = 'translateX(-50%) translateY(20px)';
    }

    // 渲染对话
    renderDialogue(text, name) {
        if (!this.elements.textEl || !this.elements.nameEl) return;

        this.elements.nameEl.innerText = name || "";
        this.elements.textEl.innerText = text || "";
    }

    // 渲染打字效果
    renderTypingEffect(text, name, onComplete) {
        if (!this.elements.textEl || !this.elements.nameEl) return;

        // 先取消之前的打字效果
        this.cancelTyping();

        this.elements.nameEl.innerText = name || "";
        this.elements.textEl.innerText = "";

        let i = 0;
        let lastTime = 0;
        const speed = 40; // ms per char
        this._currentTypingText = text; // 保存当前正在打印的文本

        const type = (timestamp) => {
            // 检查是否已被取消或文本已更改
            if (!this._currentTypingRef || this._currentTypingText !== text) return;

            if (!lastTime) lastTime = timestamp;
            const elapsed = timestamp - lastTime;

            if (elapsed >= speed) {
                if (i < text.length) {
                    this.elements.textEl.innerText += text[i++];
                    lastTime = timestamp;
                }
            }

            if (i < text.length) {
                this._currentTypingRef = requestAnimationFrame(type);
            } else {
                this._currentTypingRef = null;
                this._currentTypingText = null;
                if (onComplete) onComplete();
            }
        };

        this._currentTypingRef = requestAnimationFrame(type);
        return this._currentTypingRef;
    }

    // 取消当前打字效果
    cancelTyping() {
        if (this._currentTypingRef) {
            cancelAnimationFrame(this._currentTypingRef);
            this._currentTypingRef = null;
        }
        this._currentTypingText = null;
    }

    // 渲染选择
    renderChoices(choices, onChoiceSelected) {
        if (!this.elements.choiceLayer) return;

        // 清空现有选择
        this.elements.choiceLayer.innerHTML = "";
        this.elements.choiceLayer.style.display = 'flex';

        choices.forEach(choice => {
            const btn = document.createElement('div');
            btn.className = 'choice-btn';
            btn.innerText = choice.text;
            btn.onclick = () => {
                this.elements.choiceLayer.style.display = 'none';
                if (onChoiceSelected) onChoiceSelected(choice);
            };
            this.elements.choiceLayer.appendChild(btn);
        });
    }

    // 清理渲染
    clear() {
        if (this.elements.textEl) this.elements.textEl.innerText = "";
        if (this.elements.nameEl) this.elements.nameEl.innerText = "";
        if (this.elements.choiceLayer) this.elements.choiceLayer.style.display = 'none';
        this.hideCharacter();
    }
}

// 模块3: 输入处理模块
class InputManager {
    constructor() {
        this.listeners = {
            keydown: [],
            click: []
        };
        this.isLocked = false;
        this.initEventListeners();
    }

    initEventListeners() {
        // 键盘事件
        window.addEventListener('keydown', (e) => {
            if (!this.isLocked) {
                this.listeners.keydown.forEach(listener => listener(e));
            }
        });

        // 点击事件
        document.addEventListener('click', (e) => {
            if (!this.isLocked && !e.target.closest('.ctrl-btn')) {
                this.listeners.click.forEach(listener => listener(e));
            }
        });
    }

    on(eventType, callback) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].push(callback);
        }
    }

    off(eventType, callback) {
        if (this.listeners[eventType]) {
            this.listeners[eventType] = this.listeners[eventType].filter(l => l !== callback);
        }
    }

    lock() {
        this.isLocked = true;
    }

    unlock() {
        this.isLocked = false;
    }

    get isLocked() {
        return this._isLocked;
    }

    set isLocked(value) {
        this._isLocked = value;
    }
}

// 模块4: 资源管理模块
class ResourceManager {
    constructor() {
        this.cache = new Map();
        this.loadingQueue = new Map();
        this.maxRetries = 3;
        this.loadingProgress = 0;
        this.totalResources = 0;
        this.loadedResources = 0;
        this.progressCallbacks = [];
    }

    // 注册进度回调
    onProgress(callback) {
        this.progressCallbacks.push(callback);
        return () => {
            this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
        };
    }

    // 更新进度
    updateProgress() {
        this.loadingProgress = Math.round((this.loadedResources / this.totalResources) * 100);
        this.progressCallbacks.forEach(callback => {
            try {
                callback(this.loadingProgress);
            } catch (error) {
                console.error('Error in progress callback:', error);
            }
        });
    }

    // 预加载图片资源
    async preloadImage(url) {
        if (this.cache.has(url)) {
            return this.cache.get(url);
        }

        if (this.loadingQueue.has(url)) {
            return this.loadingQueue.get(url);
        }

        this.totalResources++;
        this.updateProgress();

        const promise = new Promise((resolve, reject) => {
            let retries = 0;
            const loadImage = () => {
                const img = new Image();
                img.onload = async () => {
                    try {
                        // 使用 decode() 异步解码图片，避免主线程在渲染时卡顿
                        if ('decode' in img) {
                            await img.decode();
                        }
                        this.cache.set(url, img);
                        this.loadingQueue.delete(url);
                        this.loadedResources++;
                        this.updateProgress();
                        resolve(img);
                    } catch (e) {
                        console.warn(`Decoding failed for ${url}, fallback to standard load.`, e);
                        this.cache.set(url, img);
                        this.loadingQueue.delete(url);
                        this.loadedResources++;
                        this.updateProgress();
                        resolve(img);
                    }
                };
                img.onerror = () => {
                    retries++;
                    if (retries <= this.maxRetries) {
                        setTimeout(loadImage, 500 * retries);
                    } else {
                        this.loadingQueue.delete(url);
                        this.loadedResources++;
                        this.updateProgress();
                        reject(new Error(`Failed to load image after ${this.maxRetries} attempts: ${url}`));
                    }
                };
                img.src = url;
            };
            loadImage();
        });

        this.loadingQueue.set(url, promise);
        return promise;
    }

    // 预加载场景资源
    async preloadScene(sceneData) {
        const resources = [];

        // 收集场景中的所有资源
        sceneData.forEach(step => {
            if (step.bg) resources.push(step.bg);

            // 收集角色图片资源
            if (step.char) {
                const charName = step.char.name || step.name;
                const sprite = step.char.sprite || 'neutral';
                const basePath = charName === '往昔.' ? 'assets/characters/wangxi/' : '';
                resources.push(`${basePath}${sprite}.png`);
            }
        });

        // 去重并加载
        const uniqueResources = [...new Set(resources)];
        const promises = uniqueResources.map(url => this.preloadImage(url));

        try {
            await Promise.all(promises);
            return true;
        } catch (error) {
            console.error('Failed to preload scene resources:', error);
            return false;
        }
    }

    // 清除缓存
    clearCache() {
        this.cache.clear();
    }

    // 获取缓存状态
    getCacheStatus() {
        return {
            size: this.cache.size,
            loading: this.loadingQueue.size
        };
    }
}

// 模块5: 事件系统模块
class EventSystem {
    constructor() {
        this.events = new Map();
    }

    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        this.events.get(eventName).push(callback);
    }

    off(eventName, callback) {
        if (this.events.has(eventName)) {
            this.events.set(eventName, this.events.get(eventName).filter(cb => cb !== callback));
        }
    }

    emit(eventName, ...args) {
        if (this.events.has(eventName)) {
            this.events.get(eventName).forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in event listener for ${eventName}:`, error);
                }
            });
        }
    }

    once(eventName, callback) {
        const onceCallback = (...args) => {
            callback(...args);
            this.off(eventName, onceCallback);
        };
        this.on(eventName, onceCallback);
    }
}

// 模块6: 性能监控模块
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            frameTime: [],
            renderTime: [],
            stepTime: [],
            resourceLoadTime: []
        };
        this.startTimes = {};
    }

    startTimer(metricName) {
        this.startTimes[metricName] = performance.now();
    }

    endTimer(metricName) {
        if (this.startTimes[metricName]) {
            const duration = performance.now() - this.startTimes[metricName];
            if (this.metrics[metricName]) {
                this.metrics[metricName].push(duration);
                // 限制数组大小，避免内存占用过大
                if (this.metrics[metricName].length > 1000) {
                    this.metrics[metricName].shift();
                }
            }
            delete this.startTimes[metricName];
            return duration;
        }
        return 0;
    }

    addMetric(metricName, value) {
        if (this.metrics[metricName]) {
            this.metrics[metricName].push(value);
            if (this.metrics[metricName].length > 1000) {
                this.metrics[metricName].shift();
            }
        }
    }

    getMetrics() {
        return {
            frameTime: this.calculateStats(this.metrics.frameTime),
            renderTime: this.calculateStats(this.metrics.renderTime),
            stepTime: this.calculateStats(this.metrics.stepTime),
            resourceLoadTime: this.calculateStats(this.metrics.resourceLoadTime)
        };
    }

    calculateStats(data) {
        if (data.length === 0) {
            return { avg: 0, min: 0, max: 0, count: 0 };
        }

        const sum = data.reduce((a, b) => a + b, 0);
        const avg = sum / data.length;
        const min = Math.min(...data);
        const max = Math.max(...data);

        return { avg, min, max, count: data.length };
    }

    reset() {
        for (const metric in this.metrics) {
            this.metrics[metric] = [];
        }
        this.startTimes = {};
    }
}

// 音乐管理模块
class MusicManager {
    constructor() {
        this.currentAudio = null;
        this.currentMusic = null;
        this.volume = 0.5;
        this.isMuted = false;
        this.basePath = 'assets/musics/';
        
        // 预定义音乐映射
        this.musicMap = {
            'attachment': 'attachment.mp3',
            'happy': 'happy.mp3',
            'night': 'night.mp3',
            'pity': 'pity.mp3',
            'warm': 'warm.mp3',
            'entrance': 'entrance.mp3'
        };
    }

    // 播放音乐
    play(musicName, options = {}) {
        const fadeDuration = options.fadeDuration || 1000;
        const loop = options.loop !== false; // 默认循环播放
        
        // 处理清除音乐的情况
        if (musicName === 'clear' || musicName === 'stop') {
            this.stop(fadeDuration);
            return;
        }
        
        // 如果已经在播放同一首音乐，不做任何操作
        if (this.currentMusic === musicName && this.currentAudio) {
            return;
        }

        const musicFile = this.musicMap[musicName] || musicName;
        const audioPath = this.basePath + musicFile;

        // 创建新的音频对象
        const newAudio = new Audio(audioPath);
        newAudio.loop = loop;
        newAudio.volume = 0;
        newAudio.preload = 'auto';

        // 处理音频加载错误
        newAudio.onerror = () => {
            console.warn(`Failed to load music: ${audioPath}`);
        };

        // 如果当前有音乐在播放，先淡出
        if (this.currentAudio) {
            this.fadeOut(this.currentAudio, fadeDuration, () => {
                this.currentAudio.pause();
                this.currentAudio = null;
            });
        }

        // 播放新音乐并淡入
        newAudio.play().then(() => {
            this.fadeIn(newAudio, fadeDuration);
            this.currentAudio = newAudio;
            this.currentMusic = musicName;
        }).catch(err => {
            console.warn('Music playback failed:', err);
        });
    }

    // 停止播放
    stop(fadeDuration = 1000) {
        if (this.currentAudio) {
            this.fadeOut(this.currentAudio, fadeDuration, () => {
                this.currentAudio.pause();
                this.currentAudio = null;
                this.currentMusic = null;
            });
        }
    }

    // 暂停播放
    pause() {
        if (this.currentAudio) {
            this.currentAudio.pause();
        }
    }

    // 恢复播放
    resume() {
        if (this.currentAudio && this.currentAudio.paused) {
            this.currentAudio.play().catch(err => {
                console.warn('Music resume failed:', err);
            });
        }
    }

    // 设置音量
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.currentAudio) {
            this.currentAudio.volume = this.isMuted ? 0 : this.volume;
        }
    }

    // 获取当前音量
    getVolume() {
        return this.volume;
    }

    // 静音切换
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.currentAudio) {
            this.currentAudio.volume = this.isMuted ? 0 : this.volume;
        }
        return this.isMuted;
    }

    // 淡入效果
    fadeIn(audio, duration) {
        const startTime = Date.now();
        const targetVolume = this.isMuted ? 0 : this.volume;
        
        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            
            if (audio) {
                audio.volume = targetVolume * progress;
            }
            
            if (progress < 1) {
                requestAnimationFrame(fade);
            }
        };
        
        requestAnimationFrame(fade);
    }

    // 淡出效果
    fadeOut(audio, duration, callback) {
        const startTime = Date.now();
        const startVolume = audio.volume;
        
        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            
            if (audio) {
                audio.volume = startVolume * (1 - progress);
            }
            
            if (progress < 1) {
                requestAnimationFrame(fade);
            } else if (callback) {
                callback();
            }
        };
        
        requestAnimationFrame(fade);
    }

    // 获取当前播放的音乐名称
    getCurrentMusic() {
        return this.currentMusic;
    }
}

// 章节追踪模块
class ChapterTracker {

    constructor() {
        this.storageKey = 'qianshenwanwang_unlocked_chapters';
        this.importantScenes = [
            'intro',
            'first_encounter',
            'transition_bond_1',
            'corridor_scene',
            'scene_conclusion',
            'chapter2_start',
            'chapter2_climax',
            'chapter3_start',
            'chapter3_climax',
            'chapter4_start',
            'chapter5_start',
            'chapter6_start',
            'chapter7_start',
            'chapter7_climax',
            'chapter8_start',
            'chapter8_climax',
            'epilogue'
        ];
    }

    // 获取已解锁的章节
    getUnlockedChapters() {
        try {
            const unlocked = localStorage.getItem(this.storageKey);
            return unlocked ? JSON.parse(unlocked) : [];
        } catch (e) {
            console.error('Failed to get unlocked chapters:', e);
            return [];
        }
    }

    // 解锁章节
    unlockChapter(sceneId) {
        if (!this.importantScenes.includes(sceneId)) {
            return false;
        }

        try {
            const unlocked = this.getUnlockedChapters();
            if (!unlocked.includes(sceneId)) {
                unlocked.push(sceneId);
                localStorage.setItem(this.storageKey, JSON.stringify(unlocked));
                console.log(`章节已解锁: ${sceneId}`);
                return true;
            }
        } catch (e) {
            console.error('Failed to unlock chapter:', e);
        }
        return false;
    }

    // 检查章节是否已解锁
    isChapterUnlocked(sceneId) {
        const unlocked = this.getUnlockedChapters();
        return unlocked.includes(sceneId);
    }

    // 重置所有章节解锁状态（调试用）
    reset() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            console.error('Failed to reset chapters:', e);
        }
    }
}

// 主引擎类 - 整合所有模块
class Engine {
    constructor() {
        // 初始化模块
        this.sceneManager = new SceneManager(STORY);
        this.renderer = new Renderer();
        this.inputManager = new InputManager();
        this.resourceManager = new ResourceManager();
        this.eventSystem = new EventSystem();
        this.performanceMonitor = new PerformanceMonitor();
        this.chapterTracker = new ChapterTracker();
        this.musicManager = new MusicManager();

        // 内部状态
        this.typing = false;
        this.typingTimer = null;
        this.saveLoadTimer = null;
        this.isLocked = false;
        this.isProcessing = false; // 防重复点击标志
        this.characters = CHARACTERS;

        // 初始化
        this.init();

        // 检查是否从章节页面跳转过来
        this.checkChapterJump();

        // 向后兼容 - 暴露旧版API
        this.initLegacyAPI();
    }

    init() {
        // 初始化背景
        if (STORY.intro && STORY.intro[0] && STORY.intro[0].bg) {
            this.renderer.renderBackground(STORY.intro[0].bg);
        }

        // 初始化事件监听
        this.setupEventListeners();

        // 触发引擎初始化事件
        this.eventSystem.emit('engine:init');
    }

    setupEventListeners() {
        // 键盘事件 - 空格键继续
        this.inputManager.on('keydown', (e) => {
            if (e.code === 'Space') {
                this.next();
            }
        });

        // 点击事件 - 继续
        this.inputManager.on('click', () => {
            this.next();
        });
    }

    async start() {
        this.performanceMonitor.startTimer('startup');
        console.log('Engine 2.0 starting...');

        try {
            // 显示加载进度条
            this.renderer.showLoading();

            // 预加载初始资源
            await this.preloadInitialResources();

            // 隐藏菜单
            const menu = document.getElementById('menu-screen');
            if (!menu) {
                throw new Error('Menu screen not found');
            }

            menu.style.opacity = '0';
            menu.style.pointerEvents = 'none';

            // 显示难度选择
            await this.delay(800);
            const difficultyLayer = document.getElementById('difficulty-layer');
            if (!difficultyLayer) {
                throw new Error('Difficulty layer not found');
            }
            difficultyLayer.style.display = 'flex';

            // 隐藏加载进度条
            this.renderer.hideLoading();

            const startupTime = this.performanceMonitor.endTimer('startup');
            this.performanceMonitor.addMetric('startupTime', startupTime);
            this.eventSystem.emit('engine:started', startupTime);

        } catch (error) {
            console.error('Failed to start engine:', error);
            this.renderer.hideLoading();
            this.eventSystem.emit('engine:error', error);
        }
    }

    // 预加载初始资源
    async preloadInitialResources() {
        const resourcesToLoad = [];

        // 收集需要预加载的资源
        if (STORY.intro && STORY.intro[0] && STORY.intro[0].bg) {
            resourcesToLoad.push(STORY.intro[0].bg);
        }

        // 添加角色图片资源
        for (const [name, char] of Object.entries(this.characters)) {
            if (char.img) {
                resourcesToLoad.push(char.img);
            }
        }

        // 如果没有资源需要加载，直接返回
        if (resourcesToLoad.length === 0) {
            return;
        }

        // 注册进度回调
        const removeCallback = this.resourceManager.onProgress((progress) => {
            this.renderer.renderLoadingProgress(progress, '初始化资源...');
        });

        try {
            // 并行加载所有资源
            const promises = resourcesToLoad.map(url => this.resourceManager.preloadImage(url));
            await Promise.all(promises);
        } catch (error) {
            console.error('Error preloading resources:', error);
        } finally {
            // 移除进度回调
            removeCallback();
        }
    }

    async selectDifficulty(difficulty) {
        const difficultyLayer = document.getElementById('difficulty-layer');
        const deathLayer = document.getElementById('death-layer');
        const subtitle = document.querySelector('.game-over-subtitle');
        const gameScreen = document.getElementById('game-screen');

        if (!difficultyLayer || !deathLayer || !subtitle) {
            throw new Error('Required elements not found');
        }

        difficultyLayer.style.display = 'none';

        switch (difficulty) {
            case 'easy':
            case 'medium':
                subtitle.innerHTML = '不整点高难度的？';
                deathLayer.style.display = 'flex';
                break;
            case 'porcelain':
                subtitle.innerHTML = '学校里不能谈恋爱😡';
                deathLayer.style.display = 'flex';
                break;
            case 'hard':
                // 显示加载进度条
                this.renderer.showLoading();

                // 预加载intro场景的资源
                if (STORY.intro) {
                    await this.preloadSceneResources(STORY.intro, '加载游戏场景...');
                }

                if (gameScreen) {
                    gameScreen.style.display = 'block';
                    setTimeout(() => {
                        gameScreen.style.opacity = '1';
                        this.sceneManager.currentSceneId = 'intro';
                        this.renderer.hideLoading();
                        this.next();
                    }, 100);
                } else {
                    this.renderer.hideLoading();
                    throw new Error('Game screen not found');
                }
                break;
            default:
                this.renderer.hideLoading();
                throw new Error(`Invalid difficulty: ${difficulty}`);
        }
    }

    async next() {
        if (this.isLocked || this.isProcessing) return;
        
        this.isProcessing = true;
        this.performanceMonitor.startTimer('stepTime');

        try {
            // 清除保存/加载消息的定时器
            if (this.saveLoadTimer) {
                clearTimeout(this.saveLoadTimer);
                this.saveLoadTimer = null;

                // 恢复文本颜色和样式
                const textEl = document.getElementById('ui-text');
                if (textEl) {
                    textEl.style.color = '';
                    textEl.style.fontWeight = '';
                }
            }

            // 如果正在打字，直接完成打字，然后继续下一步
            if (this.typing) {
                this.renderer.cancelTyping();
                this.finishType();
                // 注意：这里不返回，继续执行后面的代码来进入下一步
            } else {
                // 只有在没有打字时才获取下一步
                const step = this.sceneManager.getNextStep();
                if (!step) {
                    // 场景结束
                    this.eventSystem.emit('scene:end', this.sceneManager.currentSceneId);
                    return;
                }

                await this.renderStep(step);
                this.eventSystem.emit('step:rendered', step);
            }

        } catch (error) {
            console.error('Error in next():', error);
            this.renderer.hideLoading(); // 确保加载进度条隐藏
            this.eventSystem.emit('engine:error', error);
        } finally {
            const stepTime = this.performanceMonitor.endTimer('stepTime');
            this.performanceMonitor.addMetric('stepTime', stepTime);
            this.isProcessing = false;
        }
    }

    async renderStep(step) {
        this.performanceMonitor.startTimer('renderTime');

        try {
            // 处理背景音乐
            if (step.music) {
                this.musicManager.play(step.music, { fadeDuration: 1500 });
            }

            // 处理背景
            if (step.bg) {
                this.renderer.renderBackground(step.bg);
            }

            // 处理选择
            if (step.choice) {
                this.handleChoice(step.choice);
            }
            // 处理场景跳转
            else if (step.next) {
                await this.handleSceneTransition(step.next);
            }
            // 处理对话
            else if (step.text) {
                this.handleDialogue(step);
            }

            this.eventSystem.emit('step:processed', step);

        } catch (error) {
            console.error('Error in renderStep():', error);
            this.renderer.hideLoading(); // 确保加载进度条隐藏
            this.eventSystem.emit('engine:error', error);
        } finally {
            const renderTime = this.performanceMonitor.endTimer('renderTime');
            this.performanceMonitor.addMetric('renderTime', renderTime);
        }
    }

    handleChoice(choices) {
        this.inputManager.lock();
        this.isLocked = true;

        this.renderer.renderChoices(choices, (choice) => {
            this.inputManager.unlock();
            this.isLocked = false;

            // 处理选择后的逻辑
            if (choice.next) {
                this.sceneManager.currentSceneId = choice.next;
                this.next();
            }

            // 选择完成后自动保存
            this.autoSave();

            this.eventSystem.emit('choice:selected', choice);
        });
    }

    async handleSceneTransition(nextSceneId) {
        // 自动保存当前状态
        this.autoSave();

        // 解锁当前章节
        this.unlockCurrentChapter();

        // 显示加载进度条
        this.renderer.showLoading();

        // 预加载目标场景的资源
        const targetScene = this.data[nextSceneId];
        if (targetScene) {
            await this.preloadSceneResources(targetScene, '加载新场景...');
        }

        // 切换场景
        this.sceneManager.currentSceneId = nextSceneId;

        // 隐藏加载进度条
        this.renderer.hideLoading();

        // 继续游戏
        this.next();
        this.eventSystem.emit('scene:transition', nextSceneId);
    }

    handleDialogue(step, skipTyping = false) {
        const charData = this.characters[step.name];

        // 渲染角色
        this.renderer.renderCharacter(step, charData);

        // 渲染对话
        if (skipTyping) {
            // 直接显示完整文本（用于加载游戏时）
            this.renderer.renderDialogue(step.text, step.name);
            this.typing = false;
        } else {
            // 打字效果
            this.typing = true;
            this.typingTimer = this.renderer.renderTypingEffect(
                step.text,
                step.name,
                () => this.finishType()
            );
        }
    }

    finishType() {
        // 先标记打字结束，防止递归
        this.typing = false;
        
        if (this.typingTimer) {
            clearInterval(this.typingTimer);
            this.typingTimer = null;
        }

        // 确保当前台词的完整文本显示出来
        const currentStep = this.sceneManager.currentScene &&
            this.sceneManager.currentIndex >= 0 &&
            this.sceneManager.currentIndex < this.sceneManager.currentScene.length
            ? this.sceneManager.currentScene[this.sceneManager.currentIndex]
            : null;

        if (currentStep && currentStep.text) {
            this.renderer.renderDialogue(currentStep.text, currentStep.name);
            
            // 检测章节结束并自动保存
            if (currentStep.text.includes('观测结束') || currentStep.text.includes('游戏结束')) {
                this.autoSave();
                console.log(`章节结束自动保存: ${this.sceneManager.currentSceneId}`);
            }
        }

        this.eventSystem.emit('typing:finished');
    }

    // 自动保存游戏（无UI提示）
    autoSave() {
        // 获取当前步骤信息
        const currentStep = this.sceneManager.currentScene &&
            this.sceneManager.currentIndex >= 0 &&
            this.sceneManager.currentIndex < this.sceneManager.currentScene.length
            ? this.sceneManager.currentScene[this.sceneManager.currentIndex]
            : null;

        const saveData = {
            version: '2.0',
            timestamp: Date.now(),
            sceneId: this.sceneManager.currentSceneId,
            index: this.sceneManager.currentIndex,
            // 保存当前步骤的关键信息
            currentBg: currentStep?.bg || null,
            currentName: currentStep?.name || null,
            currentText: currentStep?.text || null,
            currentChar: currentStep?.char || null
        };

        try {
            localStorage.setItem('grace_save', JSON.stringify(saveData));
            this.eventSystem.emit('game:autosaved', saveData);
        } catch (error) {
            console.error('Failed to auto-save game:', error);
        }
    }

    // 保存游戏
    save(event) {
        // 阻止事件冒泡，避免触发点击继续
        if (event) {
            event.stopPropagation();
        }

        // 获取当前步骤信息
        const currentStep = this.sceneManager.currentScene &&
            this.sceneManager.currentIndex >= 0 &&
            this.sceneManager.currentIndex < this.sceneManager.currentScene.length
            ? this.sceneManager.currentScene[this.sceneManager.currentIndex]
            : null;

        const saveData = {
            version: '2.0',
            timestamp: Date.now(),
            sceneId: this.sceneManager.currentSceneId,
            index: this.sceneManager.currentIndex,
            // 保存当前步骤的关键信息
            currentBg: currentStep?.bg || null,
            currentName: currentStep?.name || null,
            currentText: currentStep?.text || null,
            currentChar: currentStep?.char || null
        };

        try {
            localStorage.setItem('grace_save', JSON.stringify(saveData));

            // 显示保存成功提示
            this.showSaveLoadMessage('游戏已保存', true);

            this.eventSystem.emit('game:saved', saveData);
        } catch (error) {
            console.error('Failed to save game:', error);
            this.showSaveLoadMessage('保存失败', false);
        }
    }

    // 显示保存/加载消息
    showSaveLoadMessage(message, isSuccess) {
        const textEl = document.getElementById('ui-text');
        if (!textEl) return;

        const originalText = textEl.textContent;
        const originalColor = textEl.style.color;

        textEl.textContent = message;
        textEl.style.color = isSuccess ? '#4ade80' : '#f87171';
        textEl.style.fontWeight = 'bold';

        // 清除之前的定时器
        if (this.saveLoadTimer) {
            clearTimeout(this.saveLoadTimer);
        }

        // 设置新的定时器
        this.saveLoadTimer = setTimeout(() => {
            textEl.textContent = originalText;
            textEl.style.color = originalColor;
            textEl.style.fontWeight = '';
            this.saveLoadTimer = null;
        }, 1500);
    }

    // 加载游戏
    async load(event) {
        // 阻止事件冒泡
        if (event) {
            event.stopPropagation();
        }

        const raw = localStorage.getItem('grace_save');
        if (!raw) {
            // 处理加载失败 - 没有存档
            this.showSaveLoadMessage('没有找到存档', false);
            return;
        }

        try {
            const saveData = JSON.parse(raw);

            // 验证存档数据
            if (!saveData.sceneId || saveData.index === undefined) {
                // 兼容旧版存档格式
                if (saveData.state) {
                    saveData.sceneId = saveData.state;
                } else {
                    throw new Error('Invalid save data format');
                }
            }

            // 检查场景是否存在
            if (!this.data[saveData.sceneId]) {
                throw new Error(`Scene not found: ${saveData.sceneId}`);
            }

            // 显示加载进度条
            this.renderer.showLoading();

            // 预加载保存点所在场景的资源
            const scene = this.data[saveData.sceneId];
            if (scene) {
                await this.preloadSceneResources(scene, '加载游戏数据...');
            }

            // 隐藏菜单和难度选择
            const menu = document.getElementById('menu-screen');
            const difficultyLayer = document.getElementById('difficulty-layer');
            const gameScreen = document.getElementById('game-screen');
            const deathLayer = document.getElementById('death-layer');

            if (menu) {
                menu.style.opacity = '0';
                menu.style.pointerEvents = 'none';
            }
            if (difficultyLayer) {
                difficultyLayer.style.display = 'none';
            }
            if (deathLayer) {
                deathLayer.style.display = 'none';
            }
            if (gameScreen) {
                gameScreen.style.display = 'block';
                gameScreen.style.opacity = '1';
            }

            // 恢复游戏状态
            this.sceneManager.setCurrentState(saveData.sceneId, saveData.index);

            // 渲染当前步骤（加载时跳过打字效果）
            const currentStep = this.sceneManager.currentScene[this.sceneManager.currentIndex];
            if (currentStep) {
                // 如果是对话步骤，直接显示完整文本
                if (currentStep.text) {
                    const charData = this.characters[currentStep.name];
                    if (currentStep.bg) {
                        this.renderer.renderBackground(currentStep.bg);
                    }
                    this.renderer.renderCharacter(currentStep, charData);
                    this.handleDialogue(currentStep, true); // 跳过打字效果
                } else {
                    // 其他类型的步骤正常渲染
                    await this.renderStep(currentStep);
                }
            }

            // 隐藏加载进度条
            this.renderer.hideLoading();

            // 显示加载成功提示
            this.showSaveLoadMessage('游戏已加载', true);

            this.eventSystem.emit('game:loaded', saveData);
        } catch (error) {
            console.error('Error loading game:', error);
            this.renderer.hideLoading();
            this.showSaveLoadMessage('加载失败：存档可能已损坏', false);
        }
    }

    // 预加载场景资源
    async preloadSceneResources(scene, text = '加载场景资源...') {
        const resourcesToLoad = new Set();

        // 收集场景中的所有资源
        scene.forEach(step => {
            if (step.bg) {
                resourcesToLoad.add(step.bg);
            }
            // 处理角色图片资源
            if (step.char) {
                const charName = step.char.name || step.name;
                const sprite = step.char.sprite || 'neutral';
                const basePath = charName === '往昔.' ? 'assets/characters/wangxi/' : '';
                const imgSrc = `${basePath}${sprite}.png`;
                resourcesToLoad.add(imgSrc);
            }
        });

        // 如果没有资源需要加载，直接返回
        if (resourcesToLoad.size === 0) {
            return;
        }

        // 注册进度回调
        const removeCallback = this.resourceManager.onProgress((progress) => {
            this.renderer.renderLoadingProgress(progress, text);
        });

        try {
            // 并行加载所有资源
            const promises = Array.from(resourcesToLoad).map(url => this.resourceManager.preloadImage(url));
            await Promise.all(promises);
        } catch (error) {
            console.error('Error preloading scene resources:', error);
        } finally {
            // 移除进度回调
            removeCallback();
        }
    }

    // 死亡场景
    death() {
        this.isLocked = true;
        this.inputManager.lock();
        const deathLayer = document.getElementById('death-layer');
        if (deathLayer) {
            deathLayer.style.display = 'flex';
        }
        this.eventSystem.emit('game:death');
    }

    // 工具方法
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 获取性能指标
    getPerformanceMetrics() {
        return this.performanceMonitor.getMetrics();
    }

    // 重置性能指标
    resetPerformanceMetrics() {
        this.performanceMonitor.reset();
    }

    // 向后兼容 - 初始化旧版API
    initLegacyAPI() {
        // 旧版属性
        Object.defineProperty(this, 'state', {
            get: () => this.sceneManager.currentSceneId,
            set: (value) => { this.sceneManager.currentSceneId = value; }
        });

        Object.defineProperty(this, 'index', {
            get: () => this.sceneManager.currentIndex,
            set: (value) => { this.sceneManager.currentIndex = value; }
        });

        Object.defineProperty(this, 'data', {
            get: () => STORY
        });

        Object.defineProperty(this, 'chars', {
            get: () => this.characters
        });

        // 确保旧版API仍然可用
        console.log('Engine 2.0 initialized with legacy API support');
    }

    // 旧版API - clickScreen方法
    clickScreen(e) {
        this.next();
    }

    // 初始化事件监听器（旧版）
    setupEventListeners() {
        // 键盘事件
        this.inputManager.on('keydown', (e) => {
            if (e.code === 'Space') {
                this.next();
            }
        });
    }

    // 检查是否从章节页面跳转过来
    checkChapterJump() {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        
        if (mode === 'chapter') {
            const targetChapter = sessionStorage.getItem('qianshenwanwang_jump_chapter');
            if (targetChapter && this.chapterTracker.isChapterUnlocked(targetChapter)) {
                // 清除跳转信息
                sessionStorage.removeItem('qianshenwanwang_jump_chapter');
                // 延迟执行跳转，确保引擎完全初始化
                setTimeout(() => {
                    this.startFromChapter(targetChapter);
                }, 100);
            }
        }
    }

    // 从特定章节开始游戏
    async startFromChapter(chapterId) {
        console.log(`从章节 ${chapterId} 开始游戏`);
        
        try {
            // 显示加载进度条
            this.renderer.showLoading();

            // 预加载目标场景的资源
            const scene = this.data[chapterId];
            if (scene) {
                await this.preloadSceneResources(scene, '加载章节内容...');
            }

            // 隐藏菜单和难度选择
            const menu = document.getElementById('menu-screen');
            const difficultyLayer = document.getElementById('difficulty-layer');
            const gameScreen = document.getElementById('game-screen');

            if (menu) {
                menu.style.opacity = '0';
                menu.style.pointerEvents = 'none';
            }
            if (difficultyLayer) {
                difficultyLayer.style.display = 'none';
            }
            if (gameScreen) {
                gameScreen.style.display = 'block';
                gameScreen.style.opacity = '1';
            }

            // 设置场景
            this.sceneManager.currentSceneId = chapterId;
            
            // 隐藏加载进度条
            this.renderer.hideLoading();
            
            // 开始游戏
            this.next();

            this.eventSystem.emit('game:chapterStart', chapterId);
        } catch (error) {
            console.error('Failed to start from chapter:', error);
            this.renderer.hideLoading();
        }
    }

    // 解锁当前章节（在场景切换时调用）
    unlockCurrentChapter() {
        const currentSceneId = this.sceneManager.currentSceneId;
        if (currentSceneId) {
            const unlocked = this.chapterTracker.unlockChapter(currentSceneId);
            if (unlocked) {
                this.eventSystem.emit('chapter:unlocked', currentSceneId);
            }
        }
    }
}

// 初始化引擎
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Engine();
});
