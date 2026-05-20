import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import GenericTable from '../../components/GenericTable';
import { groupService } from '../../services/groupService';
import { subjectService } from '../../services/subjectService';
import { teacherService } from '../../services/teacherService';
import { semesterService } from '../../services/semesterService';
import { Semester } from '../../models/Semester';

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'group_code', label: 'Código' },
  { key: 'subject_name', label: 'Asignatura' },
  { key: 'teacher_name', label: 'Docente' },
  { key: 'semester_name', label: 'Semestre' },
  { key: 'capacity', label: 'Capacidad' },
];

const actions = [
  { name: 'edit', label: 'Editar' },
  { name: 'assign', label: 'Asignar Docente' },
  { name: 'final-scores', label: 'Notas Finales' },
  { name: 'delete', label: 'Eliminar' },
];

const GroupList: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterFilter, setSemesterFilter] = useState('');

  const load = async (semId: string) => {
    const [groups, subjects, teachers, allSemesters] = await Promise.all([
      groupService.getAll(),
      subjectService.getAll(),
      teacherService.getAll(),
      semesterService.getAll(),
    ]);
    setSemesters(allSemesters);

    const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s.name]));
    const teacherMap = Object.fromEntries(
      teachers.map(t => [t.id, `${t.first_name ?? ''} ${t.last_name ?? ''}`.trim()])
    );
    const semesterMap = Object.fromEntries(allSemesters.map(s => [s.id, s.name]));

    const enriched = groups
      .filter(g => !semId || g.semester_id === semId)
      .map(g => ({
        ...g,
        subject_name: subjectMap[g.subject_id ?? ''] ?? '—',
        teacher_name: teacherMap[g.teacher_id ?? ''] ?? 'Sin asignar',
        semester_name: semesterMap[g.semester_id ?? ''] ?? '—',
      }));
    setRows(enriched);
  };

  useEffect(() => { load(''); }, []);

  const handleAction = async (action: string, item: any) => {
    if (action === 'edit') {
      navigate(`/groups/form/${item.id}`);
    } else if (action === 'assign') {
      navigate(`/groups/assign-teacher/${item.id}`);
    } else if (action === 'final-scores') {
      navigate(`/groups/final-grades/${item.id}`);
    } else if (action === 'delete') {
      const { isConfirmed } = await Swal.fire({
        title: '¿Eliminar grupo?',
        text: 'Se eliminarán también las inscripciones y calificaciones del grupo.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });
      if (!isConfirmed) return;
      const ok = await groupService.delete(item.id);
      Swal.fire(
        ok
          ? { title: 'Eliminado', icon: 'success', timer: 1500, showConfirmButton: false }
          : { title: 'No se puede eliminar', text: 'El grupo tiene inscripciones o calificaciones asociadas.', icon: 'error' }
      );
      if (ok) load(semesterFilter);
    }
  };

  return (
    <div>
      <Breadcrumb pageName="Grupos" />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-black dark:text-white">Semestre</label>
          <select
            value={semesterFilter}
            onChange={e => { setSemesterFilter(e.target.value); load(e.target.value); }}
            className="rounded border border-stroke bg-transparent px-3 py-2 text-sm text-black dark:border-strokedark dark:bg-form-input dark:text-white"
          >
            <option value="">Todos los semestres</option>
            {semesters.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}{s.is_active ? ' (activo)' : ''}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => navigate('/groups/form')}
          className="ml-auto rounded bg-primary px-4 py-2 text-sm text-white transition hover:bg-opacity-90"
        >
          + Crear
        </button>
      </div>

      <GenericTable data={rows} columns={columns} actions={actions} onAction={handleAction} />
    </div>
  );
};

export default GroupList;
