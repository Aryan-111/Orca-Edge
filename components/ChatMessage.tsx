import React from 'react';
import { ChatMessage, InterviewReport } from '../types';
import { UserIcon, OrcaIcon } from './Icons';
import ReportComponent from './Report';

interface ChatMessageProps {
  message: ChatMessage;
  interviewHistory: InterviewReport[];
}

// Helper function to parse markdown-like syntax into HTML
const formatTextForDisplay = (text: string) => {
    if (!text) return '';
    // Process block-level elements first, ensuring they are at the start of a line.
    // The 'gm' flags are crucial for this to work correctly on multi-line strings.
    return text
      .replace(/^---/gm, '<hr class="my-4 border-slate-600" />')
      .replace(/^###\s*(.*)/gm, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
      .replace(/^-\s*(.*)/gm, '<span class="block ml-4 relative before:content-[\'•\'] before:absolute before:-left-4">$1</span>')
      // Process inline elements after block elements
      .replace(/\*\*\s*(.*?)\s*\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-teal-400 hover:underline">$1</a>');
};


const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, interviewHistory }) => {
  const isUser = message.sender === 'user';
  
  if (message.isReport && message.reportData) {
      const previousReport = interviewHistory.find(
          (report) => new Date(report.date) < new Date(message.reportData!.date)
      );

      return (
          <div className="flex items-start gap-4 p-4 animate-fade-in-down">
              <OrcaIcon className="w-10 h-10 flex-shrink-0 text-teal-400" />
              <ReportComponent
                  reportData={message.reportData}
                  previousReportData={previousReport}
              />
          </div>
      );
  }

  const containerClasses = `flex items-start gap-4 p-4 ${!isUser ? 'animate-fade-in-down' : ''}`;
  const bubbleClasses = `max-w-xl rounded-lg p-6 shadow-lg text-white ${isUser ? 'bg-teal-600 rounded-br-none ml-auto' : 'bg-slate-600 rounded-bl-none'}`;
  const textClasses = "whitespace-pre-wrap text-base font-medium leading-relaxed";
  const userIconClasses = "w-8 h-8 flex-shrink-0 rounded-full p-1";

  // Separate feedback from the main message content
  const feedbackRegex = /\*Feedback:\* (.*?)(?:\n\n|\n|$)/s;
  const feedbackMatch = message.text.match(feedbackRegex);
  const feedbackText = feedbackMatch ? feedbackMatch[1].trim() : null;
  const mainText = feedbackText ? message.text.replace(feedbackMatch[0], '').trim() : message.text;

  // Format both parts for safe HTML rendering
  const formattedMainText = formatTextForDisplay(mainText);
  const formattedFeedbackText = feedbackText ? formatTextForDisplay(feedbackText) : null;

  return (
    <div className={containerClasses}>
      {!isUser && <OrcaIcon className="w-10 h-10 flex-shrink-0 text-teal-400" />}
      <div className={bubbleClasses}>
        {formattedFeedbackText && (
            <div className="border-l-2 border-teal-400/60 italic pl-4 mb-4 text-base opacity-90">
                <strong>Feedback:</strong> 
                <span className="not-italic" dangerouslySetInnerHTML={{ __html: ' ' + formattedFeedbackText }} />
            </div>
        )}
        <div className={textClasses} dangerouslySetInnerHTML={{ __html: formattedMainText }} />
      </div>
      {isUser && <UserIcon className={`${userIconClasses} bg-teal-600 text-white`} />}
    </div>
  );
};

export default ChatMessageComponent;