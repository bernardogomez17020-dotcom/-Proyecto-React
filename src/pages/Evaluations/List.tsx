import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import GenericTable from '../../components/GenericTable';
import { evaluationService } from '../../services/evaluationService';
import { subjectService } from '../../services/subjectService';
import { rubricService } from '../../services/rubricService';
import { groupService } from '../../services/groupService';

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'subject_name', label: 'Asignatura' },
  { key: 'rubric_title', label: 'Rúbrica' },
  { key: 'group_name', label: 'Grupo' },
  { key: 'weight', label: 'Peso (%)' },
];

const actions = [
  { name: 'edit', label: 'Editar' },
  { name: 'associate', label: 'Asociar Rúbrica' },
  { name: 'grade', label: 'Calificar' },
  { name: 'delete', label: 'Eliminar' },
];

const EvaluationList: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    const [evaluations, subjects, rubrics, groups] = await Promise.all([
      evaluationService.getAll(),
      subjectService.getAll(),
      rubricService.getAll(),
      groupService.getAll(),
    ]);

    const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s.name ?? '—']));
    const rubricMap = Object.fromEntries(rubrics.map(r => [r.id, r.title ?? '—']));
    const groupMap = Object.fromEntries(groups.map(g => [g.id, `${g.name} (${g.group_code})`]));

    setRows(evaluations.map(e => ({
      ...e,
      subject_name: subjectMap[e.subject_id ?? ''] ?? '—',
      rubric_title: e.rubric_id ? (rubricMap[e.rubric_id] ?? '—') : 'Sin rúbrica',
      group_name: groupMap[e.group_id ?? ''] ?? '—',
    })));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (action: string, item: any) => {
    if (action === 'edit') {
      navigate(`/evaluations/form/${item.id}`);
    } else if (action === 'associate') {
      navigate(`/evaluations/associate-rubric/${item.id}`);
    } else if (action === 'grade') {
      navigate(`/evaluations/grade/${item.id}`);
    } else if (action === 'delete') {
      const { isConfirmed } = await Swal.fire({
        title: '¿Eliminar evaluación?',
        text: 'Esta acción no se puede revertir.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });
      if (!isConfirmed) return;
      const ok = await evaluationService.delete(item.id);
      Swal.fire(
        ok
          ? { title: 'Eliminada', icon: 'success', timer: 1500, showConfirmButton: false }
          : { title: 'Error', text: 'No se pudo eliminar la evaluación.', icon: 'error' }
      );
      if (ok) load();
    }
  };

  return (
    <div>
      <Breadcrumb pageName="Evaluaciones" />
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => navigate('/evaluations/form')}
          className="rounded bg-primary px-4 py-2 text-sm text-white transition hover:bg-opacity-90"
        >
          + Crear
        </button>
      </div>
      <GenericTable data={rows} columns={columns} actions={actions} onAction={handleAction} />
    </div>
  );
};

export default EvaluationList;
