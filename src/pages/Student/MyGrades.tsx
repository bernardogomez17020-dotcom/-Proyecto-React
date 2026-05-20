import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Breadcrumb from '../../components/Breadcrumb';
import { gradeService } from '../../services/gradeService';
import { evaluationService } from '../../services/evaluationService';
import { enrollmentService } from '../../services/enrollmentService';
import { studentService } from '../../services/studentService';
import { criterionService } from '../../services/criterionService';
import { scaleService } from '../../services/scaleService';
import { Grade } from '../../models/Grade';
import { Evaluation } from '../../models/Evaluation';
import { RootState } from '../../store/store';

interface ScaleInfo {
  criterionName: string;
  scaleName: string;
}

const MyGrades: React.FC = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.user.user);

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [scaleInfoMap, setScaleInfoMap] = useState<Record<string, ScaleInfo>>({});
  const [loading, setLoading] = useState(true);
  const [notSent, setNotSent] = useState(false);

  useEffect(() => {
    if (!evaluationId) return;
    const load = async () => {
      try {
        const ev = await evaluationService.getById(evaluationId);
        setEvaluation(ev);

        // Build scale_id → {criterionName, scaleName} from rubric criteria
        if (ev?.rubric_id) {
          const [allCriteria, allScales] = await Promise.all([
            criterionService.getAll(),
            scaleService.getAll(),
          ]);
          const rubricCriteria = allCriteria.filter(c => c.rubric_id === ev.rubric_id);
          const map: Record<string, ScaleInfo> = {};
          rubricCriteria.forEach(criterion => {
            allScales
              .filter(s => s.criterion_id === criterion.id)
              .forEach(scale => {
                if (scale.id) {
                  map[scale.id] = {
                    criterionName: criterion.name ?? '—',
                    scaleName: scale.name ?? '—',
                  };
                }
              });
          });
          setScaleInfoMap(map);
        }

        // Find the student's enrollment to locate their grade
        const allGrades = await gradeService.getAll();
        const evalGrades = allGrades.filter(g => g.evaluation_id === evaluationId);

        let myGrade: Grade | null = null;

        if (currentUser?.id) {
          const student = await studentService.getByUserId(currentUser.id);
          if (student?.id) {
            const enrollments = await enrollmentService.search({ student_id: student.id });
            const myEnrollmentIds = new Set(
              enrollments.map(e => e.id).filter(Boolean) as string[],
            );
            myGrade =
              evalGrades.find(
                g => g.enrollment_id && myEnrollmentIds.has(g.enrollment_id),
              ) ?? null;
          }
        }

        // E1: only show SENT grades to the student
        if (myGrade && myGrade.status !== 'SENT') {
          setNotSent(true);
          myGrade = null;
        }

        setGrade(myGrade);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [evaluationId, currentUser]);

  const downloadPdf = () => {
    if (!grade || !evaluation) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Reporte de Calificación', 14, 18);
    doc.setFontSize(11);
    doc.text(`Evaluación: ${evaluation.name ?? '—'}`, 14, 28);
    doc.text(`Nota final: ${grade.final_score?.toFixed(2) ?? '—'}`, 14, 35);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 42);
    if (grade.observations) {
      doc.text(`Observaciones: ${grade.observations}`, 14, 49);
    }

    const details = grade.details ?? [];
    if (details.length > 0) {
      autoTable(doc, {
        startY: grade.observations ? 58 : 52,
        head: [['Criterio', 'Nivel obtenido', 'Puntaje', 'Comentario del docente']],
        body: details.map(d => {
          const info = scaleInfoMap[d.scale_id ?? ''];
          return [
            info?.criterionName ?? '—',
            info?.scaleName ?? '—',
            d.score?.toFixed(2) ?? '—',
            d.comment ?? '',
          ];
        }),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: { 3: { cellWidth: 55 } },
      });
    }

    doc.save(`calificacion_${(evaluation.name ?? 'evaluacion').replace(/\s+/g, '_')}.pdf`);
  };

  if (loading) return <div className="p-6 text-center text-body">Cargando...</div>;

  return (
    <div>
      <Breadcrumb pageName={evaluation ? `Notas — ${evaluation.name}` : 'Mis Notas'} />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* E1: grade exists but not sent yet */}
        {notSent ? (
          <div className="p-6 text-center text-sm text-body dark:text-bodydark">
            Tu calificación aún no ha sido enviada por el docente.
          </div>
        ) : !grade ? (
          <div className="p-6 text-center text-sm text-body dark:text-bodydark">
            Aún no tienes calificación registrada para esta evaluación.
          </div>
        ) : (
          <div className="p-6">
            {/* Score header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">
                    {grade.final_score?.toFixed(1) ?? '—'}
                  </p>
                  <p className="text-xs text-body dark:text-bodydark">Nota final</p>
                </div>
                <span className="rounded-full bg-success bg-opacity-10 px-3 py-1 text-sm font-medium text-success">
                  Enviada
                </span>
              </div>
              <button
                onClick={downloadPdf}
                className="rounded border border-primary py-1.5 px-4 text-xs font-medium text-primary transition hover:bg-primary hover:text-white"
              >
                Descargar reporte PDF
              </button>
            </div>

            {/* Observations */}
            {grade.observations && (
              <div className="mb-5 rounded border border-stroke bg-gray-2 px-4 py-3 text-sm dark:border-strokedark dark:bg-meta-4">
                <span className="font-medium text-black dark:text-white">
                  Observaciones del docente:{' '}
                </span>
                <span className="text-body dark:text-bodydark">{grade.observations}</span>
              </div>
            )}

            {/* Detail breakdown */}
            {(grade.details ?? []).length === 0 ? (
              <p className="text-center text-sm text-body dark:text-bodydark">
                No hay desglose de criterios disponible.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm">
                  <thead>
                    <tr className="bg-gray-2 dark:bg-meta-4">
                      <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">
                        Criterio
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">
                        Nivel obtenido
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-black dark:text-white">
                        Puntaje
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">
                        Comentario del docente
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(grade.details ?? []).map((detail, idx) => {
                      const info = scaleInfoMap[detail.scale_id ?? ''];
                      return (
                        <tr
                          key={detail.id ?? idx}
                          className="border-t border-stroke dark:border-strokedark"
                        >
                          <td className="px-4 py-3 text-black dark:text-white">
                            {info?.criterionName ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-black dark:text-white">
                            {info?.scaleName ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-primary">
                            {detail.score?.toFixed(2) ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-body dark:text-bodydark">
                            {detail.comment ?? '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/student/my-evaluations')}
        className="mt-4 rounded border border-stroke py-2 px-6 text-sm text-black transition hover:shadow-1 dark:border-strokedark dark:text-white"
      >
        Volver
      </button>
    </div>
  );
};

export default MyGrades;
