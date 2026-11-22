const message=document.getElementById('recovery-message');
for(const [id,name]of [['reload','reload-screen'],['retry','restart'],['folder','folder'],['exit','exit']])document.getElementById(id).addEventListener('click',async()=>{try{if(!window.server?.[name])throw Error('পর্দার সংযোগ চালু হয়নি। Task Manager থেকে অ্যাপ বন্ধ করে আবার খুলুন।');const result=await window.server[name]();if(!result.ok)throw Error(result.error);message.textContent='সম্পন্ন হয়েছে।';}catch(error){message.textContent=error.message;}});
if(!window.server)message.textContent='পর্দার সংযোগ চালু হয়নি। Task Manager থেকে অ্যাপ বন্ধ করে আবার খুলুন।';else window.server.status().then(result=>{message.textContent=result.ok?(result.value.message||'আগের সেটআপ প্রস্তুত আছে।'):result.error;}).catch(()=>{message.textContent='আবার চেষ্টা করুন অথবা বর্তমান সংস্করণ পুনরায় ইনস্টল করুন।';});

setInterval(()=>{void window.server?.['screen-alive']?.().catch(()=>{});},2000);
