export function apiOrigin(){return (process.env.API_URL||"http://127.0.0.1:5100").replace(/\/$/,"");}
