import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import { evaluationService } from '../../services/evaluationService';
import { rubricService } from '../../services/rubricService';
import { criterionService } from '../../services/criterionService';
import { scaleService } from '../../services/scaleService';
import { Evaluation } from '../../models/Evaluation';
import { Rubric } from '../../models/Rubric';
import { Criterion } from '../../models/Criterion';

const ViewRubric: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [noRubric, setNoRubric] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const ev = await evaluationService.getById(id);
        if (!ev) return;
        setEvaluation(ev);

        // E1: no rubric associated
        if (!ev.rubric_id) {
          setNoRubric(true);
          return;
        }

        const [rub, allCriteria, allScales] = await Promise.all([
          rubricService.getById(ev.rubric_id),
          criterionService.getAll(),
          scaleService.getAll(),
        ]);

        setRubric(rub);

        const rubricCriteria = allCriteria.filter(c => c.rubric_id === ev.rubric_id);
        setCriteria(
          rubricCriteria.map(c => ({
            ...c,
            scales: allScales
              .filter(s => s.criterion_id === c.id)
              .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
          })),
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="p-6 text-center text-body">Cargando...</div>;
  if (!evaluation) return <div className="p-6 text-center text-body">Evaluación no encontrada.</div>;

  return (
    <div>
      <Breadcrumb pageName={`Rúbrica — ${evaluation.name}`} />

      {/* E1 */}
      {noRubric ? (
        <div className="rounded-sm border border-stroke bg-white p-6 text-center text-sm text-body dark:border-strokedark dark:bg-boxdark">
          Esta evaluación aún no tiene una rúbrica asociada. Consulta a tu docente.
        </div>
      ) : rubric ? (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          {/* Rubric header */}
          <div className="border-b border-stroke px-6 py-5 dark:border-strokedark">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-black dark:text-white">{rubric.title}</h3>
                {rubric.description && (
                  <p className="mt-1 text-sm text-body dark:text-bodydark">{rubric.description}</p>
                )}
              </div>
              {rubric.created_at && (
                <span className="shrink-0 rounded bg-primary bg-opacity-10 px-3 py-1 text-xs text-primary">
                  Publicada:{' '}
                  {new Date(rubric.created_at).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Criteria */}
          <div className="space-y-6 p-6">
            {criteria.length === 0 ? (
              <p className="text-center text-sm text-body dark:text-bodydark">
                Esta rúbrica no tiene criterios definidos.
              </p>
            ) : (
              criteria.map(criterion => (
                <div
                  key={criterion.id}
                  className="rounded border border-stroke p-4 dark:border-strokedark"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-semibold text-black dark:text-white">{criterion.name}</h4>
                    <span className="rounded-full bg-primary bg-opacity-10 px-3 py-1 text-xs font-medium text-primary">
                      Peso: {criterion.weight}%
                    </span>
                  </div>
                  {criterion.description && (
                    <p className="mb-3 text-sm text-body dark:text-bodydark">
                      {criterion.description}
                    </p>
                  )}

                  {/* Scales grid */}
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {(criterion.scales ?? []).map(scale => (
                      <div
                        key={scale.id}
                        className="rounded border border-stroke bg-gray-2 p-3 dark:border-strokedark dark:bg-meta-4"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium text-black dark:text-white">
                            {scale.name}
                          </span>
                          <span className="text-xs font-bold text-primary">{scale.value} pts</span>
                        </div>
                        {scale.description && (
                          <p className="text-xs text-body dark:text-bodydark">{scale.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      <button
        onClick={() => navigate('/student/my-evaluations')}
        className="mt-4 rounded border border-stroke py-2 px-6 text-sm text-black transition hover:shadow-1 dark:border-strokedark dark:text-white"
      >
        Volver
      </button>
    </div>
  );
};

export default ViewRubric;
