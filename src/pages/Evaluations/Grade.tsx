import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import Swal from 'sweetalert2';
import { evaluationService } from '../../services/evaluationService';
import { enrollmentService } from '../../services/enrollmentService';
import { gradeService } from '../../services/gradeService';
import { criterionService } from '../../services/criterionService';
import { scaleService } from '../../services/scaleService';
import { studentService } from '../../services/studentService';
import { Evaluation } from '../../models/Evaluation';
import { Enrollment } from '../../models/Enrollment';
import { Criterion } from '../../models/Criterion';

interface StudentGradeState {
  enrollment: Enrollment;
  studentName: string;
  existingGradeId?: string;
  existingStatus?: string;
  selections: Record<string, string>;
  comments: Record<string, string>;
  observations: string;
}

const inputClass =
  'w-full rounded border border-stroke bg-transparent py-1.5 px-3 text-sm text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white';

const GradeStudents: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [studentGrades, setStudentGrades] = useState<StudentGradeState[]>([]);
  const [loading, setLoading] = useState(true);
  const [noRubric, setNoRubric] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const ev = await evaluationService.getById(id);
        if (!ev) return;
        setEvaluation(ev);

        if (!ev.rubric_id) {
          setNoRubric(true);
          return;
        }

        const [allCriteria, allScales, allEnrollments, allGrades, allStudents] = await Promise.all([
          criterionService.getAll(),
          scaleService.getAll(),
          enrollmentService.getAll(),
          gradeService.getAll(),
          studentService.getAll(),
        ]);

        const studentNameMap = Object.fromEntries(
          allStudents.map(s => [
            s.id,
            `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || '—',
          ]),
        );

        const rubricCriteria = allCriteria.filter(c => c.rubric_id === ev.rubric_id);
        const loadedCriteria: Criterion[] = rubricCriteria.map(c => ({
          ...c,
          scales: allScales.filter(s => s.criterion_id === c.id),
        }));
        setCriteria(loadedCriteria);

        // Map scale_id → criterion_id for pre-populating existing drafts
        const scaleToCriterion: Record<string, string> = {};
        loadedCriteria.forEach(c => {
          (c.scales ?? []).forEach(s => {
            if (s.id && c.id) scaleToCriterion[s.id] = c.id;
          });
        });

        const groupEnrollments = allEnrollments.filter(
          e => e.group_id === ev.group_id && e.status === 'ACTIVE',
        );
        const evalGrades = allGrades.filter(g => g.evaluation_id === id);

        setStudentGrades(
          groupEnrollments.map(enrollment => {
            const existing = evalGrades.find(g => g.enrollment_id === enrollment.id);
            const selections: Record<string, string> = {};
            const comments: Record<string, string> = {};

            if (existing?.details) {
              existing.details.forEach(d => {
                if (d.scale_id) {
                  const cId = scaleToCriterion[d.scale_id];
                  if (cId) {
                    selections[cId] = d.scale_id;
                    if (d.comment) comments[cId] = d.comment;
                  }
                }
              });
            }

            const studentName =
              studentNameMap[enrollment.student_id ?? ''] || enrollment.student_id || '—';

            return {
              enrollment,
              studentName,
              existingGradeId: existing?.id,
              existingStatus: existing?.status,
              selections,
              comments,
              observations: existing?.observations ?? '',
            };
          }),
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const updateSelection = (sIdx: number, criterionId: string, scaleId: string) => {
    setStudentGrades(prev =>
      prev.map((sg, i) =>
        i === sIdx ? { ...sg, selections: { ...sg.selections, [criterionId]: scaleId } } : sg,
      ),
    );
  };

  const updateComment = (sIdx: number, criterionId: string, comment: string) => {
    setStudentGrades(prev =>
      prev.map((sg, i) =>
        i === sIdx ? { ...sg, comments: { ...sg.comments, [criterionId]: comment } } : sg,
      ),
    );
  };

  const updateObservations = (sIdx: number, value: string) => {
    setStudentGrades(prev =>
      prev.map((sg, i) => (i === sIdx ? { ...sg, observations: value } : sg)),
    );
  };

  const calculateScore = (sg: StudentGradeState): number =>
    criteria.reduce((total, c) => {
      const scaleId = sg.selections[c.id!];
      const scale = (c.scales ?? []).find(s => s.id === scaleId);
      return total + ((scale?.value ?? 0) * (c.weight ?? 0)) / 100;
    }, 0);

  const saveGrade = async (sg: StudentGradeState, sIdx: number, sendToStudent: boolean) => {
    if (!evaluation?.id || !evaluation.rubric_id) return;

    if (sendToStudent) {
      const missing = criteria
        .filter(c => !sg.selections[c.id!])
        .map(c => c.name ?? c.id ?? '?');
      if (missing.length > 0) {
        Swal.fire({
          title: 'Criterios incompletos',
          html: `Debes seleccionar un nivel para los siguientes criterios:<ul class="text-left mt-2 list-disc ml-5">${missing.map(m => `<li>${m}</li>`).join('')}</ul>`,
          icon: 'warning',
        });
        return;
      }
    }

    const details = criteria
      .filter(c => sg.selections[c.id!])
      .map(c => ({
        scale_id: sg.selections[c.id!],
        comment: sg.comments[c.id!] || undefined,
      }));

    const result = await gradeService.gradeStudent({
      enrollment_id: sg.enrollment.id!,
      evaluation_id: evaluation.id,
      rubric_id: evaluation.rubric_id,
      details,
      status: sendToStudent ? 'SENT' : 'DRAFT',
      observations: sg.observations || undefined,
    });

    if (result) {
      Swal.fire({
        title: sendToStudent ? 'Calificación enviada' : 'Borrador guardado',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      setStudentGrades(prev =>
        prev.map((s, i) =>
          i === sIdx
            ? { ...s, existingGradeId: result.id, existingStatus: result.status }
            : s,
        ),
      );
    } else {
      Swal.fire('Error', 'No se pudo guardar la calificación.', 'error');
    }
  };

  if (loading) return <div className="p-6 text-center text-body">Cargando...</div>;
  if (!evaluation) return <div className="p-6 text-center text-body">Evaluación no encontrada.</div>;

  if (noRubric) {
    return (
      <div>
        <Breadcrumb pageName={`Calificar — ${evaluation.name}`} />
        <div className="rounded-sm border border-warning bg-warning bg-opacity-10 p-6 text-sm">
          Esta evaluación no tiene una rúbrica asociada.{' '}
          <button
            onClick={() => navigate(`/evaluations/associate-rubric/${evaluation.id}`)}
            className="font-medium underline"
          >
            Asociar rúbrica →
          </button>
        </div>
        <button
          onClick={() => navigate('/evaluations/list')}
          className="mt-4 rounded border border-stroke py-2 px-6 text-sm text-black hover:shadow-1 dark:border-strokedark dark:text-white transition"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb pageName={`Calificar — ${evaluation.name}`} />

      {studentGrades.length === 0 ? (
        <div className="rounded-sm border border-stroke bg-white p-6 text-center text-body dark:border-strokedark dark:bg-boxdark">
          No hay estudiantes inscritos activamente en este grupo.
        </div>
      ) : (
        studentGrades.map((sg, sIdx) => {
          const isSent = sg.existingStatus === 'SENT';
          const score = calculateScore(sg);

          return (
            <div
              key={sg.enrollment.id}
              className="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
            >
              {/* Student header */}
              <div className="border-b border-stroke px-6 py-4 dark:border-strokedark flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold text-black dark:text-white">{sg.studentName}</h4>
                <div className="flex items-center gap-3">
                  {sg.existingStatus && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        isSent
                          ? 'bg-success bg-opacity-10 text-success'
                          : 'bg-warning bg-opacity-10 text-warning'
                      }`}
                    >
                      {isSent ? 'Enviada' : 'Borrador'}
                    </span>
                  )}
                  <span className="text-sm font-medium text-primary">
                    Nota calculada: {score.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Criteria */}
              <div className="p-6 space-y-4">
                {criteria.map(c => (
                  <div
                    key={c.id}
                    className="grid grid-cols-1 gap-3 md:grid-cols-3 items-start border-b border-stroke pb-4 dark:border-strokedark last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-black dark:text-white">{c.name}</p>
                      <p className="text-xs text-body dark:text-bodydark">Peso: {c.weight}%</p>
                      {c.description && (
                        <p className="mt-0.5 text-xs text-body dark:text-bodydark">{c.description}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-body dark:text-bodydark">
                        Nivel de desempeño
                      </label>
                      {isSent ? (
                        <p className="text-sm text-black dark:text-white">
                          {(c.scales ?? []).find(s => s.id === sg.selections[c.id!])?.name ?? '—'}
                        </p>
                      ) : (
                        <select
                          className={inputClass}
                          value={sg.selections[c.id!] || ''}
                          onChange={e => updateSelection(sIdx, c.id!, e.target.value)}
                        >
                          <option value="">Seleccionar...</option>
                          {(c.scales ?? []).map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} (valor: {s.value})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-body dark:text-bodydark">
                        Comentario
                      </label>
                      {isSent ? (
                        <p className="text-sm text-body dark:text-bodydark">
                          {sg.comments[c.id!] || '—'}
                        </p>
                      ) : (
                        <input
                          className={inputClass}
                          value={sg.comments[c.id!] || ''}
                          onChange={e => updateComment(sIdx, c.id!, e.target.value)}
                          placeholder="Retroalimentación..."
                        />
                      )}
                    </div>
                  </div>
                ))}

                {/* Observations */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                    Observaciones generales
                  </label>
                  {isSent ? (
                    <p className="text-sm text-body dark:text-bodydark">{sg.observations || '—'}</p>
                  ) : (
                    <textarea
                      rows={2}
                      className={inputClass}
                      value={sg.observations}
                      onChange={e => updateObservations(sIdx, e.target.value)}
                      placeholder="Observaciones generales sobre el desempeño del estudiante..."
                    />
                  )}
                </div>

                {/* Action buttons */}
                {!isSent && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => saveGrade(sg, sIdx, false)}
                      className="rounded border border-primary py-2 px-4 text-sm text-primary hover:bg-primary hover:text-white transition"
                    >
                      Guardar borrador
                    </button>
                    <button
                      onClick={() => saveGrade(sg, sIdx, true)}
                      className="rounded bg-primary py-2 px-4 text-sm text-white hover:bg-opacity-90 transition"
                    >
                      Enviar calificación
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      <button
        onClick={() => navigate('/evaluations/list')}
        className="mt-2 rounded border border-stroke py-2 px-6 text-sm text-black hover:shadow-1 dark:border-strokedark dark:text-white transition"
      >
        Volver
      </button>
    </div>
  );
};

export default GradeStudents;
