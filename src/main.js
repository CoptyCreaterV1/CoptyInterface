import "./style.css";

const KEY = "copty_v1_state";

const defaults = {
  user: { name: "Guest", email: "", loggedIn: false },
  plan: "free",
  chats: [],
  activeChat: null,
  memory: [],
  settings: { enterToSend: true, compact: false }
};

let state = load();

function load() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return structuredClone(defaults);
  }
}
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
function id(prefix="id") { return prefix + "_" + crypto.randomUUID().slice(0,8); }
function esc(v="") {
  return String(v).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}
function active() {
  return state.chats.find(c => c.id === state.activeChat);
}
function newChat() {
  const chat = { id:id("chat"), title:"New chat", messages:[] };
  state.chats.unshift(chat);
  state.activeChat = chat.id;
  save();
}
function ensureChat() {
  if (!active()) newChat();
}
function usage() {
  const today = new Date().toISOString().slice(0,10);
  return JSON.parse(localStorage.getItem("copty_usage_"+today) || "0");
}
function bumpUsage() {
  const today = new Date().toISOString().slice(0,10);
  localStorage.setItem("copty_usage_"+today, String(usage()+1));
}

function render() {
  ensureChat();
  const chat = active();
  const limit = state.plan === "ultra" ? "Unlimited*" : `${Math.max(0,20-usage())} left today`;

  document.querySelector("#app").innerHTML = `
  <div class="app ${state.settings.compact ? "compact":""}">
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <div class="logo">C</div>
        <div><b>COPTY</b><small>V1 AI</small></div>
      </div>
      <button class="new-chat" id="newChat">＋ New chat</button>

      <div class="section-label">Workspace</div>
      <button class="nav active" data-page="chat">⌁ Chat</button>
      <button class="nav" data-page="memory">◉ Memory <span>${state.memory.length}</span></button>
      <button class="nav" data-page="settings">⚙ Settings</button>

      <div class="section-label chats-label">Recent chats</div>
      <div class="chat-list">
        ${state.chats.slice(0,12).map(c => `
          <button class="chat-row ${c.id===state.activeChat?"selected":""}" data-chat="${c.id}">
            <span>▹</span>${esc(c.title || "New chat")}
          </button>`).join("")}
      </div>

      <div class="side-bottom">
        <div class="upgrade">
          <div class="ultra">✦ COPTY V1 ULTRA</div>
          <p>Advanced model, larger limits, files and premium tools.</p>
          <button id="upgrade">Explore Ultra</button>
        </div>
        <div class="account">
          <div class="avatar">${esc((state.user.name||"G").slice(0,1).toUpperCase())}</div>
          <div class="account-text"><b>${esc(state.user.name)}</b><small>${state.plan==="ultra"?"Ultra":"Free plan"}</small></div>
          <button id="account">•••</button>
        </div>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <button class="hamburger" id="hamburger">☰</button>
        <div class="mobile-brand">COPTY <span>V1</span></div>
        <div class="online"><i></i> Online</div>
        <button class="plan" id="plan">${state.plan.toUpperCase()}</button>
      </header>

      <div id="page" class="page">
        ${pageChat(chat, limit)}
      </div>
    </main>
  </div>
  <div id="modal-root"></div>`;

  bind();
}

function pageChat(chat, limit) {
  const empty = chat.messages.length === 0;
  return `
  <section class="chat-page">
    ${empty ? `
      <div class="welcome">
        <div class="badge">✦ COPTY V1</div>
        <h1>What are we <em>building?</em></h1>
        <p>Your fast AI workspace for ideas, code, writing and research.</p>
        <div class="suggestions">
          <button data-prompt="Explain quantum computing simply">Explain something</button>
          <button data-prompt="Write a clean JavaScript function">Write code</button>
          <button data-prompt="Give me 5 startup ideas">Brainstorm</button>
          <button data-prompt="Help me make a study plan">Plan something</button>
        </div>
      </div>` : `
      <div class="conversation" id="conversation">
        ${chat.messages.map(m => `
          <div class="msg ${m.role}">
            <div class="msg-avatar">${m.role==="assistant"?"C":esc((state.user.name||"G")[0].toUpperCase())}</div>
            <div class="msg-content">
              <div class="msg-name">${m.role==="assistant"?"Copty":"You"}</div>
              <div class="msg-text">${format(m.content)}</div>
            </div>
          </div>`).join("")}
        <div id="typing" class="typing hidden"><span></span><span></span><span></span> Copty is thinking…</div>
      </div>`}

    <div class="composer-wrap">
      <div class="composer">
        <textarea id="prompt" placeholder="Message CoptyV1…" rows="1"></textarea>
        <div class="tools">
          <button title="Attach file" id="attach">＋</button>
          <span>CoptyV1 · ${limit}</span>
          <button class="send" id="send">➤</button>
        </div>
        <input id="file" type="file" hidden>
      </div>
      <div class="composer-note">Copty can make mistakes. Check important information.</div>
    </div>
  </section>`;
}

