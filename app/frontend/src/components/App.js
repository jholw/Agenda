import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import TaskManager from "./components/TaskManager";
import ProjectManager from "./components/ProjectManager";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchTasks();
    fetchProjects();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'tasks':
        return <TaskManager tasks={tasks} fetchTasks={fetchTasks} projects={projects} />;
      case 'projects':
        return <ProjectManager projects={projects} fetchProjects={fetchProjects} tasks={tasks} />;
      default:
        return <Dashboard stats={stats} tasks={tasks} setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="App">
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
          {/* Navigation */}
          <nav className="bg-white shadow-lg border-b border-purple-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-purple-800">
                    📋 Agenda de Tarefas
                  </h1>
                </div>
                <div className="flex space-x-4 items-center">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`nav-item ${currentView === 'dashboard' ? 'nav-item-active' : 'nav-item-inactive'}`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentView('tasks')}
                    className={`nav-item ${currentView === 'tasks' ? 'nav-item-active' : 'nav-item-inactive'}`}
                  >
                    Tarefas
                  </button>
                  <button
                    onClick={() => setCurrentView('projects')}
                    className={`nav-item ${currentView === 'projects' ? 'nav-item-active' : 'nav-item-inactive'}`}
                  >
                    Projetos
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={renderContent()} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </div>
  );
}

const Dashboard = ({ stats, tasks, setCurrentView }) => {
  const recentTasks = tasks.slice(0, 5);
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stats-card stats-card-total">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white opacity-90">Total de Tarefas</p>
              <p className="text-3xl font-bold text-white">{stats.total_tasks || 0}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stats-card stats-card-pending">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white opacity-90">A Fazer</p>
              <p className="text-3xl font-bold text-white">{stats.todo_tasks || 0}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stats-card stats-card-scheduled">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white opacity-90">Agendadas</p>
              <p className="text-3xl font-bold text-white">{stats.scheduled_tasks || 0}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stats-card stats-card-completed">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white opacity-90">Concluídas</p>
              <p className="text-3xl font-bold text-white">{stats.completed_tasks || 0}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Tarefas Recentes</h2>
          <button
            onClick={() => setCurrentView('tasks')}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            Ver todas →
          </button>
        </div>
        
        <div className="space-y-3">
          {recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    task.status === 'completed' ? 'bg-green-500' :
                    task.status === 'scheduled' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-800">{task.title}</p>
                    <p className="text-sm text-gray-600">{task.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>Nenhuma tarefa encontrada. Comece criando uma nova tarefa!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;