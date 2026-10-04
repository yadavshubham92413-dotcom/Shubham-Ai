const $=id=>document.getElementById(id);

const messages=$("messages");
const input=$("messageInput");
const send=$("sendBtn");
const welcome=$("welcome");
const sideMenu=$("sideMenu");
const historyList=$("historyList");
const attachmentPreview=$("attachmentPreview");
const fileInput=$("fileInput");
const cameraInput=$("cameraInput");

let chat=[];
let attachment=null;
let busy=false;

function scrollBottom(){
  $("chatArea").scrollTop=$("chatArea").scrollHeight;
}

function addMessage(role,text){
  const row=document.createElement("div");
  row.className=`message ${role}`;
  const bubble=document.createElement("div");
  bubble.className="bubble";
  bubble.textContent=text;
  row.appendChild(bubble);
  messages.appendChild(row);
  scrollBottom();
  return bubble;
}

function showThinking(){
  const row=document.createElement("div");
  row.className="message ai";
  row.id="thinking";
  const dot=document.createElement("div");
  dot.className="thinking";
  row.appendChild(dot);
  messages.appendChild(row);
  scrollBottom();
}

function removeThinking(){
  $("thinking")?.remove();
}

function saveHistory(){
  localStorage.setItem("shubham_ai_history",JSON.stringify(chat));
  renderHistory();
}

function renderHistory(){
  historyList.innerHTML="";
  if(!chat.length){
    historyList.innerHTML='<div style="color:#69717e;font-size:12px;padding:8px">No chats yet</div>';
    return;
  }

  const item=document.createElement("button");
  item.className="menu-item history-item";
  item.textContent=chat[0]?.text?.slice(0,40)||"New chat";
  item.onclick=()=>{
    closeMenu();
    messages.innerHTML="";
    welcome.style.display="none";
    for(const m of chat){
      if(m.role==="user"||m.role==="model") addMessage(m.role==="model"?"ai":"user",m.text);
    }
  };
  historyList.appendChild(item);
}

function loadHistory(){
  try{chat=JSON.parse(localStorage.getItem("shubham_ai_history")||"[]")}catch{chat=[]}
  renderHistory();
}

function closeMenu(){sideMenu.classList.remove("open")}

function newChat(){
  chat=[];
  messages.innerHTML="";
  welcome.style.display="";
  localStorage.removeItem("shubham_ai_history");
  closeMenu();
  input.value="";
  input.style.height="auto";
  clearAttachment();
}

async function sendMessage(){
  const text=input.value.trim();

  if((!text && !attachment) || busy) return;

  busy=true;
  welcome.style.display="none";

  const userText=text || "Is attached file/image ko analyze karke mujhe batao.";
  addMessage("user", attachment ? `${userText}\n\n📎 ${attachment.name}` : userText);

  input.value="";
  input.style.height="auto";

  const previous=chat.slice(-20);

  chat.push({
    role:"user",
    text:userText + (attachment ? ` [Attached: ${attachment.name}]` : "")
  });

  const currentFile=attachment;
  clearAttachment();
  showThinking();

  try{
    const form=new FormData();

    form.append("message",userText);
    form.append("history",JSON.stringify(previous));

    if(currentFile){
      form.append("file",currentFile,currentFile.name);
    }

    const res=await fetch("/api/chat",{
      method:"POST",
      body:form
    });

    removeThinking();

    if(!res.ok){
      const errorText=await res.text();
      throw new Error(errorText || "AI request failed");
    }

    const bubble=addMessage("ai","");
    const reader=res.body.getReader();
    const decoder=new TextDecoder();

    let incoming="";
    let displayed="";
    let finished=false;

    const typeNext=()=>{
      if(displayed.length >= incoming.length){
        if(finished) scrollBottom();
        return;
      }

      const remaining=incoming.length-displayed.length;

      // Fast typewriter: keeps the response feeling live without slowing it down.
      const step=remaining > 120 ? 5 : remaining > 50 ? 3 : remaining > 15 ? 2 : 1;

      displayed += incoming.slice(
        displayed.length,
        displayed.length + step
      );

      bubble.textContent=displayed;
      scrollBottom();

      requestAnimationFrame(typeNext);
    };

    while(true){
      const {value,done}=await reader.read();

      if(done) break;

      incoming += decoder.decode(value,{stream:true});
      typeNext();
    }

    incoming += decoder.decode();
    finished=true;
    typeNext();

    while(displayed.length < incoming.length){
      await new Promise(resolve=>setTimeout(resolve,10));
    }

    const full=incoming;

    if(!full.trim()){
      bubble.textContent="AI ne koi text response nahi diya.";
    }

    chat.push({
      role:"model",
      text:full
    });

    saveHistory();

  }catch(err){
    removeThinking();
    console.error("CHAT ERROR:",err);
    addMessage("ai","AI response nahi aa paaya. Server/API ko check karna hoga.");
  }finally{
    busy=false;
  }
}

