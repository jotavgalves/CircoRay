import { isAuthenticated, json } from "../../_shared/auth.js";
const KEY='analytics:v1';
async function auth(request,env){return Boolean(env.SESSION_SECRET)&&await isAuthenticated(request,env.SESSION_SECRET)}
export async function onRequestGet({request,env}){if(!await auth(request,env))return json({error:'Não autorizado.'},401);let data={};try{data=await env.CONFIG_KV?.get(KEY,'json')||{}}catch{}return json({ok:true,data,storageReady:Boolean(env.CONFIG_KV)})}
export async function onRequestDelete({request,env}){if(!await auth(request,env))return json({error:'Não autorizado.'},401);if(!env.CONFIG_KV)return json({error:'KV indisponível.'},503);await env.CONFIG_KV.delete(KEY);return json({ok:true})}
