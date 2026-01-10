// 性能测试脚本
// 用于测试优化前后的引擎性能差异

class PerformanceTest {
    constructor() {
        this.testResults = [];
        this.startTime = 0;
    }

    // 开始测试
    startTest(testName) {
        this.startTime = performance.now();
        console.log(`=== Starting test: ${testName} ===`);
    }

    // 结束测试
    endTest(testName) {
        const endTime = performance.now();
        const duration = endTime - this.startTime;
        this.testResults.push({ name: testName, duration });
        console.log(`=== Test ${testName} completed in ${duration.toFixed(2)}ms ===`);
        return duration;
    }

    // 运行所有测试
    runAllTests() {
        console.log('=== Running all performance tests ===');
        this.testResults = [];

        // 测试场景加载
        this.testSceneLoading();

        // 测试渲染性能
        this.testRenderPerformance();

        // 测试事件处理
        this.testEventHandling();

        // 测试资源加载
        this.testResourceLoading();

        // 输出测试结果
        this.printResults();
    }

    // 测试场景加载性能
    testSceneLoading() {
        this.startTest('Scene Loading');
        
        // 模拟加载多个场景
        for (let i = 0; i < 100; i++) {
            game.sceneManager.loadScene('intro');
            game.sceneManager.loadScene('chapter2_start');
            game.sceneManager.loadScene('chapter3_start');
        }
        
        this.endTest('Scene Loading');
    }

    // 测试渲染性能
    testRenderPerformance() {
        this.startTest('Render Performance');
        
        // 准备测试数据
        const testStep = {
            bg: 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&w=1920&q=80',
            name: '系统',
            text: '这是一条测试文本，用于测试渲染性能。' + 'x'.repeat(100)
        };
        
        // 模拟渲染多个步骤
        for (let i = 0; i < 50; i++) {
            game.renderer.renderBackground(testStep.bg);
            game.renderer.renderDialogue(testStep.text, testStep.name);
        }
        
        this.endTest('Render Performance');
    }

    // 测试事件处理性能
    testEventHandling() {
        this.startTest('Event Handling');
        
        // 注册多个事件监听器
        const listeners = [];
        for (let i = 0; i < 100; i++) {
            const listener = () => {};
            game.eventSystem.on('test:event', listener);
            listeners.push(listener);
        }
        
        // 触发事件多次
        for (let i = 0; i < 1000; i++) {
            game.eventSystem.emit('test:event', i);
        }
        
        // 清理事件监听器
        listeners.forEach(listener => {
            game.eventSystem.off('test:event', listener);
        });
        
        this.endTest('Event Handling');
    }

    // 测试资源加载性能
    testResourceLoading() {
        this.startTest('Resource Loading');
        
        // 测试资源预加载
        const testImages = [
            'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&w=1920&q=80',
            'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1920&q=80'
        ];
        
        // 并行加载所有图片
        const promises = testImages.map(img => game.resourceManager.preloadImage(img));
        
        Promise.all(promises).then(() => {
            this.endTest('Resource Loading');
        }).catch(error => {
            console.error('Resource loading test failed:', error);
            this.endTest('Resource Loading');
        });
    }

    // 打印测试结果
    printResults() {
        console.log('\n=== Performance Test Results ===');
        this.testResults.forEach(result => {
            console.log(`${result.name}: ${result.duration.toFixed(2)}ms`);
        });
        
        // 计算平均值
        const totalDuration = this.testResults.reduce((sum, result) => sum + result.duration, 0);
        const avgDuration = totalDuration / this.testResults.length;
        console.log(`\nAverage duration: ${avgDuration.toFixed(2)}ms`);
        
        // 与基准值比较
        this.compareWithBaseline();
    }

    // 与基准值比较
    compareWithBaseline() {
        // 基准值（优化前的估计值）
        const baseline = {
            'Scene Loading': 100,
            'Render Performance': 200,
            'Event Handling': 50,
            'Resource Loading': 1000
        };
        
        console.log('\n=== Comparison with Baseline ===');
        this.testResults.forEach(result => {
            const baselineValue = baseline[result.name] || 0;
            const improvement = ((baselineValue - result.duration) / baselineValue * 100).toFixed(1);
            console.log(`${result.name}: ${result.duration.toFixed(2)}ms vs ${baselineValue}ms (${improvement}% improvement)`);
        });
    }
}

// 初始化测试
window.addEventListener('DOMContentLoaded', () => {
    // 等待引擎加载完成
    setTimeout(() => {
        if (window.game) {
            window.performanceTest = new PerformanceTest();
            console.log('Performance test initialized. Use window.performanceTest.runAllTests() to run tests.');
        } else {
            console.error('Game engine not found. Performance test cannot be initialized.');
        }
    }, 1000);
});
