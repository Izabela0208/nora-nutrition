import { C, card, serif, sans, inp } from "../noraTokens";
import { NoraAvatar } from "../NoraIcons";

export default function ChatTab({
  chatMessages, chatInput, setChatInput, chatLoad, handleChatSend, chatEndRef,
}) {
  return (
    <div style={{ paddingBottom:0 }}>
      <div style={{ backgroundColor:C.green, padding:"22px 20px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <NoraAvatar size={36}/>
          <div>
            <h2 style={{ fontFamily:serif, fontSize:20, color:C.bg, fontWeight:600, margin:0 }}>Ask Nora</h2>
            <p style={{ fontSize:12, color:"rgba(245,240,232,0.6)", margin:0 }}>Your personal nutrition companion</p>
          </div>
        </div>
      </div>

      <div style={{ padding:"16px 16px 148px", display:"flex", flexDirection:"column", gap:12 }}>
        {chatMessages.map((msg, i) => (
          msg.role === "nora" ? (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", animation:"fadeIn 0.25s ease" }}>
              <NoraAvatar size={30}/>
              <div style={{ ...card, padding:"12px 14px", maxWidth:"82%", borderRadius:"4px 14px 14px 14px" }}>
                <p style={{ fontSize:14, color:C.text, lineHeight:1.65, margin:0, fontFamily:sans }}>{msg.content}</p>
              </div>
            </div>
          ) : (
            <div key={i} style={{ display:"flex", justifyContent:"flex-end", animation:"fadeIn 0.25s ease" }}>
              <div style={{ backgroundColor:C.green, padding:"12px 14px", borderRadius:"14px 4px 14px 14px", maxWidth:"82%" }}>
                <p style={{ fontSize:14, color:C.bg, lineHeight:1.65, margin:0, fontFamily:sans }}>{msg.content}</p>
              </div>
            </div>
          )
        ))}
        {chatLoad && (
          <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
            <NoraAvatar size={30}/>
            <div style={{ ...card, padding:"14px 16px", borderRadius:"4px 14px 14px 14px" }}>
              <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                {[0,1,2].map(j=>(
                  <div key={j} style={{ width:7, height:7, borderRadius:"50%", backgroundColor:C.muted, animation:`dotPulse 1.2s ease ${j*0.2}s infinite` }}/>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef}/>
      </div>

      <div style={{ position:"fixed", bottom:62, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, backgroundColor:C.bg, borderTop:`1px solid ${C.border}`, padding:"10px 16px", display:"flex", gap:8, zIndex:9 }}>
        <input
          className="focus-gold"
          style={{ ...inp, flex:1, borderRadius:24, padding:"11px 16px" }}
          placeholder="Ask anything about your nutrition…"
          value={chatInput}
          onChange={e=>setChatInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); handleChatSend(); } }}
        />
        <button onClick={handleChatSend} disabled={chatLoad||!chatInput.trim()} style={{ width:44, height:44, borderRadius:"50%", backgroundColor:chatLoad||!chatInput.trim()?"#C8D5D1":C.green, border:"none", cursor:chatLoad||!chatInput.trim()?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background-color 0.15s" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 2L2 6.5l5 1.5 1.5 5L14 2Z" stroke={C.bg} strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
