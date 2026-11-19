/* ── Authenticated, standalone A4 item-code reference ── */
import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/server/api';
import MenuCodePrint from '@/components/menu/MenuCodePrint';
export default async function Page(){const user=await currentUser();if(!user)redirect('/login');if(!user.permissions.includes('menu:read'))redirect('/profile');return <MenuCodePrint/>;}
