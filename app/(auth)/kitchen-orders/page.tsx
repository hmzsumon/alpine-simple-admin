import {redirect} from 'next/navigation';import {currentUser} from '@/lib/server/api';import KitchenSlipHistory from '@/components/kitchen/KitchenSlipHistory';
export default async function Page(){const user=await currentUser();if(!user||!['owner','admin'].includes(user.role)||!user.permissions.includes('orders:read'))redirect('/profile');return <KitchenSlipHistory/>;}
