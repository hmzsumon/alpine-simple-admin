/* ── Independent of the business workspace so offline/preparing servers remain recoverable. ── */
import {redirect} from 'next/navigation';import {currentUser} from '@/lib/server/api';import ServerControl from '@/components/server/ServerControl';
export const dynamic='force-dynamic';export const metadata={title:'Cloud server control · Alpine',robots:{index:false,follow:false}};
export default async function ServerControlPage(){const user=await currentUser();if(!user)redirect('/login');if(user.role!=='owner')redirect('/profile');return <ServerControl owner={user.name}/>;}
