const {contextBridge,ipcRenderer}=require('electron');
const names=['status','devices','network','scan-network','network-settings','prepare','setup','resume','cancel','open-admin','autostart','firewall','backup','folder','restart','exit','reload-screen','copy-address','screen-alive'];
contextBridge.exposeInMainWorld('server',Object.fromEntries(names.map(name=>[name,(...args)=>ipcRenderer.invoke('server:'+name,...args)])));
