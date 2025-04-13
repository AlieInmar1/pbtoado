import React from 'react';
import { StoriesTable } from '../components/StoriesTable';
import { Toolbar } from '../components/Toolbar';
import { AIAssistant } from '../components/AIAssistant';
import { useState } from 'react';

export function Dashboard() {
  return (
    <div>
      <div className="p-4">
        <Toolbar />
        <StoriesTable
          className="mt-4"
        />
      </div>
      <div className="fixed bottom-8 right-8 z-50">
        <AIAssistant />
      </div>
    </div>
  );
}