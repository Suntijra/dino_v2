
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GameContext {
  score: number;
  coins: number;
  highScore: number;
  gameSpeed: number;
  status: 'WIN' | 'LOSS' | 'PLAYING';
  event?: 'DISTANCE' | 'COINS';
}

export async function getGameCommentary(ctx: GameContext): Promise<string> {
  try {
    const isNewRecord = ctx.score > ctx.highScore;
    const prompt = `
      ข้อมูลการเล่นล่าสุด (จบเกม):
      - คะแนน: ${Math.floor(ctx.score)}
      - สถิติสูงสุด: ${ctx.highScore}
      - เหรียญ: ${ctx.coins}
      - ความเร็ว: ${ctx.gameSpeed.toFixed(1)}
      - ทำลายสถิติ: ${isNewRecord ? 'ใช่' : 'ไม่'}

      หน้าที่ของคุณ: 
      เขียนคำแซวสั้นๆ (ไม่เกิน 12 คำ) ด้วยภาษาไทยวัยรุ่น กวนประสาท ประชดประชัน
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: "คุณคือ Dino-Tech AI ผู้ช่วยสุดกวน หน้าที่คือคอมเมนต์สั้นๆ กระชับ และกวนประสาท",
        temperature: 0.9,
      },
    });

    return response.text.trim() || "สภาพ... ลองใหม่นะ";
  } catch (error) {
    return "เอาน่า... อีกรอบเพื่อความปัง";
  }
}

export async function getMidGameCommentary(ctx: GameContext): Promise<string> {
  try {
    let situation = ctx.event === 'COINS' ? `รวยจัด มี ${ctx.coins} เหรียญ` : `วิ่งมา ${Math.floor(ctx.score)} เมตรแล้ว`;

    const prompt = `
      สถานการณ์: ${situation}
      เขียนคำพูดสั้นๆ (ห้ามเกิน 8 คำ) แซวผู้เล่นแบบกวนๆ ภาษาไทยวัยรุ่น
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: "คุณคือ Dino-Tech AI แซวสั้นๆ กระชับ ห้ามยาวเด็ดขาด",
        temperature: 0.7,
      },
    });

    return response.text.trim() || "วิ่งไป!";
  } catch (error) {
    return "ตึงจัด!";
  }
}