function showAttachment(file){
  attachment=file;
  attachmentPreview.innerHTML="";

  const box=document.createElement("div");
  box.className="attachment";

  if(file.type.startsWith("image/")){
    const img=document.createElement("img");
    img.src=URL.createObjectURL(file);
    box.appendChild(img);
  }

  const name=document.createElement("span");
  name.textContent=file.name;
  box.appendChild(name);

  const close=document.createElement("button");
  close.className="icon-btn";
  close.style.width="30px";
  close.style.height="30px";
  close.textContent="×";
  close.onclick=clearAttachment;
  box.appendChild(close);

  attachmentPreview.appendChild(box);
}

function fileToDataURL(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}

function clearAttachment(){
  attachment=null;
  attachmentPreview.innerHTML="";
  fileInput.value="";
  cameraInput.value="";
}

$("menuBtn").onclick=()=>sideMenu.classList.add("open");
$("closeMenu").onclick=closeMenu;
$("newChatBtn").onclick=newChat;
$("menuNewChat").onclick=newChat;

send.onclick=sendMessage;

input.addEventListener("input",()=>{
  input.style.height="auto";
  input.style.height=Math.min(input.scrollHeight,140)+"px";
});

input.addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey){
    e.preventDefault();
    sendMessage();
  }
});

document.querySelectorAll("[data-suggestion]").forEach(btn=>{
  btn.onclick=()=>{
    input.value=btn.dataset.suggestion;
    input.focus();
    input.dispatchEvent(new Event("input"));
  };
});

const featurePrompts = {
  "ROBLOX SCRIPTING":"Roblox scripting me meri help karo.",
  "APP DEVELOPMENT":"App development me meri help karo.",
  "CODING":"Coding me meri help karo.",
  "STUDY":"Study me meri help karo.",
  "CALCULATOR":"Mujhe calculation karni hai.",
  "WRITING":"Mujhe writing me help chahiye.",
  "WEB SEARCH":"Mujhe current information search karni hai.",
  "IMAGE STUDIO":"Mujhe image create/edit karni hai.",
  "VIDEO STUDIO":"Mujhe video creation me help chahiye.",
  "DOCUMENTS":"Mujhe document par kaam karna hai.",
  "DATA ANALYSIS":"Mujhe data analyze karna hai.",
  "TRANSLATOR":"Mujhe translation karni hai.",
  "MEMORY":"Meri saved memory manage karo.",
  "PROJECTS":"Mere projects manage karo.",
  "GALLERY":"Meri gallery dekhni hai.",
  "SETTINGS":"SHUBHAM AI settings kholo."
};

document.querySelectorAll(".menu-item").forEach(btn=>{
  const name=btn.textContent.trim();

  if(featurePrompts[name]){
    btn.onclick=()=>{
      closeMenu();
      input.value=featurePrompts[name];
      input.focus();
      input.dispatchEvent(new Event("input"));
    };
  }
});

$("fileBtn").onclick=()=>fileInput.click();
$("photoBtn").onclick=()=>photoInput.click();

photoInput.onchange=()=>{
  if(photoInput.files[0])showAttachment(photoInput.files[0]);
};
$("cameraBtn").onclick=()=>cameraInput.click();

fileInput.onchange=()=>{
  if(fileInput.files[0])showAttachment(fileInput.files[0]);
};

cameraInput.onchange=()=>{
  if(cameraInput.files[0])showAttachment(cameraInput.files[0]);
};

$("micBtn").onclick=()=>{
  if(!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)){
    alert("Voice input is not supported in this browser.");
    return;
  }

  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const recognition=new Recognition();
  recognition.lang="hi-IN";
  recognition.interimResults=true;

  recognition.onresult=e=>{
    let text="";
    for(const result of e.results) text+=result[0].transcript;
    input.value=text;
    input.dispatchEvent(new Event("input"));
  };

  recognition.start();
};

loadHistory();
