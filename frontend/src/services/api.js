import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({ baseURL: API_BASE, timeout: 10000 });

export const universityColors = {
  uet: '#1a3a6b',
  punjab: '#2d6a4f',
  nuces: '#7b2d8b',
};

export const universityLabels = {
  uet: 'UET Lahore',
  punjab: 'PU Lahore',
  nuces: 'NUCES (FAST)',
};

// System
export const getHealth = () => api.get('/health');
export const getNodeStatus = () => api.get('/nodes/status');
export const getUniversities = () => api.get('/universities');
export const getOverview = () => api.get('/overview');

// Departments
export const getDepartments = (university) =>
  api.get('/departments', { params: university ? { university } : {} });

// Programs
export const getPrograms = (params = {}) => api.get('/programs', { params });
export const comparePrograms = (universities, degree_type) =>
  api.get('/programs/compare', { params: { universities: universities.join(','), degree_type } });

// Admissions
export const getAdmissions = (params = {}) => api.get('/admissions', { params });

// Fees
export const getFees = (params = {}) => api.get('/fees', { params });

// Scholarships
export const getScholarships = (params = {}) => api.get('/scholarships', { params });

// Merit Lists
export const getMeritLists = (params = {}) => api.get('/merit-lists', { params });

// Search
export const search = (q) => api.get('/search', { params: { q } });

// Replication
export const getReplicationLogs = () => api.get('/replication/logs');
export const simulateReplication = () => api.post('/replication/simulate');

export default api;
