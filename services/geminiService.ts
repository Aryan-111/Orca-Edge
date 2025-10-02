import { GoogleGenAI, Chat, GenerateContentResponse, Type, Part } from "@google/genai";
import { CvAnalysis, InterviewReport } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File): Promise<Part> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export async function analyzeCv(cvFile: File, targetRole: string, techCount: number, behCount: number): Promise<CvAnalysis> {
    const prompt = `You are an expert HR analyst. Analyze the following CV for a '${targetRole}' position. Extract exactly ${techCount} key technical skills and ${behCount} key experiences (internships, projects, or leadership roles). Return your findings in a single, minified JSON object with no extra text or markdown. The JSON must have two keys: "technical_skills" (an array of ${techCount} strings) and "experiences" (an array of ${behCount} strings).`;
    
    const filePart = await fileToGenerativePart(cvFile);
    
    const result: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [filePart, { text: prompt }] },
    });
    
    try {
        const jsonText = result.text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(jsonText);
        if (!parsed.technical_skills || !parsed.experiences || parsed.technical_skills.length !== techCount || parsed.experiences.length !== behCount) {
             throw new Error("Parsed CV data is not in the expected format.");
        }
        return parsed as CvAnalysis;
    } catch (e) {
        console.error("Failed to parse CV analysis:", e);
        return {
            technical_skills: ["SQL", "Python", "Power BI", "Excel", "Teamwork", "R"],
            experiences: ["a past project", "a leadership role", "an internship experience"]
        };
    }
}

export function createChatSession(targetRole: string, totalQuestions: number, hrCount: number, techCount: number, behCount: number, previousReport?: InterviewReport): Chat {
    const previousReportContext = previousReport
        ? `
// PREVIOUS PERFORMANCE CONTEXT
The user has completed an interview before. Here is their previous report summary:
- Previous Date: ${new Date(previousReport.date).toLocaleDateString()}
- Previous Overall Score: ${previousReport.overallScore}/10
${previousReport.sections.map(s => `- Previous ${s.category} Score: ${s.score}/10`).join('\n')}
In your final report, you MUST include a "progress_comparison" object that analyzes their improvement based on these past scores.`
        : `
// PREVIOUS PERFORMANCE CONTEXT
This is the user's first interview. The "progress_comparison" object in your final report MUST be null.`;


    const systemInstruction = `You are "Orca," an experienced HR Manager conducting a simulated interview for an entry-level candidate.

// BEHAVIOR RULES
1.  **REAL-TIME FEEDBACK:** After EACH user answer, you MUST provide a concise, one-sentence constructive review prefixed with "*Feedback:*". This applies to all questions EXCEPT the final one.
2.  **IMMEDIATE NEXT QUESTION:** On a new line, immediately after the feedback, ask the NEXT question in the sequence. Do not wait for a prompt.
3.  **ONE QUESTION AT A TIME:** Your response should only contain feedback for the last answer and the single next question.
4.  **STRICT ORDER:** Follow the question sequence exactly as defined below.
5.  **CONCISE & PROFESSIONAL:** Maintain a professional and encouraging tone, suitable for a fresher.

// INTERVIEW FLOW
You will be given context from the user's CV. Start the interview by saying "Excellent, thank you. I'm reviewing your CV... Okay, I've reviewed your CV. We'll now begin the interview, which will have three parts. Let's start with some introductory questions." and then ask the first HR question.

**Part 1: HR Questions (${hrCount} Questions)**
- Ask ${hrCount} standard HR questions. Examples: "Tell me about yourself?", "What is your greatest strength?", "Why are you interested in this ${targetRole} position?". Ask them one by one.

**Part 2: Technical Questions (${techCount} Questions)**
- After the last HR question, provide feedback, then say: "Thank you. Now, let's move on to some technical questions based on your CV."
- Then ask ${techCount} technical questions, one by one. For each technical skill provided, ask a concise, foundational conceptual question suitable for an entry-level candidate.

**Part 3: Behavioral Questions (${behCount} Questions)**
- After the last technical question, provide feedback, then say: "Great. For the final part of our interview, I'd like to ask some behavioral questions about your past experiences."
- Then ask ${behCount} behavioral questions, one by one, based on the experiences provided. Frame these questions to allow the candidate to draw from academic projects, internships, or other relevant activities, focusing on problem-solving, teamwork, and learning.

// FINAL REPORT STAGE
- After the user provides their answer to the final (${totalQuestions}th) question, your response for that turn MUST BE ONLY the final comprehensive report.
- The report MUST be a single, minified JSON object wrapped in \`\`\`json ... \`\`\`. Do not include ANY text, feedback, or markdown outside the JSON block.

${previousReportContext}

**JSON Report Schema:**
The JSON object MUST conform to this exact structure:
{
  "sections": [
    {
      "category": "HR & Introduction",
      "score": <number out of 10>,
      "feedback": "<string: Detailed, constructive feedback for this section. Minimum 40 words.>"
    },
    {
      "category": "Technical Skills",
      "score": <number out of 10>,
      "feedback": "<string: Detailed, constructive feedback for this section based on their answers. Minimum 40 words.>"
    },
    {
      "category": "Behavioral & Situational",
      "score": <number out of 10>,
      "feedback": "<string: Detailed, constructive feedback for this section. If applicable, mention the STAR (Situation, Task, Action, Result) method. Minimum 40 words.>"
    }
  ],
  "overallScore": <number: The weighted average score out of 10, rounded to one decimal place>,
  "finalTip": "<string: One final, encouraging, and actionable piece of advice for the user.>",
  "suggestedResources": [
    {
      "title": "<string: Title of a real, relevant article or video>",
      "url": "<string: A valid, real, public URL to the resource>",
      "description": "<string: A brief one-sentence description of why this resource is useful for the user's improvement areas.>"
    }
  ],
  "progress_comparison": {
    "improvement_summary": "<string: A summary of the user's progress since the last interview. Note specific areas of improvement or decline.>"
  } | null
}`;

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: systemInstruction },
    });
}