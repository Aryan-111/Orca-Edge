import React, { useState, useRef, useEffect, useCallback } from 'react';
import { InterviewStage, ChatMessage as Message, CvAnalysis, InterviewReport } from './types';
import ChatMessageComponent from './components/ChatMessage';
import { SendIcon, UploadIcon, OrcaIcon, CheckIcon } from './components/Icons';
import { analyzeCv, createChatSession } from './services/geminiService';
import type { Chat } from '@google/genai';
import Onboarding from './components/Onboarding';

const initialMessages: Message[] = [
    { sender: 'ai', text: "Hello! I'm Orca, your dedicated interview coach. To begin, please enter your target job role, select the interview length, and upload your CV (image or PDF)." }
];

const getHistory = (): InterviewReport[] => {
    try {
        const historyJson = localStorage.getItem('orca-interview-history');
        if (!historyJson) return [];
        const history = JSON.parse(historyJson) as InterviewReport[];
        // Sort by date descending to have the latest first
        return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
        console.error("Failed to parse interview history:", e);
        return [];
    }
};

const saveHistory = (history: InterviewReport[]) => {
    try {
        localStorage.setItem('orca-interview-history', JSON.stringify(history));
    } catch (e) {
        console.error("Failed to save interview history:", e);
    }
};

const App: React.FC = () => {
    const [isOnboarding, setIsOnboarding] = useState(true);
    const [stage, setStage] = useState<InterviewStage>(InterviewStage.SETUP);
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [userInput, setUserInput] = useState<string>('');
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [numQuestions, setNumQuestions] = useState<number>(15);
    const [interviewHistory, setInterviewHistory] = useState<InterviewReport[]>([]);
    const [timer, setTimer] = useState<number>(0);
    
    const chatSessionRef = useRef<Chat | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const questionCountRef = useRef(0);
    const timerIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        setInterviewHistory(getHistory());
    }, []);

    useEffect(() => {
        chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
    }, [messages]);

    useEffect(() => {
        if (isLoading) {
            setTimer(0);
            timerIntervalRef.current = window.setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        } else if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [isLoading]);
    
    const handleRestart = () => {
        setStage(InterviewStage.SETUP);
        setMessages(initialMessages);
        setUserInput('');
        setCvFile(null);
        setNumQuestions(15);
        setIsLoading(false);
        setTimer(0);
        chatSessionRef.current = null;
        questionCountRef.current = 0;
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    };

    const handleGoHome = () => {
        handleRestart();
        setIsOnboarding(true);
    };

    const handleStartInterview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !cvFile) {
            setMessages(prev => [...prev, { sender: 'ai', text: "Please provide a target job role, select an interview length, and upload a CV file to start." }]);
            return;
        }

        const targetRole = userInput.trim();
        setMessages(prev => [...prev, { sender: 'user', text: `Role: ${targetRole} | Questions: ${numQuestions}\nCV: ${cvFile.name}` }]);
        setUserInput('');
        setIsLoading(true);
        setStage(InterviewStage.ANALYZING);

        const hrCount = Math.ceil(numQuestions / 3);
        const techCount = Math.floor(numQuestions / 3);
        const behCount = numQuestions - hrCount - techCount;

        try {
            const latestReport = interviewHistory.length > 0 ? interviewHistory[0] : undefined;
            const cvAnalysis: CvAnalysis = await analyzeCv(cvFile, targetRole, techCount, behCount);
            chatSessionRef.current = createChatSession(targetRole, numQuestions, hrCount, techCount, behCount, latestReport);
            
            const contextMessage = `USER_CONTEXT: Use these skills and experiences for questions. Skills: ${cvAnalysis.technical_skills.join(', ')}. Experiences: ${cvAnalysis.experiences.join(', ')}. Now, start the interview.`;

            const response = await chatSessionRef.current.sendMessage({ message: contextMessage });

            setIsLoading(false);
            setMessages(prev => [...prev, { sender: 'ai', text: response.text }]);
            setStage(InterviewStage.INTERVIEW);

        } catch (error) {
            console.error("Error starting interview:", error);
            setMessages(prev => [...prev, { sender: 'ai', text: "I'm sorry, there was an error analyzing your CV. Please try reloading the page." }]);
            setStage(InterviewStage.ERROR);
            setIsLoading(false);
        }
    };
    
    const handleSendMessage = useCallback(async () => {
        if (!userInput.trim() || !chatSessionRef.current) return;
        
        const text = userInput.trim();
        setMessages(prev => [...prev, { sender: 'user', text }]);
        setUserInput('');
        setIsLoading(true);
        
        if (stage === InterviewStage.INTERVIEW) {
            questionCountRef.current += 1;
        }
        
        const isFinalQuestion = questionCountRef.current === numQuestions;

        try {
            const response = await chatSessionRef.current.sendMessage({ message: text });
            
            if (isFinalQuestion) {
                 setStage(InterviewStage.FEEDBACK); // To show "Generating report..."
                 try {
                    const jsonMatch = response.text.match(/```json\n([\s\S]*?)\n```/);
                    if (!jsonMatch || !jsonMatch[1]) {
                        throw new Error("No valid JSON block found in the report response.");
                    }
                    const parsedReport = JSON.parse(jsonMatch[1]);
                    const newReport: InterviewReport = {
                        ...parsedReport,
                        date: new Date().toISOString(),
                    };

                    setMessages(prev => [...prev, { sender: 'ai', text: "Here is your detailed report.", isReport: true, reportData: newReport }]);
                    
                    const updatedHistory = [newReport, ...interviewHistory];
                    setInterviewHistory(updatedHistory);
                    saveHistory(updatedHistory);

                    setStage(InterviewStage.COMPLETE);
                } catch (e) {
                    console.error("Failed to parse interview report:", e);
                    setMessages(prev => [...prev, { sender: 'ai', text: "I had trouble generating your report in the correct format. Here is the raw data:\n\n" + response.text }]);
                    setStage(InterviewStage.ERROR);
                }

            } else {
                setMessages(prev => [...prev, { sender: 'ai', text: response.text }]);
            }

        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, an error occurred. Please try again." }]);
            setStage(InterviewStage.ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [userInput, numQuestions, stage, interviewHistory]);

    const renderInputArea = () => {
        switch (stage) {
            case InterviewStage.SETUP:
                return (
                    <form onSubmit={handleStartInterview} className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Enter target job role..."
                            className="flex-grow w-full p-3 border border-slate-700 bg-slate-900 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder-slate-400 transition-all duration-200"
                        />
                        <div className="flex w-full sm:w-auto items-center gap-2">
                            <select value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="p-3 border border-slate-700 bg-slate-900 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-200">
                                <option value={5}>5 Qs</option>
                                <option value={10}>10 Qs</option>
                                <option value={15}>15 Qs</option>
                            </select>
                            <label className="cursor-pointer bg-slate-700 text-white p-3 rounded-lg hover:bg-slate-600 transition-colors duration-200 flex items-center gap-2">
                               {cvFile ? (
                                    <>
                                        <CheckIcon className="w-6 h-6 text-green-400" />
                                        <span className="hidden sm:inline text-green-400 font-medium">{cvFile.name.length > 10 ? cvFile.name.substring(0, 10)+'...' : cvFile.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <UploadIcon className="w-6 h-6" />
                                        <span className="hidden sm:inline">Upload CV</span>
                                    </>
                                )}
                                <input type="file" accept="image/*,application/pdf" onChange={(e) => setCvFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
                            </label>
                            <button type="submit" className="bg-teal-600 text-white font-bold p-3 rounded-lg hover:bg-teal-700 transition-colors duration-200 disabled:bg-opacity-50 disabled:cursor-not-allowed" disabled={!userInput.trim() || !cvFile}>
                                Start
                            </button>
                        </div>
                    </form>
                );
            case InterviewStage.INTERVIEW:
                 return (
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                            placeholder={"Type your answer..."}
                            className="flex-grow p-4 pr-14 border border-slate-700 bg-slate-900 text-white rounded-full focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder-slate-400 transition-all duration-200"
                            disabled={isLoading}
                        />
                        <button onClick={handleSendMessage} className="absolute right-2 bg-teal-600 text-white p-2.5 rounded-full hover:bg-teal-700 transition-colors duration-200 disabled:bg-opacity-50" disabled={isLoading || !userInput.trim()}>
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                );
            case InterviewStage.COMPLETE:
                 return (
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button onClick={handleRestart} className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200">
                            Restart Interview
                        </button>
                        <button onClick={handleGoHome} className="w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200">
                            Return to Home
                        </button>
                    </div>
                );
            default:
                return (
                     <div className="text-center text-slate-400 p-4 bg-slate-800/50 rounded-lg">
                        {stage === InterviewStage.ANALYZING && "Analyzing your CV and preparing the interview..."}
                        {stage === InterviewStage.FEEDBACK && "Finalizing your feedback report..."}
                        {stage === InterviewStage.ERROR && "An error occurred. Please refresh the page to try again."}
                    </div>
                )
        }
    };

    if (isOnboarding) {
        return <Onboarding onGetStarted={() => setIsOnboarding(false)} />;
    }

    return (
        <div className="flex flex-col h-screen sm:h-[95vh] max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-md border border-slate-700 shadow-2xl rounded-lg sm:my-4">
             <header className="bg-slate-900/70 border-b border-slate-700 text-white p-4 rounded-t-lg flex items-center justify-center">
                <h1 className="font-brand text-xl tracking-widest uppercase">ORCA</h1>
            </header>
            <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-transparent">
                {messages.map((msg, index) => (
                    <ChatMessageComponent 
                        key={index} 
                        message={msg} 
                        interviewHistory={interviewHistory}
                    />
                ))}
                {isLoading && (
                    <div className="flex items-start gap-4 p-4">
                         <OrcaIcon className="w-10 h-10 flex-shrink-0 text-teal-400" />
                        <div className="max-w-xl rounded-lg p-4 bg-slate-700 text-white">
                           <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
                              </div>
                              <span className="text-sm text-slate-300 tabular-nums">
                                {stage === InterviewStage.ANALYZING ? `Analyzing CV... (${timer}s)`
                                    : stage === InterviewStage.FEEDBACK ? `Generating report... (${timer}s)`
                                    : `Generating response... (${timer}s)`
                                }
                              </span>
                           </div>
                        </div>
                    </div>
                )}
            </main>
            <footer className="p-4 border-t border-slate-700 bg-slate-900/70 rounded-b-lg">
                {renderInputArea()}
            </footer>
        </div>
    );
};

export default App;