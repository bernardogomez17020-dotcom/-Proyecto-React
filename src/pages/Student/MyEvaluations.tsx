import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Breadcrumb from '../../components/Breadcrumb';
import GenericTable from '../../components/GenericTable';
import { evaluationService } from '../../services/evaluationService';
import { enrollmentService } from '../../services/enrollmentService';
import { studentService } from '../../services/studentService';
import { subjectService } from '../../services/subjectService';
import { RootState } from '../../store/store';

const columns = [
  { key: 'name', label: 'Evaluación' },
  { key: 'subject_name', label: 'Asignatura' },
  { key: 'weight', label: 'Peso (%)' },
  { key: 'rubric_label', label: 'Rúbrica' },
];

const actions = [
  { name: 'view-rubric', label: 'Ver Rúbrica' },
  { name: 'view-grades', label: 'Ver Notas' },
];

const MyEvaluations: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.user.user);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [allEvaluations, allSubjects] = await Promise.all([
        evaluationService.getAll(),
        subjectService.getAll(),
      ]);

      const subjectMap = Object.fromEntries(allSubjects.map(s => [s.id, s.name ?? '—']));

      let filtered = allEvaluations;

      if (currentUser?.id) {
        const student = await studentService.getByUserId(currentUser.id);
        if (student?.id) {
          const enrollments = await enrollmentService.search({ student_id: student.id });
          const activeGroupIds = new Set(
            enrollments
              .filter(e => e.status === 'ACTIVE')
              .map(e => e.group_id)
              .filter(Boolean) as string[],
          );
          if (activeGroupIds.size > 0) {
            filtered = allEvaluations.filter(ev => ev.group_id && activeGroupIds.has(ev.group_id));
          } else {
            filtered = [];
          }
        }
      }

      setRows(
        filtered.map(ev => ({
          ...ev,
          subject_name: subjectMap[ev.subject_id ?? ''] ?? '—',
          rubric_label: ev.rubric_id ? 'Disponible' : 'Sin rúbrica',
        })),
      );
    };

    load();
  }, [currentUser]);

  const handleAction = (action: string, item: any) => {
    if (action === 'view-rubric') navigate(`/student/rubric/${item.id}`);
    if (action === 'view-grades') navigate(`/student/grades/${item.id}`);
  };

  return (
    <div>
      <Breadcrumb pageName="Mis Evaluaciones" />
      <GenericTable data={rows} columns={columns} actions={actions} onAction={handleAction} />
    </div>
  );
};

export default MyEvaluations;
