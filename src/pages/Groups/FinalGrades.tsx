import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import { groupService } from '../../services/groupService';
import { semesterService } from '../../services/semesterService';
import { evaluationService } from '../../services/evaluationService';
import { enrollmentService } from '../../services/enrollmentService';
import { gradeService } from '../../services/gradeService';
import { Group } from '../../models/Group';
import { Semester } from '../../models/Semester';
import { Evaluation } from '../../models/Evaluation';
import { Enrollment } from '../../models/Enrollment';
import { Grade } from '../../models/Grade';

interface StudentRow {
  enrollment: Enrollment;
  studentName: string;
  gradeByEval: Record<string, Grade | undefined>;
  consolidatedScore: number;
  isComplete: boolean;
}

const FinalGrades: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [semester, setSemester] = useState<Semester | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [studentRows, setStudentRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [semesterInactive, setSemesterInactive] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registerResults, setRegisterResults] = useState<
    { enrollment_id: string; student_id: string; official_final_score: number; evaluations_count: number }[] | null
  >(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const grp = await groupService.getById(id);
        if (!grp) return;
        setGroup(grp);

        const [allEvaluations, allEnrollments, allGrades, allSemesters] = await Promise.all([
          evaluationService.getAll(),
          enrollmentService.getAll(),
          gradeService.getAll(),
          semesterService.getAll(),
        ]);

        // E2: check semester is active
        const sem = allSemesters.find(s => s.id === grp.semester_id) ?? null;
        setSemester(sem);
        if (sem && !sem.is_active) {
          setSemesterInactive(true);
          return;
        }

        const groupEvals = allEvaluations.filter(e => e.group_id === id);
        setEvaluations(groupEvals);

        const groupEnrollments = allEnrollments.filter(
          e => e.group_id === id && e.status === 'ACTIVE',
        );

        const evalIds = new Set(groupEvals.map(e => e.id!));
        const groupGrades = allGrades.filter(
          g => g.evaluation_id && evalIds.has(g.evaluation_id),
        );

        const rows: StudentRow[] = groupEnrollments.map(enrollment => {
          const gradeByEval: Record<string, Grade | undefined> = {};
          groupEvals.forEach(ev => {
            gradeByEval[ev.id!] = groupGrades.find(
              g => g.evaluation_id === ev.id && g.enrollment_id === enrollment.id,
            );
          });

          const consolidatedScore = groupEvals.reduce((sum, ev) => {
            const grade = gradeByEval[ev.id!];
            return sum + ((grade?.final_score ?? 0) * (ev.weight ?? 0)) / 100;
          }, 0);

          const isComplete = groupEvals.every(ev => {
            const grade = gradeByEval[ev.id!];
            return grade && grade.status === 'SENT';
          });

          const studentName = enrollment.student
            ? `${enrollment.student.first_name ?? ''} ${enrollment.student.last_name ?? ''}`.trim()
            : enrollment.student_id ?? '—';

          return { enrollment, studentName, gradeByEval, consolidatedScore, isComplete };
        });

        setStudentRows(rows);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const incompleteCount = studentRows.filter(r => !r.isComplete).length;

  const handleRegister = async () => {
    if (!id) return;

    if (incompleteCount > 0) {
      // E1: warn but allow
      const { isConfirmed } = await Swal.fire({
        title: 'Calificaciones incompletas',
        html: `<b>${incompleteCount}</b> estudiante(s) tienen evaluaciones sin enviar.<br>La nota final se calculará con las evaluaciones disponibles y se registrarán observaciones automáticamente.<br><br>¿Deseas continuar de todas formas?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
      });
      if (!isConfirmed) return;
    } else {
      const { isConfirmed } = await Swal.fire({
        title: '¿Registrar notas oficiales?',
        text: 'Esta acción bloqueará todas las calificaciones del grupo y no podrá revertirse.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
      });
      if (!isConfirmed) return;
    }

    const results = await gradeService.registerFinalScores(id);
    if (!results) {
      Swal.fire('Error', 'No se pudieron registrar las notas finales.', 'error');
      return;
    }

    setRegistered(true);
    setRegisterResults(results);
    Swal.fire({ title: 'Notas registradas exitosamente', icon: 'success', timer: 2000, showConfirmButton: false });
  };

  const downloadPDF = () => {
    if (!registerResults || !group) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Reporte de Notas Finales', 14, 18);
    doc.setFontSize(11);
    doc.text(`Grupo: ${group.name ?? group.group_code ?? '—'}  (${group.group_code ?? ''})`, 14, 28);
    doc.text(`Semestre: ${semester?.name ?? '—'}`, 14, 35);
    doc.text(`Fecha de registro: ${new Date().toLocaleDateString('es-CO')}`, 14, 42);

    autoTable(doc, {
      startY: 52,
      head: [['Estudiante', 'Evaluaciones computadas', 'Nota final oficial']],
      body: registerResults.map(r => {
        const row = studentRows.find(s => s.enrollment.id === r.enrollment_id);
        return [
          row?.studentName ?? r.student_id ?? '—',
          String(r.evaluations_count),
          r.official_final_score.toFixed(2),
        ];
      }),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`notas_finales_${group.group_code ?? group.id}.pdf`);
  };

  if (loading) return <div className="p-6 text-center">Cargando...</div>;
  if (!group) return <div className="p-6 text-center">Grupo no encontrado.</div>;

  // E2: inactive semester
  if (semesterInactive) {
    return (
      <div>
        <Breadcrumb pageName="Notas Finales" />
        <div className="mb-6 rounded-sm border border-danger bg-danger bg-opacity-10 p-6 text-sm text-danger">
          <strong>Registro bloqueado.</strong> El semestre{' '}
          <b>{semester?.name ?? group.semester_id}</b> no está activo. Contacta al administrador
          para activarlo antes de registrar notas finales.
        </div>
        <button
          onClick={() => navigate('/groups/list')}
          className="rounded border border-stroke py-2 px-6 text-sm text-black hover:shadow-1 dark:border-strokedark dark:text-white transition"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb pageName={`Notas Finales — ${group.name ?? group.group_code}`} />

      {/* Group info */}
      <div className="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <span className="font-medium text-black dark:text-white">Grupo: </span>
            <span className="text-body dark:text-bodydark">
              {group.name} ({group.group_code})
            </span>
          </div>
          <div>
            <span className="font-medium text-black dark:text-white">Semestre: </span>
            <span className="text-body dark:text-bodydark">{semester?.name ?? '—'}</span>
          </div>
          <div>
            <span className="font-medium text-black dark:text-white">Evaluaciones: </span>
            <span className="text-body dark:text-bodydark">{evaluations.length}</span>
          </div>
          <div>
            <span className="font-medium text-black dark:text-white">Estudiantes activos: </span>
            <span className="text-body dark:text-bodydark">{studentRows.length}</span>
          </div>
        </div>
      </div>

      {/* E1: incomplete warning */}
      {incompleteCount > 0 && (
        <div className="mb-6 rounded border border-warning bg-warning bg-opacity-10 p-4 text-sm">
          <strong>Atención:</strong> {incompleteCount} estudiante(s) tienen evaluaciones sin
          enviar. La nota final se calculará con las evaluaciones disponibles.
        </div>
      )}

      {/* Preview table */}
      {studentRows.length === 0 ? (
        <div className="mb-6 rounded-sm border border-stroke bg-white p-6 text-center text-body dark:border-strokedark dark:bg-boxdark">
          No hay estudiantes inscritos activamente en este grupo.
        </div>
      ) : (
        <div className="mb-6 overflow-x-auto rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke bg-gray-2 dark:border-strokedark dark:bg-meta-4">
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">
                  Estudiante
                </th>
                {evaluations.map(ev => (
                  <th
                    key={ev.id}
                    className="px-4 py-3 text-center font-semibold text-black dark:text-white"
                  >
                    {ev.name}
                    <br />
                    <span className="text-xs font-normal text-body dark:text-bodydark">
                      ({ev.weight}%)
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-semibold text-black dark:text-white">
                  Nota Final
                </th>
                <th className="px-4 py-3 text-center font-semibold text-black dark:text-white">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {studentRows.map(row => (
                <tr
                  key={row.enrollment.id}
                  className="border-b border-stroke dark:border-strokedark last:border-0"
                >
                  <td className="px-4 py-3 text-black dark:text-white">{row.studentName}</td>
                  {evaluations.map(ev => {
                    const grade = row.gradeByEval[ev.id!];
                    return (
                      <td key={ev.id} className="px-4 py-3 text-center">
                        {grade ? (
                          <span
                            className={
                              grade.status === 'SENT' ? 'text-success' : 'text-warning'
                            }
                          >
                            {(grade.final_score ?? 0).toFixed(2)}
                            {grade.status !== 'SENT' && (
                              <span className="ml-0.5 text-xs">*</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-meta-1">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center font-semibold text-primary">
                    {row.consolidatedScore.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.isComplete ? (
                      <span className="rounded-full bg-success bg-opacity-10 px-2 py-0.5 text-xs text-success">
                        Completo
                      </span>
                    ) : (
                      <span className="rounded-full bg-warning bg-opacity-10 px-2 py-0.5 text-xs text-warning">
                        Incompleto
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {studentRows.some(r =>
            Object.values(r.gradeByEval).some(g => g && g.status !== 'SENT'),
          ) && (
            <p className="px-4 py-2 text-xs text-body dark:text-bodydark">
              * Calificación en borrador (no enviada aún)
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {!registered ? (
          <button
            onClick={handleRegister}
            disabled={studentRows.length === 0 || evaluations.length === 0}
            className="rounded bg-primary py-2 px-6 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
          >
            Registrar notas oficiales
          </button>
        ) : (
          <button
            onClick={downloadPDF}
            className="rounded bg-success py-2 px-6 text-sm font-medium text-white transition hover:bg-opacity-90"
          >
            Descargar reporte PDF
          </button>
        )}
        <button
          onClick={() => navigate('/groups/list')}
          className="rounded border border-stroke py-2 px-6 text-sm text-black transition hover:shadow-1 dark:border-strokedark dark:text-white"
        >
          Volver
        </button>
      </div>
    </div>
  );
};

export default FinalGrades;
