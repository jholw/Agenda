import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProjectManager = ({ projects, fetchProjects, tasks }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: ''
  });
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    estimated_time: '',
    tags: []
  });

  useEffect(() => {
    if (selectedProject) {
      const filteredTasks = tasks.filter(task => task.project_id === selectedProject.id);
      setProjectTasks(filteredTasks);
    }
  }, [selectedProject, tasks]);

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await axios.put(`${API}/projects/${editingProject.id}`, projectForm);
      } else {
        await axios.post(`${API}/projects`, projectForm);
      }
      fetchProjects();
      resetProjectForm();
      setShowProjectModal(false);
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...taskForm,
        project_id: selectedProject.id,
        tags: taskForm.tags.filter(tag => tag.trim() !== ''),
        estimated_time: taskForm.estimated_time ? parseInt(taskForm.estimated_time) : null
      };

      if (editingTask) {
        await axios.put(`${API}/tasks/${editingTask.id}`, taskData);
      } else {
        await axios.post(`${API}/tasks`, taskData);
      }
      
      // Refresh tasks
      const response = await axios.get(`${API}/tasks`);
      const filteredTasks = response.data.filter(task => task.project_id === selectedProject.id);
      setProjectTasks(filteredTasks);
      
      resetTaskForm();
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleProjectEdit = (project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || ''
    });
    setShowProjectModal(true);
  };

  const handleTaskEdit = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date || '',
      estimated_time: task.estimated_time || '',
      tags: task.tags || []
    });
    setShowTaskModal(true);
  };

  const handleProjectDelete = async (projectId) => {
    if (window.confirm('Tem certeza que deseja excluir este projeto? Todas as tarefas relacionadas serão mantidas, mas não estarão mais associadas ao projeto.')) {
      try {
        await axios.delete(`${API}/projects/${projectId}`);
        fetchProjects();
        if (selectedProject && selectedProject.id === projectId) {
          setSelectedProject(null);
        }
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await axios.delete(`${API}/tasks/${taskId}`);
        const filteredTasks = projectTasks.filter(task => task.id !== taskId);
        setProjectTasks(filteredTasks);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`${API}/tasks/${taskId}`, { status: newStatus });
      const updatedTasks = projectTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      setProjectTasks(updatedTasks);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const resetProjectForm = () => {
    setProjectForm({ name: '', description: '' });
    setEditingProject(null);
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      estimated_time: '',
      tags: []
    });
    setEditingTask(null);
  };

  const handleTaskTagChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setTaskForm({ ...taskForm, tags });
  };

  const getTasksByStatus = (status) => {
    return projectTasks.filter(task => task.status === status);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (selectedProject) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedProject(null)}
              className="text-purple-600 hover:text-purple-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{selectedProject.name}</h1>
              {selectedProject.description && (
                <p className="text-gray-600 mt-1">{selectedProject.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowTaskModal(true)}
            className="btn-primary"
          >
            + Nova Tarefa
          </button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Do Column */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <h3 className="text-lg font-semibold text-gray-800">A Fazer</h3>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                {getTasksByStatus('todo').length}
              </span>
            </div>
            <div className="space-y-3">
              {getTasksByStatus('todo').map(task => (
                <div key={task.id} className="kanban-card">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-800 flex-1 pr-2">{task.title}</h4>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleTaskEdit(task)}
                        className="text-purple-600 hover:text-purple-800 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleTaskDelete(task.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                    <select
                      value={task.status}
                      onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="todo">A Fazer</option>
                      <option value="scheduled">Agendada</option>
                      <option value="completed">Concluída</option>
                    </select>
                  </div>
                  
                  {task.due_date && (
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDueDate(task.due_date)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Scheduled Column */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <h3 className="text-lg font-semibold text-gray-800">Agendadas</h3>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                {getTasksByStatus('scheduled').length}
              </span>
            </div>
            <div className="space-y-3">
              {getTasksByStatus('scheduled').map(task => (
                <div key={task.id} className="kanban-card">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-800 flex-1 pr-2">{task.title}</h4>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleTaskEdit(task)}
                        className="text-purple-600 hover:text-purple-800 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleTaskDelete(task.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                    <select
                      value={task.status}
                      onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="todo">A Fazer</option>
                      <option value="scheduled">Agendada</option>
                      <option value="completed">Concluída</option>
                    </select>
                  </div>
                  
                  {task.due_date && (
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDueDate(task.due_date)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Completed Column */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <h3 className="text-lg font-semibold text-gray-800">Concluídas</h3>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                {getTasksByStatus('completed').length}
              </span>
            </div>
            <div className="space-y-3">
              {getTasksByStatus('completed').map(task => (
                <div key={task.id} className="kanban-card">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-800 flex-1 pr-2">{task.title}</h4>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleTaskEdit(task)}
                        className="text-purple-600 hover:text-purple-800 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleTaskDelete(task.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                    <select
                      value={task.status}
                      onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="todo">A Fazer</option>
                      <option value="scheduled">Agendada</option>
                      <option value="completed">Concluída</option>
                    </select>
                  </div>
                  
                  {task.due_date && (
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDueDate(task.due_date)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task Modal */}
        {showTaskModal && (
          <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowTaskModal(false);
                      resetTaskForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleTaskSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      required
                      className="form-input"
                      placeholder="Digite o título da tarefa"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      rows={3}
                      className="form-textarea"
                      placeholder="Descreva a tarefa..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prioridade
                      </label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                        className="form-select"
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Vencimento
                      </label>
                      <input
                        type="date"
                        value={taskForm.due_date}
                        onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tempo Estimado (minutos)
                    </label>
                    <input
                      type="number"
                      value={taskForm.estimated_time}
                      onChange={(e) => setTaskForm({ ...taskForm, estimated_time: e.target.value })}
                      className="form-input"
                      placeholder="Ex: 30"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      value={taskForm.tags.join(', ')}
                      onChange={handleTaskTagChange}
                      className="form-input"
                      placeholder="Ex: urgente, trabalho, pessoal"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTaskModal(false);
                        resetTaskForm();
                      }}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      {editingTask ? 'Atualizar' : 'Criar'} Tarefa
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Projetos</h1>
        <button
          onClick={() => setShowProjectModal(true)}
          className="btn-primary"
        >
          + Novo Projeto
        </button>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const projectTaskCount = tasks.filter(task => task.project_id === project.id).length;
          const completedTaskCount = tasks.filter(task => task.project_id === project.id && task.status === 'completed').length;
          
          return (
            <div key={project.id} className="task-card cursor-pointer" onClick={() => setSelectedProject(project)}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 flex-1 pr-2">
                  {project.name}
                </h3>
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProjectEdit(project);
                    }}
                    className="text-purple-600 hover:text-purple-800 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProjectDelete(project.id);
                    }}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {project.description && (
                <p className="text-gray-600 mb-3 text-sm">{project.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {projectTaskCount} tarefas
                  </span>
                  <span className="text-sm text-gray-500">
                    {completedTaskCount} concluídas
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${projectTaskCount > 0 ? (completedTaskCount / projectTaskCount) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {projectTaskCount > 0 ? Math.round((completedTaskCount / projectTaskCount) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-500 text-lg">Nenhum projeto encontrado</p>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
                </h2>
                <button
                  onClick={() => {
                    setShowProjectModal(false);
                    resetProjectForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleProjectSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Projeto *
                  </label>
                  <input
                    type="text"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    required
                    className="form-input"
                    placeholder="Digite o nome do projeto"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    rows={3}
                    className="form-textarea"
                    placeholder="Descreva o projeto..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProjectModal(false);
                      resetProjectForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingProject ? 'Atualizar' : 'Criar'} Projeto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;