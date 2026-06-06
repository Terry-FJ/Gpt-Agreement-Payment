window.addEventListener('DOMContentLoaded',()=>{
const PRIMARY_API=['https://api.987ai.vip/api','https://api.jisuai.xyz/proxy/primary/api'];
const NEW_API=['https://api.jisuai.xyz/proxy/new/api','https://kkk.ow800.com/api'];
const REDEEM_API='https://api.jisuai.xyz';
const MANAGED_API='';
const DEFAULT_PRODUCT_ID=3;
const $=id=>document.getElementById(id);
const zh={title:'AI Plus 充值平台',subtitle:'专业、正规、安全、快捷',cardLabel:'验证卡密',cardPlaceholder:'请输入卡密',cardVerified:'已验证卡密',redeemDetected:'已识别兑换码',cardPrefix:'卡密:',flowStepOne:'第一步:',flowStepTwo:'第二步:',loginBtn:'点击登录GPT',credentialBtn:'点我获取充值秘钥',rechargeWarning:'如果返回内容是空的，则登录不成功，请重新登录',tokenLabel:'第三步：输入充值秘钥',tokenPlaceholder:'请将上方返回的完整 JSON 复制至此处，也兼容单独粘贴 token',confirmInfoTitle:'确认充值信息',confirmEmailLabel:'账户邮箱:',confirmCardLabel:'卡密:',confirmChannelLabel:'充值通道:',confirmPlanLabel:'当前订阅:',statusLabel:'任务状态',waitingSubmit:'等待提交',btnBack:'返回',btnVerify:'验证卡密',btnParse:'核对账户',btnRedeemVerify:'验证兑换码',btnConfirm:'确认充值',btnSuccess:'充值成功',btnRetry:'重新提交',channelAuto:'自动识别',channelPrimary:'GPT通道1',channelNew:'GPT通道2',channelRedeem:'GPT通道3'};
const en={...zh,title:'AI Plus Recharge Platform',subtitle:'Professional · Compliant · Safe · Fast',cardLabel:'Verify card key',cardPlaceholder:'Enter card key',cardVerified:'Verified card key',redeemDetected:'Redeem code detected',credentialBtn:'Get recharge key',tokenLabel:'Step 3: Enter recharge key',btnVerify:'Verify card key',btnParse:'Check account',btnRedeemVerify:'Verify redeem code',btnBack:'Back',btnConfirm:'Confirm recharge',btnSuccess:'Recharge successful',channelAuto:'Auto detect',channelPrimary:'GPT Channel 1',channelNew:'GPT Channel 2',channelRedeem:'GPT Channel 3'};
const i18n={'zh-CN':zh,en};
const els={app:document.querySelector('.app-card'),menu:$('languageMenu'),trigger:$('languageTrigger'),code:$('currentLangCode'),name:$('currentLangName'),pane1:$('pane1'),pane2:$('pane2'),pane3:$('pane3'),card:$('cardKey'),token:$('tokenBox'),verified:$('verifiedCardValue'),verifiedTitle:document.querySelector('.verified-title b'),back:$('backBtn'),next:$('nextBtn'),btn:$('btnText'),sumMail:$('sumMail'),sumCard:$('confirmCardKey'),sumChannel:$('sumChannel'),sumPlan:$('sumPlan'),sumStat:$('sumStat'),overridePanel:$('overridePanel'),forceRecharge:$('forceRecharge'),log:$('logArea'),toasts:$('toastCenter')};
let state={step:1,lang:localStorage.getItem('lav_lang')||'zh-CN',cardOk:false,channel:'',channelName:'',productId:DEFAULT_PRODUCT_ID,email:'',planType:'',accessToken:'',fullAuthData:'',platformCredential:null,tid:'',busy:false,pollTimer:null,forceRecharge:false,reuseEmail:''};
function t(k){return i18n[state.lang]?.[k]||zh[k]||k}
function setText(el,v){if(el)el.textContent=v}
function notify(msg){let d=document.createElement('div');d.className='toast-pill';d.textContent=translateError(msg)||'操作提示';els.toasts.appendChild(d);setTimeout(()=>d.remove(),3500)}
function translateError(msg){let m=String(msg||'').trim();return ({CARD_VERIFICATION_SUCCESS:'卡密识别成功',CARD_NOT_FOUND:'卡密不存在',CARD_ALREADY_USED:'卡密已使用',CARD_DISABLED:'卡密已禁用',CARD_EXPIRED:'卡密已过期',CARD_INVALID:'卡密无效',INVALID_CARD:'卡密无效',INVALID_CDK_FORMAT:'卡密格式无效',CDK_NOT_FOUND:'兑换码不存在',CDK_ALREADY_USED:'兑换码已使用',CDK_DISABLED:'兑换码已禁用',ACCOUNT_INVALID:'账号校验失败',ACCOUNT_VERIFICATION_FAILED:'账号校验服务异常',NO_AVAILABLE_CREDENTIAL:'暂无可用兑换资源',RECHARGE_FAILED:'兑换执行失败',CONFIRM_REQUIRED:'缺少确认标志',NETWORK_ERROR:'网络异常',TIMEOUT:'请求超时',UNKNOWN_ERROR:'未知错误'}[m]||m)}
function log(msg){let tm=new Date().toLocaleTimeString();els.log.insertAdjacentHTML('beforeend',`<div><b>[${tm}]</b> ${String(msg).replace(/[<>]/g,'')}</div>`);els.log.scrollTop=els.log.scrollHeight}
function sync(){
 if(els.app)els.app.dataset.step=String(state.step);
 [els.pane1,els.pane2,els.pane3].forEach((p,i)=>p.classList.toggle('hidden',i!==state.step-1));
 document.querySelectorAll('.step').forEach((s,i)=>{s.classList.toggle('active',i===state.step-1);s.classList.toggle('done',i<state.step-1)});
 els.back.hidden=state.step===1;
 if(state.step===1){els.next.disabled=false;setText(els.btn,state.cardOk?'继续下一步':t('btnVerify'))}
 if(state.step===2){els.next.disabled=false;setText(els.btn,state.channel==='redeem'?t('btnRedeemVerify'):t('btnParse'));setText(els.verifiedTitle,state.channel==='redeem'?t('redeemDetected'):t('cardVerified'));setText(els.verified,els.card.value.trim()||'--')}
 if(state.step===3){let active=hasActivePlan(state.planType);setText(els.btn,state.tid&&state.channel!=='redeem'?'恢复监控':t('btnConfirm'));setText(els.sumMail,state.email||'未识别');setText(els.sumCard,els.card.value.trim()||'--');setText(els.sumChannel,state.channelName||t('channelAuto'));setText(els.sumPlan,state.planType||'--');if(els.overridePanel)els.overridePanel.classList.toggle('hidden',!active);if(els.forceRecharge)els.forceRecharge.checked=state.forceRecharge;if(!state.tid)setText(els.sumStat,t('waitingSubmit'))}
}
function enterStep2(card,msg){
 state.cardOk=true;
 state.step=2;
 els.next.disabled=false;
 setText(els.verified,card);
 sync();
 if(msg)notify(msg);
}
function resetAfterSuccess(){clearInterval(state.pollTimer);els.card.value='';els.token.value='';els.log.innerHTML='';if(els.forceRecharge)els.forceRecharge.checked=false;Object.assign(state,{step:1,cardOk:false,channel:'',channelName:'',productId:DEFAULT_PRODUCT_ID,email:'',planType:'',accessToken:'',fullAuthData:'',platformCredential:null,tid:'',busy:false,pollTimer:null,forceRecharge:false,reuseEmail:''});sync()}

function applyLang(){
 document.documentElement.lang=state.lang;document.title=t('title');setText(els.code,state.lang==='en'?'US':'CN');setText(els.name,state.lang==='en'?'English':'中文');
 document.querySelectorAll('[data-i18n]').forEach(n=>setText(n,t(n.dataset.i18n)));
 document.querySelectorAll('[data-i18n-placeholder]').forEach(n=>n.placeholder=t(n.dataset.i18nPlaceholder));
 if(state.channel==='primary')state.channelName=t('channelPrimary');if(state.channel==='new')state.channelName=t('channelNew');if(state.channel==='redeem')state.channelName=t('channelRedeem');if(state.channel==='managed')state.channelName='自有卡密';sync()
}
async function call(base,path,method='GET',body=null){let bases=Array.isArray(base)?base:[base],last='';for(let i=0;i<bases.length;i++){let url=bases[i]+path,opt={method,headers:{'Content-Type':'application/json'}};if(body)opt.body=JSON.stringify(body);let r,p;try{r=await fetch(url,opt)}catch(e){last='请求失败: '+url;continue}let ct=r.headers.get('content-type')||'';p=ct.includes('json')?await r.json():await r.text();if(r.ok)return p;let msg=typeof p==='object'?(p.error?.message||p.error?.code||p.message||'SERVER_ERROR'):p;if(r.status>=500&&i<bases.length-1){last=msg;continue}throw new Error(msg)}throw new Error(last||'请求失败')}
function pickMsg(r,fb){return translateError(r?.error?.message||r?.error?.code||r?.message||r?.data?.message||r?.error||fb)}
function isRedeemCdk(v){return v.length>=36&&/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(v)}
function isManagedKey(v){return /^JS-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/i.test(v)}
function hasActivePlan(plan){let p=String(plan||'').trim().toLowerCase();return !!p&&!['free','none','unknown','--','null','undefined'].includes(p)}
function isGptProduct(r){let p=String(r?.product_api_type||r?.data?.product_api_type||'gpt').trim().toLowerCase();return !p||p==='gpt'}
function isFinalCardError(msg){let m=String(msg||'');return /已(被)?使用|already.?used|used|已停用|已禁用|disabled|已过期|expired/i.test(m)}
function cardError(msg){let e=new Error(translateError(msg));e.final=isFinalCardError(msg);return e}
function finalCardError(msg){let e=cardError(msg);e.final=true;return e}
async function verifyManaged(card){let r=await call(MANAGED_API,'/api/app/cards/verify','POST',{publicKey:card});if(r?.success!==true)throw cardError(r?.error?.message||'卡密不可用');state.channel='managed';state.channelName='自有卡密';return r}
async function verifyPrimary(card){let r=await call(PRIMARY_API,`/card-keys/${encodeURIComponent(card)}`);if(!isGptProduct(r))throw finalCardError('当前卡密不是 GPT 产品');let reusable=r?.available===false&&String(r?.used_email||'').trim();if(!(r&&r.available===true)&&!reusable)throw cardError(pickMsg(r,'卡密不可用'));state.channel='primary';state.channelName=t('channelPrimary');state.reuseEmail=reusable||'';return r}
async function verifyNew(card){
 let r;
 try{
   r=await call(NEW_API,'/cards/verify','POST',{cardInfo:card});
 }catch(e){
   if(String(e.message||'').trim()==='CARD_VERIFICATION_SUCCESS'){
     state.channel='new';
     state.channelName=t('channelNew');
     state.productId=DEFAULT_PRODUCT_ID;
     return {success:true,message:'CARD_VERIFICATION_SUCCESS'};
   }
   throw cardError(e.message);
 }
 let d=r?.data||{};
 let values=[r?.code,r?.message,r?.status,d?.code,d?.message,d?.status,d?.cardStatus,d?.state].map(v=>String(v||'').trim());
 let lower=values.map(v=>v.toLowerCase());
 let ok=values.includes('CARD_VERIFICATION_SUCCESS')||d?.success===true||d.valid===true||d.available===true||d.usable===true||['unused','valid','available'].some(s=>lower.includes(s));
 if(!ok)throw cardError(pickMsg(r,'卡密不可用'));
 state.channel='new';
 state.channelName=t('channelNew');
 state.productId=Number(d.productId||d.product_id||DEFAULT_PRODUCT_ID)||DEFAULT_PRODUCT_ID;
 return r;
}
async function checkCard(){
 let card=els.card.value.trim();if(!card)return notify('卡密不能为空');els.next.disabled=true;setText(els.btn,'正在自动识别通道...');
 try{if(isManagedKey(card)){await verifyManaged(card);enterStep2(card,'自有卡密可用');return}if(isRedeemCdk(card)){state.channel='redeem';state.channelName=t('channelRedeem');enterStep2(card,'已识别兑换码格式 · '+state.channelName);return}
 let ok=false,last=null;try{await verifyPrimary(card);ok=true}catch(e){last=e;if(e.final)throw e}if(!ok)try{await verifyNew(card);ok=true}catch(e){last=e}if(!ok)throw last||new Error('卡密不可用');enterStep2(card,'卡密识别成功 · '+state.channelName)}
 catch(e){state.cardOk=false;state.channel='';state.channelName='';notify(e.message)}
 finally{els.next.disabled=false;sync()}
}
function parseAuth(raw){raw=raw.trim();if(!raw)return{};let j=null;try{j=JSON.parse(raw)}catch(e){}let wrap=j?.platformCredential||j;let data=wrap?.platform&&wrap?.data?wrap.data:wrap;let token=String(data?.accessToken||data?.access_token||data?.token||raw).trim();return{token,email:String(data?.user?.email||data?.email||data?.account?.email||'').trim(),planType:String(data?.account?.planType||data?.account?.plan_type||'').trim(),data,platformCredential:j?{platform:'chatgpt',data}:null,full:j?raw:JSON.stringify({accessToken:token})}}
function validRedeemData(d){return !!(d&&d.user?.id&&d.user?.email&&d.account?.id&&d.account?.planType&&d.accessToken)}
function redeemMsg(r,fb){return translateError(r?.error?.code||r?.error?.message||r?.data?.error?.code||r?.data?.error?.message||r?.data?.message||r?.message||fb)}
function redeemStatusMsg(status){let s=String(status||'').toLowerCase();return s==='used'?'CDK_ALREADY_USED':s==='disabled'?'CDK_DISABLED':s==='expired'?'CARD_EXPIRED':'兑换码不可用'}
async function recordEmail(source){if(!state.email)return;try{await call(REDEEM_API,'/api/records/email','POST',{email:state.email,key:els.card.value.trim(),channel:state.channel,planType:state.planType,source})}catch(e){}}
async function redeemVerify(card,pc){
 let r=await call(REDEEM_API,'/api/external/redeem/verify','POST',{cdk:card,platformCredential:pc});
 if(r?.success!==true)throw new Error(redeemMsg(r,'兑换码验证失败'));
 let status=String(r?.data?.cdk?.status||'').toLowerCase();
 if(status!=='unused')throw new Error(status?redeemStatusMsg(status):redeemMsg(r,'兑换码不可用'));
 let account=r?.data?.platformResult?.data?.account||{};
 return {email:account.email||pc.data.user.email,planType:account.planType||pc.data.account.planType,raw:r};
}
async function parseStep(){let a=parseAuth(els.token.value);if(!a.token)return notify('请粘贴充值秘钥 JSON 或授权密钥');els.next.disabled=true;setText(els.btn,state.channel==='redeem'?'正在验证兑换码...':'正在同步账号...');try{state.accessToken=a.token;state.fullAuthData=a.full;
 if(state.channel==='managed'){if(!a.email)throw new Error('请粘贴完整认证 JSON，需包含邮箱信息');state.email=a.email;state.planType=a.planType||'--';await call(MANAGED_API,'/api/app/cards/bind-email','POST',{publicKey:els.card.value.trim(),email:state.email});state.step=3;notify('已绑定邮箱，本地演示可确认')}
 else if(state.channel==='redeem'){if(!validRedeemData(a.data))throw new Error('充值秘钥 JSON 缺少 user.id、user.email、account.id、account.planType 或 accessToken');state.platformCredential=a.platformCredential||{platform:'chatgpt',data:a.data};let v=await redeemVerify(els.card.value.trim(),state.platformCredential);state.email=v.email;state.planType=v.planType;await recordEmail('redeem_verify');state.step=3;notify('兑换码可用，请确认兑换')}
 else if(state.channel==='new'){let email=a.email;if(!email){try{let r=await call(PRIMARY_API,'/parse-token','POST',{access_token:a.token});if(r.success)email=r.message||''}catch(e){}}if(!email)throw new Error('请粘贴完整认证 JSON，需包含邮箱信息');state.email=email;state.planType=a.planType||'--';await recordEmail('new_parse');state.step=3;notify('账号同步成功')}
 else{let r=await call(PRIMARY_API,'/parse-token','POST',{access_token:a.token});if(!r.success)throw new Error(r.message||'账号同步失败');state.email=r.message||a.email||state.reuseEmail;state.planType=a.planType||'--';await recordEmail('primary_parse');state.step=3;notify(state.reuseEmail?'已识别 GPT 复用卡密，请确认充值':'账号同步成功')}}
 catch(e){notify(e.message)}finally{els.next.disabled=false;sync()}}
async function redeemConfirm(card,pc){let r=await call(REDEEM_API,'/api/external/redeem/confirm','POST',{cdk:card,confirm:true,platformCredential:pc});if(r?.success!==true||r?.data?.success!==true)throw new Error(redeemMsg(r,'兑换失败'));return r}
async function runTask(){if(state.busy)return;let card=els.card.value.trim(),a=parseAuth(els.token.value),token=state.accessToken||a.token;if(!card)return notify('卡密不能为空');if(!token)return notify('授权密钥不能为空');state.busy=true;els.next.disabled=true;setText(els.btn,'正在提交任务...');log('初始化充值执行协议...');log('已选择充值通道: '+state.channelName);
 try{if(hasActivePlan(state.planType)&&!state.forceRecharge){throw new Error('当前账号已有 Plus 或付费订阅，请勾选确认覆盖充值后再提交')}
 if(state.channel==='managed'){state.tid='managed_demo';state.busy=false;setText(els.sumStat,'本地演示成功');setText(els.btn,'充值成功');els.next.disabled=true;log('自有卡密已绑定邮箱，本地演示流程完成');notify('本地演示完成');setTimeout(resetAfterSuccess,1200);return}
 if(state.channel==='redeem'){let pc=state.platformCredential||a.platformCredential||{platform:'chatgpt',data:a.data};if(!validRedeemData(pc.data))throw new Error('充值秘钥 JSON 缺少必填字段');let r=await redeemConfirm(card,pc);state.tid='redeem_done';state.busy=false;setText(els.sumStat,'充值成功');setText(els.btn,'充值成功');els.next.disabled=true;log('兑换确认成功: '+(r?.data?.message||r?.message||'充值成功'));notify('恭喜！协议执行完毕');setTimeout(resetAfterSuccess,1200);return}
 if(state.channel==='new'){let r=await call(NEW_API,'/cards/verify-gpt','POST',{cardInfo:card,userEmail:state.email,userGptToken:token,fullAuthData:state.fullAuthData,productId:state.productId||DEFAULT_PRODUCT_ID,forceRecharge:state.forceRecharge});state.tid=r?.data?.taskId||r?.taskId;if(!state.tid)throw new Error(pickMsg(r,'未返回任务 ID'))}
 else{let r=await call(PRIMARY_API,'/tasks','POST',{card_key:card,access_token:token,idp:'google',force_recharge:state.forceRecharge});state.tid=r.task_id;if(!state.tid)throw new Error('未返回任务 ID')}
 log('任务协议分发成功: '+state.tid);poll()}catch(e){state.busy=false;els.next.disabled=false;setText(els.btn,t('btnConfirm'));log('执行中断: '+translateError(e.message));notify(e.message);sync();if(state.step===3)setText(els.sumStat,'执行失败')}}
async function readStatus(){if(state.channel==='new'){let r=await call(NEW_API,'/recharge/query-task-status','POST',{taskId:state.tid,productId:state.productId||DEFAULT_PRODUCT_ID,cardInfo:els.card.value.trim()});let s=r?.data?.status||r?.status||'processing';return{status:s==='success'?'completed':s,message:r?.data?.message||r?.message||'',error:r?.data?.error||r?.error||''}}let r=await call(PRIMARY_API,`/tasks/${encodeURIComponent(state.tid)}`);return{status:r.status,message:r.message||'',error:r.error||''}}
function poll(){if(!state.tid||state.channel==='redeem')return;clearInterval(state.pollTimer);setText(els.sumStat,'正在处理');setText(els.btn,'正在处理...');state.pollTimer=setInterval(async()=>{try{let r=await readStatus();log('节点状态反馈: '+r.status+(r.message?' · '+r.message:''));if(r.status==='completed'){clearInterval(state.pollTimer);setText(els.sumStat,'充值成功');setText(els.btn,'充值成功');els.next.disabled=true;notify('恭喜！协议执行完毕');setTimeout(resetAfterSuccess,1200)}if(r.status==='failed'){clearInterval(state.pollTimer);els.next.disabled=false;setText(els.sumStat,'执行失败');setText(els.btn,'重新提交');log('异常详情: '+(r.error||r.message||'未提供错误详情'))}}catch(e){log('等待节点响应: '+e.message)}},3000)}
els.next.onclick=()=>{if(state.step===1)return state.cardOk?(state.step=2,sync()):checkCard();if(state.step===2)return parseStep();return state.tid&&state.channel!=='redeem'?poll():runTask()};
els.back.onclick=()=>{if(state.step>1){state.step--;sync()}};
if(els.forceRecharge)els.forceRecharge.onchange=()=>{state.forceRecharge=els.forceRecharge.checked;sync()};
els.card.oninput=()=>{if(state.cardOk||state.channel){Object.assign(state,{step:1,cardOk:false,channel:'',channelName:'',email:'',planType:'',tid:'',accessToken:'',platformCredential:null,forceRecharge:false,reuseEmail:''});if(els.forceRecharge)els.forceRecharge.checked=false;els.log.innerHTML='';sync()}};
els.trigger.onclick=e=>{e.stopPropagation();els.menu.classList.toggle('open')};
els.menu.onclick=e=>{let b=e.target.closest('button[data-lang]');if(!b)return;state.lang=b.dataset.lang;localStorage.setItem('lav_lang',state.lang);els.menu.classList.remove('open');applyLang()};
document.addEventListener('click',()=>els.menu.classList.remove('open'));
applyLang();
});
