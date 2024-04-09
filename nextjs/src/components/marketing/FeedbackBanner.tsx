"use client"
import { useState, useEffect, SetStateAction } from 'react';
import { usePostHog } from 'posthog-js/react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const FeedbackBanner = () => {
    const posthog = usePostHog();
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [showTextArea, setShowTextArea] = useState(false);
    const [textAreaValue, setTextAreaValue] = useState('');
    const [showBanner, setShowBanner] = useState(true);
    const [validationMessage, setValidationMessage] = useState('');

    interface Survey {
        id: string;
        name: string;
        type: string;
    }

    useEffect(() => {
        posthog.getActiveMatchingSurveys((surveys) => {
            const firstSurvey = surveys.find(survey => survey.type === 'api');
            if (firstSurvey) {
                setSurvey(firstSurvey);
                posthog.capture("survey shown", {
                    $survey_id: firstSurvey.id,
                    $survey_name: firstSurvey.name
                });
            }
        });
    }, []);

    const handleTextAreaChange = (event: { target: { value: SetStateAction<string>; }; }) => {
        setTextAreaValue(event.target.value);
        if (validationMessage) setValidationMessage('');
    };

    const submitFeedback = () => {
        if (survey && textAreaValue.trim()) {
            posthog.capture("survey sent", {
                $survey_id: survey.id,
                $survey_name: survey.name,
                $survey_response: textAreaValue
            });
            setTextAreaValue('');
            setFeedbackSubmitted(true);
            setShowTextArea(false);
        } else {
            setValidationMessage("This field can't be blank.");
        }
    };

    const closeBanner = () => setShowBanner(false);

    if (!showBanner) return null;

    return (
        <div className="absolute top-0 left-0 right-0 bg-brandBlue z-20 p-4 flex flex-col gap-4">
            <div className="flex justify-between">
                <div><h3 className="text-hLg">Alpha software</h3>
                    <p>This is a rapidly changing prototype</p></div>
                <svg onClick={closeBanner} xmlns="http://www.w3.org/2000/svg" width="33" height="36" viewBox="0 0 33 36" fill="none" style={{ cursor: 'pointer' }}>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M16.2804 2.29877C16.5732 2.00587 16.5732 1.53099 16.2804 1.23809C15.9875 0.94519 15.5126 0.94519 15.2197 1.23809L8.25 8.20788L1.2803 1.23809C0.987401 0.94519 0.512524 0.94519 0.219624 1.23809C-0.0732756 1.53099 -0.0732756 2.00587 0.219624 2.29877L7.18937 9.26852L0.219624 16.2383C-0.0732756 16.5312 -0.0732756 17.006 0.219624 17.2989C0.512524 17.5918 0.987401 17.5918 1.2803 17.2989L8.25 10.3292L15.2197 17.2989C15.5126 17.5918 15.9875 17.5918 16.2804 17.2989C16.5732 17.006 16.5732 16.5312 16.2804 16.2383L9.31065 9.26852L16.2804 2.29877Z" fill="white" />
                </svg>
                </div>
            <div className="max-w-prose">
                <div className="flex flex-col gap-2 mb-4">
                    <Link
                        className=""
                        href="/signup"
                    >
                        Join the waitlist
                    </Link>
                    <Link
                        className=""
                        href="https://mapped.commonknowledge.coop/"
                    >
                        Mapped v.1
                    </Link>
                </div>
                {!feedbackSubmitted ? (
                    <div>
                        {showTextArea && survey ? (
                            <div>
                                <Textarea value={textAreaValue} onChange={handleTextAreaChange} className='mb-2'></Textarea>
                                {validationMessage && <div className='mb-2'>{validationMessage}</div>}
                                <Button onClick={submitFeedback} variant="reverse" size='sm'>
                                    Send feedback
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={() => setShowTextArea(true)} variant="reverse" size='sm'>Leave feedback on Mapped</Button>
                        )}
                    </div>
                ) : (
                    <div>Thanks for submitting your feedback</div>
                )}
            </div>
        </div >
    );
};

export default FeedbackBanner;