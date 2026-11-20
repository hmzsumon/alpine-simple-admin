const {contextBridge,ipcRenderer}=require('electron');
const names=['status','devices','network','scan-network','network-settings','prepare','setup','resume','cancel','open-admin','autostart','firewall','backup','folder'];
contextBridge.exposeInMainWorld('server',Object.fromEntries(names.map(name=>[name,(...args)=>ipcRenderer.invoke('server:'+name,...args)])));
