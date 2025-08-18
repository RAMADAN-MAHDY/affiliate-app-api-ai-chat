import dotenv from "dotenv";
import UserRequest from "../models/UserRequest.js";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.OPENAI_API_KEY });

const ChatController = async (req, res) => {
  const { message } = req.clonedBody;
  const sessionId = req.sessionId;
  const token = req.token;

  if (!message) {
    return res.status(400).json({ error: "الرسالة مطلوبة" });
  }

  try {
    let userSession = await UserRequest.findOne({ sessionId });

    if (!userSession) {
      userSession = await UserRequest.create({
        sessionId,
        chatHistory: [
          {
            role: "user",
           content: `
انت خبير تسويق الكتروني متخصص في السوق المصري وبالذات التسويق بالعمولة🏆.
- هدفك تقديم استراتيجيات عملية وواقعية للمستخدمين علشان يحققوا مبيعات ونمو 📈.
- استخدم لغة سهلة وبالعامية المصرية مع إضافة مصطلحات إنجليزية شائعة في التسويق 💡.
- قدم نصائح مثبتة علميًا وتجارب فعلية في التسويق الرقمي ✅.
- خليك مصدر تعلم كامل للـ Marketing: شرح أدوات التسويق، الحملات الإعلانية، إدارة المحتوى، تحسين نسب التحويل (Conversion)، وتحليل الأداء 📊.
- ضيف أمثلة عملية، تلميحات وأخطاء شائعة لازم يتجنبها المسوقين ⚠️.
- استخدم الإيموجيز بطريقة مناسبة حسب نوع الرسالة: نصيحة 💡، تحذير ⚠️، نجاح ✅، مثال عملي 🛠️، تحفيز 🚀.
- حافظ على الأسلوب التعليمي: كأنك معلم شخصي للمستخدم 🧑‍🏫، مع توضيح خطوات عملية ممكن ينفذها على أرض الواقع.
- ركز على السياق: اقرأ تاريخ المحادثة بالكامل (chat history) قبل ما ترد، وخلي ردك مرتبط بالأسئلة والطلبات السابقة للمستخدم 🔄.
- حاول دايمًا توازن بين الجانب النظري والجانب العملي بحيث المتعلم يقدر يطبق على مشاريع حقيقية 🛠️.
- لو المستخدم طلب نصيحة عملية أو استراتيجية جديدة، قدمها خطوة بخطوة مع أمثلة وأدوات جاهزة للاستخدام 📝.
- خلي الأسلوب مشجع ومحفز، وادعم الكلام بالإيموجيز عشان يبقى ممتع وسهل القراءة 😎.
- رد باحترافيه واختصار   ملاحظاتك 📝.
`.trim(),
          },
        ],
      });

      return res.json({
        reply: `
اهلا بيك  ! 👋
انا مساعدك بالذكاء الاصطناعي  في التسويق الالكتروني ... 🚀💡
جاهز نبدأ الرحلة 💪📈
    `,
        token,
      });
    }

    // ✨ تحديث التاريخ
    userSession.chatHistory.push({ role: "user", content: message });

    // ✨ تحويل history لصيغة Gemini
   const formattedHistory = userSession.chatHistory.slice(-20).map(msg => ({
  role:
    msg.role === "assistant"
      ? "model"
      : msg.role === "system"
      ? "user" // ✨ أي system تتحول لـ user
      : msg.role, // أي user يفضل user
  parts: [{ text: msg.content }],
}));

    // ✨ استدعاء Gemini
   const completion = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: formattedHistory,
  max_output_tokens: 220,
  temperature: 0.7
});

    const reply = completion.text || "";

    if (!reply) {
      return res.status(500).json({ error: "ما قدرناش نرجع رد من المساعد" });
    }

    userSession.chatHistory.push({ role: "assistant", content: reply });
    await userSession.save();

    res.json({ reply, token });
  } catch (error) {
    console.error("❌ خطأ في استدعاء gemini:", error);
    res.status(500).json({ error: "حدث خطأ داخلي" });
  }
};

export default ChatController;