function format(text) {
  return esc(text)
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function pageMemory() {
  return `
  <section class="settings-page">
    <div class="settings-head"><div class="badge">◉ MEMORY</div><h2>Copty Memory</h2><p>Facts saved in this browser for your CoptyV1 workspace.</p></div>
    <div class="panel">
      <div class="panel-title"><b>Saved memories</b><button id="addMemory">＋ Add</button></div>
      ${state.memory.length ? state.memory.map((m,i)=>`<div class="memory"><span>${esc(m)}</span><button data-del-memory="${i}">×</button></div>`).join("") : `<div class="empty">No memories yet.</div>`}
    </div>
    <div class="notice">Memory is currently stored locally in this browser. A production multi-device memory database can be connected later.</div>
  </section>`;
}

function pageSettings() {
  return `
  <section class="settings-page">
    <div class="settings-head"><div class="badge">⚙ SETTINGS</div><h2>Settings</h2><p>Customize your CoptyV1 workspace.</p></div>
    <div class="panel">
      <label class="setting"><span><b>Enter to send</b><small>Press Enter to send messages.</small></span><input type="checkbox" id="enterSetting" ${state.settings.enterToSend?"checked":""}></label>
      <label class="setting"><span><b>Compact mode</b><small>Reduce spacing in the interface.</small></span><input type="checkbox" id="compactSetting" ${state.settings.compact?"checked":""}></label>
      <div class="setting"><span><b>Plan</b><small>Current account tier.</small></span><strong class="purple">${state.plan.toUpperCase()}</strong></div>
      <button class="danger" id="reset">Reset local Copty data</button>
    </div>
  </section>`;
}

function showModal(type) {
  const root = document.querySelector("#modal-root");
  root.innerHTML = `
  <div class="modal" id="modal">
    <div class="modal-box">
      <button class="close" id="close">×</button>
      ${type==="ultra" ? `
        <div class="badge">✦ COPTY V1 ULTRA</div>
        <h2>Unlock the Ultra workspace.</h2>
        <p>Ultra is designed for higher limits and premium tools.</p>
        <div class="features"><div>⚡ Higher usage limits</div><div>🧠 Advanced model access</div><div>📄 Larger file handling</div><div>🌐 Advanced web tools</div><div>🖼 Image tools</div></div>
        <div class="price">$— <small>payment not connected</small></div>
        <button class="primary" id="demoUltra">Enable demo Ultra</button>
        <small class="muted">Demo only. No payment is charged.</small>
      ` : `
        <div class="badge">COPTY ACCOUNT</div>
        <h2>${state.user.loggedIn ? "Your account" : "Create a local profile"}</h2>
        <p>This starter uses browser-local identity. Connect Supabase/Firebase later for real accounts.</p>
        <input class="modal-input" id="name" placeholder="Your name" value="${esc(state.user.name)}">
        <input class="modal-input" id="email" placeholder="Email (optional)" value="${esc(state.user.email)}">
        <button class="primary" id="saveProfile">Save profile</button>
        <button class="ghost" id="logout">Clear profile</button>
      `}
    </div>
  </div>`;
  document.querySelector("#close").onclick=()=>root.innerHTML="";
  if(type==="ultra") {
    document.querySelector("#demoUltra").onclick=()=>{
      state.plan="ultra"; save(); root.innerHTML=""; render();
    };
  } else {
    document.querySelector("#saveProfile").onclick=()=>{
      state.user.name=document.querySelector("#name").value.trim()||"Guest";
      state.user.email=document.querySelector("#email").value.trim();
      state.user.loggedIn=true; save(); root.innerHTML=""; render();
    };
    document.querySelector("#logout").onclick=()=>{
      state.user={name:"Guest",email:"",loggedIn:false}; save(); root.innerHTML=""; render();
    };
  }
}

function bind() {
  document.querySelector("#newChat").onclick=()=>{newChat();render();};
  document.querySelector("#upgrade").onclick=()=>showModal("ultra");
  document.querySelector("#plan").onclick=()=>showModal("ultra");
  document.querySelector("#account").onclick=()=>showModal("account");

  document.querySelector("#hamburger").onclick=()=>document.querySelector("#sidebar").classList.toggle("open");

  document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{
    const page=b.dataset.page;
    document.querySelector("#page").innerHTML=page==="chat"?pageChat(active(),state.plan==="ultra"?"Unlimited*":`${Math.max(0,20-usage())} left today`):page==="memory"?pageMemory():pageSettings();
    bindPage(page);
  });
  document.querySelectorAll("[data-chat]").forEach(b=>b.onclick=()=>{state.activeChat=b.dataset.chat;save();render();});
  bindPage("chat");
}

