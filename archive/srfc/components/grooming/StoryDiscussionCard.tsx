import React, { useState } from 'react';
import { 
  XMarkIcon, 
  PencilIcon, 
  PlusIcon,
  CheckIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import type { GroomingSessionStory, Story } from '../../types/database';

interface StoryDiscussionCardProps {
  sessionStory: GroomingSessionStory & { story: Story };
  onClose: () => void;
  onUpdateStatus: (status: 'pending' | 'discussed' | 'deferred' | 'split' | 'rejected') => Promise<void>;
  onAddDiscussionPoint: (point: string) => Promise<void>;
  onAddDecision: (decision: string) => Promise<void>;
  onAddQuestion: (question: string) => Promise<void>;
  onUpdateTechnicalNotes: (notes: string) => Promise<void>;
  onUpdateRiskRating: (rating: number) => Promise<void>;
  onUpdateComplexityRating: (rating: number) => Promise<void>;
  onSplitStory: () => void;
  sessionStatus: 'planned' | 'in_progress' | 'completed';
}

export function StoryDiscussionCard({
  sessionStory,
  onClose,
  onUpdateStatus,
  onAddDiscussionPoint,
  onAddDecision,
  onAddQuestion,
  onUpdateTechnicalNotes,
  onUpdateRiskRating,
  onUpdateComplexityRating,
  onSplitStory,
  sessionStatus
}: StoryDiscussionCardProps) {
  const [loading, setLoading] = useState(false);
  const [newDiscussionPoint, setNewDiscussionPoint] = useState('');
  const [newDecision, setNewDecision] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [technicalNotes, setTechnicalNotes] = useState(sessionStory.technical_notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [riskRating, setRiskRating] = useState(sessionStory.risk_rating || 0);
  const [complexityRating, setComplexityRating] = useState(sessionStory.complexity_rating || 0);

  const isReadOnly = sessionStatus === 'completed';

  const handleUpdateStatus = async (status: 'pending' | 'discussed' | 'deferred' | 'split' | 'rejected') => {
    if (loading || isReadOnly) return;
    
    setLoading(true);
    try {
      await onUpdateStatus(status);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDiscussionPoint = async () => {
    if (!newDiscussionPoint.trim() || loading || isReadOnly) return;
    
    setLoading(true);
    try {
      await onAddDiscussionPoint(newDiscussionPoint.trim());
      setNewDiscussionPoint('');
    } catch (error) {
      console.error('Error adding discussion point:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDecision = async () => {
    if (!newDecision.trim() || loading || isReadOnly) return;
    
    setLoading(true);
    try {
      await onAddDecision(newDecision.trim());
      setNewDecision('');
    } catch (error) {
      console.error('Error adding decision:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim() || loading || isReadOnly) return;
    
    setLoading(true);
    try {
      await onAddQuestion(newQuestion.trim());
      setNewQuestion('');
    } catch (error) {
      console.error('Error adding question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTechnicalNotes = async () => {
    if (loading || isReadOnly) return;
    
    setLoading(true);
    try {
      await onUpdateTechnicalNotes(technicalNotes);
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Error updating technical notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRiskRating = async (rating: number) => {
    if (loading || isReadOnly) return;
    
    setRiskRating(rating);
    setLoading(true);
    try {
      await onUpdateRiskRating(rating);
    } catch (error) {
      console.error('Error updating risk rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComplexityRating = async (rating: number) => {
    if (loading || isReadOnly) return;
    
    setComplexityRating(rating);
    setLoading(true);
    try {
      await onUpdateComplexityRating(rating);
    } catch (error) {
      console.error('Error updating complexity rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'discussed': return 'bg-green-100 text-green-800';
      case 'deferred': return 'bg-yellow-100 text-yellow-800';
      case 'split': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
              sessionStory.story.level === 'epic' ? 'bg-purple-100 text-purple-800' :
              sessionStory.story.level === 'feature' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {sessionStory.story.level || 'story'}
            </span>
            <h2 className="text-xl font-semibold text-gray-900">{sessionStory.story.pb_title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Story details */}
            <div className="md:col-span-2 space-y-6">
              {/* Story description */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm text-gray-900">{sessionStory.story.description || 'No description provided.'}</p>
              </div>

              {/* Acceptance criteria */}
              {sessionStory.story.acceptance_criteria && sessionStory.story.acceptance_criteria.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Acceptance Criteria</h3>
                  <ul className="mt-1 list-disc list-inside text-sm text-gray-900 space-y-1">
                    {sessionStory.story.acceptance_criteria.map((criteria, index) => (
                      <li key={index}>{criteria}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technical notes */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500">Technical Notes</h3>
                  {!isReadOnly && (
                    <button
                      onClick={() => setIsEditingNotes(!isEditingNotes)}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      {isEditingNotes ? 'Cancel' : 'Edit'}
                    </button>
                  )}
                </div>
                
                {isEditingNotes ? (
                  <div className="mt-1">
                    <textarea
                      value={technicalNotes}
                      onChange={(e) => setTechnicalNotes(e.target.value)}
                      rows={4}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Add technical implementation details, architecture notes, etc."
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleSaveTechnicalNotes}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save Notes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {technicalNotes || 'No technical notes yet.'}
                  </p>
                )}
              </div>

              {/* Discussion points */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Discussion Points</h3>
                {!isReadOnly && (
                  <div className="mt-1 flex">
                    <input
                      type="text"
                      value={newDiscussionPoint}
                      onChange={(e) => setNewDiscussionPoint(e.target.value)}
                      placeholder="Add a discussion point..."
                      className="block w-full border-gray-300 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <button
                      onClick={handleAddDiscussionPoint}
                      disabled={!newDiscussionPoint.trim() || loading}
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                {sessionStory.discussion_points && sessionStory.discussion_points.length > 0 ? (
                  <ul className="mt-3 divide-y divide-gray-200">
                    {sessionStory.discussion_points.map((point, index) => (
                      <li key={index} className="py-2">
                        <p className="text-sm text-gray-900">{point}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">No discussion points recorded yet.</p>
                )}
              </div>

              {/* Decisions */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Decisions</h3>
                {!isReadOnly && (
                  <div className="mt-1 flex">
                    <input
                      type="text"
                      value={newDecision}
                      onChange={(e) => setNewDecision(e.target.value)}
                      placeholder="Add a decision..."
                      className="block w-full border-gray-300 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <button
                      onClick={handleAddDecision}
                      disabled={!newDecision.trim() || loading}
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                {sessionStory.decisions && sessionStory.decisions.length > 0 ? (
                  <ul className="mt-3 divide-y divide-gray-200">
                    {sessionStory.decisions.map((decision, index) => (
                      <li key={index} className="py-2">
                        <p className="text-sm text-gray-900">{decision}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">No decisions recorded yet.</p>
                )}
              </div>

              {/* Questions */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Questions</h3>
                {!isReadOnly && (
                  <div className="mt-1 flex">
                    <input
                      type="text"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Add a question..."
                      className="block w-full border-gray-300 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <button
                      onClick={handleAddQuestion}
                      disabled={!newQuestion.trim() || loading}
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                {sessionStory.questions && sessionStory.questions.length > 0 ? (
                  <ul className="mt-3 divide-y divide-gray-200">
                    {sessionStory.questions.map((question, index) => (
                      <li key={index} className="py-2">
                        <p className="text-sm text-gray-900">{question}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">No questions recorded yet.</p>
                )}
              </div>
            </div>

            {/* Right column - Status and actions */}
            <div className="space-y-6">
              {/* Status */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Status</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUpdateStatus('pending')}
                    disabled={sessionStory.status === 'pending' || loading || isReadOnly}
                    className={`inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded ${
                      sessionStory.status === 'pending' 
                        ? 'bg-gray-100 text-gray-800 border-gray-400' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } disabled:opacity-50`}
                  >
                    <ClockIcon className="h-3.5 w-3.5 mr-1" />
                    Pending
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus('discussed')}
                    disabled={sessionStory.status === 'discussed' || loading || isReadOnly}
                    className={`inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded ${
                      sessionStory.status === 'discussed' 
                        ? 'bg-green-100 text-green-800 border-green-400' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } disabled:opacity-50`}
                  >
                    <CheckIcon className="h-3.5 w-3.5 mr-1" />
                    Discussed
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus('deferred')}
                    disabled={sessionStory.status === 'deferred' || loading || isReadOnly}
                    className={`inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded ${
                      sessionStory.status === 'deferred' 
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-400' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } disabled:opacity-50`}
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />
                    Deferred
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus('split')}
                    disabled={sessionStory.status === 'split' || loading || isReadOnly}
                    className={`inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded ${
                      sessionStory.status === 'split' 
                        ? 'bg-blue-100 text-blue-800 border-blue-400' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } disabled:opacity-50`}
                  >
                    <DocumentDuplicateIcon className="h-3.5 w-3.5 mr-1" />
                    Split
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus('rejected')}
                    disabled={sessionStory.status === 'rejected' || loading || isReadOnly}
                    className={`inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded ${
                      sessionStory.status === 'rejected' 
                        ? 'bg-red-100 text-red-800 border-red-400' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } disabled:opacity-50`}
                  >
                    <XMarkIcon className="h-3.5 w-3.5 mr-1" />
                    Rejected
                  </button>
                </div>
              </div>

              {/* Complexity rating */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Complexity Rating</h3>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleUpdateComplexityRating(rating)}
                      disabled={loading || isReadOnly}
                      className={`w-8 h-8 rounded-full mx-1 flex items-center justify-center ${
                        complexityRating >= rating 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      } disabled:opacity-50`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {complexityRating === 0 ? 'Not rated' : `Complexity: ${complexityRating}/5`}
                </p>
              </div>

              {/* Risk rating */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Risk Rating</h3>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleUpdateRiskRating(rating)}
                      disabled={loading || isReadOnly}
                      className={`w-8 h-8 rounded-full mx-1 flex items-center justify-center ${
                        riskRating >= rating 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      } disabled:opacity-50`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {riskRating === 0 ? 'Not rated' : `Risk: ${riskRating}/5`}
                </p>
              </div>

              {/* Story points */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500">Story Points</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {sessionStory.story.story_points || 'Not estimated'}
                </p>
              </div>

              {/* Split story button */}
              {!isReadOnly && (
                <button
                  onClick={onSplitStory}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                  Split Story
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
