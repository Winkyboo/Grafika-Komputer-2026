(() => {
  const style = document.createElement('style');
  style.textContent = `
    .canvas-fullscreen-stage { position: relative; }
    .canvas-fullscreen-button {
      position: absolute; right: auto; bottom: 10px; left: 10px; z-index: 20;
      display: inline-flex; align-items: center; gap: 7px;
      width: auto !important; min-height: 0; margin: 0 !important;
      padding: 8px 11px; border: 1px solid #ffffff45; border-radius: 8px;
      background: #101923eF; color: #f3f7fb; font: 700 12px/1.1 system-ui, sans-serif;
      cursor: pointer; box-shadow: 0 4px 16px #0006; backdrop-filter: blur(8px);
    }
    .canvas-fullscreen-button:hover { background: #243747; }
    .canvas-fullscreen-button:focus-visible { outline: 2px solid #7de3f3; outline-offset: 2px; }
    .canvas-fullscreen-stage:fullscreen {
      position: fixed !important; inset: 0 !important; z-index: 2147483647 !important;
      display: grid !important; place-items: center !important;
      width: 100vw !important; height: 100vh !important; max-width: none !important;
      max-height: none !important; margin: 0 !important; padding: 0 !important;
      overflow: hidden !important; border: 0 !important; border-radius: 0 !important;
      background: #070b12 !important;
    }
    .canvas-fullscreen-stage:fullscreen > canvas {
      display: block; max-width: 100vw !important; max-height: 100vh !important;
      object-fit: contain;
    }
    .canvas-fullscreen-stage:fullscreen:not([data-fullscreen-fill]) > canvas {
      width: min(100vw, calc(100vh * var(--fullscreen-ratio, 1.5))) !important;
      height: auto !important;
    }
    .canvas-fullscreen-stage:fullscreen[data-fullscreen-fill] > canvas {
      width: 100% !important; height: 100% !important;
    }
    .canvas-fullscreen-stage:fullscreen > .canvas-fullscreen-button { bottom: 18px; left: 18px; }
    body.canvas-fullscreen-stage:fullscreen > canvas {
      position: absolute; inset: 0; width: 100vw !important; height: 100vh !important;
      max-width: none !important; max-height: none !important;
    }
  `;
  document.head.append(style);

  const registered = new WeakSet();
  const register = (stage) => {
    if (!stage || registered.has(stage)) return;
    const canvas = stage.querySelector('canvas');
    if (!canvas) return;
    registered.add(stage);
    stage.classList.add('canvas-fullscreen-stage');
    const width = Number(canvas.getAttribute('width')) || canvas.width || 1;
    const height = Number(canvas.getAttribute('height')) || canvas.height || 1;
    stage.style.setProperty('--fullscreen-ratio', String(width / height));
    if (stage.matches('.viewport, #canvasWrap')) stage.dataset.fullscreenFill = '';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'canvas-fullscreen-button';
    button.setAttribute('aria-label', 'Tampilkan canvas layar penuh');
    button.textContent = '⛶ Layar penuh';
    button.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement === stage) await document.exitFullscreen();
        else await stage.requestFullscreen();
      } catch (error) {
        console.error('Fullscreen tidak dapat dibuka:', error);
      }
    });
    stage.append(button);
  };

  const observe = (stage) => {
    register(stage);
    if (!stage.querySelector('canvas')) {
      const observer = new MutationObserver(() => {
        register(stage);
        if (registered.has(stage)) observer.disconnect();
      });
      observer.observe(stage, { childList: true, subtree: true });
    }
  };

  const scan = (root) => {
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (root.matches('.canvas-wrap, .viewport, #canvasWrap')) observe(root);
    root.querySelectorAll('.canvas-wrap, .viewport, #canvasWrap').forEach(observe);
    if (root.matches('canvas') && !root.closest('.canvas-wrap, .viewport, #canvasWrap')) observe(document.body);
    root.querySelectorAll('canvas').forEach((canvas) => {
      if (!canvas.closest('.canvas-wrap, .viewport, #canvasWrap')) observe(document.body);
    });
  };
  scan(document.documentElement);
  new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach(scan)))
    .observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener('fullscreenchange', () => {
    document.querySelectorAll('.canvas-fullscreen-stage').forEach((stage) => {
      const button = stage.querySelector('.canvas-fullscreen-button');
      if (!button) return;
      const active = document.fullscreenElement === stage;
      button.textContent = active ? '× Keluar fullscreen' : '⛶ Layar penuh';
      button.setAttribute('aria-label', active ? 'Keluar dari layar penuh' : 'Tampilkan canvas layar penuh');
    });
    window.dispatchEvent(new Event('resize'));
  });
})();
