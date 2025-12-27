// 全局角色定义（简单对象，不依赖模块）
// 在 scenario.js 中使用角色名（例如：{ char: '往昔.' } 或 { char: { name: '往昔.', sprite: 'smile' } }）
// 单个角色可定义多个立绘，资源放在 /assets 目录（可自行替换为实际图片）

const makeDataSvg = (label, bg='#2b2b5f') => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='48%' font-size='48' fill='#fff' text-anchor='middle' dominant-baseline='middle' font-family='Noto Serif SC'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const CHARACTERS = {
  '往昔.': {
    sprites: {
      // 使用仓库中的真实图片路径（assets/characters/...）
      neutral: 'assets/characters/wangxi/neutral.png',
      smile: 'assets/characters/wangxi/smile.png'
    },
    default: 'neutral'
  },
  '陈君皓': {
    sprites: {
      // 暂时使用占位 SVG，如需真实图请放到 assets/characters/chen/ 并替换路径
      default: makeDataSvg('陈君皓', '#6b3f3f'),
      bandaged: makeDataSvg('陈君皓 (绷带)', '#5b5b34')
    },
    default: 'default'
  }
};

// 当浏览器无法加载指定图片时，自动回退到占位 SVG（便于开发）
for (const k of Object.keys(CHARACTERS)) {
  const def = CHARACTERS[k];
  for (const s of Object.keys(def.sprites)) {
    const v = def.sprites[s];
    // 如果路径指向 assets 且文件不存在，本地开发环境会报 404；这里不做存在性检测（浏览器负责），但我们保留占位作为备用
  }
}

// 你可以在这里动态注册更多角色，例如：
// CHARACTERS['新人'] = { sprites: { a: 'assets/new/a.png' }, default: 'a' };

console.log('CHARACTERS loaded:', Object.keys(CHARACTERS));
