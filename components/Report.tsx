import React, { useState, useRef, forwardRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InterviewReport } from '../types';
import { DownloadIcon, ArrowUpIcon, ArrowDownIcon, ArrowRightIcon, NoteIcon, LightBulbIcon, ExternalLinkIcon } from './Icons';

interface ReportProps {
    reportData: InterviewReport;
    previousReportData?: InterviewReport;
}

const ScoreChangeIndicator: React.FC<{ change: number }> = ({ change }) => {
    if (change > 0) {
        return <span className="flex items-center text-sm text-green-400"><ArrowUpIcon className="w-4 h-4 mr-1"/>+{change.toFixed(1)}</span>;
    }
    if (change < 0) {
        return <span className="flex items-center text-sm text-red-400"><ArrowDownIcon className="w-4 h-4 mr-1"/>{change.toFixed(1)}</span>;
    }
    return <span className="flex items-center text-sm text-slate-400"><ArrowRightIcon className="w-4 h-4 mr-1"/>-</span>;
};

const ScoreDisplay: React.FC<{ score: number, previousScore?: number }> = ({ score, previousScore }) => {
    const scoreChange = previousScore !== undefined ? score - previousScore : 0;
    
    return (
        <div className="flex flex-col items-center">
            <div className="text-4xl font-bold text-teal-300">{score.toFixed(1)}<span className="text-2xl text-slate-400">/10</span></div>
            {previousScore !== undefined && <ScoreChangeIndicator change={scoreChange} />}
        </div>
    );
};


const ReportComponent = forwardRef<HTMLDivElement, ReportProps>(({ reportData, previousReportData }, ref) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const internalRef = useRef<HTMLDivElement>(null);
    const reportElementRef = ref || internalRef;

    const handleDownload = async () => {
        if (!reportElementRef || typeof reportElementRef === 'function' || !reportElementRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(reportElementRef.current, {
                scale: 2,
                backgroundColor: '#1e293b',
                useCORS: true,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const canvasAspectRatio = canvas.width / canvas.height;
            const imgWidth = pdfWidth - 20;
            const imgHeight = imgWidth / canvasAspectRatio;
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`orca-interview-report-${new Date(reportData.date).toLocaleDateString()}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div ref={reportElementRef} className="bg-slate-800 rounded-lg p-6 shadow-lg text-white max-w-3xl w-full border border-slate-700">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-teal-300">Interview Performance Report</h2>
                    <p className="text-sm text-slate-400">{new Date(reportData.date).toLocaleString()}</p>
                </div>
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-900 bg-teal-500 hover:bg-teal-400 px-3 py-2 rounded-lg transition-colors duration-200 disabled:bg-teal-300 disabled:cursor-wait"
                >
                    <DownloadIcon className="w-4 h-4" />
                    {isDownloading ? '...' : 'PDF'}
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-900/50 p-4 rounded-lg">
                <div className="md:col-span-1 flex justify-center items-center">
                   <ScoreDisplay score={reportData.overallScore} previousScore={previousReportData?.overallScore} />
                </div>
                <div className="md:col-span-2">
                    {reportData.progress_comparison?.improvement_summary ? (
                         <p className="text-slate-300 italic">"{reportData.progress_comparison.improvement_summary}"</p>
                    ): (
                        <p className="text-slate-300 italic">"This is your first interview with Orca. Complete another to track your progress!"</p>
                    )}
                </div>
            </div>

            {reportData.sections.map((section, index) => {
                const prevSection = previousReportData?.sections.find(s => s.category === section.category);
                return (
                    <div key={index} className="mb-6 p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-slate-200">{section.category}</h3>
                            <ScoreDisplay score={section.score} previousScore={prevSection?.score} />
                        </div>
                        <p className="text-slate-300 whitespace-pre-wrap">{section.feedback}</p>
                    </div>
                );
            })}

            <div className="mb-6">
                <h3 className="text-xl font-semibold text-slate-200 mb-3 flex items-center gap-2"><NoteIcon className="w-6 h-6 text-teal-400" />Personalized Learning Resources</h3>
                <div className="space-y-3">
                    {reportData.suggestedResources.map((res, i) => (
                         <a 
                            key={i} 
                            href={res.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block bg-slate-700/50 p-4 rounded-lg hover:bg-slate-700 transition-colors duration-200 group border border-transparent hover:border-teal-500"
                        >
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-teal-400 group-hover:underline">{res.title}</h4>
                                    <p className="text-sm text-slate-400 mt-1">{res.description}</p>
                                </div>
                                <ExternalLinkIcon className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition-colors duration-200 flex-shrink-0 mt-1" />
                            </div>
                        </a>
                    ))}
                </div>
            </div>
            
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-slate-200 mb-3 flex items-center gap-2"><LightBulbIcon className="w-6 h-6 text-teal-400" />Final Tip from Orca</h3>
                <p className="bg-slate-700/50 p-4 rounded-lg italic text-slate-300">"{reportData.finalTip}"</p>
            </div>
        </div>
    );
});

export default ReportComponent;