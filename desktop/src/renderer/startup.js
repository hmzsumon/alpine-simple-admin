/* Standalone recovery remains available even when the application bundle cannot load. */
(() => {
 const root=document.getElementById('root');
 const refresh=document.getElementById('startup-refresh');
 if(refresh)refresh.addEventListener('click',()=>window.location.reload());
 const show=()=>{const card=document.getElementById('startup-card');if(card){document.getElementById('startup-status').textContent='The screen could not start. Refresh to retry. Your saved orders and records are retained.';refresh.hidden=false;}};
 window.addEventListener('error',event=>{if(event.target instanceof HTMLScriptElement||!root.textContent.trim())show();},true);
 setTimeout(show,15000);
})();
