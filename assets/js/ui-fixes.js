export function initUiFixes(config = {}) {
  if (window.__circorayUiFixesLoaded) return;
  window.__circorayUiFixesLoaded = true;

  const style = document.createElement('style');
  style.textContent = `
    /* Angry state: keep the clown in the exact same base pose/box. */
    .clown-img.cr-angry-pose,
    .clown-wrap.cr-angry-pose .clown-img{
      object-fit:contain!important;
      object-position:center bottom!important;
      transform:none!important;
      transform-origin:center bottom!important;
    }

    /* Wheel labels: keep every label upright, compact and centered inside its slice. */
    .wheel .slice-label{
      width:82px!important;
      margin-left:-41px!important;
      font-size:10px!important;
      line-height:1.05!important;
      white-space:normal!important;
      text-wrap:balance;
      letter-spacing:-.02em!important;
      transform-origin:50% 0!important;
      z-index:3!important;
    }
    .wheel .slice-label span,
    .wheel .slice-label b{
      display:block!important;
      transform:none!important;
      writing-mode:horizontal-tb!important;
    }

    @media(max-width:600px){
      .wheel .slice-label{width:74px!important;margin-left:-37px!important;font-size:9px!important;line-height:1.02!important}
    }
  `;
  document.head.appendChild(style);

  function normalizeWheelLabels() {
    const labels = [...document.querySelectorAll('.wheel .slice-label')];
    if (!labels.length) return;
    const canonical = ['TICKET','VOLTE AO INÍCIO','TENTE DE NOVO','TICKET','VOLTE AO INÍCIO','TENTE DE NOVO'];
    labels.slice(0, 6).forEach((label, index) => {
      label.textContent = canonical[index];
      // Existing geometry places labels radially. Counter-rotate only the text so it remains readable.
      const inline = label.style.transform || '';
      const rotate = inline.match(/rotate\(([-\d.]+)deg\)/i);
      if (rotate) {
        const deg = Number(rotate[1]) || 0;
        const translate = inline.replace(/rotate\([^)]*\)/i, '').trim();
        label.style.transform = `${translate} rotate(${deg}deg)`;
        label.dataset.crWheelAngle = String(deg);
        let inner = label.querySelector(':scope > .cr-wheel-text');
        if (!inner) {
          inner = document.createElement('span');
          inner.className = 'cr-wheel-text';
          inner.textContent = canonical[index];
          label.textContent = '';
          label.appendChild(inner);
        }
        inner.style.transform = `rotate(${-deg}deg)`;
        inner.style.transformOrigin = 'center';
      }
    });
  }

  normalizeWheelLabels();
  const observer = new MutationObserver(normalizeWheelLabels);
  observer.observe(document.body, { childList:true, subtree:true });

  // Expose for the wheel renderer if it rebuilds labels after a spin/config update.
  window.CIRCO_FIX_WHEEL_LABELS = normalizeWheelLabels;
}
