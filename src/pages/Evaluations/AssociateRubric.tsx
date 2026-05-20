import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import { evaluationService } from '../../services/evaluationService';
import { rubricService } from '../../services/rubricService';
import { subjectService } from '../../services/subjectService';
import { gradeService } from '../../services/gradeService';
import { Rubric } from '../../models/Rubric';
import { Subject } from '../../models/Subject';

const inputClass =
  'w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary';

const AssociateRubric: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [evaluation, setEvaluation] = useState<any>(null);
  const [currentRubricTitle, setCurrentRubricTitle] = useState('');
  const [currentSubjectName, setCurrentSubjectName] = useState('');
  const [publishedRubrics, setPublishedRubrics] = useState<Rubric[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [hasGrades, setHasGrades] = useState(false);

  const [selectedRubricId, setSelectedRubricId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [ev, allRubrics, allSubjects, allGrades] = await Promise.all([
          evaluationService.getById(id),
          rubricService.getAll(),
          subjectService.getAll(),
          gradeService.getAll(),
        ]);

        if (ev) {
          setEvaluation(ev);
          setSelectedRubricId(ev.rubric_id ?? '');
          setSelectedSubjectId(ev.subject_id ?? '');

          const subjectMap = Object.fromEntries(allSubjects.map(s => [s.id, s.name ?? '']));
          const rubricMap = Object.fromEntries(allRubrics.map(r => [r.id, r.title ?? '']));
          setCurrentSubjectName(subjectMap[ev.subject_id ?? ''] ?? '—');
          setCurrentRubricTitle(ev.rubric_id ? (rubricMap[ev.rubric_id] ?? '—') : 'Sin rúbrica');

          // E2: check if any grades exist for this evaluation
          const grades = allGrades.filter(g => g.evaluation_id === id);
          setHasGrades(grades.length > 0);
        }

        setPublishedRubrics(allRubrics.filter(r => r.is_public && !r.is_archived));
        setSubjects(allSubjects);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    if (!id || !evaluation) return;

    if (!selectedRubricId) {
      Swal.fire({ title: 'Selecciona una rúbrica', icon: 'warning' });
      return;
    }
    if (!selectedSubjectId) {
      Swal.fire({ title: 'Selecciona una asignatura', icon: 'warning' });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: '¿Confirmar asociación?',
      html: `Se vinculará la rúbrica y asignatura seleccionadas a la evaluación <b>${evaluation.name}</b>.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;

    const ok = await evaluationService.update(id, {
      rubric_id: selectedRubricId,
      subject_id: selectedSubjectId,
    });

    if (ok) {
      Swal.fire({ title: 'Asociación guardada', icon: 'success', timer: 1500, showConfirmButton: false });
      navigate('/evaluations/list');
    } else {
      Swal.fire({ title: 'Error', text: 'No se pudo guardar la asociación.', icon: 'error' });
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!evaluation) return <div className="p-6">Evaluación no encontrada.</div>;

  return (
    <div>
      <Breadcrumb pageName="Asociar Rúbrica a Evaluación" />

      {/* Evaluation info card */}
      <div className="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <h3 className="mb-4 text-base font-semibold text-black dark:text-white">Información de la evaluación</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-black dark:text-white">Nombre: </span>
            <span className="text-body dark:text-bodydark">{evaluation.name}</span>
          </div>
          <div>
            <span className="font-medium text-black dark:text-white">Peso: </span>
            <span className="text-body dark:text-bodydark">{evaluation.weight}%</span>
          </div>
          <div>
            <span className="font-medium text-black dark:text-white">Asignatura actual: </span>
            <span className="text-body dark:text-bodydark">{currentSubjectName}</span>
          </div>
          <div>
            <span className="font-medium text-black dark:text-white">Rúbrica actual: </span>
            <span className="text-body dark:text-bodydark">{currentRubricTitle}</span>
          </div>
        </div>
      </div>

      {/* E2: grades exist — block change */}
      {hasGrades && (
        <div className="mb-6 rounded border border-danger bg-danger bg-opacity-10 p-4 text-sm text-danger">
          <strong>No se puede cambiar la rúbrica.</strong> Ya existen calificaciones registradas para esta evaluación.
          Si necesitas cambiarla, elimina primero las calificaciones asociadas.
        </div>
      )}

      {/* E1: no published rubrics */}
      {publishedRubrics.length === 0 && !hasGrades && (
        <div className="mb-6 rounded border border-warning bg-warning bg-opacity-10 p-4 text-sm">
          No hay rúbricas publicadas disponibles.{' '}
          <Link to="/rubrics/form" className="font-medium underline">
            Ir a crear una rúbrica →
          </Link>
        </div>
      )}

      {/* Association form */}
      {!hasGrades && publishedRubrics.length > 0 && (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
          <h3 className="mb-4 text-base font-semibold text-black dark:text-white">Seleccionar asignatura y rúbrica</h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Asignatura <span className="text-meta-1">*</span>
              </label>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className={inputClass}
              >
                <option value="">Seleccionar...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Rúbrica publicada <span className="text-meta-1">*</span>
              </label>
              <select
                value={selectedRubricId}
                onChange={e => setSelectedRubricId(e.target.value)}
                className={inputClass}
              >
                <option value="">Seleccionar...</option>
                {publishedRubrics.map(r => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-body dark:text-bodydark">
                Solo se muestran rúbricas publicadas y no archivadas.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={handleSave}
              className="flex justify-center rounded bg-primary py-3 px-10 font-medium text-white hover:bg-opacity-90 transition"
            >
              Guardar asociación
            </button>
            <button
              onClick={() => navigate('/evaluations/list')}
              className="flex justify-center rounded border border-stroke py-3 px-10 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* If grades exist, show only back button */}
      {hasGrades && (
        <button
          onClick={() => navigate('/evaluations/list')}
          className="rounded border border-stroke py-2 px-6 text-sm font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white transition"
        >
          Volver
        </button>
      )}
    </div>
  );
};

export default AssociateRubric;
