// CoptyV1 public AI gateway.
// Set these in Netlify -> Project configuration -> Environment variables:
//
// AI_API_URL = https://YOUR_PROVIDER/v1/chat/completions
// AI_API_KEY = secret key
// AI_MODEL   = model-name
//
// The frontend never receives AI_API_KEY.
// Your local Ollama at 127.0.0.1:11434 is only reachable from your own PC,
// so it cannot serve public visitors through Netlify.

export default async function handler(req) {
  if (req.method !== "POST") return json({error:"Method not allowed"},405);

  try {
    const body = await req.json();
    const message = String(body.message || "").trim();
    const history = Array.isArray(body.history) ? body.history : [];
    const memory = Array.isArray(body.memory) ? body.memory : [];
    const plan = body.plan === "ultra" ? "ultra" : "free";

    if (!message) return json({error:"Message is required"},400);

    // Free-tier safety limit at the gateway too.
    // For production, replace this with a real database-backed quota.
    const apiUrl = process.env.AI_API_URL;
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || "qwen2.5:1.5b";

    if (!apiUrl) {
      return json({
        reply:
          "CoptyV1 is installed correctly, but no public AI provider is configured. " +
          "Add AI_API_URL, AI_API_KEY and AI_MODEL in Netlify environment variables."
      });
    }

    const system = [
      "You are CoptyV1, a helpful AI assistant.",
      "Answer clearly and directly in English.",
      "Do not pretend to have tools or access that you do not have.",
      plan === "ultra" ? "The user has CoptyV1 Ultra." : "The user is on CoptyV1 Free.",
      memory.length ? "Relevant user memory:\n" + memory.slice(-20).map(x=>"- "+String(x)).join("\n") : ""
    ].filter(Boolean).join("\n\n");

    const safeHistory = history
      .filter(x => x && (x.role === "user" || x.role === "assistant"))
      .slice(-10)
      .map(x => ({role:x.role,content:String(x.content).slice(0,10000)}));

    const upstream = await fetch(apiUrl, {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        ...(apiKey ? {"Authorization":"Bearer "+apiKey} : {})
      },
      body:JSON.stringify({
        model,
        messages:[
          {role:"system",content:system},
          ...safeHistory
        ],
        temperature:0.7,
        max_tokens: plan === "ultra" ? 1800 : 700
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return json({error:data?.error?.message || "AI provider request failed"},502);
    }

    const reply =
      data?.choices?.[0]?.message?.content ??
      data?.message?.content ??
      "The AI provider returned no text.";

    return json({reply});
  } catch (e) {
    return json({error:"Copty server error: "+e.message},500);
  }
}

function json(value,status=200){
  return new Response(JSON.stringify(value),{
    status,
    headers:{"Content-Type":"application/json"}
  });
}