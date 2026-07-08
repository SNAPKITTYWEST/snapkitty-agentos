'use client';

import { useState, useEffect } from 'react';
import agentData from '@/data/agent-personas.json';

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  status: string;
  personality: string;
  skills: string[];
  currentTask: string;
  quote: string;
}

export default function AgentGrid() {
  const [agents] = useState<Agent[]>(agentData.agents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<{ agent: string; text: string }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      const activities = [
        'Verifying envelope seal...',
        'Compiling ContextClip...',
        'Sealing memory bucket...',
        'Analyzing complexity bounds...',
        'Detecting anomaly...',
        'Coordinating swarm...',
        'Running P-time verifier...',
        'Updating universe sum...',
      ];
      const activity = activities[Math.floor(Math.random() * activities.length)];

      setMessages((prev) => [
        ...prev.slice(-8),
        { agent: randomAgent.name, text: activity },
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, [agents]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
            AgentOS Live
          </h1>
          <p className="text-xl text-gray-300">
            Interact with sovereign AI agents in real-time
          </p>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className="relative group cursor-pointer"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl"
                style={{
                  background: `linear-gradient(135deg, ${agent.color}40, ${agent.color}20)`,
                }}
              />
              <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 hover:border-cyan-500 transition-all duration-300 hover:scale-105">
                {/* Avatar */}
                <div className="text-6xl mb-4">{agent.avatar}</div>

                {/* Name & Role */}
                <h3 className="text-2xl font-bold mb-2" style={{ color: agent.color }}>
                  {agent.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">{agent.role}</p>

                {/* Status */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-gray-500 uppercase">{agent.status}</span>
                </div>

                {/* Current Task */}
                <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-400 mb-1">Current Task:</p>
                  <p className="text-sm text-cyan-400">{agent.currentTask}</p>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2">
                  {agent.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-full bg-slate-700/50 text-gray-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">Live Activity Feed</h2>
          <div className="space-y-2 font-mono text-sm min-h-[12rem]">
            {messages.length === 0 ? (
              <p className="text-gray-500">Waiting for agent activity...</p>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className="flex items-start gap-3 animate-fade-in">
                  <span className="text-cyan-400 shrink-0">[{msg.agent}]</span>
                  <span className="text-gray-300">{msg.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Agent Detail Modal */}
        {selectedAgent && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedAgent(null)}
          >
            <div
              className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-6 mb-6">
                <div className="text-8xl">{selectedAgent.avatar}</div>
                <div className="flex-1">
                  <h2
                    className="text-4xl font-bold mb-2"
                    style={{ color: selectedAgent.color }}
                  >
                    {selectedAgent.name}
                  </h2>
                  <p className="text-xl text-gray-400 mb-4">{selectedAgent.role}</p>
                  <p className="text-gray-300 italic">&ldquo;{selectedAgent.quote}&rdquo;</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">Personality</h3>
                  <p className="text-gray-300">{selectedAgent.personality}</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-slate-700 text-gray-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">Current Task</h3>
                  <p className="text-gray-300">{selectedAgent.currentTask}</p>
                </div>

                <button
                  onClick={() => setSelectedAgent(null)}
                  className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-bold hover:scale-105 transition-transform"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
