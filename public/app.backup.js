const chat=document.getElementById("chat");
const welcome=document.getElementById("welcome");
const composer=document.getElementById("composer");
const prompt=document.getElementById("prompt");
const drawer=document.getElementById("drawer");
const fileInput=document.getElementById("fileInput");

document.getElementById("menuBtn").onclick=()=>drawer.classList.add("open");
document.getElementById("closeMenu").onclick=()=>drawer.classList.remove("open");

document.getElementById("attachBtn").onclick=()=>fileInput.click();

document.querySelectorAll(".suggestions button").forEach(b=>{
  b.onclick=()=>{
    prompt.value=b.textContent.replace(/^[^ ]+\s*/,"");
    prompt.focus();
  };
});

document.getElementById("newChatBtn").onclick=()=>{
  chat.innerHTML="";
  chat.appendChild(welcome);
  welcome.style.display="block";
  prompt.value="";
};

function addMessage(text,type){
  welcome.style.display="none";
  const div=document.createElement("div");
  div.className="msg "+type;
  div.textContent=text;
  chat.appendChild(div);
  chat.scrollTop=chat.scrollHeight;
}

composer.onsubmit=e=>{
  e.preventDefault();
  const text=prompt.value.trim();
  if(!text && !fileInput.files.length)return;
  if(text)addMessage(text,"user");
  if(fileInput.files.length)addMessage("📎 "+fileInput.files[0].name,"user");
  prompt.value="";
  fileInput.value="";
};

document.getElementById("micBtn").onclick=()=>{
  if(!("webkitSpeechRecognition" in window)){
    addMessage("Voice input is not supported by this browser yet.","ai");
    return;
  }
  const r=new webkitSpeechRecognition();
  r.lang="hi-IN";
  r.onresult=e=>prompt.value=e.results[0][0].transcript;
  r.start();
};