function bindPage(page) {
  if(page==="chat") {
    const prompt=document.querySelector("#prompt");
    const send=document.querySelector("#send");
    if(!prompt || !send)return;

    document.querySelectorAll("[data-prompt]").forEach(b=>b.onclick=()=>{prompt.value=b.dataset.prompt;prompt.focus();});

    document.querySelector("#attach").onclick=()=>document.querySelector("#file").click();
    document.querySelector("#file").onchange=e=>{
      const f=e.target.files?.[0];
      if(f) prompt.value += ` [Attached: ${f.name}]`;
    };

    async function sendMessage(){
      const text=prompt.value.trim();
      if(!text)return;
      if(state.plan==="free" && usage()>=20) {
        showModal("ultra");
        return;
      }
      const chat=active();
      chat.messages.push({role:"user",content:text});
      if(chat.title==="New chat")chat.title=text.slice(0,38);
      prompt.value="";
      bumpUsage();
      save();
      render();

      const typing=document.querySelector("#typing");
      if(typing)typing.classList.remove("hidden");

      try {
        const response=await fetch("/api/chat",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({message:text,plan:state.plan,history:chat.messages.slice(-10),memory:state.memory})
        });
        const data=await response.json();
        chat.messages.push({role:"assistant",content:data.reply||data.error||"No response."});
      } catch(e) {
        chat.messages.push({role:"assistant",content:"Copty's backend is not connected yet. Add an AI provider to Netlify environment variables, then redeploy."});
      }
      save();render();
      setTimeout(()=>document.querySelector("#conversation")?.scrollTo(0,999999),30);
    }

    send.onclick=sendMessage;
    prompt.onkeydown=e=>{
      if(e.key==="Enter" && !e.shiftKey && state.settings.enterToSend){e.preventDefault();sendMessage();}
    };
    setTimeout(()=>document.querySelector("#conversation")?.scrollTo(0,999999),10);
  }

  if(page==="memory") {
    document.querySelector("#addMemory").onclick=()=>{
      const x=prompt("What should Copty remember?");
      if(x?.trim()){state.memory.push(x.trim());save();render();document.querySelector('[data-page="memory"]').click();}
    };
    document.querySelectorAll("[data-del-memory]").forEach(b=>b.onclick=()=>{
      state.memory.splice(Number(b.dataset.delMemory),1);save();render();document.querySelector('[data-page="memory"]').click();
    });
  }

  if(page==="settings") {
    document.querySelector("#enterSetting").onchange=e=>{state.settings.enterToSend=e.target.checked;save();};
    document.querySelector("#compactSetting").onchange=e=>{state.settings.compact=e.target.checked;save();render();};
    document.querySelector("#reset").onclick=()=>{
      if(confirm("Reset all local Copty data?")){localStorage.clear();state=load();render();}
    };
  }
}

render();