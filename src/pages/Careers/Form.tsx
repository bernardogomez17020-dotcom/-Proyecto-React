import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import GenericForm, { FormField } from '../../components/GenericForm';
import { careerService } from '../../services/careerService';

const fields: FormField[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej: Ingeniería de Sistemas' },
  { name: 'code', label: 'Código', type: 'text', required: true, placeholder: 'Ej: ISC-001' },
  { name: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Descripción de la carrera' },
];

const CareerForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<Record<string, any> | undefined>();

  useEffect(() => {
    if (id) careerService.getById(id).then(data => data && setInitial(data));
  }, [id]);

  const handleSubmit = async (values: Record<string, any>) => {
    const result = id
      ? await careerService.update(id, values)
      : await careerService.create(values);
    return !!result;
  };

  return (
    <GenericForm
      title={id ? 'Editar Carrera' : 'Crear Carrera'}
      fields={fields}
      initialValues={initial}
      onSubmit={handleSubmit}
      backPath="/careers/list"
    />
  );
};

export default CareerForm;
