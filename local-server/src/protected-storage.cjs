/* Windows account protection independent of Chromium's disposable UI cache. */
const fs=require('node:fs'),{spawnSync}=require('node:child_process');
const prefix=Buffer.from('ALPINE_DPAPI_1\0');
function protectedStorage(legacy,host){
 if(process.platform!=='win32')return legacy;
 function call(operation,input){const result=spawnSync(host,[operation],{input,encoding:'utf8',windowsHide:true,timeout:15000,maxBuffer:1024*1024});if(result.error||result.status!==0)throw Error('Windows account protection is unavailable. Use the original Windows account and retry.');return result.stdout;}
 return {isEncryptionAvailable:()=>fs.existsSync(host),encryptString:value=>Buffer.concat([prefix,Buffer.from(call('--protect-settings',value),'base64')]),decryptString:bytes=>bytes.subarray(0,prefix.length).equals(prefix)?call('--unprotect-settings',bytes.subarray(prefix.length).toString('base64')):legacy.decryptString(bytes)};
}
module.exports={protectedStorage};
