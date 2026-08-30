const API_BASE_URL = 'http://localhost:5000/api';

export const DEMO_EMPLOYEE_ID = '184fe2b5-987b-4568-a4bd-b657ee7e5d1f';

export async function getSkillGap(employeeId = DEMO_EMPLOYEE_ID) {
  const res = await fetch(`${API_BASE_URL}/skill-gap/${employeeId}`);
  if (!res.ok) throw new Error('Failed to fetch skill gap');
  return res.json();
}

export async function getAiAssessment(employeeId = DEMO_EMPLOYEE_ID) {
  const res = await fetch(`${API_BASE_URL}/ai-assessment/${employeeId}`);
  if (!res.ok) throw new Error('Failed to fetch AI assessment');
  return res.json();
}

export async function getRecommendations(employeeId = DEMO_EMPLOYEE_ID) {
  const res = await fetch(`${API_BASE_URL}/recommendations/${employeeId}`);
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return res.json();
}

export async function completeCourse({ employeeProfileId = DEMO_EMPLOYEE_ID, competencyId, newLevel }) {
  const res = await fetch(`${API_BASE_URL}/recommendations/complete-course`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeProfileId, competencyId, newLevel })
  });
  if (!res.ok) throw new Error('Failed to update course completion');
  return res.json();
}

export async function generateQuizFromPdf(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/quiz/generate`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to generate quiz from PDF');
  }
  return res.json();
}

