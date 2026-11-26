/* ── Distinct app identities; generated from vector geometry, not recolored restaurant marks. ── */
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),cli=path.join(root,'management-desktop/node_modules/@tauri-apps/cli/tauri.js');
const icons={
 management:{color:'#6941C6',dark:'#43248C',label:'ADMIN',shape:'<rect x="124" y="122" width="110" height="110" rx="19"/><rect x="266" y="122" width="122" height="64" rx="17"/><rect x="266" y="215" width="122" height="114" rx="19"/><rect x="124" y="264" width="110" height="65" rx="17"/>'},
 server:{color:'#087F73',dark:'#07564F',label:'SERVER',shape:'<rect x="114" y="120" width="284" height="84" rx="20" fill="none" stroke="white" stroke-width="18"/><rect x="114" y="232" width="284" height="84" rx="20" fill="none" stroke="white" stroke-width="18"/><circle cx="153" cy="162" r="12"/><circle cx="153" cy="274" r="12"/><path d="M207 162h141M207 274h141" stroke="white" stroke-width="13" stroke-linecap="round"/>'},
 counter:{color:'#2563EB',dark:'#173E9C',label:'COUNTER',shape:'<path d="M158 108h190v229l-24-15-24 15-24-15-24 15-24-15-24 15-23-15-23 15Z" fill="none" stroke="white" stroke-width="18" stroke-linejoin="round"/><path d="M202 159h104M202 201h104M202 243h49" stroke="white" stroke-width="15" stroke-linecap="round"/><circle cx="297" cy="275" r="23" fill="white"/>'},
 waiter:{color:'#D58A13',dark:'#8C5708',label:'WAITER',shape:'<path d="M111 280h290M133 257a123 123 0 0 1 246 0Z" fill="none" stroke="white" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/><circle cx="256" cy="116" r="13"/><path d="M180 322h152" stroke="white" stroke-width="16" stroke-linecap="round"/>'}
};
for(const [name,{color,dark,label,shape}]of Object.entries(icons)){
 const folder=path.join(root,'public/app-icons',name);fs.mkdirSync(folder,{recursive:true});
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x2=".9" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs><rect width="512" height="512" rx="104" fill="url(#g)"/><path d="M68 58h376" stroke="white" stroke-opacity=".14" stroke-width="3"/><g fill="white">${shape}</g><text x="256" y="417" text-anchor="middle" fill="white" font-family="Segoe UI,Arial,sans-serif" font-weight="700" font-size="34" letter-spacing="5">${label}</text></svg>`;
 const source=path.join(folder,'source.svg');fs.writeFileSync(source,svg);execFileSync(process.execPath,[cli,'icon',source,'-o',folder],{cwd:root,stdio:'pipe',windowsHide:true});
 for(const entry of fs.readdirSync(folder)){if(['source.svg','icon.png','icon.ico','32x32.png','128x128.png','128x128@2x.png'].includes(entry))continue;const target=path.join(folder,entry);if(!target.startsWith(folder+path.sep))throw Error('Invalid generated icon path');fs.rmSync(target,{recursive:true,force:true});}
 console.log('Generated distinct '+label+' icon');
}
for(const file of ['32x32.png','128x128.png','128x128@2x.png','icon.ico'])fs.copyFileSync(path.join(root,'public/app-icons/management',file),path.join(root,'management-desktop/src-tauri/icons',file));
fs.copyFileSync(path.join(root,'public/app-icons/management/icon.png'),path.join(root,'management-desktop/public/management-icon.png'));
