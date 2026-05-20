import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import Swal from 'sweetalert2';
import { rubricService } from '../../services/rubricService';
import { criterionService } from '../../services/criterionService';
import { scaleService } from '../../services/scaleService';
import { Criterion } from '../../models/Criterion';
import { Scale } from '../../models/Scale';

const inputClass =
  'w-full rounded border border-stroke bg-transparent py-2 px-3 text-sm text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white';

const RubricForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [rubricId, setRubricId] = useState<string | undefined>(id);
  const [rubricIsPublic, setRubricIsPublic] = useState(false);
  const [rubricIsArchived, setRubricIsArchived] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [rubric, allCriteria, allScales] = await Promise.all([
          rubricService.getById(id),
          criterionService.getAll(),
          scaleService.getAll(),
        ]);
        if (rubric) {
          setForm({ title: rubric.title ?? '', description: rubric.description ?? '' });
          setRubricIsPublic(rubric.is_public ?? false);
          setRubricIsArchived(rubric.is_archived ?? false);
        }
        const rubricCriteria = allCriteria.filter(c => c.rubric_id === id);
        setCriteria(
          rubricCriteria.map(c => ({
            ...c,
            scales: allScales.filter(s => s.criterion_id === c.id),
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const isReadOnly = rubricIsArchived;
  const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

  // ── Rubric actions ────────────────────────────────────────────────────────

  const saveRubric = async () => {
    if (!form.title.trim()) {
      Swal.fire('Título requerido', 'El título de la rúbrica es obligatorio.', 'warning');
      return;
    }
    if (rubricId) {
      const ok = await rubricService.update(rubricId, { title: form.title, description: form.description });
      if (!ok) { Swal.fire('Error', 'No se pudo guardar la rúbrica.', 'error'); return; }
    } else {
      const created = await rubricService.create({ title: form.title, description: form.description });
      if (!created?.id) { Swal.fire('Error', 'No se pudo crear la rúbrica.', 'error'); return; }
      setRubricId(created.id);
    }
    Swal.fire({ title: 'Rúbrica guardada', icon: 'success', timer: 1500, showConfirmButton: false });
  };

  const handlePublish = async () => {
    if (!rubricId) return;

    // E2: no criteria
    if (criteria.length === 0) {
      Swal.fire({ title: 'Sin criterios', text: 'La rúbrica debe tener al menos un criterio para publicarse.', icon: 'error' });
      return;
    }

    // E1: weight sum must be exactly 100%
    if (totalWeight !== 100) {
      Swal.fire({
        title: 'Suma de pesos incorrecta',
        text: `La suma de los pesos es ${totalWeight}%. Debe ser exactamente 100% para poder publicar.`,
        icon: 'error',
      });
      return;
    }

    // E2: each criterion must have between 2 and 5 scales
    const underscaled = criteria.filter(c => (c.scales ?? []).length < 2);
    if (underscaled.length > 0) {
      Swal.fire({
        title: 'Escalas insuficientes',
        text: `Los criterios "${underscaled.map(c => c.name).join(', ')}" tienen menos de 2 niveles. Cada criterio necesita entre 2 y 5 escalas.`,
        icon: 'error',
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: '¿Publicar rúbrica?',
      text: 'Una rúbrica publicada no puede eliminarse, solo archivarse.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Publicar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;

    const ok = await rubricService.publish(rubricId);
    if (ok) {
      setRubricIsPublic(true);
      Swal.fire({ title: 'Rúbrica publicada', icon: 'success', timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire({ title: 'Error', text: 'No se pudo publicar la rúbrica.', icon: 'error' });
    }
  };

  // ── Criterion actions ─────────────────────────────────────────────────────

  const addCriterion = async () => {
    if (!rubricId) { Swal.fire('Guarda la rúbrica primero', '', 'info'); return; }
    const created = await criterionService.create({ rubric_id: rubricId, name: 'Nuevo criterio', weight: 0 });
    if (created) setCriteria(prev => [...prev, { ...created, scales: [] }]);
  };

  const updateCriterion = (idx: number, field: string, value: any) =>
    setCriteria(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));

  const saveCriterion = async (c: Criterion) => {
    if (!c.id) return;
    const ok = await criterionService.update(c.id, {
      rubric_id: c.rubric_id,
      name: c.name,
      description: c.description,
      weight: c.weight,
    });
    if (ok) Swal.fire({ title: 'Criterio guardado', icon: 'success', timer: 1000, showConfirmButton: false });
    else Swal.fire('Error', 'No se pudo guardar el criterio.', 'error');
  };

  const deleteCriterion = async (c: Criterion, idx: number) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar criterio?',
      text: 'Se eliminarán también sus escalas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    if (c.id) await criterionService.delete(c.id);
    setCriteria(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Scale actions ─────────────────────────────────────────────────────────

  const addScale = async (cIdx: number, criterionId: string) => {
    const scales = criteria[cIdx].scales ?? [];
    if (scales.length >= 5) {
      Swal.fire('Límite alcanzado', 'Un criterio puede tener máximo 5 niveles.', 'warning');
      return;
    }
    const created = await scaleService.create({ criterion_id: criterionId, name: 'Nuevo nivel', value: 0 });
    if (created) {
      setCriteria(prev =>
        prev.map((c, i) => i === cIdx ? { ...c, scales: [...(c.scales ?? []), created] } : c)
      );
    }
  };

  const updateScale = (cIdx: number, sIdx: number, field: string, value: any) =>
    setCriteria(prev =>
      prev.map((c, i) =>
        i === cIdx
          ? { ...c, scales: (c.scales ?? []).map((s, j) => j === sIdx ? { ...s, [field]: value } : s) }
          : c
      )
    );

  const saveScale = async (cIdx: number, s: Scale) => {
    if (!s.id) return;
    const otherValues = (criteria[cIdx].scales ?? [])
      .filter(sc => sc.id !== s.id)
      .map(sc => sc.value);
    if (otherValues.includes(s.value)) {
      Swal.fire('Valor duplicado', 'Ya existe un nivel con ese valor numérico en este criterio.', 'warning');
      return;
    }
    const ok = await scaleService.update(s.id, { criterion_id: s.criterion_id, name: s.name, description: s.description, value: s.value });
    if (ok) Swal.fire({ title: 'Escala guardada', icon: 'success', timer: 1000, showConfirmButton: false });
    else Swal.fire('Error', 'No se pudo guardar la escala.', 'error');
  };

  const deleteScale = async (cIdx: number, s: Scale, sIdx: number) => {
    if (s.id) await scaleService.delete(s.id);
    setCriteria(prev =>
      prev.map((c, i) =>
        i === cIdx ? { ...c, scales: (c.scales ?? []).filter((_, j) => j !== sIdx) } : c
      )
    );
  };

  // CU-09 2a: clone a scale from another criterion
  const copyScale = async (cIdx: number, criterionId: string, sourceScaleId: string) => {
    const source = criteria.flatMap(c => c.scales ?? []).find(s => s.id === sourceScaleId);
    if (!source) return;

    const existingValues = (criteria[cIdx].scales ?? []).map(s => s.value);
    if (existingValues.includes(source.value)) {
      Swal.fire('Valor duplicado', 'Ya existe un nivel con ese valor en este criterio.', 'warning');
      return;
    }

    const scales = criteria[cIdx].scales ?? [];
    if (scales.length >= 5) {
      Swal.fire('Límite alcanzado', 'Un criterio puede tener máximo 5 niveles.', 'warning');
      return;
    }

    const created = await scaleService.create({
      criterion_id: criterionId,
      name: source.name,
      description: source.description,
      value: source.value,
    });
    if (created) {
      setCriteria(prev =>
        prev.map((c, i) => i === cIdx ? { ...c, scales: [...(c.scales ?? []), created] } : c)
      );
      Swal.fire({ title: 'Escala copiada', icon: 'success', timer: 1000, showConfirmButton: false });
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div>
      <Breadcrumb pageName={id ? 'Editar Rúbrica' : 'Crear Rúbrica'} />

      {rubricIsPublic && (
        <div className="mb-4 rounded border border-primary bg-primary bg-opacity-10 p-3 text-sm text-primary">
          Esta rúbrica está <strong>publicada</strong>. No puede eliminarse; usa "Archivar" si ya no la necesitas.
        </div>
      )}
      {rubricIsArchived && (
        <div className="mb-4 rounded border border-warning bg-warning bg-opacity-10 p-3 text-sm">
          Esta rúbrica está <strong>archivada</strong> y no puede asociarse a nuevas evaluaciones.
        </div>
      )}

      {/* ── Rubric metadata ── */}
      <div className="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">Datos de la Rúbrica</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Título *</label>
            <input
              className={inputClass}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Título de la rúbrica"
              disabled={isReadOnly}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Descripción</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descripción de la rúbrica"
              disabled={isReadOnly}
            />
          </div>
        </div>
        {!isReadOnly && (
          <button
            onClick={saveRubric}
            className="mt-4 rounded bg-primary py-2 px-6 text-sm font-medium text-white hover:bg-opacity-90"
          >
            Guardar datos
          </button>
        )}
      </div>

      {/* ── Criteria ── */}
      {rubricId && (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black dark:text-white">
              Criterios{' '}
              <span className={`ml-2 text-sm font-normal ${totalWeight === 100 ? 'text-success' : 'text-meta-1'}`}>
                (Total pesos: {totalWeight}%{totalWeight === 100 ? ' ✓' : ` — faltan ${100 - totalWeight}%`})
              </span>
            </h3>
            {!isReadOnly && (
              <button
                onClick={addCriterion}
                className="rounded bg-primary py-1.5 px-4 text-sm text-white hover:bg-opacity-90"
              >
                + Criterio
              </button>
            )}
          </div>

          {criteria.length === 0 && (
            <p className="text-sm text-body dark:text-bodydark">
              No hay criterios. Agrega al menos uno para poder publicar la rúbrica.
            </p>
          )}

          {criteria.map((criterion, cIdx) => {
            const scales = criterion.scales ?? [];
            const otherScales = criteria
              .filter((_, i) => i !== cIdx)
              .flatMap(c => (c.scales ?? []).map(s => ({ scale: s, criterionName: c.name ?? '' })));

            return (
              <div
                key={criterion.id ?? cIdx}
                className="mb-4 rounded border border-stroke p-4 dark:border-strokedark"
              >
                {/* Criterion fields */}
                <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-black dark:text-white">Nombre *</label>
                    <input
                      className={inputClass}
                      value={criterion.name ?? ''}
                      onChange={e => updateCriterion(cIdx, 'name', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-black dark:text-white">Descripción</label>
                    <input
                      className={inputClass}
                      value={criterion.description ?? ''}
                      onChange={e => updateCriterion(cIdx, 'description', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-black dark:text-white">Peso (%) *</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className={inputClass}
                      value={criterion.weight ?? ''}
                      onChange={e => updateCriterion(cIdx, 'weight', Number(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="mb-4 flex gap-2">
                    <button
                      onClick={() => saveCriterion(criterion)}
                      className="rounded bg-success py-1 px-3 text-xs text-white hover:bg-opacity-90"
                    >
                      Guardar criterio
                    </button>
                    <button
                      onClick={() => deleteCriterion(criterion, cIdx)}
                      className="rounded bg-danger py-1 px-3 text-xs text-white hover:bg-opacity-90"
                    >
                      Eliminar criterio
                    </button>
                  </div>
                )}

                {/* Scales */}
                <div className="pl-2 border-l-2 border-stroke dark:border-strokedark">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-black dark:text-white">
                      Escalas{' '}
                      <span className={scales.length < 2 ? 'text-meta-1' : 'text-success'}>
                        ({scales.length} nivel{scales.length !== 1 ? 'es' : ''}{scales.length < 2 ? ' — mínimo 2 para publicar' : ''})
                      </span>
                    </p>
                    {!isReadOnly && criterion.id && (
                      <button
                        onClick={() => addScale(cIdx, criterion.id!)}
                        disabled={scales.length >= 5}
                        className="rounded border border-primary py-0.5 px-2 text-xs text-primary hover:bg-primary hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        + Escala
                      </button>
                    )}
                  </div>

                  {scales.map((scale, sIdx) => (
                    <div
                      key={scale.id ?? sIdx}
                      className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-4 items-end"
                    >
                      <div>
                        <label className="mb-1 block text-xs text-body dark:text-bodydark">Etiqueta</label>
                        <input
                          className={inputClass}
                          value={scale.name ?? ''}
                          onChange={e => updateScale(cIdx, sIdx, 'name', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-body dark:text-bodydark">Descripción</label>
                        <input
                          className={inputClass}
                          value={scale.description ?? ''}
                          onChange={e => updateScale(cIdx, sIdx, 'description', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-body dark:text-bodydark">Valor numérico</label>
                        <input
                          type="number"
                          className={inputClass}
                          value={scale.value ?? ''}
                          onChange={e => updateScale(cIdx, sIdx, 'value', Number(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </div>
                      {!isReadOnly && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveScale(cIdx, scale)}
                            className="rounded bg-success py-1 px-2 text-xs text-white hover:bg-opacity-90"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => deleteScale(cIdx, scale, sIdx)}
                            className="rounded bg-danger py-1 px-2 text-xs text-white hover:bg-opacity-90"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* CU-09 2a: copy scale from another criterion */}
                  {!isReadOnly && criterion.id && scales.length < 5 && otherScales.length > 0 && (
                    <div className="mt-2">
                      <select
                        value=""
                        onChange={e => {
                          if (e.target.value) copyScale(cIdx, criterion.id!, e.target.value);
                        }}
                        className="rounded border border-stroke bg-transparent py-1 px-2 text-xs text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                      >
                        <option value="">Copiar escala de otro criterio...</option>
                        {otherScales.map(({ scale, criterionName }) => (
                          <option key={scale.id} value={scale.id}>
                            {criterionName}: {scale.name} (valor: {scale.value})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="mt-4 flex flex-wrap gap-3">
        {rubricId && !rubricIsPublic && !rubricIsArchived && (
          <button
            onClick={handlePublish}
            className="rounded bg-success py-2 px-6 text-sm font-medium text-white hover:bg-opacity-90"
          >
            Publicar
          </button>
        )}
        <button
          onClick={() => navigate('/rubrics/list')}
          className="rounded border border-stroke py-2 px-6 text-sm font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
        >
          Volver
        </button>
      </div>
    </div>
  );
};

export default RubricForm;
