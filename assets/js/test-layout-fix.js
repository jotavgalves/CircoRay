export function initTestLayoutFix() {
  if (document.getElementById("cr-test-layout-fix")) return;
  const style = document.createElement("style");
  style.id = "cr-test-layout-fix";
  style.textContent = `
    body:has(#cr-hardcore.open) #cr-hardcore .crhc-wrap{
      padding:0!important;
      gap:0!important;
    }
    body:has(#cr-hardcore.open) #cr-hardcore .crhc-head{
      display:none!important;
    }
    body:has(#cr-hardcore.open) #cr-hardcore .crhc-stage{
      position:relative!important;
      width:100vw!important;
      height:100dvh!important;
      flex:0 0 100dvh!important;
      min-height:100dvh!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
    }
    body:has(#cr-hardcore.open) #cr-hardcore .crhc-result,
    body:has(#cr-hardcore.open) #cr-hardcore .crhc-transition,
    body:has(#cr-hardcore.open) #cr-hardcore .crhc-intro{
      inset:0!important;
      width:100%!important;
      height:100%!important;
      padding:max(24px,env(safe-area-inset-top)) max(24px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(24px,env(safe-area-inset-left))!important;
      display:grid!important;
      place-items:center!important;
      text-align:center!important;
    }
    body:has(#cr-hardcore.open) #cr-hardcore .crhc-result > div,
    body:has(#cr-hardcore.open) #cr-hardcore .crhc-transition > div,
    body:has(#cr-hardcore.open) #cr-hardcore .crhc-intro > div{
      width:min(720px,92vw)!important;
      margin:0 auto!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
    }
    body:has(#cr-hardcore.open) #cr-hardcore .crhc-result h2,
    body:has(#cr-hardcore.open) #cr-hardcore .crhc-result p{
      margin-left:auto!important;
      margin-right:auto!important;
      text-align:center!important;
    }
  `;
  document.head.appendChild(style);
}
