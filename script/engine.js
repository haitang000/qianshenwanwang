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
            loadingText: document.querySelector('.loading-text')
        };
    }

    // 渲染加载进度条
    renderLoadingProgress(progress, text = '加载中...') {
        if (this.elements.loadingProgress && this.elements.loadingPercentage) {
            const percent = Math.min(100, Math.max(0, progress));
            this.elements.loadingProgress.style.width = `${percent}%`;
            this.elements.loadingPercentage.textContent = `${percent}%`;
        }
        if (this.elements.loadingText) {
            this.elements.loadingText.textContent = text;
        }
    }

    // 显示加载进度条
    showLoading() {
        if (this.elements.loadingLayer) {
            this.elements.loadingLayer.style.display = 'flex';
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
            this.elements.dialogBox.style.borderLeftColor = charData.theme;
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

        this.elements.nameEl.innerText = name || "";
        this.elements.textEl.innerText = "";

        let i = 0;
        const timer = setInterval(() => {
            this.elements.textEl.innerText += text[i++];
            if (i >= text.length) {
                clearInterval(timer);
                if (onComplete) onComplete();
            }
        }, 40);

        return timer;
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
                img.onload = () => {
                    this.cache.set(url, img);
                    this.loadingQueue.delete(url);
                    this.loadedResources++;
                    this.updateProgress();
                    resolve(img);
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
            // TODO: 收集角色图片资源
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

        // 内部状态
        this.typing = false;
        this.typingTimer = null;
        this.isLocked = false;
        this.characters = CHARACTERS;

        // 初始化
        this.init();

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
        if (this.isLocked) return;

        this.performanceMonitor.startTimer('stepTime');

        try {
            // 如果正在打字，直接完成打字
            if (this.typing) {
                this.finishType();
                return;
            }

            const step = this.sceneManager.getNextStep();
            if (!step) {
                // 场景结束
                this.eventSystem.emit('scene:end', this.sceneManager.currentSceneId);
                return;
            }

            await this.renderStep(step);
            this.eventSystem.emit('step:rendered', step);

        } catch (error) {
            console.error('Error in next():', error);
            this.renderer.hideLoading(); // 确保加载进度条隐藏
            this.eventSystem.emit('engine:error', error);
        } finally {
            const stepTime = this.performanceMonitor.endTimer('stepTime');
            this.performanceMonitor.addMetric('stepTime', stepTime);
        }
    }

    async renderStep(step) {
        this.performanceMonitor.startTimer('renderTime');

        try {
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
            
            this.eventSystem.emit('choice:selected', choice);
        });
    }

    async handleSceneTransition(nextSceneId) {
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

    handleDialogue(step) {
        const charData = this.characters[step.name];
        
        // 渲染角色
        this.renderer.renderCharacter(step, charData);
        
        // 渲染对话（打字效果）
        this.typing = true;
        this.typingTimer = this.renderer.renderTypingEffect(
            step.text,
            step.name,
            () => this.finishType()
        );
    }

    finishType() {
        if (this.typingTimer) {
            clearInterval(this.typingTimer);
            this.typingTimer = null;
        }
        this.typing = false;
        this.eventSystem.emit('typing:finished');
    }

    // 保存游戏
    save() {
        const saveData = {
            state: this.sceneManager.currentSceneId,
            index: this.sceneManager.currentIndex
        };
        
        localStorage.setItem('grace_save', JSON.stringify(saveData));
        
        // 显示保存提示
        const box = document.getElementById('dialog-box');
        if (box) {
            box.style.background = 'rgba(255,255,255,0.2)';
            setTimeout(() => box.style.background = 'var(--theme-glass)', 200);
        }
        
        this.eventSystem.emit('game:saved', saveData);
    }

    // 加载游戏
    async load() {
        const raw = localStorage.getItem('grace_save');
        if (!raw) {
            // 处理加载失败
            const subtitle = document.querySelector('.game-over-subtitle');
            if (subtitle) {
                subtitle.innerHTML = '我说了Coming Soon你尔多隆吗';
            }
            this.death();
            return;
        }

        try {
            const saveData = JSON.parse(raw);
            
            // 显示加载进度条
            this.renderer.showLoading();
            
            // 预加载保存点所在场景的资源
            const sceneId = saveData.state;
            const scene = this.data[sceneId];
            if (scene) {
                await this.preloadSceneResources(scene, '加载游戏数据...');
            }
            
            this.sceneManager.setCurrentState(saveData.state, saveData.index);
            this.start();
            this.eventSystem.emit('game:loaded', saveData);
            
            // 隐藏加载进度条
            this.renderer.hideLoading();
        } catch (error) {
            console.error('Error loading game:', error);
            this.renderer.hideLoading();
            this.death();
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
}

// 初始化引擎
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Engine();
});
