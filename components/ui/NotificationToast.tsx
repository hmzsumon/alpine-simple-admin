/* ────────── bridge workspace messages into the shared toast stack ────────── */
"use client";
import {useEffect} from "react";
import {useAdminContext} from "@/context/AdminContext";
import {notify} from "@/lib/feedback";
export default function NotificationToast(){const {notice,setNotice}=useAdminContext();useEffect(()=>{if(notice){notify(notice,"info");setNotice("");}},[notice,setNotice]);return null;}
