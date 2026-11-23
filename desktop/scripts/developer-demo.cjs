/* Developer entry point only: production sign-in does not expose the demo. */
const {spawn}=require('node:child_process'),path=require('node:path');
const electron=require('electron');
const child=spawn(electron,[path.resolve(__dirname,'..'),'--lan-demo'],{stdio:'inherit',windowsHide:true});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});child.on('exit',code=>{process.exitCode=code||0;});
