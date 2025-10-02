import React from 'react';
import { CvAnalysisIcon, TargetIcon, FeedbackIcon } from './Icons';

interface OnboardingProps {
  onGetStarted: () => void;
}

const AnimatedMascot = () => (
    <div className="mb-8 mx-auto w-48 h-48">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
            <g className="animate-float">
                {/* Shadow */}
                <ellipse cx="100" cy="185" rx="55" ry="8" fill="black" opacity="0.1" filter="url(#blur)" />
                
                {/* Orca Body */}
                <g transform="rotate(-10 100 100) translate(0, -10)">
                    {/* Tail */}
                    <path d="M25 110 C 5 120, 5 90, 25 100 Z" fill="url(#bot-body-gradient)" stroke="#2dd4bf" strokeWidth="1.5"/>
                    <path d="M25 110 C 5 100, 5 130, 25 120 Z" fill="url(#bot-body-gradient)" stroke="#2dd4bf" strokeWidth="1.5"/>

                    {/* Main Body */}
                    <path d="M30,110 C 60,80 150,50 180,90 C 190,120 150,160 110,150 C 70,140 40,130 30,110 Z" fill="url(#bot-body-gradient)" stroke="#2dd4bf" strokeWidth="1.5" />
                    
                    {/* Dorsal Fin */}
                    <path d="M100,75 C 110,45 140,55 130,75 Z" fill="url(#bot-body-gradient)" stroke="#2dd4bf" strokeWidth="1.5"/>
                    
                    {/* Belly Patch */}
                    <path d="M80,145 C 120,155 165,130 170,100 C 160,125 120,145 85,140 Z" fill="#e2e8f0"/>

                    {/* Eye Patch */}
                    <ellipse cx="150" cy="85" rx="15" ry="10" fill="#e2e8f0" transform="rotate(15 150 85)"/>
                    
                    {/* Eye */}
                    <g className="animate-blink">
                        <circle cx="155" cy="88" r="4" fill="#1e293b" />
                    </g>

                    {/* Flipper */}
                    <path d="M110,125 C 90,145 100,155 120,140 Z" fill="url(#bot-body-gradient)" stroke="#2dd4bf" strokeWidth="1.5"/>

                </g>
            </g>

            <defs>
                <linearGradient id="bot-body-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="50%" stopColor="#134e4a" />
                    <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <filter id="blur">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                </filter>
            </defs>
        </svg>
    </div>
);


const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
    <div className="flex flex-col items-center p-8 bg-slate-800/30 backdrop-blur-lg rounded-2xl border border-slate-700/50 transition-all duration-300 hover:-translate-y-2 hover:border-slate-600">
      {icon}
      <h3 className="text-xl font-semibold mb-2 text-slate-100">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
);


const Onboarding: React.FC<OnboardingProps> = ({ onGetStarted }) => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen text-white p-6 overflow-hidden">
        {/* Animated abstract shapes for depth */}
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-1/4 right-0 w-96 h-96 bg-teal-500/10 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/4 -right-1/4 w-80 h-80 bg-sky-500/10 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      
      <div className="relative z-10 text-center animate-fade-in-up max-w-5xl w-full">
        <AnimatedMascot />
        <h1 className="font-brand text-6xl sm:text-8xl tracking-widest mb-8 bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-teal-400 uppercase">
          ORCA
        </h1>
        <div className="max-w-2xl mx-auto mb-16">
            <p className="text-xl text-slate-200 mb-2">Ace your next interview.</p>
            <p className="text-lg text-slate-400">Get CV-driven questions and instant, actionable feedback to build your confidence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-auto mb-20">
          <FeatureCard 
            icon={<CvAnalysisIcon className="w-10 h-10 mb-4 text-teal-300" />}
            title="CV-Powered Analysis"
            description="Upload your CV for questions tailored to your specific skills and experiences."
          />
          <FeatureCard 
            icon={<TargetIcon className="w-10 h-10 mb-4 text-cyan-300" />}
            title="Role-Specific Questions"
            description="Practice with relevant questions for your target role—from HR to technical."
          />
          <FeatureCard 
            icon={<FeedbackIcon className="w-10 h-10 mb-4 text-sky-300" />}
            title="Instant Feedback"
            description="Receive a detailed performance report with scores and tips to improve."
          />
        </div>

        <button
          onClick={onGetStarted}
          className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-4 px-12 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-xl shadow-teal-500/30"
        >
          Begin Your Practice Interview
        </button>
      </div>
      <style>{`
        body { font-family: 'Poppins', sans-serif; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 6s infinite ease-in-out;
        }

        @keyframes blink {
            0%, 90%, 100% { transform: scaleY(1); }
            95% { transform: scaleY(0.1); }
        }
        .animate-blink {
            animation: blink 4s infinite ease-in-out;
            transform-origin: center;
        }

        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 8s infinite ease-in-out; }
        .animation-delay-2000 { animation-delay: -2.6s; }
        .animation-delay-4000 { animation-delay: -5.3s; }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;